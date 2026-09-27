export interface Skill {
  id: string;
  label: string;
  src: string;
  /** True for single-color (near-black) marks that need inverting in dark mode. */
  mono?: boolean;
  /** Icon size in px, used both in the grid and by the floating field. */
  size: number;
  /** 0 (far, barely reacts to the cursor) .. 1 (near, reacts most). */
  depth: number;
  /** Initial floating position as a fraction of the viewport, 0-1. */
  x: number;
  y: number;
}

export interface SkillCategory {
  title: string;
  items: Skill[];
}

const ICONS = "https://cdn.simpleicons.org";

/**
 * Icons that can't come from cdn.simpleicons.org.
 *
 * `authJs`: used only by the Meridian Freight card in lib/projects-data.ts
 * (Auth.js is no longer listed as a skill). Simple Icons still has no
 * `authjs` entry (404) and authjs.dev ships no SVG of its mark, so this
 * stays a generic shield-and-keyhole line glyph — same 24x24 viewBox / 1.6
 * stroke / round-cap convention as Footer's PinIcon.
 *
 * `openAi`: Simple Icons has neither `openai` nor `chatgpt` (both still 404),
 * so this is the real OpenAI mark taken from Bootstrap Icons 1.13.1
 * (icons.getbootstrap.com/icons/openai), MIT licensed, © 2019-2024 The
 * Bootstrap Authors. Its own 16x16 viewBox is kept so the path still fits;
 * `currentColor` is swapped for the #111111 the mono-inversion rule expects.
 */
