import { SectionHeadline } from "@/components/ui/SectionHeadline";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SKILL_CATEGORIES } from "@/lib/skills";

export function SkillsMatrix() {
  return (
    <section
      id="stack"
      className="px-[clamp(24px,4.5vw,64px)] pt-[clamp(56px,8vw,128px)] pb-[clamp(64px,11vw,176px)]"
    >
      <div className="mb-[clamp(40px,5vw,64px)] grid grid-cols-1 gap-x-6 gap-y-3 lg:grid-cols-12">
        <SectionLabel className="lg:col-span-2 lg:col-start-1">
          Technical skills
        </SectionLabel>
        <SectionHeadline className="lg:col-start-3 lg:col-span-6 lg:self-end">
          The stack, roughly.
        </SectionHeadline>
      </div>

      {/* A typographic index: every category in order, a hairline between
          each, tools set inline like words. On desktop the category name
          hangs in the left columns and its tools flow on the right. */}
      <div>
        {SKILL_CATEGORIES.map((category, i) => (
          <div
            key={category.title}
            className={`grid grid-cols-1 gap-x-6 gap-y-3 py-[clamp(20px,2.4vw,32px)] lg:grid-cols-12 lg:items-baseline ${
              i > 0 ? "border-t" : ""
            }`}
            style={{ borderColor: "var(--rule)" }}
          >
            <h3 className="font-category m-0 text-lead leading-[1.2] font-normal italic lg:col-span-3 lg:col-start-1">
              {category.title}
            </h3>
            <ul className="m-0 flex list-none flex-wrap items-center gap-x-5 gap-y-2.5 p-0 lg:col-span-9 lg:col-start-4">
              {category.items.map((skill) => (
                <li key={skill.id} className="inline-flex items-center gap-2">
                  {/* Dock slot for CursorField (components/CursorField.tsx).
                      The static icon is always here; the field only hides it
                      while its floating copy is in flight to this spot. */}
                  <span id={`skill-slot-${skill.id}`} className="inline-flex h-5 w-5 shrink-0 items-center justify-center">
                    <img
                      src={skill.src}
                      alt=""
                      data-mono={skill.mono ? "" : undefined}
                      width={20}
                      height={20}
                      className="skill-static h-5 w-5 object-contain"
                    />
                  </span>
                  <span className="text-caption leading-caption tracking-caption" style={{ color: "var(--body)" }}>
                    {skill.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
