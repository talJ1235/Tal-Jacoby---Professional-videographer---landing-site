import { neon } from '@neondatabase/serverless';

const getDb = () => neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.headers['x-admin-key'] !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const sql = getDb();
  const leads = await sql`
    SELECT * FROM leads WHERE deleted_at IS NULL ORDER BY created_at DESC
  `;

  const header = 'שם,טלפון,אימייל,שירות,סטטוס,הודעה,תאריך';
  const rows = leads.map((l) =>
    [
      l.name,
      l.phone,
      l.email,
      l.service,
      l.status,
      (l.message || '').replace(/,/g, ' '),
      new Date(l.created_at).toLocaleDateString('he-IL'),
    ].join(',')
  );

  const csv = '﻿' + [header, ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
  res.send(csv);
}
