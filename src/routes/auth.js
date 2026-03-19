const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Register a new company + admin user
router.post('/register', async (req, res) => {
  try {
    const { companyName, uen, companyType, name, email, password } = req.body;
    if (!companyName || !uen || !name || !email || !password)
      return res.status(400).json({ error: 'All fields are required' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const company = await prisma.company.create({
      data: { name: companyName, uen, type: companyType || 'MAIN_CONTRACTOR' }
    });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { companyId: company.id, name, email, passwordHash, role: 'COMPANY_ADMIN' }
    });

    const token = jwt.sign({ userId: user.id, companyId: company.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role }, company });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email }, include: { company: true } });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ userId: user.id, companyId: user.companyId, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role }, company: user.company });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId }, include: { company: true } });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
