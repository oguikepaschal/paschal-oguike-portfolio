"use client";

import { useEffect, useState, useSyncExternalStore, type ComponentType } from "react";

/** No weave below this width: the text fills the section on phones. */
const WEAVE_QUERY = "(min-width: 768px)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(WEAVE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Loads the weave (its own chunk, plus the worker behind it) only once the
 * viewport is wide enough — a plain import() in an effect, so narrower
 * screens never request any of it. */
export function AboutWeave() {
  const wide = useSyncExternalStore(subscribe, () => window.matchMedia(WEAVE_QUERY).matches, () => false);
  const [Canvas, setCanvas] = useState<ComponentType | null>(null);

  useEffect(() => {
    if (!wide || Canvas) return;
    let cancelled = false;
    import("@/components/AboutWeaveCanvas").then((mod) => {
      if (!cancelled) setCanvas(() => mod.default);
    });
    return () => {
      cancelled = true;
    };
  }, [wide, Canvas]);

  return wide && Canvas ? <Canvas /> : null;
}
