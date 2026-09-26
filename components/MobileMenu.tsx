"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, cubicBezier, motion, useReducedMotion } from "framer-motion";
import { Clock } from "@/components/Clock";
import { lockBodyScroll } from "@/lib/scrollLock";

interface NavLink {
  href: string;
  label: string;
}

function MenuIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <line x1="3" y1="7" x2="21" y2="7" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="17" x2="21" y2="17" />
    </svg>
  );
}

/** Shared by the reduced-motion crossfade and the scrim-adjacent bits of the
 * reveal — same duration/ease the old dropdown used for its fade. */
const OVERLAY_TRANSITION = { duration: 0.25, ease: cubicBezier(0.4, 0, 0.2, 1) } as const;
/** The radial reveal itself: slower than a fade so the clip-path sweep from
 * the trigger's corner actually reads as motion instead of a flash. */
const REVEAL_TRANSITION = { duration: 0.5, ease: cubicBezier(0.4, 0, 0.2, 1) } as const;

/** Drives the cascade: each row (link, then the clock) is a step behind the
 * one above it via staggerChildren, so they come in like stairs instead of
 * all appearing at once. */
const LIST_VARIANTS = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
};

const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: cubicBezier(0.4, 0, 0.2, 1) } },
};

/** Radial reveal from the hamburger's corner (top-right). 150% comfortably
 * covers the viewport from a corner without diagonal math. */
const CLIP_VARIANTS = {
  hidden: { clipPath: "circle(0% at 100% 0%)" },
  visible: { clipPath: "circle(150% at 100% 0%)" },
};

/** prefers-reduced-motion fallback: no clip-path sweep, just a crossfade. */
const FADE_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

/**
 * Hamburger button + full-screen takeover nav, shown only below the
 * breakpoint where Nav hides its inline link row. The clock moves in here
 * too — see Nav.tsx — since the collapsed header has no room for it.
 */
export function MobileMenu({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  function close() {
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const unlockScroll = lockBodyScroll();
    const trigger = triggerRef.current;

    // `inert` rather than hand-rolled Tab cycling: everything outside the
    // takeover panel is excluded from the tab order and from assistive tech
    // natively, and it's undone in one pass on close. The panel itself is
    // portalled straight onto <body>, so this only ever has to skip that one
    // sibling instead of reasoning about where it sits in Nav's tree.
    const inerted: HTMLElement[] = [];
    for (const child of Array.from(document.body.children)) {
      if (!(child instanceof HTMLElement) || child === panelRef.current) continue;
      child.setAttribute("inert", "");
      inerted.push(child);
    }

    firstLinkRef.current?.focus();

    return () => {
      unlockScroll();
      for (const el of inerted) el.removeAttribute("inert");
      // Only after the trigger's subtree is un-inerted can it actually
      // accept focus again — doing this from `close()` itself fires before
      // this cleanup has run, while the header is still inert, so the
      // .focus() call silently no-ops and focus falls back to <body>.
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex h-11 w-11 items-center justify-center transition-colors duration-300 hover:text-ink"
        style={{ color: "var(--muted)" }}
      >
        <MenuIcon open={open} />
      </button>

      {/* Portalled onto <body> instead of left inside Nav's header: the
          takeover is a page-level overlay, and it also has to sit outside
          the subtree that gets skipped by the inert loop above. */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                key="menu"
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label="Site navigation"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={reducedMotion ? FADE_VARIANTS : CLIP_VARIANTS}
                transition={reducedMotion ? OVERLAY_TRANSITION : REVEAL_TRANSITION}
                className="fixed inset-0 z-50 flex flex-col"
                style={{ background: "var(--nav-scrim)" }}
              >
                <div className="flex justify-end px-[clamp(24px,4.5vw,64px)] py-[10px]">
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Close menu"
                    className="flex h-11 w-11 items-center justify-center text-ink transition-colors duration-300 hover:text-accent"
                  >
                    <MenuIcon open />
                  </button>
                </div>

                <nav className="flex flex-1 flex-col items-center justify-center px-8">
                  <motion.ul
                    initial="hidden"
                    animate="visible"
                    variants={LIST_VARIANTS}
                    className="flex flex-col items-center gap-6 text-center"
                  >
                    {links.map((link, i) => (
                      <motion.li key={link.href} variants={ITEM_VARIANTS}>
                        <a
                          ref={i === 0 ? firstLinkRef : undefined}
                          href={link.href}
                          onClick={close}
                          className="font-display text-headline leading-headline font-extrabold uppercase tracking-headline text-ink transition-colors duration-300 hover:text-accent focus-visible:text-accent"
                        >
                          {link.label}
                        </a>
                      </motion.li>
                    ))}
                  </motion.ul>
                </nav>

                <motion.div
                  variants={ITEM_VARIANTS}
                  initial="hidden"
                  animate="visible"
                  className="flex justify-center pb-9"
                >
                  <Clock />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
