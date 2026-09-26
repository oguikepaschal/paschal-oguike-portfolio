"use client";

import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  MotionConfig,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { GlassScrim } from "@/components/ui/GlassScrim";
import { SectionHeadline } from "@/components/ui/SectionHeadline";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { TechIconRow } from "@/components/ui/TechIconRow";
import { ProjectModal } from "@/components/ProjectModal";
import { PROJECTS, type Project } from "@/lib/projects-data";

/** Tailwind's `xl` — matches the grid's own `xl:grid-cols-4` below (the fan
 * math assumes a single 4-up row, so this must always match whatever
 * breakpoint actually produces one). Previously `lg`/64rem, which fanned the
 * deck a full 128px before the grid had 4 columns, spreading cards across a
 * still-2-column grid in between. */
const DECK_MEDIA_QUERY = "(min-width: 80rem)";
/** Same overdamped feel as CursorField's dock flight, a touch quicker since
 * the distances here are a card width rather than the whole viewport. */
const DECK_TRANSITION = { type: "spring", stiffness: 140, damping: 24, mass: 1 } as const;
/** Each card's horizontal offset from its own grid slot toward the deck's
 * center, as a percentage of one card width. -100 would stack them exactly;
 * the remaining 60% is the strip of every card behind that stays uncovered —
 * wide enough for its index, tech icon, and most of its title's first line. */
const FAN_X_STEP = -40;
/** Drop (px) per squared step from the center, so the outer cards sit a
 * little lower and the row reads as a held hand rather than a flat strip. */
const FAN_ARC = 6;
const FAN_ROTATE_STEP = 2;
/** Room under the row for the arc plus the rotated cards' lower corners. */
const FAN_RESERVE = 28;
/** Single shared shadow for every card surface — the desktop fan lift, its
 * hover state, and the mobile rows — so color and spread move together
 * instead of three near-duplicate values drifting apart. Warm --accent
 * rather than a neutral rgba, with a tight spread so it reads as a soft
 * lift rather than a wide glow. */
const CARD_SHADOW = "0px 16px 32px -30px var(--accent)";
const NO_SHADOW = "0px 0px 0px 0px rgba(23,19,16,0)";

/** useLayoutEffect during SSR/static prerendering warns ("does nothing on
 * the server") since there's no DOM to lay out — fall back to useEffect
 * there, where it's inert anyway. In the browser this runs synchronously
 * before paint, so a desktop visitor's correct isDesktop value lands in the
 * very first frame instead of flashing the mobile layout for one frame
 * and then snapping to the fan-deck. */
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Spread-card hover tilt. Kept deliberately small: a few degrees reads as
 * the card catching the light, anything more starts to feel like a toy. */
const TILT_MAX_DEG = 4;
const TILT_PERSPECTIVE = 900;
const HOVER_LIFT_SCALE = 1.02;
const TILT_SPRING = { stiffness: 220, damping: 22, mass: 0.6 };
const GLARE_SPRING = { stiffness: 200, damping: 30 };
/** Hover-revealed detail layer: px it rises by, and its fade/rise spring. */
const DETAIL_RISE = 10;
const DETAIL_SPRING = { stiffness: 260, damping: 32 };
/** isDesktop is width-only, and touch laptops/tablets can be that wide —
 * the tilt also needs a real hovering, fine pointer to make sense. */
const HOVER_MEDIA_QUERY = "(hover: hover) and (pointer: fine)";

