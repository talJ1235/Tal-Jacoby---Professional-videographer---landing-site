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

const SERVICES = ['צילום חתונה', 'צילום אירוע', 'וידאו תדמית', 'צילום מוצר', 'אחר'];

const METHODS = [
  { icon: '📞', label: '054-771-3317', href: 'tel:0547713317' },
  { icon: '✉', label: 'tal.jacoby1235@gmail.com', href: 'mailto:tal.jacoby1235@gmail.com' },
  { icon: '📍', label: 'נתניה והמרכז', href: null },
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
      await submitLead(form);
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
      {/* Decorative background word */}
      <span className="contact__bg-word" aria-hidden="true">CONTACT</span>

      <div className="contact__inner section">

        {/* Left — identity + contact methods */}
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
                <a key={label} href={href} className="contact__method">
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

          <div className="contact__divider" />
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
              <motion.form key="form" className="contact__form" onSubmit={handleSubmit} noValidate>
                <FloatingField id="name"    label="שם מלא"           value={form.name}    onChange={set('name')}    error={errors.name} />
                <FloatingField id="phone"   label="טלפון"            type="tel" value={form.phone}   onChange={set('phone')}   error={errors.phone} />
                <FloatingField id="email"   label="אימייל"           type="email" value={form.email} onChange={set('email')}   error={errors.email} />
                <FloatingField id="service" label="סוג שירות"        value={form.service} onChange={set('service')} error={errors.service} as="select">
                  <option value="" disabled hidden></option>
                  {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
                </FloatingField>
                <FloatingField id="message" label="הודעה (אופציונלי)" value={form.message} onChange={set('message')} as="textarea" />

                {serverError && <p className="server-error">{serverError}</p>}

                <Button type="submit" size="lg" disabled={loading} style={{ width: '100%', marginTop: 'var(--space-2)' }}>
                  {loading ? 'שולח...' : 'שלח פנייה'}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

      </div>
    </section>
  );
}
