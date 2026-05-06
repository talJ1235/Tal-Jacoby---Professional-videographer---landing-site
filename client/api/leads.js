import { neon } from '@neondatabase/serverless';
import { Resend } from 'resend';
import { setCors, getClientIp } from './_lib/security.js';

// ── Security helpers ────────────────────────────────────────────
const VALID_SERVICES = ['צילום אירוע', 'וידאו תדמית', 'צילום מוצר', 'אחר'];

function sanitize(val, maxLen = 200) {
  return String(val ?? '').trim().slice(0, maxLen);
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

const getDb = () => neon(process.env.DATABASE_URL);

async function initTable(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS leads (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      phone       TEXT NOT NULL,
      email       TEXT NOT NULL,
      service     TEXT NOT NULL,
      message     TEXT    DEFAULT '',
      status      TEXT    DEFAULT 'new',
      notes       TEXT    DEFAULT '',
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      deleted_at  TIMESTAMPTZ,
      ip          TEXT    DEFAULT ''
    )
  `;
  // Add ip column if it doesn't exist (for existing tables)
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS ip TEXT DEFAULT ''`;
}

async function sendEmails(lead) {
  if (!process.env.RESEND_API_KEY) {
    console.log('RESEND_API_KEY not set — skipping email');
    return;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM || 'onboarding@resend.dev';
  const notifyTo = process.env.NOTIFICATION_EMAIL || 'tal.jacoby1235@gmail.com';

  // Send notification email — always to owner
  try {
    await resend.emails.send({
      from,
      to: notifyTo,
      subject: `ליד חדש: ${escapeHtml(lead.name)}`,
      html: `<div dir="rtl" style="font-family:Arial">
        <h2>ליד חדש התקבל!</h2>
        <p><strong>שם:</strong> ${escapeHtml(lead.name)}</p>
        <p><strong>טלפון:</strong> ${escapeHtml(lead.phone)}</p>
        <p><strong>אימייל:</strong> ${escapeHtml(lead.email)}</p>
        <p><strong>שירות:</strong> ${escapeHtml(lead.service)}</p>
        ${lead.message ? `<p><strong>הודעה:</strong> ${escapeHtml(lead.message)}</p>` : ''}
        <p><strong>תאריך:</strong> ${new Date(lead.created_at).toLocaleString('he-IL')}</p>
      </div>`,
    });
    console.log('Notification email sent OK');
  } catch (err) {
    console.error('Notification email error:', err.message);
  }

  // Send auto-reply to customer
  try {
    await resend.emails.send({
      from,
      to: lead.email,
      subject: `שלום ${lead.name}, קיבלתי את פנייתך ✓`,
      html: `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;direction:rtl">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

        <!-- Header -->
        <tr>
          <td style="background:#141210;padding:32px 40px;text-align:center">
            <div style="font-size:22px;font-weight:700;color:#FF6B4A;letter-spacing:0.04em">טל יעקבי</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:4px;letter-spacing:0.1em">צלם וידאו מקצועי</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px">
            <h2 style="margin:0 0 16px;font-size:22px;color:#1a1a1a">שלום ${escapeHtml(lead.name)} 👋</h2>
            <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.8">
              תודה שפנית אליי! קיבלתי את הפרטים שלך ואחזור אליך <strong>תוך 24 שעות</strong>.
            </p>

            <!-- Summary box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:10px;border:1px solid #eee;margin-bottom:28px">
              <tr><td style="padding:20px 24px">
                <div style="font-size:11px;color:#FF6B4A;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:14px">פרטי הפנייה</div>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="padding:5px 0;font-size:14px;color:#888;width:90px">שירות:</td><td style="padding:5px 0;font-size:14px;color:#222;font-weight:600">${escapeHtml(lead.service)}</td></tr>
                  <tr><td style="padding:5px 0;font-size:14px;color:#888">טלפון:</td><td style="padding:5px 0;font-size:14px;color:#222">${escapeHtml(lead.phone)}</td></tr>
                  ${lead.message ? `<tr><td style="padding:5px 0;font-size:14px;color:#888;vertical-align:top">הודעה:</td><td style="padding:5px 0;font-size:14px;color:#222">${escapeHtml(lead.message)}</td></tr>` : ''}
                </table>
              </td></tr>
            </table>

            <p style="margin:0 0 28px;font-size:14px;color:#777;line-height:1.7">
              בינתיים, מוזמן לבדוק את העבודות שלי באינסטגרם או לצפות בסרטונים ביוטיוב.
            </p>

            <!-- CTA buttons -->
            <table cellpadding="0" cellspacing="0" style="margin-bottom:32px">
              <tr>
                <td style="padding-left:8px">
                  <a href="https://www.instagram.com/tal_jacoby1235" style="display:inline-block;padding:12px 22px;background:#141210;color:#fff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600">אינסטגרם ↗</a>
                </td>
                <td>
                  <a href="https://www.youtube.com/@tal100" style="display:inline-block;padding:12px 22px;background:#FF6B4A;color:#fff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600">יוטיוב ↗</a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:14px;color:#555;line-height:1.7">
              בברכה,<br>
              <strong style="color:#1a1a1a">טל יעקבי</strong><br>
              <span style="color:#888;font-size:13px">054-771-3317 · נתניה והמרכז</span>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f9;padding:20px 40px;text-align:center;border-top:1px solid #eee">
            <p style="margin:0;font-size:12px;color:#bbb">© 2026 טל יעקבי — כל הזכויות שמורות</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
    console.log('Auto-reply sent OK');
  } catch (err) {
    console.error('Auto-reply email error:', err.message);
  }
}

export default async function handler(req, res) {
  if (setCors(req, res, 'GET, POST, OPTIONS')) return;

  const sql = getDb();
  await initTable(sql);

  // ── POST /api/leads — public ──────────────────────────────────
  if (req.method === 'POST') {
    const { name, phone, email, service, message, recaptchaToken, website } = req.body || {};

    // Honeypot: bots fill hidden fields, humans don't
    if (website) {
      // Silent 200 so bots think they succeeded
      return res.status(200).json({ success: true });
    }

    // Sanitize + enforce length limits (extra layer on top of parameterized queries)
    const cleanName    = sanitize(name, 100);
    const cleanPhone   = sanitize(phone, 30);
    const cleanEmail   = sanitize(email, 200);
    const cleanService = sanitize(service, 50);
    const cleanMessage = sanitize(message, 2000);

    if (!cleanName || !cleanPhone || !cleanEmail || !cleanService) {
      return res.status(400).json({ error: 'שדות חובה חסרים' });
    }

    // Validate email format
    if (!/\S+@\S+\.\S+/.test(cleanEmail)) {
      return res.status(400).json({ error: 'כתובת אימייל לא תקינה' });
    }

    // Validate service against whitelist — prevents unexpected values
    if (!VALID_SERVICES.includes(cleanService)) {
      return res.status(400).json({ error: 'שירות לא תקין' });
    }

    // Rate limiting by IP — max 6 submissions per hour
    const ip = getClientIp(req);
    if (ip && ip !== 'unknown') {
      const [{ count: ipCount }] = await sql`
        SELECT COUNT(*) as count FROM leads
        WHERE ip = ${ip}
        AND created_at > NOW() - INTERVAL '1 hour'
        AND deleted_at IS NULL
      `;
      if (parseInt(ipCount) >= 6) {
        return res.status(429).json({ error: 'יותר מדי פניות. נסה שוב מאוחר יותר.' });
      }
    }

    // Rate limiting by email — max 3 submissions per email per 24h (catches VPN bypass)
    const [{ count: emailCount }] = await sql`
      SELECT COUNT(*) as count FROM leads
      WHERE email = ${cleanEmail}
      AND created_at > NOW() - INTERVAL '24 hours'
      AND deleted_at IS NULL
    `;
    if (parseInt(emailCount) >= 3) {
      return res.status(429).json({ error: 'כתובת האימייל הזו כבר שלחה פנייה לאחרונה.' });
    }

    // reCAPTCHA v3 verification
    if (process.env.RECAPTCHA_SECRET && recaptchaToken) {
      try {
        const verifyRes = await fetch(
          `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${recaptchaToken}`,
          { method: 'POST' }
        );
        const verifyData = await verifyRes.json();
        if (!verifyData.success || verifyData.score < 0.5) {
          return res.status(400).json({ error: 'נכשל אימות בוט. נסה שוב.' });
        }
      } catch (err) {
        console.error('reCAPTCHA verify error:', err.message);
        // don't block submission if verification fails
      }
    }
    const [lead] = await sql`
      INSERT INTO leads (name, phone, email, service, message, ip)
      VALUES (${cleanName}, ${cleanPhone}, ${cleanEmail}, ${cleanService}, ${cleanMessage}, ${ip})
      RETURNING *
    `;
    await sendEmails(lead);
    return res.status(201).json({ success: true, id: lead.id });
  }

  // ── GET /api/leads — admin ────────────────────────────────────
  if (req.method === 'GET') {
    if (req.headers['x-admin-key'] !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { status, search, page = 1 } = req.query;
    const pageSize = 20;
    const offset   = (parseInt(page) - 1) * pageSize;

    let leads, countResult;
    if (search) {
      const q = `%${search}%`;
      leads       = await sql`SELECT * FROM leads WHERE deleted_at IS NULL AND (name ILIKE ${q} OR phone ILIKE ${q} OR email ILIKE ${q}) ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}`;
      countResult = await sql`SELECT COUNT(*) FROM leads WHERE deleted_at IS NULL AND (name ILIKE ${q} OR phone ILIKE ${q} OR email ILIKE ${q})`;
    } else if (status) {
      leads       = await sql`SELECT * FROM leads WHERE deleted_at IS NULL AND status = ${status} ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}`;
      countResult = await sql`SELECT COUNT(*) FROM leads WHERE deleted_at IS NULL AND status = ${status}`;
    } else {
      leads       = await sql`SELECT * FROM leads WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}`;
      countResult = await sql`SELECT COUNT(*) FROM leads WHERE deleted_at IS NULL`;
    }

    // Normalize legacy 'new' status → 'חדש'
    const normalized = leads.map((l) => ({ ...l, status: l.status === 'new' ? 'חדש' : l.status }));
    return res.json({ leads: normalized, total: parseInt(countResult[0].count), page: parseInt(page), pageSize });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
