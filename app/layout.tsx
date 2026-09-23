import type { Metadata } from "next";
import { Archivo, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import Script from "next/script";
import { CursorField } from "@/components/CursorField";
import { Nav } from "@/components/Nav";
import { ALL_SKILLS } from "@/lib/skills";
import "./globals.css";

// Direction C: Archivo carries display and UI (condensed on its width axis
// for display/brand text, upright for UI), Source Serif 4 carries reading
// text. Both loaded with their full variable range (no fixed `weight`) so
// the wdth/opsz axes below stay live instead of collapsing to static cuts.
const archivo = Archivo({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["wdth"],
  variable: "--font-sans",
});

const sourceSerif4 = Source_Serif_4({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-serif",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Paschal — Full-stack developer",
  description:
    "I architect the system. The agents type the code. Full-stack developer working across React, TypeScript, Node, and Postgres.",
};

// Applies the saved (or system) theme to <html> before hydration, so there's
// no flash of the wrong theme on load.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var theme = stored === "light" || stored === "dark"
      ? stored
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${sourceSerif4.variable} ${jetBrainsMono.variable}`}
      // The beforeInteractive script below sets data-theme before hydration
      // to avoid a flash of the wrong theme; that intentionally differs from
      // the server-rendered markup, which doesn't know the client's theme.
      suppressHydrationWarning
    >
      <body>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
        <CursorField items={ALL_SKILLS} />
        <Nav />
        {children}
      </body>
    </html>
  );
}
