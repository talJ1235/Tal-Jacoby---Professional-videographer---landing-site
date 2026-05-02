import './Footer.css';

// SOCIAL LINKS — שנה את הקישורים כאן ↓
const SOCIALS = {
  instagram: 'https://www.instagram.com/tal_jacoby1235',
  youtube:   'https://www.youtube.com/@tal100',
  facebook:  'https://www.facebook.com/profile.php?id=100026237141861',
};

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">

        {/* Brand */}
        <div className="footer__brand">
          <p className="footer__logo">טל יעקבי</p>
          <p className="footer__tagline">צלם וידאו</p>
        </div>

        {/* Contact info — EDIT HERE ↓ */}
        <div className="footer__contact">
          <a href="tel:0547713317" className="footer__contact-item">054-771-3317</a>
          {/* EMAIL: שנה כאן ↓ */}
          <a href="mailto:tal.jacoby1235@gmail.com" className="footer__contact-item">tal.jacoby1235@gmail.com</a>
          <span className="footer__contact-item">נתניה והמרכז</span>
        </div>

        {/* Socials */}
        <div className="footer__right">
          <div className="footer__socials">
            <a href={SOCIALS.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="5"/>
                <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/>
              </svg>
            </a>
            <a href={SOCIALS.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.5C5.12 20 12 20 12 20s6.88 0 8.59-.5a2.78 2.78 0 0 0 1.95-1.92A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
                <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none"/>
              </svg>
            </a>
            <a href={SOCIALS.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
          </div>
          <p className="footer__copy">© 2025 כל הזכויות שמורות</p>
        </div>

      </div>
    </footer>
  );
}
