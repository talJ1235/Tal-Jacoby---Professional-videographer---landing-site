import { Layout } from '../components/layout/Layout';
import { Opening } from '../sections/Opening';
import { Works } from '../sections/Works';
import { Footer } from '../components/layout/Footer';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useLenis } from '../hooks/useLenis';

// Each section is isolated so a crash in one can never blank the whole page.
export function Home() {
  useLenis();

  return (
    <Layout>
      <ErrorBoundary><Opening /></ErrorBoundary>
      <ErrorBoundary><Works /></ErrorBoundary>
      <ErrorBoundary><Footer /></ErrorBoundary>
    </Layout>
  );
}
