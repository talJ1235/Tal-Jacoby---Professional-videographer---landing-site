import { Navbar } from './Navbar';
import { ScrollProgress } from '../ui/ScrollProgress';
import { WhatsAppButton } from '../ui/WhatsAppButton';

export function Layout({ children }) {
  return (
    <>
      <ScrollProgress />
      <Navbar />
      <main>{children}</main>
      <WhatsAppButton />
    </>
  );
}
