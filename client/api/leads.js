import { neon } from '@neondatabase/serverless';
import { Resend } from 'resend';

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
      deleted_at  TIMESTAMPTZ
    )
  `;
}

async function sendEmails(lead) {
  if (!process.env.RESEND_API_KEY) {
    console.log('RESEND_API_KEY not set — skipping email');
    return;
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await Promise.all([
      resend.emails.send({
        from: process.env.RESEND_FROM || 'onboarding@resend.dev',
        to:   process.env.NOTIFICATION_EMAIL || 'tal.jacoby1235@gmail.com',
        subject: `ליד חדש: ${lead.name}`,
        html: `<div dir="rtl" style="font-family:Arial">
          <h2>ליד חדש התקבל!</h2>
          <p><strong>שם:</strong> ${lead.name}</p>
          <p><strong>טלפון:</strong> ${lead.phone}</p>
          <p><strong>אימייל:</strong> ${lead.email}</p>
          <p><strong>שירות:</strong> ${lead.service}</p>
          ${lead.message ? `<p><strong>הודעה:</strong> ${lead.message}</p>` : ''}
          <p><strong>תאריך:</strong> ${new Date(lead.created_at).toLocaleString('he-IL')}</p>
        </div>`,
      }),
      resend.emails.send({
        from: process.env.RESEND_FROM || 'onboarding@resend.dev',
        to:   lead.email,
        subject: 'קיבלתי את פנייתך — טל יעקבי',
        html: `<div dir="rtl" style="font-family:Arial">
          <h2>שלום ${lead.name},</h2>
          <p>תודה על פנייתך! קיבלתי את הפרטים ואחזור אליך בהקדם.</p>
          <p>בברכה,<br><strong>טל יעקבי — צלם וידאו</strong></p>
        </div>`,
      }),
    ]);
  } catch (err) {
    console.error('Email error:', err.message);
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = getDb();
  await initTable(sql);

  // ── POST /api/leads — public ──────────────────────────────────
  if (req.method === 'POST') {
    const { name, phone, email, service, message } = req.body || {};
    if (!name || !phone || !email || !service) {
      return res.status(400).json({ error: 'שדות חובה חסרים' });
    }
    const [lead] = await sql`
      INSERT INTO leads (name, phone, email, service, message)
      VALUES (${name}, ${phone}, ${email}, ${service}, ${message || ''})
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

    return res.json({ leads, total: parseInt(countResult[0].count), page: parseInt(page), pageSize });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
