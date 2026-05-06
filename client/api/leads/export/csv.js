import { neon } from '@neondatabase/serverless';
import { setCors, getClientIp, checkAdminLimit, recordAdminFail, clearAdminFails } from '../../_lib/security.js';

const getDb = () => neon(process.env.DATABASE_URL);

// Wrap CSV fields to handle commas/quotes/newlines safely
function csvCell(val) {
  const str = String(val ?? '').replace(/"/g, '""');
  return `"${str}"`;
}

export default async function handler(req, res) {
  if (setCors(req, res, 'GET, OPTIONS')) return;

  const ip = getClientIp(req);

  // Admin brute-force guard
  if (checkAdminLimit(ip)) {
    return res.status(429).json({ error: 'יותר מדי ניסיונות. נסה שוב מאוחר יותר.' });
  }

  if (req.headers['x-admin-key'] !== process.env.ADMIN_SECRET) {
    recordAdminFail(ip);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  clearAdminFails(ip);

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sql = getDb();
  const leads = await sql`
    SELECT * FROM leads WHERE deleted_at IS NULL ORDER BY created_at DESC
  `;

  const header = ['שם', 'טלפון', 'אימייל', 'שירות', 'סטטוס', 'הודעה', 'תאריך'].map(csvCell).join(',');
  const rows = leads.map((l) =>
    [
      l.name,
      l.phone,
      l.email,
      l.service,
      l.status,
      l.message || '',
      new Date(l.created_at).toLocaleDateString('he-IL'),
    ].map(csvCell).join(',')
  );

  const csv = '﻿' + [header, ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
  res.setHeader('Cache-Control', 'no-store');
  res.send(csv);
}
