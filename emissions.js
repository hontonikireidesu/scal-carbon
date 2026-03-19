const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');
const prisma = new PrismaClient();

// Get all emission entries for a period
router.get('/period/:periodId', authMiddleware, async (req, res) => {
  try {
    const entries = await prisma.emissionEntry.findMany({
      where: { periodId: req.params.periodId },
      include: { emissionFactor: true }
    });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new emission entry
router.post('/period/:periodId', authMiddleware, async (req, res) => {
  try {
    const { scope, category, subCategory, activityValue, activityUnit, emissionFactorId, notes } = req.body;

    // Look up EF and calculate CO2e
    const ef = await prisma.emissionFactor.findUnique({ where: { id: emissionFactorId } });
    if (!ef) return res.status(404).json({ error: 'Emission factor not found' });

    const calculatedCO2e = (parseFloat(activityValue) * ef.kgCO2ePerUnit) / 1000; // convert kg to tonnes

    const entry = await prisma.emissionEntry.create({
      data: {
        periodId: req.params.periodId,
        scope: parseInt(scope),
        category,
        subCategory,
        activityValue: parseFloat(activityValue),
        activityUnit,
        emissionFactorId,
        calculatedCO2e,
        notes,
        dataSource: 'MANUAL'
      }
    });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an entry
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.emissionEntry.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get summary for dashboard
router.get('/summary/:periodId', authMiddleware, async (req, res) => {
  try {
    const entries = await prisma.emissionEntry.findMany({ where: { periodId: req.params.periodId } });
    const summary = { scope1: 0, scope2: 0, scope3: 0, total: 0 };
    for (const e of entries) {
      if (e.scope === 1) summary.scope1 += e.calculatedCO2e;
      if (e.scope === 2) summary.scope2 += e.calculatedCO2e;
      if (e.scope === 3) summary.scope3 += e.calculatedCO2e;
    }
    summary.total = summary.scope1 + summary.scope2 + summary.scope3;
    // round to 2 decimal places
    for (const k of Object.keys(summary)) summary[k] = Math.round(summary[k] * 100) / 100;
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
