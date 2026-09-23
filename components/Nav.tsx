import { Clock } from "@/components/Clock";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileMenu } from "@/components/MobileMenu";

const NAV_LINKS = [
  { href: "#work", label: "Work" },
  { href: "#stack", label: "Stack" },
  { href: "#notes", label: "Notes" },
  { href: "#contact", label: "Contact" },
];

export function Nav() {
  return (
    <header
      className="relative z-30 flex items-center justify-between gap-4 border-b-2 px-[clamp(24px,4.5vw,64px)] py-[26px]"
      style={{ background: "var(--paper)", borderColor: "var(--rule)" }}
    >
      <a href="#top" className="font-display text-brand leading-brand font-extrabold uppercase tracking-brand">
        Paschal
      </a>

      <nav className="hidden flex-wrap items-baseline gap-x-[30px] gap-y-3 text-ui leading-ui font-semibold uppercase tracking-ui md:flex">
        {NAV_LINKS.map((link) => (
          <a key={link.href} href={link.href} className="transition-colors duration-300 hover:text-accent">
            {link.label}
          </a>
        ))}
      </nav>

      <div className="hidden items-center gap-[18px] md:flex">
        <Clock />
        <ThemeToggle />
      </div>

      <div className="flex items-center gap-3 md:hidden">
        <ThemeToggle />
        <MobileMenu links={NAV_LINKS} />
      </div>
    </header>
  );
}
