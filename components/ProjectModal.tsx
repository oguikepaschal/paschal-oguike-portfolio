"use client";

import { useEffect } from "react";
import Image from "next/image";
import { AnimatePresence, cubicBezier, motion } from "framer-motion";
import type { Project } from "@/lib/projects-data";
import { lockBodyScroll } from "@/lib/scrollLock";

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

export function ProjectModal({ project, onClose }: ProjectModalProps) {
  useEffect(() => {
    if (!project) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [project, onClose]);

  useEffect(() => {
    if (!project) return;
    return lockBodyScroll();
  }, [project]);

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          key="veil"
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
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.32, ease: cubicBezier(0.2, 0.9, 0.24, 1) }}
            className="relative w-full max-w-[920px]"
            style={{ background: "var(--card)", border: "1px solid var(--rule)", boxShadow: "0 40px 90px -40px rgba(23,19,16,0.6)" }}
          >
            {/* Anchored to the card itself (not the image wrapper) and
                translated half its own size past the corner, so it visibly
                hangs off the card boundary — a clearer "this closes this
                card" affordance than a button sitting flush inside it. */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-0 right-0 z-10 flex h-9 w-9 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-white/15 text-tag text-white backdrop-blur-md transition-colors duration-300 bg-[rgba(23,19,16,0.55)] hover:bg-[rgba(23,19,16,0.8)]"
            >
              ✕
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute bottom-0 right-0 z-10 flex h-9 w-9 translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-white/15 text-tag text-white backdrop-blur-md transition-colors duration-300 bg-[rgba(23,19,16,0.55)] hover:bg-[rgba(23,19,16,0.8)] lg:hidden"
            >
              ✕
            </button>

            <div className="relative border-b-2" style={{ borderColor: "var(--rule)" }}>
              <div className="relative aspect-video w-full overflow-hidden" style={{ background: "var(--wash)" }}>
                {project.image && (
                  <Image
                    src={project.image.src}
                    alt={project.image.alt}
                    fill
                    sizes="(min-width: 1000px) 920px, 100vw"
                    className="object-cover object-top"
                  />
                )}
              </div>
            </div>

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
                  <a href={project.liveSiteHref} className="text-label leading-label uppercase tracking-label" style={{ color: "var(--accent)" }}>
                    View live site →
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
