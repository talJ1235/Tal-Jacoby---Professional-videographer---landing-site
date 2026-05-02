import { Layout } from '../components/layout/Layout';
import { Hero } from '../sections/Hero';
import { About } from '../sections/About';
import { Portfolio } from '../sections/Portfolio';
import { Contact } from '../sections/Contact';
import { SectionDots } from '../components/ui/SectionDots';
import { useSectionScroll } from '../hooks/useSectionScroll';

export function Home() {
  useSectionScroll();

  return (
    <Layout>
      <SectionDots />
      <Hero />
      <About />
      <Portfolio />
      <Contact />
    </Layout>
  );
}
