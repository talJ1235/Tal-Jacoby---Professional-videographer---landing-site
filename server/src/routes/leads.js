import { Router } from 'express';
import { body } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { sendLeadNotification, sendAutoReply } from '../services/emailService.js';

const router = Router();
const prisma = new PrismaClient();

const leadValidation = [
  body('name').trim().notEmpty().withMessage('שם הוא שדה חובה'),
  body('phone').trim().notEmpty().withMessage('טלפון הוא שדה חובה'),
  body('email').trim().isEmail().withMessage('כתובת אימייל לא תקינה'),
  body('service').trim().notEmpty().withMessage('סוג שירות הוא שדה חובה'),
  body('message').optional().trim(),
];

// POST /api/leads — public
router.post('/', leadValidation, validate, async (req, res, next) => {
  try {
    const { name, phone, email, service, message } = req.body;
    const lead = await prisma.lead.create({
      data: { name, phone, email, service, message: message || '' },
    });
    await Promise.all([sendLeadNotification(lead), sendAutoReply(lead)]);
    res.status(201).json({ success: true, id: lead.id });
  } catch (err) {
    next(err);
  }
});

// GET /api/leads — admin
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { status, search, page = 1 } = req.query;
    const pageSize = 20;
    const skip = (parseInt(page) - 1) * pageSize;

    const where = { deletedAt: null };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.lead.count({ where }),
    ]);

    res.json({ leads, total, page: parseInt(page), pageSize });
  } catch (err) {
    next(err);
  }
});

// GET /api/leads/export/csv — admin
router.get('/export/csv', authMiddleware, async (req, res, next) => {
  try {
    const leads = await prisma.lead.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    const header = 'שם,טלפון,אימייל,שירות,סטטוס,הודעה,תאריך';
    const rows = leads.map((l) =>
      [
        l.name,
        l.phone,
        l.email,
        l.service,
        l.status,
        (l.message || '').replace(/,/g, ' '),
        new Date(l.createdAt).toLocaleDateString('he-IL'),
      ].join(',')
    );

    const csv = '﻿' + [header, ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

// GET /api/leads/:id — admin
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const lead = await prisma.lead.findFirst({
      where: { id: parseInt(req.params.id), deletedAt: null },
    });
    if (!lead) return res.status(404).json({ error: 'Not found' });
    res.json(lead);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/leads/:id — admin
router.patch('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const data = {};
    if (status !== undefined) data.status = status;
    if (notes !== undefined) data.notes = notes;

    const lead = await prisma.lead.update({
      where: { id: parseInt(req.params.id) },
      data,
    });
    res.json(lead);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/leads/:id — soft delete, admin
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    await prisma.lead.update({
      where: { id: parseInt(req.params.id) },
      data: { deletedAt: new Date() },
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