const ORIGINAL_ICONS = {
  serwist: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#111111" d="M11 2h2v9h4l-5 6-5-6h4V2Z M4 20h16v2H4Z"/></svg>`,
  authJs: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.8 19.5 6v6.1c0 4.2-3 7.4-7.5 9.1-4.5-1.7-7.5-4.9-7.5-9.1V6L12 2.8Z"/><circle cx="12" cy="11" r="2"/><path d="M12 13v3.2"/></svg>`,
  openAi: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="#111111"><path d="M14.949 6.547a3.94 3.94 0 0 0-.348-3.273 4.11 4.11 0 0 0-4.4-1.934A4.1 4.1 0 0 0 8.423.2 4.15 4.15 0 0 0 6.305.086a4.1 4.1 0 0 0-1.891.948 4.04 4.04 0 0 0-1.158 1.753 4.1 4.1 0 0 0-1.563.679A4 4 0 0 0 .554 4.72a3.99 3.99 0 0 0 .502 4.731 3.94 3.94 0 0 0 .346 3.274 4.11 4.11 0 0 0 4.402 1.933c.382.425.852.764 1.377.995.526.231 1.095.35 1.67.346 1.78.002 3.358-1.132 3.901-2.804a4.1 4.1 0 0 0 1.563-.68 4 4 0 0 0 1.14-1.253 3.99 3.99 0 0 0-.506-4.716m-6.097 8.406a3.05 3.05 0 0 1-1.945-.694l.096-.054 3.23-1.838a.53.53 0 0 0 .265-.455v-4.49l1.366.778q.02.011.025.035v3.722c-.003 1.653-1.361 2.992-3.037 2.996m-6.53-2.75a2.95 2.95 0 0 1-.36-2.01l.095.057L5.29 12.09a.53.53 0 0 0 .527 0l3.949-2.246v1.555a.05.05 0 0 1-.022.041L6.473 13.3c-1.454.826-3.311.335-4.15-1.098m-.85-6.94A3.02 3.02 0 0 1 3.07 3.949v3.785a.51.51 0 0 0 .262.451l3.93 2.237-1.366.779a.05.05 0 0 1-.048 0L2.585 9.342a2.98 2.98 0 0 1-1.113-4.094zm11.216 2.571L8.747 5.576l1.362-.776a.05.05 0 0 1 .048 0l3.265 1.86a3 3 0 0 1 1.173 1.207 2.96 2.96 0 0 1-.27 3.2 3.05 3.05 0 0 1-1.36.997V8.279a.52.52 0 0 0-.276-.445m1.36-2.015-.097-.057-3.226-1.855a.53.53 0 0 0-.53 0L6.249 6.153V4.598a.04.04 0 0 1 .019-.04L9.533 2.7a3.07 3.07 0 0 1 3.257.139c.474.325.843.778 1.066 1.303.223.526.289 1.103.191 1.664zM5.503 8.575 4.139 7.8a.05.05 0 0 1-.026-.037V4.049c0-.57.166-1.127.476-1.607s.752-.864 1.275-1.105a3.08 3.08 0 0 1 3.234.41l-.096.054-3.23 1.838a.53.53 0 0 0-.265.455zm.742-1.577 1.758-1 1.762 1v2l-1.755 1-1.762-1z"/></svg>`,
};

function svgDataUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Shared so project cards (lib/projects-data.ts) can reuse the same
 * hand-drawn marks instead of defining a second copy that drifts. */
export const ORIGINAL_ICON_SRC = {
  authJs: svgDataUri(ORIGINAL_ICONS.authJs),
  openAi: svgDataUri(ORIGINAL_ICONS.openAi),
};

export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    title: "Languages",
    items: [
      { id: "javascript", label: "JavaScript", src: `${ICONS}/javascript`, size: 46, depth: 0.62, x: 0.19, y: 0.185 },
      { id: "python", label: "Python", src: `${ICONS}/python`, size: 32, depth: 0.22, x: 0.33, y: 0.185 },
      { id: "typescript", label: "TypeScript", src: `${ICONS}/typescript`, size: 48, depth: 0.7, x: 0.755, y: 0.19 },
      { id: "html5", label: "HTML5", src: `${ICONS}/html5`, size: 34, depth: 0.3, x: 0.905, y: 0.225 },
      { id: "react", label: "React", src: `${ICONS}/react`, size: 52, depth: 0.78, x: 0.085, y: 0.295 },
      { id: "tailwind", label: "Tailwind", src: `${ICONS}/tailwindcss`, size: 38, depth: 0.44, x: 0.335, y: 0.28 },
      // Simple Icons retired `css3`; `css` is the only slug and its official
      // fill is now #663399, so the classic CSS blue comes from the CDN's
      // /<slug>/<hex> colour form rather than a dead slug.
      { id: "css", label: "CSS", src: `${ICONS}/css/1572B6`, size: 27, depth: 0.13, x: 0.935, y: 0.315 },
    ],
  },
  {
    title: "Database & cloud",
    items: [
      { id: "postgresql", label: "Postgres", src: `${ICONS}/postgresql`, size: 50, depth: 0.72, x: 0.06, y: 0.6 },
      { id: "mongodb", label: "MongoDB", src: `${ICONS}/mongodb`, size: 33, depth: 0.3, x: 0.165, y: 0.645 },
      { id: "supabase", label: "Supabase", src: `${ICONS}/supabase`, size: 45, depth: 0.62, x: 0.945, y: 0.655 },
      { id: "neon", label: "Neon Postgres", src: `${ICONS}/neon`, size: 28, depth: 0.15, x: 0.775, y: 0.555 },
      { id: "drizzle", label: "Drizzle ORM", src: `${ICONS}/drizzle`, size: 38, depth: 0.4, x: 0.845, y: 0.6 },
    ],
  },
  {
    title: "DevOps & tools",
    items: [
      { id: "node", label: "Node.js", src: `${ICONS}/nodedotjs`, size: 42, depth: 0.5, x: 0.115, y: 0.355 },
      { id: "git", label: "Git", src: `${ICONS}/git`, size: 31, depth: 0.24, x: 0.22, y: 0.72 },
      { id: "github", label: "GitHub", src: `${ICONS}/github`, mono: true, size: 47, depth: 0.68, x: 0.36, y: 0.78 },
      { id: "vercel", label: "Vercel", src: `${ICONS}/vercel`, mono: true, size: 39, depth: 0.46, x: 0.65, y: 0.785 },
      { id: "vscode", label: "VS Code", src: "/icons/vscode.svg", size: 36, depth: 0.36, x: 0.045, y: 0.9 },
      { id: "turborepo", label: "Turborepo", src: `${ICONS}/turborepo`, size: 44, depth: 0.55, x: 0.09, y: 0.76 },
      { id: "railway", label: "Railway", src: `${ICONS}/railway`, mono: true, size: 37, depth: 0.42, x: 0.5, y: 0.86 },
    ],
  },
  {
    title: "AI and core",
    items: [
      { id: "next", label: "Next.js", src: `${ICONS}/nextdotjs`, mono: true, size: 30, depth: 0.2, x: 0.205, y: 0.32 },
      { id: "zod", label: "Zod", src: `${ICONS}/zod`, size: 26, depth: 0.12, x: 0.265, y: 0.205 },
      // Keeps id "twilio" so its existing skill-slot-twilio dock stays valid;
      // only the mark and label change, to the WhatsApp integration this
      // entry actually stands for (same slug as the Polanco project card).
      { id: "twilio", label: "WhatsApp API", src: `${ICONS}/whatsapp`, size: 40, depth: 0.5, x: 0.51, y: 0.73 },
      { id: "claude", label: "Claude", src: `${ICONS}/claude`, size: 33, depth: 0.28, x: 0.765, y: 0.94 },
      { id: "gemini", label: "Gemini", src: `${ICONS}/googlegemini`, size: 41, depth: 0.52, x: 0.57, y: 0.61 },
      {
        id: "chatgpt",
        label: "ChatGPT",
        src: ORIGINAL_ICON_SRC.openAi,
        mono: true,
        size: 29,
        depth: 0.18,
        x: 0.88,
        y: 0.44,
      },
    ],
  },
];

export const ALL_SKILLS: Skill[] = SKILL_CATEGORIES.flatMap((category) => category.items);
