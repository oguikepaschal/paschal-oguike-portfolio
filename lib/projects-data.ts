import { ORIGINAL_ICON_SRC } from "@/lib/skills";

export interface ProjectTechIcon {
  label: string;
  src: string;
  /** True for single-color (near-black) marks that need inverting in dark mode. */
  mono?: boolean;
}

export interface Project {
  id: string;
  number: string;
  status: string;
  tone: "accent" | "muted";
  title: string;
  /** One-line summary shown on the card. */
  description: string;
  /** Tech tag badges shown on the card. */
  tags: string[];
  /** Italic intro paragraph shown at the top of the modal. */
  tagline: string;
  problem: string;
  whatBroke: string[];
  decisions: string[];
  techIcons: ProjectTechIcon[];
  /** Public URL, when there is one. Omitted for private or unlaunched
   * deployments, so the modal never shows a link that goes nowhere. */
  liveSiteHref?: string;
  /** 16:9 screenshot filling the modal's header. Omitted projects keep the
   * blank placeholder until a photo is added. */
  image?: { src: string; alt: string };
}

const ICONS = "https://cdn.simpleicons.org";

export const PROJECTS: Project[] = [
  {
    id: "sterling",
    number: "01",
    status: "Live",
    tone: "accent",
    title: "Sterling Capital Exchange",
    description: "A simulated trading platform built to actually hold up.",
    tags: ["Next.js", "Supabase", "Sentry", "Cloudflare", "TypeScript", "Railway"],
    tagline:
      "Spot, forex, and binary options, all simulated but functioning like the real thing. The interface was the easy part. Getting price feeds, order matching, and multi-currency wallets to behave correctly under load took most of the work.",
    problem:
      "Most trading demos fake the numbers. I wanted the math to actually hold, so a forex position and a binary option settle against the same price feed without drifting apart.",
    whatBroke: [
      "Four separate wallet mutation bugs shared one root cause: balance updates weren't wrapped in database transactions, so a failure partway through left a wallet mutated with no rollback. Fixed once at the architecture level instead of patching each symptom.",
      "A debugging pass flagged old options-trading code as an active bug. It was dead code left over from a feature removal, reachable through live routes but never executed. Pattern-matching without checking reachability delayed the real fix.",
      "Cron settlement returned 401 errors for days. Three unrelated causes stacked: environment variables set for Development but not Production, a missing 'Bearer' prefix expected by the auth check, and a Sentry config flag silently interfering with the request.",
      "All exchange price fetches (Bybit, Binance, CoinGecko) get blocked outright by the hosting environment, so everything routes through a Cloudflare Worker relay instead of calling those APIs directly.",
    ],
    decisions: [
      "Used Supabase instead of a custom backend to keep auth, realtime, and Postgres in one place. Gave up some flexibility for faster iteration.",
      "Built the wallet as an append-only transaction log instead of mutable balances, so every position stays auditable.",
      "Currency handling became its own subsystem. Supporting multiple locales without breaking settlement precision took more care than expected.",
    ],
    techIcons: [
      { label: "Next.js", src: `${ICONS}/nextdotjs`, mono: true },
      { label: "Supabase", src: `${ICONS}/supabase` },
      { label: "Sentry", src: `${ICONS}/sentry` },
      { label: "Cloudflare", src: `${ICONS}/cloudflare` },
      { label: "TypeScript", src: `${ICONS}/typescript` },
      { label: "Railway", src: `${ICONS}/railway`, mono: true },
    ],
    liveSiteHref: "https://sterlingcapitalexchange.com",
    image: {
      src: "/images/projects/sterling-capital-v2.jpeg",
      alt: "Sterling Capital Exchange homepage with a live BTC/USD trading terminal",
    },
  },
  {
    id: "freight",
    number: "02",
    status: "In progress",
    tone: "muted",
    title: "Meridian Freight",
    description: "Three apps, one shared backend, kept in sync.",
    tags: ["Next.js", "TypeScript", "Neon Postgres", "Drizzle ORM", "Auth.js v5", "Turborepo"],
    tagline:
      "A freight-forwarding platform built from scratch, modeled on enterprise players in the space. Split into a public marketing site, a customer portal, and an internal admin app, all sharing one monorepo and one data layer.",
    problem:
      "Freight software has to serve prospects, shipping customers, and internal ops at once, without the three surfaces drifting into separate codebases.",
    whatBroke: [
      "Preview deployments started failing consistently once the database's preview-branch count hit its plan limit. Production was unaffected, but every feature branch broke until old branches were cleaned up manually. Still a recurring maintenance task.",
      "An automated attribution-suppression config looked correct in review but silently failed, because two keys were the wrong type: booleans instead of empty strings. A manual check caught it, which led to a second independent safeguard rather than trusting the config alone.",
      "Trusting a coding agent's summary of a pull request almost let through a change built on an outdated base, which would have deleted unrelated content on merge. Every diff now gets checked directly against main before approval.",
      "Google Fonts' next/font integration kept failing during CI builds, since it fetches fonts at build time and CI environments don't always have reliable access. Switched to locally bundled fonts, trading setup convenience for build reliability.",
    ],
    decisions: [
      "Turborepo monorepo with shared UI and type packages, so all three apps stay consistent without copy-pasting components.",
      "Schema decisions made early and carefully. Freight data like shipments, containers, and customs records is hard to restructure later.",
      "Architecture reviewed before implementation each time, rather than worked out live in the codebase.",
    ],
    techIcons: [
      { label: "Next.js", src: `${ICONS}/nextdotjs`, mono: true },
      { label: "TypeScript", src: `${ICONS}/typescript` },
      { label: "Neon Postgres", src: `${ICONS}/neon` },
      { label: "Drizzle ORM", src: `${ICONS}/drizzle` },
      { label: "Auth.js v5", src: ORIGINAL_ICON_SRC.authJs, mono: true },
      { label: "Turborepo", src: `${ICONS}/turborepo` },
    ],
  },
  {
    id: "dealership",
    number: "03",
    status: "Not adopted",
    tone: "muted",
    title: "Polanco Ops Hub",
    description: "Inventory and CRM built around how the team already works.",
    tags: ["React", "Node.js", "WhatsApp API", "Tailwind", "Supabase"],
    tagline:
      "A mobile-first operations hub built on spec for a Lagos luxury car dealership designed, built and pitched entirely on my own initiative, with no brief and no contract. It was never adopted, but it was worth the shot. Inventory tracking, a CRM built around WhatsApp, and deal sheets generated automatically.",
    problem:
      "The dealership's real workflow lived in WhatsApp threads and paper deal sheets. Software that ignored that would just sit unused.",
    whatBroke: [
      "A code audit turned up a silent exchange-rate bug that could put ₦0 or NaN into deal sheet PDFs with no visible error. It had been sitting in production undetected, since nothing was actually crashing.",
      "The offline and installable app layer broke completely after a framework upgrade. Two popular PWA libraries were both incompatible with the new default build system, so the fix meant switching to a different build approach entirely.",
      "Car creation wasn't atomic, so a failure partway through could leave a partial record in the database. Same root cause as the Sterling wallet bugs: a write that needed to be all-or-nothing wasn't. Recognizing the pattern the second time meant fixing it faster.",
      "Deleted or hidden cars were still reachable through a public image URL, meaning inventory that was supposed to be private stayed viewable to anyone with the link.",
    ],
    decisions: [
      "Built the CRM around WhatsApp instead of a conventional inbox, matching the channel the sales team already relied on.",
      "Chose a PWA over a native app, since install friction on the team's phones mattered more than native features.",
      "Deal sheets now pull directly from live inventory, removing a manual step that used to cause errors.",
    ],
    techIcons: [
      { label: "React", src: `${ICONS}/react` },
      { label: "Node.js", src: `${ICONS}/nodedotjs` },
      { label: "WhatsApp API", src: `${ICONS}/whatsapp` },
      { label: "Tailwind", src: `${ICONS}/tailwindcss` },
      { label: "Supabase", src: `${ICONS}/supabase` },
    ],
    image: {
      src: "/images/projects/polanco-ops-hub.jpeg",
      alt: "Polanco Ops Hub inventory screen showing vehicle cards with availability status",
    },
  },
  {
    id: "stonebridge",
    number: "04",
    status: "Live",
    tone: "accent",
    title: "Stonebridge Builders",
    description: "A CMS that lives in git, not a subscription.",
    tags: ["Cloudinary", "CSS", "Netlify", "Git"],
    tagline:
      "Marketing site, recruiting pipeline, and content management for a general contracting company operating across Pennsylvania, North Carolina, and Illinois. Content lives in the repo, with no database and no monthly CMS cost.",
    problem: "A small contracting company editing a few pages a month doesn't need a headless CMS subscription to do it.",
    whatBroke: [
      "SSL certificate renewal failed, and the certificate settings looked completely correct. The real cause was a nameserver mismatch between the hosting provider and the domain registrar, which meant the certificate authority couldn't verify the domain at all.",
    ],
    decisions: [
      "Content stored as markdown in the repo, edited directly or through a lightweight git-based editor, with no database dependency.",
      "Static generation for speed and zero server cost on a site that's mostly marketing pages.",
      "Recruiting and hiring documents pull from the same content pipeline, keeping job postings and the site in sync.",
    ],
    techIcons: [
      { label: "Cloudinary", src: `${ICONS}/cloudinary` },
      { label: "CSS", src: `${ICONS}/css` },
      { label: "Netlify", src: `${ICONS}/netlify` },
      { label: "Git", src: `${ICONS}/git` },
    ],
    liveSiteHref: "https://thestonebridgeco.com",
    image: {
      src: "/images/projects/stonebridge.jpeg",
      alt: "Stonebridge Builders homepage hero reading “Building with Integrity. Crafted to Last.”",
    },
  },
];
