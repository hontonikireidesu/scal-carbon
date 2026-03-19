const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all emission factors (optionally filter by scope or category)
router.get('/', async (req, res) => {
  try {
    const { scope, category } = req.query;
    const where = { isActive: true };
    if (scope) where.scope = parseInt(scope);
    if (category) where.category = category;
    const factors = await prisma.emissionFactor.findMany({ where, orderBy: { category: 'asc' } });
    res.json(factors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
