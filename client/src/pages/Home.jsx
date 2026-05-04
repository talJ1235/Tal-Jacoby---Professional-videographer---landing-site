import { Layout } from '../components/layout/Layout';
import { Hero } from '../sections/Hero';
import { About } from '../sections/About';
import { Portfolio } from '../sections/Portfolio';
import { Contact } from '../sections/Contact';
import { SectionDots } from '../components/ui/SectionDots';
import { useSectionScroll } from '../hooks/useSectionScroll';
import './Home.css';

function SectionSep() {
  return (
    <div className="section-sep" aria-hidden="true">
      <span className="section-sep__gem" />
    </div>
  );
}

export function Home() {
  useSectionScroll();

  return (
    <Layout>
      <SectionDots />
      <Hero />
      <SectionSep />
      <About />
      <SectionSep />
      <Portfolio />
      <SectionSep />
      <Contact />
    </Layout>
  );
}
