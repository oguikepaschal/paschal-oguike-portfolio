"use client";

import { useEffect, useRef } from "react";
import {
  DESKTOP_AREA,
  DESKTOP_FORMAT,
  INK_CUT,
  draw,
  prepCanvas,
  type Rect,
  type WeaveColors,
  type WeaveFormat,
  type WeaveMark,
} from "@/lib/weave";

const RESIZE_DEBOUNCE_MS = 150;
/** Drift (slow per-mark sway) only on desktop widths. */
const DRIFT_QUERY = "(min-width: 1024px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function toRect(r: DOMRect, origin: DOMRect): Rect {
  return [r.left - origin.left, r.top - origin.top, r.right - origin.left, r.bottom - origin.top];
}

/** The About section's real text boxes, relative to the section: the actual
 * line boxes of its two headings (label and headline) and the paragraph
 * column. field() keeps marks out of these, falling off over quietFall. */
function measureQuiet(section: HTMLElement): Rect[] {
  const origin = section.getBoundingClientRect();
  const rects: Rect[] = [];
  const range = document.createRange();
  for (const heading of section.querySelectorAll("h2")) {
    range.selectNodeContents(heading);
    for (const line of range.getClientRects()) if (line.width > 0) rects.push(toRect(line, origin));
  }
  const column = section.querySelector("p")?.parentElement;
  if (column) rects.push(toRect(column.getBoundingClientRect(), origin));
  return rects;
}

function hexToRgb(value: string): [number, number, number] {
  const hex = value.trim().replace("#", "");
  const n = parseInt(hex.length === 3 ? hex.replace(/./g, "$&$&") : hex, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function readColors(section: HTMLElement): WeaveColors {
  const styles = getComputedStyle(section);
  const light = document.documentElement.getAttribute("data-theme") !== "dark";
  return {
    ink: hexToRgb(styles.getPropertyValue("--ink")),
    accent: styles.getPropertyValue("--accent").trim(),
    cut: light ? INK_CUT : null,
  };
}

/**
 * The About section's generative background. Only ever loaded at 768px and
 * up (see AboutWeave.tsx). Layout runs in a worker; drawing happens here.
 */
export default function AboutWeaveCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = canvas?.parentElement;
    if (!canvas || !section) return;

    const worker = new Worker(new URL("./weave.worker.ts", import.meta.url));
    const reduced = window.matchMedia(REDUCED_MOTION_QUERY).matches;
    const driftAllowed = !reduced && window.matchMedia(DRIFT_QUERY).matches;

    let format: WeaveFormat | null = null;
    let marks: WeaveMark[] | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let colors = readColors(section);
    let requestId = 0;
    let visible = false;
    let frame = 0;
    let debounce = 0;
    let lastKey = "";

    function drawStatic() {
      if (ctx && marks && format) draw(ctx, marks, format, colors);
    }

    function tick(now: number) {
      frame = 0;
      if (!ctx || !marks || !format || !visible) return;
      draw(ctx, marks, format, colors, now / 1000);
      frame = requestAnimationFrame(tick);
    }

    function startDrift() {
      if (driftAllowed && visible && marks && !frame) frame = requestAnimationFrame(tick);
    }

    function stopDrift() {
      cancelAnimationFrame(frame);
      frame = 0;
    }

    worker.onmessage = (e: MessageEvent<{ id: number; marks: WeaveMark[] }>) => {
      if (e.data.id !== requestId || !format) return;
      marks = e.data.marks;
      ctx = prepCanvas(canvas, format);
      drawStatic();
      canvas.style.opacity = "1";
      startDrift();
    };

    function relayout() {
      const W = Math.round(section!.clientWidth);
      const H = Math.round(section!.clientHeight);
      if (!W || !H) return;
      const quiet = measureQuiet(section!);
      const key = JSON.stringify([W, H, quiet.map((r) => r.map(Math.round))]);
      if (key === lastKey) return;
      lastKey = key;
      format = {
        ...DESKTOP_FORMAT,
        W,
        H,
        quiet,
        seeds: Math.max(4, Math.round(DESKTOP_FORMAT.seeds * ((W * H) / DESKTOP_AREA))),
      };
      requestId += 1;
      worker.postMessage({ id: requestId, format });
    }

    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(debounce);
      debounce = window.setTimeout(relayout, RESIZE_DEBOUNCE_MS);
    });
    resizeObserver.observe(section);

    // Drift pauses whenever the section is off screen.
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) startDrift();
      else stopDrift();
    });
    intersectionObserver.observe(section);

    // Theme switches change --ink and --accent: re-read and redraw.
    const themeObserver = new MutationObserver(() => {
      colors = readColors(section);
      if (!frame) drawStatic();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    relayout();

    return () => {
      clearTimeout(debounce);
      stopDrift();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      themeObserver.disconnect();
      worker.terminate();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-0 motion-safe:transition-opacity motion-safe:duration-700"
    />
  );
}
