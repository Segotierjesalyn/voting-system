const express = require('express');
const router = express.Router();
const db = require('../db');

// Get settings (for user and admin)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM election_settings');
    let settings = {};
    rows.forEach(row => {
      settings[row.election_key] = JSON.parse(row.settings);
    });
    res.json(settings);
  } catch(err) {
    res.json({}); // fallback
  }
});

// Save settings (admin only, with token)
router.post('/', async (req, res) => {
  const settings = req.body;
  try {
    for (const [key, value] of Object.entries(settings)) {
      await db.query(
        'INSERT INTO election_settings (election_key, settings) VALUES (?, ?) ON DUPLICATE KEY UPDATE settings = ?',
        [key, JSON.stringify(value), JSON.stringify(value)]
      );
    }
    res.json({ message: 'Settings saved' });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;