const express = require('express');
const router = express.Router();
const db = require('./db');
const verifyToken = require('./middleware');

// Get positions for an election
router.get('/', async (req, res) => {
  try {
    let query = 'SELECT * FROM positions';
    const params = [];
    if (req.query.election_id) {
      query += ' WHERE election_id = ?';
      params.push(req.query.election_id);
    }
    query += ' ORDER BY display_order';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: create position
router.post('/', verifyToken, async (req, res) => {
  const { election_id, title, max_seats, display_order } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO positions (election_id, title, max_seats, display_order) VALUES (?, ?, ?, ?)',
      [election_id, title, max_seats, display_order || 0]
    );
    res.json({ message: 'Position added', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: update position
router.put('/:id', verifyToken, async (req, res) => {
  const { title, max_seats, display_order } = req.body;
  try {
    await db.query(
      'UPDATE positions SET title=?, max_seats=?, display_order=? WHERE id=?',
      [title, max_seats, display_order, req.params.id]
    );
    res.json({ message: 'Position updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: delete position
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM positions WHERE id = ?', [req.params.id]);
    res.json({ message: 'Position deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;