import { neon } from '@neondatabase/serverless';

const getDb = () => neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.headers['x-admin-key'] !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const sql = getDb();
  const { id } = req.query;

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
    return res.json(lead);
  }

  if (req.method === 'DELETE') {
    await sql`UPDATE leads SET deleted_at = NOW() WHERE id = ${id}`;
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
