const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v || '');
const instaOk = (v) => /^https?:\/\//.test(v || '');
const phoneOk = (v) => /^\+?[0-9]{9,15}$/.test((v || '').replace(/[\s\-()]/g, ''));

// Normalize an Israeli number to +972… tel format.
function normalizePhone(v) {
  const digits = (v || '').replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('0')) return '+972' + digits.slice(1);
  if (digits.startsWith('972')) return '+' + digits;
  return digits;
}

export function SiteTexts({ site, onChange }) {
  const f = site.footer || {};
  return (
    <section className="content-section">
      <div className="content-section__head">
        <h2>טקסטים ופרטים</h2>
      </div>

      <div className="cw-grid">
        <label className="cw-field">
          <span>שם ראשי (פתיח)</span>
          <input value={site.heroName} onChange={(e) => onChange({ heroName: e.target.value })} />
        </label>
        <label className="cw-field">
          <span>כותרת משנה (פתיח)</span>
          <input value={site.heroSubtitle} onChange={(e) => onChange({ heroSubtitle: e.target.value })} />
        </label>
        <label className="cw-field">
          <span>כותרת SEO (טאב הדפדפן)</span>
          <input value={site.seoTitle} onChange={(e) => onChange({ seoTitle: e.target.value })} />
        </label>
        <label className="cw-field">
          <span>תיאור SEO</span>
          <input value={site.seoDescription} onChange={(e) => onChange({ seoDescription: e.target.value })} />
        </label>

        <label className="cw-field">
          <span>אימייל (פוטר)</span>
          <input
            value={f.email || ''}
            onChange={(e) => onChange({ footer: { email: e.target.value } })}
          />
          {!emailOk(f.email) && <em className="cw-err">כתובת אימייל לא תקינה</em>}
        </label>
        <label className="cw-field">
          <span>טלפון (פוטר)</span>
          <input
            value={f.phone || ''}
            onChange={(e) => onChange({ footer: { phone: e.target.value } })}
            onBlur={(e) => onChange({ footer: { phone: normalizePhone(e.target.value) } })}
          />
          {!phoneOk(f.phone) && <em className="cw-err">מספר טלפון לא תקין</em>}
        </label>
        <label className="cw-field">
          <span>קישור אינסטגרם (פוטר)</span>
          <input
            value={f.instagram || ''}
            onChange={(e) => onChange({ footer: { instagram: e.target.value } })}
          />
          {!instaOk(f.instagram) && <em className="cw-err">קישור לא תקין (חייב להתחיל ב־http)</em>}
        </label>
      </div>
    </section>
  );
}
