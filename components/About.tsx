import { AboutWeave } from "@/components/AboutWeave";
import { SectionHeadline } from "@/components/ui/SectionHeadline";
import { SectionLabel } from "@/components/ui/SectionLabel";

const PARAGRAPHS = [
  `I build full-stack products end to end. React and Next.js up front. Postgres and Supabase underneath. Enough of the connective tissue (auth, real-time sync, PDFs, WhatsApp integrations) to ship something a business can actually run on. My last big build was an ops platform I designed and shipped for a Lagos exotic-car dealership unasked. They already had a system in place so it never went live there but I still count it as a win.`,
  `Cars aren't just a talking point for me. I own and run PZ Autos, a car sales business I built and still run myself. I was a car enthusiast long before I became a developer.`,
  `When I'm not working I'm doing one of three things. Gaming: God of War Ragnarök Valhalla is what I'm playing until GTA 6. Uploading photos to Google Maps: I've been at it since 2021 as a Level 5 Local Guide and I'm close to 291,000 photo views. Or learning something new to sharpen my craft. While building this portfolio I've been studying system design documentation and the broader principles of backend engineering.`,
];

export function About() {
  return (
    // relative + overflow-hidden (but no z-index or isolate) so the weave
    // canvas can sit at -z-10 behind the text without lifting the section
    // into its own stacking context, which would drop the paragraphs below
    // the CursorField layer.
    <section id="about" className="relative overflow-hidden px-[clamp(24px,4.5vw,64px)] py-[clamp(56px,8vw,128px)]">
      <AboutWeave />
      <div className="mb-[clamp(40px,5vw,64px)] grid grid-cols-1 gap-x-6 gap-y-3 lg:grid-cols-12">
        <SectionLabel className="lg:col-span-2 lg:col-start-1">About me</SectionLabel>
        <SectionHeadline className="lg:col-start-3 lg:col-span-9 lg:self-end">
          I build the systems businesses run on.
        </SectionHeadline>
      </div>

      {/* Left-aligned under the headline's own column at a reading measure,
          on the plain page surface. z-[21] keeps the copy above the
          CursorField layer (z-20) so drifting icons pass behind it. */}
      <div className="relative z-[21] grid grid-cols-1 gap-x-6 lg:grid-cols-12">
        <div className="flex max-w-[65ch] flex-col gap-6 lg:col-start-3 lg:col-span-8">
          {PARAGRAPHS.map((paragraph, i) => (
            <p key={i} className="font-text m-0 text-body leading-body tracking-body text-pretty" style={{ color: "var(--body)" }}>
              {paragraph}
            </p>
          ))}
          {/* Only where the weave renders (768px and up, see AboutWeave.tsx).
              It sits in this column, so the weave's quiet zone covers it. */}
          <p className="font-text m-0 hidden text-body leading-body tracking-body text-pretty md:block" style={{ color: "var(--body)" }}>
            The texture behind this text is six months of building, one mark per commit.
          </p>
        </div>
      </div>
    </section>
  );
}
