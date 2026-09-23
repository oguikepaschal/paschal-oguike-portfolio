import type { ElementType, ReactNode } from "react";

interface SectionLabelProps {
  children: ReactNode;
  className?: string;
  /** Element to render as. Defaults to `h2` since every current usage is a
   * top-level section header sitting below Hero's single `h1` — pass a
   * different tag only where that's genuinely not the right semantics. */
  as?: ElementType;
}

/** The recurring uppercase marker at the top of every section. Plain upright
 * Archivo at the handoff's "label" role — the same face as running body UI
 * text, set apart by weight, size and wide tracking rather than a different
 * typeface. */
export function SectionLabel({ children, className = "", as: Tag = "h2" }: SectionLabelProps) {
  return (
    <Tag
      className={`m-0 text-label leading-label font-semibold uppercase tracking-label ${className}`}
      style={{ color: "var(--muted)" }}
    >
      {children}
    </Tag>
  );
}
