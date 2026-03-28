const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');
const prisma = new PrismaClient();

// Generate ESG report with AI
router.post('/generate', async (req, res) => {
  try {
    const { standard, total, scope1, scope2, scope3, company, role, prompt: customPrompt } = req.body;
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const prompt = customPrompt || `You are an expert ESG report writer for Singapore construction companies.
Write a professional ESG report narrative for a SCAL member company.

Company: ${company || 'SCAL Member Company'}
Reporting standard: ${standard}
Reporting period: FY 2024

GHG Emissions data:
- Total emissions: ${(total || 0).toFixed(1)} tCO2e
- Scope 1 (Direct): ${(scope1 || 0).toFixed(1)} tCO2e
- Scope 2 (Electricity): ${(scope2 || 0).toFixed(1)} tCO2e
- Scope 3 (Value chain): ${(scope3 || 0).toFixed(1)} tCO2e

Write a 3-paragraph ESG report covering:
1. Environmental performance — GHG emissions summary, key sources, and reduction initiatives taken
2. Social performance — worker safety commitment, workforce development, and community contributions
3. Governance — policies in place, ESG oversight, and forward-looking commitments

Keep it professional, concise, and specific to Singapore construction context. Reference NEA, MOM, BCA Green Mark, and Singapore Green Plan 2030 where relevant. Write in third person.`;

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    });

    res.json({ report: response.content[0].text });
  } catch (err) {
    console.error('Report gen error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get report summary for a period
router.get('/summary/:periodId', authMiddleware, async (req, res) => {
  try {
    const entries = await prisma.emissionEntry.findMany({
      where: { periodId: req.params.periodId },
      include: { emissionFactor: true }
    });
    const summary = { scope1: 0, scope2: 0, scope3: 0, total: 0, byCategory: {} };
    for (const e of entries) {
      if (e.scope === 1) summary.scope1 += e.calculatedCO2e;
      if (e.scope === 2) summary.scope2 += e.calculatedCO2e;
      if (e.scope === 3) summary.scope3 += e.calculatedCO2e;
      summary.byCategory[e.category] = (summary.byCategory[e.category] || 0) + e.calculatedCO2e;
    }
    summary.total = summary.scope1 + summary.scope2 + summary.scope3;
    for (const k of Object.keys(summary)) {
      if (typeof summary[k] === 'number') summary[k] = Math.round(summary[k] * 100) / 100;
    }
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
