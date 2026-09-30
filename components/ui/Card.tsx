import type { CSSProperties, KeyboardEvent, ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  interactive?: boolean;
  href?: string;
  onClick?: () => void;
  className?: string;
  /** Overrides the default background/shadow, e.g. for a resting-state
   * shadow that must apply without a hover. */
  style?: CSSProperties;
  /** box-shadow applied on hover for interactive cards. Passed in as a CSS
   * custom property (rather than baked into the Tailwind class) so callers
   * can share one shadow constant between this native :hover trigger and
   * their own resting-state inline shadow, instead of two values drifting
   * apart over time. */
  hoverShadow?: string;
}

/** Shared surface for the project grid and similar boxed content. */
export function Card({
  children,
  interactive = false,
  href,
  onClick,
  className = "",
  style: styleOverride,
  hoverShadow,
}: CardProps) {
  const classes = `flex flex-col p-[22px] transition-all duration-300 ${
    interactive
      ? "cursor-pointer [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-1.5 [@media(hover:hover)_and_(pointer:fine)]:hover:shadow-[var(--card-hover-shadow)]"
      : ""
  } ${className}`;
  const style = {
    background: "var(--card)",
    ...(hoverShadow ? ({ "--card-hover-shadow": hoverShadow } as CSSProperties) : {}),
    ...styleOverride,
  };

  if (href) {
    return (
      <a href={href} onClick={onClick} className={classes} style={style}>
        {children}
      </a>
    );
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  }

  return (
    <div
      onClick={onClick}
      onKeyDown={interactive && onClick ? handleKeyDown : undefined}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      className={classes}
      style={style}
    >
      {children}
    </div>
  );
}