function subscribeToHoverQuery(onChange: () => void) {
  const query = window.matchMedia(HOVER_MEDIA_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function useCanHover() {
  return useSyncExternalStore(
    subscribeToHoverQuery,
    () => window.matchMedia(HOVER_MEDIA_QUERY).matches,
    () => false,
  );
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

/** True while the open modal was opened by a card click on this page, i.e.
 * there's a history entry under it to go back to. False for a deep link
 * (?project=… loaded directly), where going back would leave the site. */
let modalPushedHistory = false;

function markModalPushed() {
  modalPushedHistory = true;
}

/** Reads and clears the flag in one step. */
function takeModalPushed() {
  const pushed = modalPushedHistory;
  modalPushedHistory = false;
  return pushed;
}

/**
 * Reads the ?project= query param and resolves the open modal from it.
 * Isolated behind Suspense because useSearchParams forces client-side
 * rendering up to the nearest Suspense boundary during static prerendering
 * — without this, `next build` fails for this otherwise-static page.
 */
function ProjectModalGate() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const openProjectId = searchParams.get("project");
  const openProject = PROJECTS.find((project) => project.id === openProjectId) ?? null;

  // Closing undoes the open rather than stacking a new entry on top of it,
  // so browser Back afterwards goes where the visitor expects instead of
  // reopening the modal they just closed.
  function close() {
    if (takeModalPushed()) {
      router.back();
    } else {
      router.replace(pathname, { scroll: false });
    }
  }

  return <ProjectModal project={openProject} onClose={close} />;
}

/** `flat` is true once the card sits fully spread — either the fan deck has
 * been opened, or there's no deck at all below the desktop breakpoint — as
 * opposed to collapsed behind the fanned deck, where only a sliver shows. */
function ProjectCard({
  project,
  onOpen,
  flat,
  isDesktop,
}: {
  project: Project;
  onOpen?: () => void;
  flat: boolean;
  isDesktop: boolean;
}) {
  const icon = project.techIcons[0];
  const prefersReducedMotion = useReducedMotion();
  const canHover = useCanHover();
  // Only a fully spread desktop card tilts — never the fanned deck (its own
  // x/y/rotate animation lives on the parent) or the mobile list.
  const tiltEnabled = isDesktop && flat && canHover && !prefersReducedMotion;
  // Same hover-capable-pointer check the tilt uses, minus the reduced-motion
  // condition: the extra detail is content, so it still reveals for those
  // users — it just fades in place instead of sliding up.
  const hoverDetail = isDesktop && flat && canHover;
  // Desktop spread cards carry the fuller baseline; mobile rows keep the
  // leaner one so the tap hint never truncates on a narrow card.
  const richBaseline = isDesktop && flat;
  const pointerTracking = tiltEnabled || hoverDetail;

  // Cursor position within the card, 0–1 on each axis; 0.5/0.5 is neutral.
  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);
  const hover = useMotionValue(0);
  const rotateX = useSpring(useTransform(pointerY, [0, 1], [TILT_MAX_DEG, -TILT_MAX_DEG]), TILT_SPRING);
  const rotateY = useSpring(useTransform(pointerX, [0, 1], [-TILT_MAX_DEG, TILT_MAX_DEG]), TILT_SPRING);
  const scale = useSpring(useTransform(hover, [0, 1], [1, HOVER_LIFT_SCALE]), TILT_SPRING);
  const glareOpacity = useSpring(hover, GLARE_SPRING);
  const glareX = useTransform(pointerX, [0, 1], [0, 100]);
  const glareY = useTransform(pointerY, [0, 1], [0, 100]);
  // Colour and blend mode come from --glare-* (globals.css), which the
  // data-theme attribute on <html> already switches per theme — same
  // mechanism every other themed value in the app uses.
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, var(--glare-core), var(--glare-edge) 60%)`;
  const detailOpacity = useSpring(hover, DETAIL_SPRING);
  const detailY = useSpring(useTransform(hover, [0, 1], [DETAIL_RISE, 0]), DETAIL_SPRING);

  function resetTilt() {
    pointerX.set(0.5);
    pointerY.set(0.5);
    hover.set(0);
  }

  // Restacking the deck (or crossing the breakpoint) mid-hover disables the
  // tilt without a mouseleave ever firing — settle back to neutral.
  useEffect(() => {
    if (pointerTracking) return;
    pointerX.set(0.5);
    pointerY.set(0.5);
    hover.set(0);
  }, [pointerTracking, pointerX, pointerY, hover]);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    // Measure the untransformed grid slot rather than this tilting, scaling
    // element, so the tilt can't feed back into its own cursor math.
    const rect = (e.currentTarget.parentElement ?? e.currentTarget).getBoundingClientRect();
    pointerX.set(clamp01((e.clientX - rect.left) / rect.width));
    pointerY.set(clamp01((e.clientY - rect.top) / rect.height));
    hover.set(1);
  }

  return (
    <motion.div
      className="h-full"
      onMouseMove={pointerTracking ? handleMouseMove : undefined}
      onMouseLeave={pointerTracking ? resetTilt : undefined}
      // Keyboard users tab through these cards — give focus the same reveal
      // a hover gets, rather than leaving the detail mouse-only.
      onFocus={hoverDetail ? () => hover.set(1) : undefined}
      onBlur={hoverDetail ? resetTilt : undefined}
      style={tiltEnabled ? { rotateX, rotateY, scale, transformPerspective: TILT_PERSPECTIVE } : undefined}
    >
      <Card
        interactive={Boolean(onOpen)}
        onClick={onOpen}
        className="relative h-full"
        hoverShadow={CARD_SHADOW}
        style={{
          ...(!isDesktop ? { background: "transparent", boxShadow: CARD_SHADOW } : {}),
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 flex-1 items-center gap-2.5">
            <span className="shrink-0 text-caption leading-caption tracking-caption tabular-nums" style={{ color: "var(--accent)" }}>
              {project.number}
            </span>
            {flat ? (
              <TechIconRow icons={project.techIcons} />
            ) : (
              icon && (
                <img
                  src={icon.src}
                  alt={icon.label}
                  title={icon.label}
                  data-mono={icon.mono ? "" : undefined}
                  width={14}
                  height={14}
                  className="block shrink-0"
                />
              )
            )}
          </span>
          <Badge tone={project.tone} border={project.status !== "Live"}>
            {project.status}
          </Badge>
        </div>

        <h3
          className={`font-display mt-5 mb-2 text-title leading-title font-bold uppercase tracking-title ${
            flat ? "text-center" : ""
          }`}
        >
          {project.title}
        </h3>

        <div className="flex flex-1 flex-col">
          <p className="mb-[22px] text-caption leading-caption tracking-caption text-pretty" style={{ color: "var(--muted)" }}>
            {project.description}
          </p>

          <div className="flex-1" />

          <div className="mb-4 flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <Badge key={tag} variant="tag">
                {tag}
              </Badge>
            ))}
          </div>

          <div
            className="flex items-center justify-between gap-3 border-t-2 pt-3.5 text-label leading-label uppercase tracking-label"
            style={{ borderColor: "var(--rule)", color: "var(--accent)" }}
          >
            {/* Shares the row rather than adding one: a second line would
                make a spread card taller than a fanned one, which moves
                every section below it on stack/spread. */}
            {richBaseline && (
              <span className="truncate whitespace-nowrap" style={{ color: "var(--faint)" }}>
                {project.whatBroke.length} broke · {project.decisions.length}{" "}
                {project.decisions.length === 1 ? "decision" : "decisions"}
              </span>
            )}
            {/* Purely decorative — the whole card is already the click
                target (see onOpen above), this is just the hint. */}
            <span className="ml-auto whitespace-nowrap">{isDesktop ? "Read the detail →" : "Tap to read →"}</span>
          </div>
        </div>

        {hoverDetail && (
          <motion.div
            className="pointer-events-none absolute inset-x-[22px] bottom-[22px] pt-8"
            style={{
              opacity: detailOpacity,
              y: prefersReducedMotion ? 0 : detailY,
              // Fades into the card's own surface so the tagline stays
              // legible over the baseline content it covers.
              background: "linear-gradient(to top, var(--card) 72%, rgba(0,0,0,0))",
            }}
          >
            <p className="m-0 line-clamp-4 text-caption leading-caption tracking-caption text-pretty" style={{ color: "var(--body)" }}>
              {project.tagline}
            </p>
            <div
              className="mt-3 border-t-2 pt-3 text-label leading-label uppercase tracking-label"
              style={{ borderColor: "var(--rule)", color: "var(--accent)" }}
            >
              Read the detail →
            </div>
          </motion.div>
        )}

        {tiltEnabled && (
          <motion.div
            aria-hidden
            className="card-glare pointer-events-none absolute inset-0"
            style={{ background: glare, opacity: glareOpacity }}
          />
        )}
      </Card>
    </motion.div>
  );
}

export function Projects() {
  const router = useRouter();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  // Opens spread: the work is the point of the page, so every card is
  // readable and focusable from the first paint. Stacking into the fan is
  // the optional flourish, not a gate in front of the projects.
  const [deckOpen, setDeckOpen] = useState(true);

  useIsomorphicLayoutEffect(() => {
    const query = window.matchMedia(DECK_MEDIA_QUERY);
    // matchMedia is only available client-side, so whether the deck fans at
    // all can only be decided once mounted — same pattern as CursorField.
    // Runs as a layout effect (not a plain effect) specifically so this
    // resolves before the browser paints, instead of flashing the mobile
    // layout for one frame on desktop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDesktop(query.matches);

    function handleChange(e: MediaQueryListEvent) {
      setIsDesktop(e.matches);
    }

    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  // Below the breakpoint there is no deck: every card is simply spread.
  const fanned = isDesktop && !deckOpen;

  function openProject(id: string) {
    markModalPushed();
    router.push(`?project=${encodeURIComponent(id)}`, { scroll: false });
  }

  function handleDeckKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    // ProjectModal closes itself on Escape too, and focus is still on the card
    // that opened it — don't let that same keypress also restack the deck.
    if (e.key !== "Escape" || !deckOpen || new URLSearchParams(window.location.search).has("project")) return;
    setDeckOpen(false);
    toggleRef.current?.focus();
  }

  return (
    <section
      id="work"
      className="px-[clamp(24px,4.5vw,64px)] pt-[clamp(56px,8vw,128px)] pb-[clamp(56px,8vw,128px)]"
    >
      <div className="mb-[clamp(40px,5vw,64px)] grid grid-cols-1 gap-x-6 gap-y-3 lg:grid-cols-12">
        <SectionLabel className="lg:col-span-2 lg:col-start-1">
          Projects
        </SectionLabel>
        <SectionHeadline className="lg:col-start-3 lg:col-span-6 lg:self-end">
          Shipped products, not tutorials.
        </SectionHeadline>
        <p
          className="font-text text-small leading-small tracking-small text-pretty lg:col-start-10 lg:col-span-3 lg:self-end"
          style={{ color: "var(--muted)" }}
        >
          Open any card to see the technical detail: the problem, the decisions, the parts that broke.
        </p>
      </div>

      {isDesktop && (
        <div className="mb-3.5 flex justify-end">
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setDeckOpen((open) => !open)}
            aria-expanded={deckOpen}
            aria-controls="work-deck"
            className="inline-flex min-h-11 items-center border px-3.5 text-ui leading-ui font-semibold uppercase tracking-ui whitespace-nowrap transition-colors duration-300 hover:border-[var(--ink)] hover:bg-[var(--wash)] hover:text-ink"
            style={{ borderColor: "var(--chip)", color: "var(--body)" }}
          >
            {deckOpen ? "Stack cards" : "Spread cards"}
          </button>
        </div>
      )}

      <div className="relative z-[21] p-[18px]">
        <GlassScrim />
        <MotionConfig reducedMotion="user" transition={DECK_TRANSITION}>
          {/* Keyed by breakpoint with initial={false}: crossing it (or the
              first client render after hydration) snaps straight to the right
              layout instead of playing the fan animation. Only an explicit
              open/close animates. */}
          <motion.div
            key={isDesktop ? "deck" : "grid"}
            id="work-deck"
            initial={false}
            // Reserved in both states, not just while fanned: toggling it
            // changed the section's height by FAN_RESERVE on every stack/
            // spread, shoving every section below up and down.
            style={{ paddingBottom: isDesktop ? FAN_RESERVE : 0 }}
            // While fanned the whole deck is one "spread" target; once spread,
            // clicks belong to the individual cards and closing is explicit.
            onClick={fanned ? () => setDeckOpen(true) : undefined}
            onKeyDown={isDesktop ? handleDeckKeyDown : undefined}
            className={`relative grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4 ${
              fanned ? "cursor-pointer" : ""
            }`}
          >
            {PROJECTS.map((project, i) => {
              const fromCenter = i - (PROJECTS.length - 1) / 2;
              // Below the breakpoint every card shows in full — description,
              // tags, icon row — so projects can be compared at a glance, and
              // one tap opens its detail.
              const flat = isDesktop ? !fanned : true;
              return (
                <motion.div
                  key={project.id}
                  initial={false}
                  animate={
                    fanned
                      ? {
                          x: `${fromCenter * FAN_X_STEP}%`,
                          y: fromCenter * fromCenter * FAN_ARC,
                          rotate: fromCenter * FAN_ROTATE_STEP,
                          boxShadow: CARD_SHADOW,
                        }
                      : { x: "0%", y: 0, rotate: 0, boxShadow: NO_SHADOW }
                  }
                  // Stacked cards are only part of the deck, never their own
                  // target: unfocusable, and clicks fall through to the deck.
                  inert={fanned}
                  className={`relative ${fanned ? "pointer-events-none" : ""}`}
                  style={{ zIndex: i }}
                >
                  <ProjectCard
                    project={project}
                    onOpen={fanned ? undefined : () => openProject(project.id)}
                    flat={flat}
                    isDesktop={isDesktop}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        </MotionConfig>
      </div>

      <Suspense fallback={null}>
        <ProjectModalGate />
      </Suspense>
    </section>
  );
}
