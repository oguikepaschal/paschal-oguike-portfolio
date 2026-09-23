import type { ReactNode } from "react";

interface SectionHeadlineProps {
  children: ReactNode;
  className?: string;
  /** Contact's headline wants the same italic treatment its mailto CTA
   * already carries; other sections leave this off. */
  italic?: boolean;
}

/** The large font-display headline every section leads with, under its
 * SectionLabel eyebrow. Sized one step below Hero's h1 so Hero keeps the
 * single biggest moment on the page. */
export function SectionHeadline({ children, className = "", italic = false }: SectionHeadlineProps) {
  return (
    <h2
      className={`font-display m-0 text-headline leading-headline font-extrabold uppercase tracking-headline text-balance ${
        italic ? "italic" : ""
      } ${className}`}
    >
      {children}
    </h2>
  );
}
