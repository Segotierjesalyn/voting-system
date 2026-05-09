const express = require('express');
const router = express.Router();
const db = require('./db');
const verifyToken = require('./middleware');

// GET positions (optionally filtered by election)
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

// GET single position by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM positions WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE position
router.post('/', verifyToken, async (req, res) => {
  const { election_id, name, max_seats, display_order } = req.body;
  if (!election_id || !name) {
    return res.status(400).json({ error: 'Missing election_id or name' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO positions (election_id, name, max_seats, display_order) VALUES (?, ?, ?, ?)',
      [election_id, name, max_seats || 1, display_order || 0]
    );
    res.json({ message: 'Position added', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE position
router.put('/:id', verifyToken, async (req, res) => {
  const { name, max_seats, display_order } = req.body;
  try {
    await db.query(
      'UPDATE positions SET name=?, max_seats=?, display_order=? WHERE id=?',
      [name, max_seats, display_order, req.params.id]
    );
    res.json({ message: 'Position updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE position (also deletes related candidates)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM candidates WHERE position_id = ?', [req.params.id]);
    await db.query('DELETE FROM positions WHERE id = ?', [req.params.id]);
    res.json({ message: 'Position deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;