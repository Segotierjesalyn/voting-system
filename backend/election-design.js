const express = require('express');
const router = express.Router();
const db = require('./db');
const verifyToken = require('./middleware');

// GET design for an election
router.get('/:election_id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM election_design WHERE election_id = ?', [req.params.election_id]);
    if (rows.length === 0) {
      return res.json({
        custom_title: null,
        logo_left: null,
        logo_center: null,
        logo_right: null,
        primary_color: '#0038a8',
        secondary_color: '#ce1126',
        accent_color: '#fcdb30',
        custom_css: null
      });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SAVE or UPDATE design (admin only)
router.post('/:election_id', verifyToken, async (req, res) => {
  const { custom_title, logo_left, logo_center, logo_right, primary_color, secondary_color, accent_color, custom_css } = req.body;
  try {
    await db.query(
      `INSERT INTO election_design 
        (election_id, custom_title, logo_left, logo_center, logo_right, primary_color, secondary_color, accent_color, custom_css)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        custom_title = VALUES(custom_title),
        logo_left = VALUES(logo_left),
        logo_center = VALUES(logo_center),
        logo_right = VALUES(logo_right),
        primary_color = VALUES(primary_color),
        secondary_color = VALUES(secondary_color),
        accent_color = VALUES(accent_color),
        custom_css = VALUES(custom_css)`,
      [req.params.election_id, custom_title, logo_left, logo_center, logo_right, primary_color, secondary_color, accent_color, custom_css]
    );
    res.json({ message: 'Design saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE design (reset to default)
router.delete('/:election_id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM election_design WHERE election_id = ?', [req.params.election_id]);
    res.json({ message: 'Design reset to default' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;