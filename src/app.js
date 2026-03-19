const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Serve the frontend HTML file
app.use(express.static(path.join(__dirname, '..')));

// Routes
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/emissions', require('./routes/emissions'));
app.use('/api/factors',   require('./routes/emissionFactors'));
app.use('/api/documents', require('./routes/documents'));

// Health check
app.get('/health', (req, res) => res.json({ 
  status: 'ok', 
  version: '1.0.0',
  hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
  keyPrefix: process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.substring(0, 10) : 'NOT SET'
}));

// Catch-all: serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ SCAL Carbon Calculator running at http://localhost:${PORT}`);
});
