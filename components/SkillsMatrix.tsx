"use client";

import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Card } from "@/components/ui/Card";
import { SectionHeadline } from "@/components/ui/SectionHeadline";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { GlassScrim } from "@/components/ui/GlassScrim";
import { SKILL_CATEGORIES, type Skill, type SkillCategory } from "@/lib/skills";

function SkillCell({ skill }: { skill: Skill }) {
  return (
    <div className="flex flex-col items-center gap-2.5 p-[14px_6px] text-center">
      {/* Empty dock slot: CursorField portals the one and only copy of this
          icon in here once it flies home, so nothing is rendered inside it by
          default — see components/CursorField.tsx. The img below is purely the
          no-field fallback and stays display:none unless the media queries that
          also switch the field off match (see .skill-slot-fallback). */}
      <div
        id={`skill-slot-${skill.id}`}
        className="skill-chase flex h-[34px] w-[34px] items-center justify-center"
      >
        <img
          src={skill.src}
          alt={skill.label}
          data-mono={skill.mono ? "" : undefined}
          width={24}
          height={24}
          className="skill-slot-fallback h-6 w-6 object-contain"
        />
      </div>
      <span className="text-caption leading-caption uppercase tracking-caption" style={{ color: "var(--muted)" }}>
        {skill.label}
      </span>
    </div>
  );
}

/** The Card markup shared by the desktop grid and the mobile carousel slide,
 * so the two only ever differ in how they're sequenced, never in styling. */
function CategoryCard({ category }: { category: SkillCategory }) {
  return (
    <Card style={{ background: "transparent" }}>
      <div
        className="border-b-2 pb-3.5 text-label leading-label uppercase tracking-label"
        style={{ borderColor: "var(--rule)", color: "var(--accent)" }}
      >
        {category.title}
      </div>
      <div className="mt-4 flex flex-wrap gap-2.5">
        {category.items.map((skill) => (
          <div key={skill.id} className="basis-[76px] grow">
            <SkillCell skill={skill} />
          </div>
        ))}
      </div>
    </Card>
  );
}

const MOBILE_QUERY = "(max-width: 639px)";
/** Same query string CursorField.tsx uses to switch itself off. */
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** True only below `sm` and only when the visitor hasn't asked for reduced
 * motion — everything else (tablet, desktop, reduced motion on mobile) falls
 * back to the plain grid. Re-checked live so rotating a phone or toggling the
 * OS setting mid-visit switches modes instead of sticking to whatever was
 * true on mount. */
function useMobileCarousel() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mobile = window.matchMedia(MOBILE_QUERY);
    const reduced = window.matchMedia(REDUCED_MOTION_QUERY);

    function sync() {
      setEnabled(mobile.matches && !reduced.matches);
    }

    sync();
    mobile.addEventListener("change", sync);
    reduced.addEventListener("change", sync);
    return () => {
      mobile.removeEventListener("change", sync);
      reduced.removeEventListener("change", sync);
    };
  }, []);

  return enabled;
}

function MobileSkillsCarousel() {
  const [emblaRef] = useEmblaCarousel({ loop: true });

  return (
    <div className="overflow-hidden" ref={emblaRef}>
      <div className="flex">
        {SKILL_CATEGORIES.map((category) => (
          <div key={category.title} className="min-w-0 flex-[0_0_100%]">
            <CategoryCard category={category} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SkillsGrid() {
  return (
    <div className="relative grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-3">
      {SKILL_CATEGORIES.map((category) => (
        <CategoryCard key={category.title} category={category} />
      ))}
    </div>
  );
}

export function SkillsMatrix() {
  const mobileCarousel = useMobileCarousel();

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
          What I reach for, by default.
        </SectionHeadline>
        <p
          className="font-text text-small leading-small tracking-small text-pretty lg:col-start-10 lg:col-span-3 lg:self-end"
          style={{ color: "var(--muted)" }}
        >
          The stack, roughly.
        </p>
      </div>

      {/* No z-[21] here, unlike Projects' GlassScrim usage: that section has
          no reason for CursorField to render above its cards,
          but this grid is exactly what the floating field flies into and
          docks onto — it must stay visible above the field the whole time,
          not hidden behind glass, so this section is deliberately left at
          the default stack order (below CursorField's z-20). */}
      <div className="relative p-[18px]">
        <GlassScrim />
        {/* Only one of these ever mounts at a time — never a carousel copy
            sitting hidden beside the grid copy — so each skill still renders
            exactly one `skill-slot-{id}` element for CursorField to dock
            into (see the comment on SkillCell above). */}
        {mobileCarousel ? <MobileSkillsCarousel /> : <SkillsGrid />}
      </div>
    </section>
  );
}
