"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, cubicBezier, motion } from "framer-motion";

interface FlipWordProps {
  words: string[];
  /** Cadence between words, in ms. */
  intervalMs?: number;
  /** One color per word (same length as `words`); falls back to --accent for
   * any word past the end of this array, or entirely if omitted. */
  colors?: string[];
}

/**
 * A fixed-size "slot" showing one word from `words` at a time, advancing on
 * an interval with an odometer-style scroll: the outgoing word slides up and
 * out while the incoming one slides up into place from below.
 *
 * The slot's width/height is set by an invisible span holding the longest
 * word in the list, in the same flow as visible text — so it reserves real
 * space via normal layout rather than a guessed pixel/ch value, and never
 * changes size when a shorter or longer word rotates in. The visible word
 * sits in a second, absolutely-positioned span on top of that sizer (inset-0
 * against it directly, with no padding in between — the chip's own padding
 * lives one level up, outside the clipped/sized box, so it can't throw the
 * inset-0 match off).
 *
 * The sizer (and the word spans layered on it) are capped at `max-width:
 * 100%` and allowed to wrap: if a long entry is ever wider than a narrow
 * phone viewport at the hero's display size, an unbreakable nowrap line
 * would rather overflow the page horizontally than shrink. Wrapping keeps the sizer in flow — still reserving real
 * space, just across up to two lines — instead of taking it out of flow
 * entirely, which would collapse the slot to zero width and defeat the
 * whole point of measuring against the longest word.
 */
function formatList(words: string[]) {
  return new Intl.ListFormat("en", { style: "long", type: "conjunction" }).format(words.map((w) => w.toLowerCase()));
}

export function FlipWord({ words, intervalMs = 2200, colors }: FlipWordProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // matchMedia is only available client-side, so this can't be decided
    // during render — same pattern as CursorField's reduced-motion check.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const rootRef = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Only cycles while the slot is actually on screen — no point animating a
  // headline nobody can see, and scrolling back up restarts it.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Hovering anywhere on the surrounding heading (not just the word itself,
  // which is a small target mid-roll) holds the current word in place.
  useEffect(() => {
    const target = rootRef.current?.closest("h1, h2, h3") ?? rootRef.current;
    if (!target) return;
    const enter = () => setHovered(true);
    const leave = () => setHovered(false);
    target.addEventListener("pointerenter", enter);
    target.addEventListener("pointerleave", leave);
    return () => {
      target.removeEventListener("pointerenter", enter);
      target.removeEventListener("pointerleave", leave);
    };
  }, []);

  // Loops while visible and not hovered. Reduced motion never cycles and just
  // shows the first word.
  useEffect(() => {
    if (words.length <= 1 || reducedMotion || !inView || hovered) return;
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % words.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [words.length, intervalMs, reducedMotion, inView, hovered]);

  const longestWord = words.reduce((longest, word) => (word.length > longest.length ? word : longest), "");
  const word = words[activeIndex];
  const color = colors?.[activeIndex] ?? "var(--accent)";

  return (
    <span ref={rootRef} className="inline-flex align-baseline" style={{ paddingRight: "0.18em" }}>
      {/* Screen readers get the whole list once, instead of whichever word
          happens to be mid-flip when the heading is read. */}
      <span className="sr-only">{formatList(words)}</span>
      <span aria-hidden className="relative inline-block max-w-full overflow-hidden">
        {/* Sizer: real text, invisible, reserves the slot's width/height via
            normal layout so it can never change when the active word does. */}
        <span aria-hidden className="invisible block max-w-full text-left break-words">
          {longestWord}
        </span>

        {reducedMotion ? (
          <span className="absolute inset-0 flex items-center justify-start text-left break-words" style={{ color }}>
            {word}
          </span>
        ) : (
          // initial={false}: the first word renders in place on load (and on
          // the server) instead of starting its entrance from opacity 0.
          <AnimatePresence initial={false}>
            <motion.span
              key={word}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={{ y: "-100%", opacity: 0 }}
              transition={{ duration: 0.5, ease: cubicBezier(0.4, 0, 0.2, 1) }}
              className="absolute inset-0 flex items-center justify-start text-left break-words"
              style={{ color }}
            >
              {word}
            </motion.span>
          </AnimatePresence>
        )}
      </span>
    </span>
  );
}
