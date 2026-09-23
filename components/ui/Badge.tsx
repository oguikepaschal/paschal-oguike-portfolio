import type { ReactNode } from "react";

type BadgeTone = "default" | "accent" | "muted";
type BadgeSize = "sm" | "md";
type BadgeVariant = "status" | "tag";

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  size?: BadgeSize;
  /** "status" (LIVE, IN PROGRESS, the hero pill) is uppercase and wide-tracked.
   * "tag" (tech tags like "Next.js") keeps natural case and ignores tone —
   * tags are always neutral in the reference. */
  variant?: BadgeVariant;
  dot?: boolean;
  href?: string;
  className?: string;
  /** Set false to omit the border entirely, e.g. a "Live" status pill that
   * should read as a plain color chip. */
  border?: boolean;
}

const TONE_STYLES: Record<BadgeTone, { border: string; color: string }> = {
  default: { border: "var(--chip)", color: "var(--body)" },
  accent: { border: "var(--accent)", color: "var(--accent)" },
  muted: { border: "var(--rule)", color: "var(--muted)" },
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: "gap-1.5 px-2 py-[3px] text-label leading-label uppercase tracking-label",
  md: "gap-3 px-3.5 py-[7px] text-label leading-label uppercase tracking-label",
};

const TAG_CLASSES = "gap-0 px-[7px] py-[3px] text-tag leading-tag tracking-tag";
const TAG_TONE = { border: "var(--rule)", color: "var(--body)" };

/**
 * Shared pill primitive: status pills ("LIVE", "IN PROGRESS"), tech tags
 * ("Next.js"), and the hero's clickable status pill all render through this.
 */
export function Badge({
  children,
  tone = "default",
  size = "sm",
  variant = "status",
  dot = false,
  href,
  className = "",
  border: showBorder = true,
}: BadgeProps) {
  const isTag = variant === "tag";
  const { border, color } = isTag ? TAG_TONE : TONE_STYLES[tone];
  const sizing = isTag ? TAG_CLASSES : SIZE_CLASSES[size];
  const classes = `inline-flex items-center ${showBorder ? "border" : ""} font-medium whitespace-nowrap transition-colors duration-300 ${sizing} ${
    href ? "hover:border-[var(--ink)] hover:bg-[var(--wash)] hover:text-ink" : ""
  } ${className}`;
  const style = { ...(showBorder ? { borderColor: border } : {}), color };

  const content = (
    <>
      {dot && (
        <span
          aria-hidden
          className="h-[6px] w-[6px] shrink-0 rounded-full"
          style={{ background: "var(--accent)" }}
        />
      )}
      {children}
    </>
  );

  if (href) {
    return (
      <a href={href} className={classes} style={style}>
        {content}
      </a>
    );
  }

  return (
    <span className={classes} style={style}>
      {content}
    </span>
  );
}
