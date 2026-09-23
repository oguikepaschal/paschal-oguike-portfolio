import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Notes } from "@/components/Notes";
import { Projects } from "@/components/Projects";
import { SkillsMatrix } from "@/components/SkillsMatrix";

export default function Home() {
  return (
    <main>
      <Hero />
      <Projects />
      <About />
      <SkillsMatrix />
      <Notes />
      <Contact />
      <Footer />
    </main>
  );
}
