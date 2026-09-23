import { SectionHeadline } from "@/components/ui/SectionHeadline";
import { SectionLabel } from "@/components/ui/SectionLabel";

const EMAIL = "paschaloguike@gmail.com";

export function Contact() {
  return (
    <section
      id="contact"
      data-inverse
      className="px-[clamp(24px,4.5vw,64px)] pt-[clamp(96px,12vw,200px)] pb-[clamp(96px,12vw,200px)]"
      style={{ background: "var(--paper)", color: "var(--ink)" }}
    >
      <div>
        {/* Same header row as every other section (Projects, About me,
            Technical skills) — SectionLabel picks up the inverted --muted
            from this section's own data-inverse palette. */}
        <div className="mb-[clamp(40px,5vw,64px)] grid grid-cols-1 gap-x-6 gap-y-3 lg:grid-cols-12">
          <SectionLabel className="lg:col-span-2 lg:col-start-1">Lets talk</SectionLabel>
        </div>

        <div className="mt-6 flex flex-col items-end text-right">
          <SectionHeadline className="mb-6" italic>
            Let&apos;s build something that has to work.
          </SectionHeadline>

          <p
            className="font-text m-0 mb-7 max-w-[34em] text-lead leading-lead tracking-lead text-pretty"
            style={{ color: "var(--body)" }}
          >
            Have a product that needs to exist, or a codebase that needs a spine? I take on a small number of
            projects at a time.
          </p>

          <a
            href={`mailto:${EMAIL}`}
            className="font-display inline-block bg-[linear-gradient(var(--accent),var(--accent))] bg-[length:0%_2px] bg-no-repeat bg-[position:0_96%] text-email leading-email tracking-email font-bold italic break-words transition-[background-size] duration-[400ms] hover:bg-[length:100%_2px]"
          >
            {EMAIL}
          </a>
        </div>
      </div>
    </section>
  );
}
