const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the parent folder (where 'admin' and 'user' reside)
app.use(express.static(path.join(__dirname, '..')));

// API routes
app.use('/api/auth', require('./auth'));
app.use('/api/voters', require('./voters'));
app.use('/api/candidates', require('./candidates'));
app.use('/api/election', require('./election'));
app.use('/api/results', require('./results'));
app.use('/api/admin', require('./routes/admin'));

// Default route – admin login page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📁 Admin: http://localhost:${PORT}/admin/index.html`);
  console.log(`📁 User:  http://localhost:${PORT}/user/index.html`);
});