import { Layout } from '../components/layout/Layout';
import { Opening } from '../sections/Opening';
import { Works } from '../sections/Works';
import { Footer } from '../components/layout/Footer';
import { useLenis } from '../hooks/useLenis';

export function Home() {
  useLenis();

  return (
    <Layout>
      <Opening />
      <Works />
      <Footer />
    </Layout>
  );
}
