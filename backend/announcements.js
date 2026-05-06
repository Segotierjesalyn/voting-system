const express = require('express');
const router = express.Router();
const db = require('./db');
const verifyToken = require('./middleware');

// Get all announcements (for user side)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM announcements ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: create announcement
router.post('/', verifyToken, async (req, res) => {
  const { title, content, posted_by } = req.body;
  try {
    await db.query(
      'INSERT INTO announcements (title, content, posted_by) VALUES (?, ?, ?)',
      [title, content, posted_by || req.user.id]
    );
    res.json({ message: 'Announcement created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: update announcement
router.put('/:id', verifyToken, async (req, res) => {
  const { title, content } = req.body;
  try {
    await db.query('UPDATE announcements SET title=?, content=? WHERE id=?', [title, content, req.params.id]);
    res.json({ message: 'Announcement updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: delete announcement
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM announcements WHERE id = ?', [req.params.id]);
    res.json({ message: 'Announcement deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;