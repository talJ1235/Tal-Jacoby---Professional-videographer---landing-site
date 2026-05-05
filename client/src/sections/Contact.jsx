import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { submitLead } from '../services/api';
import { Button } from '../components/ui/Button';
import './Contact.css';

function FloatingField({ id, label, type = 'text', value, onChange, error, as = 'input', children }) {
  const Tag = as;
  return (
    <div className={`field${value ? ' field--filled' : ''}${error ? ' field--error' : ''}`}>
      <Tag id={id} name={id} type={type} value={value} onChange={onChange} className="field__input" placeholder=" ">
        {children}
      </Tag>
      <label htmlFor={id} className="field__label">{label}</label>
      {error && <span className="field__error">{error}</span>}
    </div>
  );
}

const SERVICES = ['צילום אירוע', 'וידאו תדמית', 'צילום מוצר', 'אחר'];

const METHODS = [
  { icon: '📞', label: '054-771-3317', href: 'tel:0547713317' },
  { icon: '✉', label: 'tal.jacoby1235@gmail.com', href: 'mailto:tal.jacoby1235@gmail.com' },
  { icon: '📍', label: 'נתניה והמרכז', href: null },
];

const SOCIALS = [
  {
    href: 'https://www.instagram.com/tal_jacoby1235',
    label: 'Instagram',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <circle cx="12" cy="12" r="5"/>
        <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    href: 'https://www.youtube.com/@tal100',
    label: 'YouTube',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.5C5.12 20 12 20 12 20s6.88 0 8.59-.5a2.78 2.78 0 0 0 1.95-1.92A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
        <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    href: 'https://www.facebook.com/profile.php?id=100026237141861',
    label: 'Facebook',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
      </svg>
    ),
  },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.65, delay, ease: [0.4, 0, 0.2, 1] },
});

export function Contact() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', service: '', message: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'שדה חובה';
    if (!form.phone.trim()) errs.phone = 'שדה חובה';
    if (!form.email.trim()) errs.email = 'שדה חובה';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'כתובת אימייל לא תקינה';
    if (!form.service) errs.service = 'בחר סוג שירות';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    setServerError('');
    try {
      // reCAPTCHA v3 — invisible, runs in background
      let recaptchaToken = '';
      try {
        recaptchaToken = await window.grecaptcha.execute(
          '6LejutgsAAAAAO1NkQzTlOmVZT5mP3I4mMJyVsF9',
          { action: 'submit' }
        );
      } catch {
        // if reCAPTCHA fails to load, still allow submission
      }
      await submitLead({ ...form, recaptchaToken });
      // Meta Pixel — track Lead event
      if (window.fbq) window.fbq('track', 'Lead');
      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'שגיאה. נסה שוב.';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="contact">
      <span className="contact__bg-word" aria-hidden="true">CONTACT</span>

      <div className="contact__inner section">

        {/* Left — eyebrow + heading + contact methods */}
        <motion.div className="contact__left" {...fadeUp(0)}>
          <span className="contact__eyebrow">יצירת קשר</span>
          <h2 className="contact__heading">בואו נדבר</h2>
          <p className="contact__sub">
            מוכן ליצור משהו מיוחד?<br />
            שלח את הפרטים ואחזור אליך תוך 24 שעות.
          </p>

          <div className="contact__methods">
            {METHODS.map(({ icon, label, href }) =>
              href ? (
                <a key={label} href={href} className="contact__method"
                  onClick={() => { if (window.fbq) window.fbq('track', 'Contact'); }}>
                  <span className="contact__method-icon">{icon}</span>
                  <span>{label}</span>
                </a>
              ) : (
                <div key={label} className="contact__method">
                  <span className="contact__method-icon">{icon}</span>
                  <span>{label}</span>
                </div>
              )
            )}
          </div>
        </motion.div>

        {/* Right — glass form card */}
        <motion.div className="contact__form-wrap" {...fadeUp(0.12)}>
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                className="success-state"
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 20 }}
              >
                <div className="success-icon">✓</div>
                <h3>הפרטים נשלחו בהצלחה!</h3>
                <p>תודה! אחזור אליך בהקדם האפשרי.</p>
              </motion.div>
            ) : (
              <motion.form key="form" className="contact__form" onSubmit={handleSubmit} noValidate
                onFocus={() => { if (window.fbq && !window._fbqCheckout) { window._fbqCheckout = true; window.fbq('track', 'InitiateCheckout'); } }}>
                <FloatingField id="name"    label="שם מלא"           value={form.name}    onChange={set('name')}    error={errors.name} />
                <FloatingField id="phone"   label="טלפון"            type="tel" value={form.phone}   onChange={set('phone')}   error={errors.phone} />
                <FloatingField id="email"   label="אימייל"           type="email" value={form.email} onChange={set('email')}   error={errors.email} />
                <FloatingField id="service" label="סוג שירות"        value={form.service} onChange={set('service')} error={errors.service} as="select">
                  <option value="" disabled hidden></option>
                  {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
                </FloatingField>
                <FloatingField id="message" label="הודעה (אופציונלי)" value={form.message} onChange={set('message')} as="textarea" />

                {serverError && <p className="server-error">{serverError}</p>}

                <Button type="submit" size="lg" disabled={loading} className="contact__submit-btn">
                  {loading ? 'שולח...' : 'שלח פנייה'}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer — socials + copyright (below form on mobile, below left col on desktop) */}
        <div className="contact__footer">
          <div className="contact__socials">
            {SOCIALS.map(({ href, label, svg }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="contact__social-link"
              >
                {svg}
              </a>
            ))}
          </div>
          <p className="contact__copy">© 2026 כל הזכויות שמורות — טל יעקבי</p>
        </div>

      </div>
    </section>
  );
}
