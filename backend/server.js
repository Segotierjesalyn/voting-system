const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

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

// ========== ELECTION DESIGN ROUTE ==========
app.use('/api/election-design', require('./election-design'));

// ========== FILE UPLOAD FOR CUSTOM LOGOS ==========

// Build the absolute path to user/image-logo/ regardless of where server.js lives
const uploadDir = path.join(__dirname, '..', 'user', 'image-logo');

// Create the folder (and any missing parents) if it doesn't exist yet
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`📁 Created upload directory: ${uploadDir}`);
  } catch (e) {
    console.error(`❌ Failed to create upload directory: ${uploadDir}`, e.message);
  }
} else {
  console.log(`📁 Upload directory exists: ${uploadDir}`);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Double-check the folder exists at request time
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'logo-' + unique + ext);
  }
});

// Only allow image files
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|svg/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp, svg)'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

const verifyToken = require('./middleware');

app.post('/api/upload-logo',
  verifyToken,
  // Role check — only admins may upload
  (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required.' });
    }
    next();
  },
  // Multer middleware — catches multer-level errors (file too big, wrong type)
  (req, res, next) => {
    upload.single('logo')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large. Maximum size is 2MB.' });
        }
        return res.status(400).json({ error: 'Upload error: ' + err.message });
      } else if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  // Final handler
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file received. Make sure the field name is "logo".' });
    }

    // Return a root-relative URL the browser can load directly
    const fileUrl = '/user/image-logo/' + req.file.filename;
    console.log(`✅ Logo uploaded: ${req.file.filename} → ${fileUrl}`);
    res.json({ url: fileUrl, filename: req.file.filename });
  }
);

// ========== STATIC FILE SERVING for uploaded logos ==========
// Makes /user/image-logo/<file> accessible in the browser
app.use('/user/image-logo', express.static(uploadDir));

// ========== DEFAULT ROUTE ==========
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin', 'index.html'));
});

// ========== GLOBAL ERROR HANDLER ==========
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.message);
  res.status(500).json({ error: 'Internal server error: ' + err.message });
});

// ========== SERVER START ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📁 Admin: http://localhost:${PORT}/admin/index.html`);
  console.log(`📁 User:  http://localhost:${PORT}/user/index.html`);
  console.log(`📁 Logos: ${uploadDir}`);
});