import './Footer.css';

// Contact values — carried over from the previous site. Update here if they change.
const EMAIL = 'tal.jacoby1235@gmail.com';
const TEL = '+972547713317';
const INSTAGRAM = 'https://www.instagram.com/tal_jacoby1235';

export function Footer() {
  return (
    <footer className="footer" aria-label="פרטי קשר">
      <div className="footer__inner">
        <span className="footer__name">טל יעקבי</span>
        <a className="footer__link" href={`mailto:${EMAIL}`}>אימייל</a>
        <a className="footer__link" href={`tel:${TEL}`}>טלפון</a>
        <a
          className="footer__link"
          href={INSTAGRAM}
          target="_blank"
          rel="noopener noreferrer"
        >
          אינסטגרם
        </a>
      </div>
    </footer>
  );
}
