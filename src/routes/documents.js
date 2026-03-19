const express = require('express');
const router = express.Router();
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
 
const prisma = new PrismaClient();
 
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF, JPG, PNG files are allowed'));
  }
});
 
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
 
    const Anthropic = require('@anthropic-ai/sdk');
    const apiKey = process.env.ANTHROPIC_API_KEY;
 
    if (!apiKey) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured on server' });
    }
 
    const client = new Anthropic({ apiKey });
    const base64Data = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
 
    let messageContent;
    if (mimeType === 'application/pdf') {
      messageContent = [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64Data } },
        { type: 'text', text: getExtractionPrompt() }
      ];
    } else {
      messageContent = [
        { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64Data } },
        { type: 'text', text: getExtractionPrompt() }
      ];
    }
 
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: messageContent }]
    });
 
    const raw = response.content[0].text;
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const extracted = JSON.parse(cleaned);
 
    const { companyId } = req.body;
    let docRecord = null;
    if (companyId) {
      docRecord = await prisma.uploadedDocument.create({
        data: {
          companyId,
          filename: req.file.originalname,
          documentType: extracted.documentType || 'unknown',
          aiStatus: 'EXTRACTED',
          aiConfidence: extracted.overallConfidence || null,
          aiExtractedData: extracted,
          isApproved: false
        }
      });
    }
 
    res.json({ success: true, documentId: docRecord?.id || null, filename: req.file.originalname, extracted });
 
  } catch (err) {
    console.error('Upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
});
 
router.get('/company/:companyId', async (req, res) => {
  try {
    const docs = await prisma.uploadedDocument.findMany({ where: { companyId: req.params.companyId }, orderBy: { createdAt: 'desc' } });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 
router.post('/:id/approve', async (req, res) => {
  try {
    const doc = await prisma.uploadedDocument.update({ where: { id: req.params.id }, data: { isApproved: true, aiStatus: 'APPROVED' } });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 
function getExtractionPrompt() {
  return `You are an expert carbon accountant for Singapore construction companies.
Analyse this document and extract emission-relevant data.
Return ONLY valid JSON, no markdown, no explanation:
 
{
  "documentType": "electricity_bill | diesel_receipt | petrol_receipt | material_invoice | aircon_service | waste_disposal | other",
  "supplier": "supplier name",
  "accountNumber": "account number or null",
  "billingPeriod": { "start": "YYYY-MM-DD or null", "end": "YYYY-MM-DD or null" },
  "lineItems": [
    {
      "description": "item description",
      "quantity": 0.0,
      "unit": "kWh | litres | tonnes | m3 | kg",
      "scope": 1,
      "emissionCategory": "electricity | diesel | petrol | concrete | steel | refrigerant | waste",
      "confidence": 0.95
    }
  ],
  "totalAmount": 0.0,
  "currency": "SGD",
  "notes": "any observations",
  "overallConfidence": 0.95
}`;
}
 
module.exports = router;
