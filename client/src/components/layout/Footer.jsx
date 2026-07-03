import { useContent } from '../../content/useContent';
import './Footer.css';

// Contact values + brand/heading come from content/site.json (edited via /admin → תוכן).
export function Footer() {
  const { site } = useContent();
  const { email, phone, instagram } = site.footer;
  const brand = site.brandName || site.heroName;
  const heading = site.contactHeading;
  const year = new Date().getFullYear();

  return (
    <footer className="footer" aria-label="פרטי קשר">
      <div className="footer__inner">
        {heading && <p className="footer__heading">{heading}</p>}

        <div className="footer__contact">
          <span className="footer__name">{brand}</span>
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

        <div className="footer__divider" aria-hidden="true" />

        <p className="footer__copy">© {year} {brand} · כל הזכויות שמורות</p>
      </div>
    </footer>
  );
}
