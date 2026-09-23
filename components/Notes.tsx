import { SectionHeadline } from "@/components/ui/SectionHeadline";
import { SectionLabel } from "@/components/ui/SectionLabel";

interface Note {
  title: string;
  dateWritten: string;
}

const NOTES: Note[] = [
  {
    title: "You can't control outcomes, only choices. Control is an illusion.",
    dateWritten: "Oct 1, 2025",
  },
  {
    title: "Detach from the results, attach to the routine.",
    dateWritten: "Aug 2, 2025",
  },
  {
    title: "Building and grieving happen the same days.",
    dateWritten: "Sept 4, 2026",
  },
];

export function Notes() {
  return (
    <section
      id="notes"
      data-inverse
      className="px-[clamp(24px,4.5vw,64px)] pt-[clamp(40px,6.5vw,96px)] pb-[clamp(56px,8vw,128px)]"
      style={{ background: "var(--paper)", color: "var(--ink)" }}
    >
      <div className="mb-[clamp(40px,5vw,64px)] grid grid-cols-1 gap-x-6 gap-y-3 lg:grid-cols-12">
        <SectionLabel className="lg:col-span-2 lg:col-start-1">
          Notes
        </SectionLabel>
        <SectionHeadline className="lg:col-start-3 lg:col-span-9 lg:self-end">
          Short thoughts, written down before I lose them.
        </SectionHeadline>
      </div>

      <div className="flex flex-col">
        {NOTES.map((note) => (
          <a
            key={note.title}
            href="#notes"
            className="grid grid-cols-1 items-baseline gap-x-6 gap-y-2 border-t-2 py-6 transition-colors duration-300 hover:bg-[var(--wash)] lg:grid-cols-12"
            style={{ borderColor: "var(--rule)" }}
          >
            <span className="text-caption leading-caption tracking-caption lg:col-start-1 lg:col-span-1" style={{ color: "var(--accent)" }}>
              —
            </span>
            <span className="font-text text-note leading-note tracking-note font-normal lg:col-start-2 lg:col-span-9">
              {note.title}
            </span>
            <span
              className="text-caption leading-caption tracking-caption tabular-nums lg:col-start-12 lg:col-span-1 lg:text-right"
              style={{ color: "var(--faint)" }}
            >
              {note.dateWritten}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
