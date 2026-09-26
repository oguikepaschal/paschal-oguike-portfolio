import Image from "next/image";
import { FlipWord } from "@/components/FlipWord";

/** Kept to short single words: the slot is sized to the longest entry, so
 * one multi-word phrase would reserve two or three lines of empty space
 * under every short word. Each maps to real work further down the page. */
const HANDLES = ["Money", "Inventory", "Operations", "Invoicing"];

const EMAIL = "paschaloguike@gmail.com";

/** The two actions a visitor came for, placed straight under the headline
 * so they sit inside the first viewport at every width, rather than after
 * the intro paragraph (desktop) or the portrait (mobile). */
function HeroActions() {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <a
        href="/Oguike_Paschal_Chidera_Resume.pdf"
        download
        className="inline-flex min-h-11 w-fit items-center gap-3 border px-3.5 text-ui leading-ui font-semibold uppercase tracking-ui transition-opacity duration-300 hover:opacity-85"
        style={{ background: "var(--accent)", borderColor: "var(--accent)", color: "var(--paper)" }}
      >
        Download Résumé
      </a>
      <a
        href={`mailto:${EMAIL}`}
        className="inline-flex min-h-11 items-center text-ui leading-ui font-semibold uppercase tracking-ui underline decoration-1 underline-offset-4 transition-colors duration-300 hover:text-accent"
        style={{ color: "var(--body)" }}
      >
        Email me
      </a>
    </div>
  );
}

export function Hero() {
  return (
    <section
      id="top"
      className="grid grid-cols-1 gap-y-8 lg:grid-cols-12 lg:gap-x-6 lg:gap-y-0 px-[clamp(24px,4.5vw,64px)] pt-[clamp(40px,10vw,128px)] pb-[clamp(48px,11vw,176px)]"
    >
      {/* Heading column: on desktop this is the right-hand block (photo takes
          the left), starting at the top row and running tall enough to sit
          alongside the photo below — the photo starts a row later (see its
          own lg:row-start-2 below) so the two columns don't align into an
          even, symmetrical pair; the text leads, the photo trails and lands
          lower, which is the asymmetry this layout is going for. */}
      <div className="flex flex-col gap-y-7 lg:col-start-6 lg:col-span-6 lg:row-start-1 lg:row-span-2 lg:self-start">
        <p className="font-text m-0 text-lead leading-lead tracking-lead" style={{ color: "var(--body)" }}>
          Hi, my name is Paschal
        </p>

        <h1 className="font-display m-0 text-left text-display leading-display font-extrabold uppercase tracking-display text-balance">
          I build web applications that&nbsp;handle{" "}
          <span className="italic">
            <FlipWord words={HANDLES} intervalMs={2000} />
          </span>{" "}
          end to end.
        </h1>

        <HeroActions />

        <p
          className="font-text block text-lead leading-lead tracking-lead text-pretty max-w-[62ch]"
          style={{ color: "var(--body)" }}
        >
          I&apos;m a full-stack developer working across React, TypeScript, Node, and Postgres end to end, from
          data model to UI. I like systems with real constraints: money that has to reconcile, inventory that has
          to stay accurate, forms that have to survive a non-technical user. Most of what&apos;s here came out of
          solving an actual operational problem for a business, not a tutorial.
        </p>
      </div>

      {/* Photo column: left side on desktop, starting one row down from the
          heading block for the offset/asymmetric composition described
          above. Wider than the old 4-col version (5 of 12) since it's now
          the left column's sole visual anchor rather than a small aside
          squeezed under the section label. */}
      <div className="mx-auto w-full max-w-[200px] sm:max-w-[340px] lg:mx-auto lg:max-w-[360px] lg:col-start-1 lg:col-span-5 lg:row-start-2 lg:mt-[clamp(28px,4vw,64px)]">
        <div className="relative aspect-[4/5] w-full overflow-hidden">
          <Image
            src="/images/hero-portrait-4.png"
            alt="Portrait photo"
            fill
            priority
            sizes="(max-width: 1024px) 340px, 360px"
            className="object-cover object-top grayscale contrast-[1.08]"
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
            style={{ background: "linear-gradient(to bottom, transparent, var(--paper))" }}
          />
        </div>
        <div className="mt-2.5 text-caption leading-caption uppercase tracking-caption tabular-nums" style={{ color: "var(--muted)" }}>
          PO / 2026
        </div>
      </div>
    </section>
  );
}
