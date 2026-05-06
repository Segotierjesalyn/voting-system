const express = require('express');
const router = express.Router();
const db = require('./db');
const verifyToken = require('./middleware');

// Get all elections (empty array if none)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM elections ORDER BY start_date ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single election by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM elections WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: create election
router.post('/', verifyToken, async (req, res) => {
  const { name, start_date, end_date, status } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO elections (name, start_date, end_date, status) VALUES (?, ?, ?, ?)',
      [name, start_date, end_date, status || 'upcoming']
    );
    res.json({ message: 'Election created', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: update election
router.put('/:id', verifyToken, async (req, res) => {
  const { name, start_date, end_date, status } = req.body;
  try {
    await db.query(
      'UPDATE elections SET name=?, start_date=?, end_date=?, status=? WHERE id=?',
      [name, start_date, end_date, status, req.params.id]
    );
    res.json({ message: 'Election updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: delete election
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM elections WHERE id = ?', [req.params.id]);
    res.json({ message: 'Election deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;