import { neon } from '@neondatabase/serverless';
import { setCors, getClientIp, checkAdminLimit, recordAdminFail, clearAdminFails } from '../_lib/security.js';

const getDb = () => neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (setCors(req, res, 'GET, PATCH, DELETE, OPTIONS')) return;

  const ip = getClientIp(req);

  // Admin brute-force guard — checked BEFORE revealing auth outcome
  if (checkAdminLimit(ip)) {
    return res.status(429).json({ error: 'יותר מדי ניסיונות. נסה שוב מאוחר יותר.' });
  }

  if (req.headers['x-admin-key'] !== process.env.ADMIN_SECRET) {
    recordAdminFail(ip);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Successful auth — reset failure counter
  clearAdminFails(ip);

  const sql = getDb();
  const { id } = req.query;

  // Validate id is a positive integer — extra layer on top of parameterized queries
  if (!id || !/^\d+$/.test(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }

  if (req.method === 'GET') {
    const [lead] = await sql`SELECT * FROM leads WHERE id = ${id} AND deleted_at IS NULL`;
    if (!lead) return res.status(404).json({ error: 'Not found' });
    return res.json(lead);
  }

  if (req.method === 'PATCH') {
    const { status, notes } = req.body || {};
    const [lead] = await sql`
      UPDATE leads
      SET status = COALESCE(${status ?? null}, status),
          notes  = COALESCE(${notes  ?? null}, notes)
      WHERE id = ${id}
      RETURNING *
    `;
    if (!lead) return res.status(404).json({ error: 'Not found' });
    return res.json(lead);
  }

  if (req.method === 'DELETE') {
    await sql`UPDATE leads SET deleted_at = NOW() WHERE id = ${id}`;
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
