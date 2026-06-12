const express = require('express');
const router = express.Router();
const db = require('../js/db'); // Points to your db helper inside backend/js/
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. Configure Multer to save images inside the user-side folder
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Navigates up out of routes/ to the project root, then into user/image-logo
    const uploadDir = path.join(__dirname, '../../user/image-logo');
    
    // Safety check: Create directory if it doesn't exist to prevent crashes
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Support multiple fallback keys ('logo', 'image', 'file') to prevent Multer Errors
const upload = multer({ storage: storage }).fields([
  { name: 'logo', maxCount: 1 },
  { name: 'image', maxCount: 1 },
  { name: 'file', maxCount: 1 }
]);

// ========== UPLOAD BALLOT LOGO COMPONENT ==========
router.post('/api/election-design/:electionId/upload', upload, async (req, res) => {
  try {
    const files = req.files;
    let uploadedFile = null;

    if (files && files.logo && files.logo[0]) uploadedFile = files.logo[0];
    else if (files && files.image && files.image[0]) uploadedFile = files.image[0];
    else if (files && files.file && files.file[0]) uploadedFile = files.file[0];

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file received.' });
    }

    // Return the relative URL path to save in the database text inputs
    const relativeUrlPath = `user/image-logo/${uploadedFile.filename}`;
    res.json({ url: relativeUrlPath, success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== GET BALLOT DESIGN CONFIGURATION ==========
router.get('/api/election-design/:electionId', async (req, res) => {
  const { electionId } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM ballot_designs WHERE election_id = ?', [electionId]);
    if (rows.length === 0) {
      // Return structured baseline defaults if no configuration exists yet
      return res.json({
        election_id: electionId,
        custom_title: 'OFFICIAL BALLOT',
        custom_subtitle: 'VoteSecure PH - Automated Election System | Bagong Pilipinas',
        logo_left: '',
        logo_center: '',
        logo_right: '',
        primary_color: '#0038a8',
        secondary_color: '#ce1126',
        accent_color: '#fcdb30',
        custom_css: ''
      });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== SAVE OR UPDATE BALLOT DESIGN CONFIGURATION ==========
router.post('/api/election-design/:electionId', async (req, res) => {
  const { electionId } = req.params;
  const {
    custom_title,
    custom_subtitle,
    logo_left,
    logo_center,
    logo_right,
    primary_color,
    secondary_color,
    accent_color,
    custom_css
  } = req.body;

  try {
    const [rows] = await db.query('SELECT id FROM ballot_designs WHERE election_id = ?', [electionId]);
    
    if (rows.length > 0) {
      // Update existing design records
      await db.query(
        `UPDATE ballot_designs 
         SET custom_title = ?, custom_subtitle = ?, logo_left = ?, logo_center = ?, logo_right = ?, 
             primary_color = ?, secondary_color = ?, accent_color = ?, custom_css = ?
         WHERE election_id = ?`,
        [custom_title, custom_subtitle, logo_left, logo_center, logo_right, primary_color, secondary_color, accent_color, custom_css, electionId]
      );
    } else {
      // Insert fresh layout configurations
      await db.query(
        `INSERT INTO ballot_designs 
         (election_id, custom_title, custom_subtitle, logo_left, logo_center, logo_right, primary_color, secondary_color, accent_color, custom_css)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [electionId, custom_title, custom_subtitle, logo_left, logo_center, logo_right, primary_color, secondary_color, accent_color, custom_css]
      );
    }
    res.json({ success: true, message: 'Ballot schema records updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== REVERT/DELETE CONFIGURATIONS ==========
router.delete('/api/election-design/:electionId', async (req, res) => {
  const { electionId } = req.params;
  try {
    await db.query('DELETE FROM ballot_designs WHERE election_id = ?', [electionId]);
    res.json({ success: true, message: 'Ballot design reverted to standard template parameters.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;