const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');           // ADDED
const fs = require('fs');                   // ADDED

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// ========== EXISTING API ROUTES (UNCHANGED) ==========
app.use('/api/auth', require('./auth'));
app.use('/api/voters', require('./voters'));
app.use('/api/candidates', require('./candidates'));
app.use('/api/election', require('./election'));
app.use('/api/results', require('./results'));
app.use('/api/announcements', require('./announcements'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/positions', require('./positions'));
app.use('/api/votes', require('./votes'));

// ========== NEW: ELECTION DESIGN ROUTE ==========
app.use('/api/election-design', require('./election-design'));


// ========== NEW: FILE UPLOAD FOR CUSTOM LOGOS ==========
// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'user', 'image-logo');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } }); // 2MB limit

// Admin-only upload endpoint (reuses your verifyToken middleware)
const verifyToken = require('./middleware');
app.post('/api/upload-logo', verifyToken, (req, res, next) => {
  // Optional: check admin role (your token includes role)
  if (req.user && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  next();
}, upload.single('logo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const fileUrl = /user/image-logo/${req.file.filename};
  res.json({ url: fileUrl });
});

// ========== EXISTING DEFAULT ROUTE (UNCHANGED) ==========
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin', 'index.html'));
});

// ========== EXISTING SERVER START ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(🚀 Server running at http://localhost:${PORT});
  console.log(📁 Admin: http://localhost:${PORT}/admin/index.html);
  console.log(📁 User:  http://localhost:${PORT}/user/index.html);
});