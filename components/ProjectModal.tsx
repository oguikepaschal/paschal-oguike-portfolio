"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence, cubicBezier, motion, useReducedMotion } from "framer-motion";
import type { Project } from "@/lib/projects-data";
import { lockBodyScroll } from "@/lib/scrollLock";

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

function subscribeNever() {
  return () => {};
}

export function ProjectModal({ project, onClose }: ProjectModalProps) {
  const veilRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const isOpen = project !== null;
  const isHydrated = useSyncExternalStore(subscribeNever, () => true, () => false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!project) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [project, onClose]);

  // Keyed on open/closed rather than on the project itself, so the opener
  // captured here is the card that was focused before the modal appeared.
  useEffect(() => {
    if (!isOpen || !isHydrated) return;

    const unlockScroll = lockBodyScroll();
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // Same approach as MobileMenu: the veil is portalled onto <body>, so
    // inerting every other body child keeps Tab and assistive tech inside
    // the dialog without hand-rolled focus cycling.
    const inerted: HTMLElement[] = [];
    for (const child of Array.from(document.body.children)) {
      if (!(child instanceof HTMLElement) || child === veilRef.current) continue;
      child.setAttribute("inert", "");
      inerted.push(child);
    }

    closeRef.current?.focus();

    return () => {
      unlockScroll();
      for (const el of inerted) el.removeAttribute("inert");
      // Only after the page is un-inerted can the card take focus back.
      opener?.focus({ preventScroll: true });
    };
  }, [isOpen, isHydrated]);

  // A deep link (?project=…) renders this on the server too, where there's
  // no <body> to portal into. Render nothing until hydration is done so the
  // server and client trees match, then portal.
  if (!isHydrated) return null;

  return createPortal(
    <AnimatePresence>
      {project && (
        <motion.div
          key="veil"
          ref={veilRef}
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto p-[clamp(16px,4vh,56px)_clamp(24px,3vw,40px)]"
          style={{ background: "rgba(23,19,16,0.42)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
        >
          <motion.div
            key={project.id}
            role="dialog"
            aria-modal="true"
            aria-label={project.title}
            onClick={(e) => e.stopPropagation()}
            // Reduced motion keeps the fade (it conveys "a layer appeared")
            // but drops the scale-and-rise.
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 14 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: reducedMotion ? 0.2 : 0.32, ease: cubicBezier(0.2, 0.9, 0.24, 1) }}
            className="relative w-full max-w-[920px]"
            style={{ background: "var(--card)", border: "1px solid var(--rule)", boxShadow: "0 40px 90px -40px rgba(23,19,16,0.6)" }}
          >
            {/* Zero-height sticky rail at the top of the card: the button
                still hangs half past the card's corner at rest, but once the
                veil scrolls it pins to the top of the viewport instead of
                scrolling away — a long case study (2,000px+ on a phone)
                always has its exit in reach. */}
            <div className="sticky top-6 z-10 h-0">
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close project details"
                className="absolute top-0 right-0 flex h-11 w-11 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-white/15 text-white backdrop-blur-md transition-colors duration-300 bg-[rgba(23,19,16,0.55)] hover:bg-[rgba(23,19,16,0.8)]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                  <line x1="5" y1="5" x2="19" y2="19" />
                  <line x1="19" y1="5" x2="5" y2="19" />
                </svg>
              </button>
            </div>

            {/* No screenshot yet (e.g. a project still in progress): skip the
                media block entirely rather than opening on an empty slab. */}
            {project.image && (
              <div className="relative border-b-2" style={{ borderColor: "var(--rule)" }}>
                <div className="relative aspect-video w-full overflow-hidden" style={{ background: "var(--wash)" }}>
                  <Image
                    src={project.image.src}
                    alt={project.image.alt}
                    fill
                    sizes="(min-width: 1000px) 920px, 100vw"
                    className="object-cover object-top"
                  />
                </div>
              </div>
            )}

            <div className="p-[clamp(24px,3.4vw,44px)]">
              <div className="flex items-center gap-3.5 text-label leading-label uppercase tracking-label" style={{ color: "var(--muted)" }}>
                <span style={{ color: "var(--accent)" }}>{project.number}</span>
                <span>{project.status}</span>
                <span className="h-px flex-1" style={{ background: "var(--rule)" }} />
              </div>

              <h3 className="font-display mt-3.5 mb-5 text-center text-mtitle leading-mtitle font-extrabold uppercase tracking-mtitle">
                {project.title}
              </h3>

              <p
                className="font-text mb-[clamp(28px,3.4vw,40px)] text-lead leading-lead tracking-lead text-pretty italic"
                style={{ color: "var(--ink)" }}
              >
                {project.tagline}
              </p>

              <div
                className="flex flex-col gap-[clamp(24px,3vw,40px)] border-t-2 pt-10 pb-10"
                style={{ borderColor: "var(--rule)" }}
              >
                <div>
                  <div className="mb-3 text-center text-label leading-label uppercase tracking-label" style={{ color: "var(--accent)" }}>
                    The problem
                  </div>
                  <p className="font-text m-0 text-small leading-small tracking-small text-pretty" style={{ color: "var(--body)" }}>
                    {project.problem}
                  </p>
                </div>
                <div>
                  <div className="mb-3 text-center text-label leading-label uppercase tracking-label" style={{ color: "var(--accent)" }}>
                    What broke
                  </div>
                  <ul className="font-text m-0 flex list-none flex-col gap-3 p-0 text-small leading-small tracking-small" style={{ color: "var(--body)" }}>
                    {project.whatBroke.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="border-t-2 pt-10" style={{ borderColor: "var(--rule)" }}>
                <div className="mb-3 text-center text-label leading-label uppercase tracking-label" style={{ color: "var(--accent)" }}>
                  Decisions
                </div>
                <ul className="font-text m-0 flex list-none flex-col gap-2.5 p-0 text-small leading-small tracking-small" style={{ color: "var(--body)" }}>
                  {project.decisions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div
                className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t-2 pt-5"
                style={{ borderColor: "var(--rule)" }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  {project.techIcons.map((icon) => (
                    <span
                      key={icon.label}
                      title={icon.label}
                      className="flex h-[34px] w-[34px] items-center justify-center border"
                      style={{ borderColor: "var(--rule)" }}
                    >
                      <img
                        src={icon.src}
                        alt={icon.label}
                        data-mono={icon.mono ? "" : undefined}
                        width={17}
                        height={17}
                        className="block"
                      />
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <span
                    className="inline-flex items-center gap-2 text-label leading-label uppercase tracking-label"
                    style={{ color: "var(--muted)" }}
                  >
                    <img src="https://cdn.simpleicons.org/github/8a8177" alt="" width={13} height={13} className="block" />
                    Codebase is private
                  </span>
                  {project.liveSiteHref && (
                    <a
                      href={project.liveSiteHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-label leading-label uppercase tracking-label"
                      style={{ color: "var(--accent)" }}
                    >
                      View live site →
                    </a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
