import { useContent } from '../../content/useContent';
import './Footer.css';

// Contact values come from content/site.json (edited via /admin → תוכן).
export function Footer() {
  const { site } = useContent();
  const { email, phone, instagram } = site.footer;
  return (
    <footer className="footer" aria-label="פרטי קשר">
      <div className="footer__inner">
        <span className="footer__name">{site.heroName}</span>
        <a className="footer__link" href={`mailto:${email}`}>אימייל</a>
        <a className="footer__link" href={`tel:${phone}`}>טלפון</a>
        <a
          className="footer__link"
          href={instagram}
          target="_blank"
          rel="noopener noreferrer"
        >
          אינסטגרם
        </a>
      </div>
    </footer>
  );
}
