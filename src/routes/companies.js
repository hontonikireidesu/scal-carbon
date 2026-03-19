const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');
const prisma = new PrismaClient();

// Get company profile
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.params.id },
      include: { reportingPeriods: true }
    });
    if (!company) return res.status(404).json({ error: 'Company not found' });
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create reporting period
router.post('/:id/periods', authMiddleware, async (req, res) => {
  try {
    const { year } = req.body;
    const period = await prisma.reportingPeriod.create({
      data: {
        companyId: req.params.id,
        year: parseInt(year),
        periodStart: new Date(`${year}-01-01`),
        periodEnd: new Date(`${year}-12-31`),
        status: 'DRAFT'
      }
    });
    res.json(period);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all companies (admin only)
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
    const companies = await prisma.company.findMany({ include: { reportingPeriods: true } });
    res.json(companies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
