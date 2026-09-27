"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { motion, motionValue, useAnimationFrame, type MotionValue } from "framer-motion";

export interface CursorFieldItem {
  id: string;
  /** Icon source (e.g. a simpleicons.org URL). */
  src: string;
  size: number;
  /** 0 (far, dimmest when idle) .. 1 (near, brightest). */
  depth: number;
  /** Resting float position as a fraction of the viewport, 0-1. */
  x: number;
  y: number;
  /** True for icons that are a single dark color and need inverting in dark mode. */
  mono?: boolean;
}

/** The field only exists for a real hovering, fine pointer that hasn't asked
 * for reduced motion. Everyone else never mounts it and just sees the static
 * icons in the skills section. */
const FIELD_QUERY = "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

/** How far (px) the pointer must actually travel before the swarm starts
 * chasing it — entering the page shouldn't snap every icon to the cursor. */
const MOVE_THRESHOLD = 24;
/** Size (px) an icon shrinks to in its slot — the static icon's size in
 * components/SkillsMatrix.tsx. */
const DOCKED_SIZE = 20;
/** Commit hysteresis for the skills section: icons commit to docking the
 * moment any of it enters the viewport, and only release once it has gone
 * this far (px) past either edge. The gap means scrolling back and forth
 * near an edge can't flip them in and out. */
const RELEASE_DISTANCE = 160;
/** Same idea for the Notes "resting" zone: enter and leave at different
 * fractions of the viewport height. */
const QUIET_ZONE_ENTER = 0.15;
const QUIET_ZONE_EXIT = 0.3;
/** Resting icons fade out as the footer arrives, finishing this many px
 * after the footer is fully in view. */
const FOOTER_FADE_END_MARGIN = 24;
/** An icon has landed once it's this close (px) to its slot and this slow
 * (px/s); at that point the static copy takes over in the same frame. */
const LAND_DISTANCE = 0.75;
const LAND_SPEED = 12;

/** Stable pseudo-random 0..1 from an id, so per-icon variance survives re-renders and SSR. */
function hash01(seed: string, salt: number) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

function subscribeToFieldQuery(onChange: () => void) {
  const query = window.matchMedia(FIELD_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

interface Box {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/** Page-space (scroll-independent) positions, measured on mount and resize
 * only — never per frame or on pointermove. Viewport positions are derived
 * each frame by subtracting the scroll offset, which needs no layout read. */
interface LayoutCache {
  ready: boolean;
  hero: Box | null;
  about: Box | null;
  stack: Box | null;
  notesTop: number | null;
  footerTop: number | null;
  footerHeight: number;
  /** Slot centre per icon, same order as items. */
  slots: ({ x: number; y: number; staticIcon: HTMLElement | null } | null)[];
}

/** Everything one icon needs between frames. Plain mutable state, owned by
 * the single frame loop — nothing here goes through React. */
interface IconState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  opacity: number;
  wobble: number;
  /** Swarm cluster offset around the cursor, and where it's drifting to. */
  cx: number;
  cy: number;
  ctx: number;
  cty: number;
  rerollAt: number;
  landed: boolean;
  staticHidden: boolean;
  mv: {
    x: MotionValue<number>;
    y: MotionValue<number>;
    rotate: MotionValue<number>;
    scale: MotionValue<number>;
    opacity: MotionValue<number>;
  };
}

function toPageBox(el: HTMLElement | null): Box | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top + scrollY, bottom: r.bottom + scrollY, left: r.left + scrollX, right: r.right + scrollX };
}

