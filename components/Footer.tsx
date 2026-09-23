const EMAIL = "paschaloguike@gmail.com";

const LINKS = [
  { href: "https://github.com", label: "GitHub" },
  { href: "https://linkedin.com", label: "LinkedIn" },
  { href: `mailto:${EMAIL}`, label: "Email" },
];

function PinIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="block"
    >
      <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.4" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer
      id="site-footer"
      data-inverse
      className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-[clamp(24px,4.5vw,64px)] pt-9 pb-[clamp(28px,4vw,40px)]"
      style={{ background: "var(--paper)" }}
    >
      <div className="flex flex-wrap gap-8 text-label leading-label uppercase tracking-label">
        {LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="transition-colors duration-300 hover:text-ink"
            style={{ color: "var(--faint)" }}
          >
            {link.label}
          </a>
        ))}
        <a
          href="https://www.google.com/maps/contrib/108760833902033858252"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 transition-colors duration-300 hover:text-ink"
          style={{ color: "var(--faint)" }}
        >
          <PinIcon />
          Local Guide · Level 5
        </a>
        <a href="#top" className="transition-colors duration-300 hover:text-ink" style={{ color: "var(--faint)" }}>
          Back to top
        </a>
      </div>
    </footer>
  );
}
