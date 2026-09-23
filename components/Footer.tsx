import type { ReactNode } from "react";

const EMAIL = "paschaloguike@gmail.com";

const ICON_PROPS = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
  className: "block",
} as const;

const SOCIALS: { label: string; href: string; icon: ReactNode }[] = [
  {
    label: "X",
    href: "https://x.com/pzautos",
    icon: (
      <svg {...ICON_PROPS} fill="currentColor">
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
      </svg>
    ),
  },
  {
    label: "GitHub",
    href: "https://github.com/oguikepaschal",
    icon: (
      <svg {...ICON_PROPS} fill="currentColor">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/oguike-paschal-6355a826a/",
    icon: (
      <svg {...ICON_PROPS} fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: "Google Maps — Local Guide · Level 5",
    href: "https://www.google.com/maps/contrib/108760833902033858252",
    icon: (
      <svg {...ICON_PROPS} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z" />
        <circle cx="12" cy="10" r="2.4" />
      </svg>
    ),
  },
];

export function Footer() {
  return (
    <footer
      id="site-footer"
      data-inverse
      className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-[clamp(24px,4.5vw,64px)] pt-9 pb-[clamp(28px,4vw,40px)]"
      style={{ background: "var(--paper)" }}
    >
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-label leading-label uppercase tracking-label">
        <div className="flex items-center gap-1">
          {SOCIALS.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.label}
              title={social.label}
              className="flex h-11 w-11 items-center justify-center transition-colors duration-300 hover:text-ink"
              style={{ color: "var(--faint)" }}
            >
              {social.icon}
            </a>
          ))}
        </div>
        <a
          href={`mailto:${EMAIL}`}
          className="transition-colors duration-300 hover:text-ink"
          style={{ color: "var(--faint)" }}
        >
          Email
        </a>
        <a href="#top" className="transition-colors duration-300 hover:text-ink" style={{ color: "var(--faint)" }}>
          Back to top
        </a>
      </div>
    </footer>
  );
}