function Field({ items }: { items: CursorFieldItem[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [icons] = useState<IconState[]>(() =>
    items.map(() => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      scale: 1,
      opacity: 0,
      wobble: 1,
      cx: 0,
      cy: 0,
      ctx: 0,
      cty: 0,
      rerollAt: -1,
      landed: false,
      staticHidden: false,
      mv: {
        x: motionValue(0),
        y: motionValue(0),
        rotate: motionValue(0),
        scale: motionValue(1),
        opacity: motionValue(0),
      },
    })),
  );
  const layout = useRef<LayoutCache>({
    ready: false,
    hero: null,
    about: null,
    stack: null,
    notesTop: null,
    footerTop: null,
    footerHeight: 0,
    slots: [],
  });
  const pointer = useRef({ x: 0, y: 0, onPage: false, moved: false, lastX: NaN, lastY: NaN });
  const state = useRef({ started: false, committed: false, quiet: false, resting: false });

  // Layout cache: measured on mount, then again only when the viewport or the
  // document's size changes (fonts loading, the project deck toggling, …).
  useEffect(() => {
    function measure() {
      const cache = layout.current;
      cache.hero = toPageBox(document.getElementById("top"));
      cache.about = toPageBox(document.getElementById("about"));
      cache.stack = toPageBox(document.getElementById("stack"));
      cache.notesTop = toPageBox(document.getElementById("notes"))?.top ?? null;
      const footer = toPageBox(document.getElementById("site-footer"));
      cache.footerTop = footer?.top ?? null;
      cache.footerHeight = footer ? footer.bottom - footer.top : 0;
      cache.slots = items.map((item) => {
        const slot = document.getElementById(`skill-slot-${item.id}`);
        const box = toPageBox(slot);
        if (!slot || !box) return null;
        return {
          x: (box.left + box.right) / 2,
          y: (box.top + box.bottom) / 2,
          staticIcon: slot.querySelector<HTMLElement>(".skill-static"),
        };
      });
      cache.ready = true;
    }

    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [items]);

  // Pointer tracking only records coordinates — no layout reads, no state.
  useEffect(() => {
    function handlePointerMove(e: PointerEvent) {
      const p = pointer.current;
      if (!p.moved && !Number.isNaN(p.lastX) && Math.hypot(e.clientX - p.lastX, e.clientY - p.lastY) > MOVE_THRESHOLD) {
        p.moved = true;
      }
      p.lastX = e.clientX;
      p.lastY = e.clientY;
      p.x = e.clientX;
      p.y = e.clientY;
      p.onPage = true;
    }

    function handlePointerOut(e: PointerEvent) {
      if (e.relatedTarget) return;
      const p = pointer.current;
      p.onPage = false;
      p.moved = false;
      p.lastX = NaN;
      p.lastY = NaN;
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerout", handlePointerOut, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerout", handlePointerOut);
    };
  }, []);

  // Hand the static icons back if the field ever unmounts mid-dock.
  useEffect(() => {
    const cache = layout.current;
    return () => {
      for (const slot of cache.slots) if (slot?.staticIcon) slot.staticIcon.style.visibility = "";
    };
  }, []);

  // The one frame loop. Every icon's motion comes from here: a single
  // critically damped spring per icon whose constants never change — only
  // its target does — so nothing is ever restarted, re-created or re-tuned.
  useAnimationFrame((t, delta) => {
    const cache = layout.current;
    if (!cache.ready) return;
    const dt = Math.min(delta, 50) / 1000;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const sx = window.scrollX;
    const sy = window.scrollY;
    const s = state.current;
    const p = pointer.current;

    // Commit to docking with hysteresis: enter as soon as the section is in
    // view, release only once it's RELEASE_DISTANCE past an edge. Cursor
    // movement plays no part, so it can never pull an icon back out.
    if (cache.stack) {
      const top = cache.stack.top - sy;
      const bottom = cache.stack.bottom - sy;
      s.committed = s.committed
        ? !(top > vh + RELEASE_DISTANCE || bottom < -RELEASE_DISTANCE)
        : top < vh && bottom > 0;
    }

    if (cache.notesTop !== null) {
      const notesTop = cache.notesTop - sy;
      s.quiet = s.quiet ? notesTop < vh * QUIET_ZONE_EXIT : notesTop < vh * QUIET_ZONE_ENTER;
    }
    const resting = s.quiet && !s.committed;
    if (resting !== s.resting) {
      s.resting = resting;
      containerRef.current?.toggleAttribute("data-field-resting", resting);
    }

    // The hero and About are reading zones: the swarm never follows the
    // cursor across them.
    const px = p.x + sx;
    const py = p.y + sy;
    const inReadingZone = [cache.hero, cache.about].some(
      (box) => box !== null && px >= box.left && px <= box.right && py >= box.top && py <= box.bottom,
    );
    const swarm = !s.committed && !resting && p.onPage && p.moved && !inReadingZone;

    let footerFade = 1;
    if (cache.footerTop !== null) {
      const fadeEnd = vh - cache.footerHeight + FOOTER_FADE_END_MARGIN;
      const span = Math.max(cache.footerHeight - FOOTER_FADE_END_MARGIN, 1);
      footerFade = Math.min(1, Math.max(0, (cache.footerTop - sy - fadeEnd) / span));
    }

    const opacityEase = 1 - Math.exp(-dt / 0.3);
    const scaleEase = 1 - Math.exp(-dt / 0.35);
    const wobbleEase = 1 - Math.exp(-dt / 0.4);

    items.forEach((item, i) => {
      const icon = icons[i];
      const slot = cache.slots[i];
      const docking = s.committed && slot !== null;

      if (!s.started) {
        icon.x = item.x * vw;
        icon.y = item.y * vh;
      }

      let tx: number;
      let ty: number;
      let targetOpacity: number;
      let targetScale = 1;
      let targetWobble = 1;

      if (docking) {
        tx = slot.x - sx;
        ty = slot.y - sy;
        targetOpacity = 1;
        targetScale = DOCKED_SIZE / item.size;
        targetWobble = 0;
      } else if (swarm) {
        // Each icon drifts to a new random offset around the cursor every
        // 5-9s, gliding there slowly on its own clock.
        if (icon.rerollAt < 0 || t >= icon.rerollAt) {
          icon.ctx = (Math.random() - 0.5) * 320;
          icon.cty = (Math.random() - 0.5) * 260;
          if (icon.rerollAt < 0) {
            icon.cx = icon.ctx;
            icon.cy = icon.cty;
          }
          icon.rerollAt = t + 5000 + Math.random() * 4000;
        }
        const glide = 1 - Math.exp(-dt / 1.4);
        icon.cx += (icon.ctx - icon.cx) * glide;
        icon.cy += (icon.cty - icon.cy) * glide;
        tx = p.x + icon.cx;
        ty = p.y + icon.cy;
        targetOpacity = 0.14 + item.depth * 0.14;
      } else {
        tx = item.x * vw;
        ty = item.y * vh;
        targetOpacity = resting ? (0.1 + item.depth * 0.12) * footerFade : 0.1 + item.depth * 0.2;
        if (resting) targetWobble = 0;
        // Resting icons stay off the About section: it has its own weave
        // background, and the swarm never belongs over its reading text.
        const about = cache.about;
        if (about && tx + sx >= about.left && tx + sx <= about.right && ty + sy >= about.top && ty + sy <= about.bottom) {
          targetOpacity = 0;
        }
      }
      if (!swarm) icon.rerollAt = -1;

      if (icon.landed && !docking) icon.landed = false;

      if (icon.landed) {
        // Parked exactly on the slot, invisible, tracking scroll so a release
        // starts from the right place.
        icon.x = tx;
        icon.y = ty;
        icon.vx = 0;
        icon.vy = 0;
      } else {
        const omega = 3.2 + hash01(item.id, 11) * 2.4;
        icon.vx += (omega * omega * (tx - icon.x) - 2 * omega * icon.vx) * dt;
        icon.vy += (omega * omega * (ty - icon.y) - 2 * omega * icon.vy) * dt;
        icon.x += icon.vx * dt;
        icon.y += icon.vy * dt;
        icon.scale += (targetScale - icon.scale) * scaleEase;
        icon.opacity += (targetOpacity - icon.opacity) * opacityEase;

        if (
          docking &&
          Math.hypot(tx - icon.x, ty - icon.y) < LAND_DISTANCE &&
          Math.hypot(icon.vx, icon.vy) < LAND_SPEED &&
          Math.abs(targetScale - icon.scale) < 0.01
        ) {
          icon.landed = true;
          icon.x = tx;
          icon.y = ty;
          icon.scale = targetScale;
          icon.opacity = 0;
        }
      }
      icon.wobble += (targetWobble - icon.wobble) * wobbleEase;

      // Exactly one copy is visible while docking: the floating one in
      // flight, then the static one from the frame it lands. Both switches
      // happen here, in the same frame, never in a React effect.
      const hideStatic = docking && !icon.landed;
      if (slot?.staticIcon && hideStatic !== icon.staticHidden) {
        slot.staticIcon.style.visibility = hideStatic ? "hidden" : "";
        icon.staticHidden = hideStatic;
      }

      const period = 4000 + hash01(item.id, 3) * 3000;
      icon.mv.x.set(icon.x);
      icon.mv.y.set(icon.y);
      icon.mv.scale.set(icon.scale);
      icon.mv.opacity.set(icon.landed ? 0 : icon.opacity);
      icon.mv.rotate.set(Math.sin((t / period) * Math.PI * 2) * 10 * icon.wobble);
    });
    s.started = true;
  });

  return (
    <div aria-hidden ref={containerRef} className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
      {items.map((item, i) => {
        const mv = icons[i].mv;
        return (
          <motion.img
            key={item.id}
            src={item.src}
            alt=""
            draggable={false}
            data-mono={item.mono ? "" : undefined}
            className="absolute top-0 left-0 block object-contain"
            style={{
              width: item.size,
              height: item.size,
              marginLeft: -item.size / 2,
              marginTop: -item.size / 2,
              x: mv.x,
              y: mv.y,
              rotate: mv.rotate,
              scale: mv.scale,
              opacity: mv.opacity,
            }}
          />
        );
      })}
    </div>
  );
}

/**
 * Floating tech-icon field, mounted once at the root layout. Icons rest at
 * their own spots, cluster loosely around the cursor, fly home into their
 * slots in the skills section while it's in view, and sit still from Notes
 * onward. Not mounted at all for touch or coarse pointers or reduced motion.
 */
export function CursorField({ items = [] }: { items?: CursorFieldItem[] }) {
  const enabled = useSyncExternalStore(
    subscribeToFieldQuery,
    () => window.matchMedia(FIELD_QUERY).matches,
    () => false,
  );
  if (!enabled || items.length === 0) return null;
  return <Field items={items} />;
}
