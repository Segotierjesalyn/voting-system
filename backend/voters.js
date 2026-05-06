const express = require('express');
const router = express.Router();
const db = require('./db');
const verifyToken = require('./middleware');

router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM voters ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/approve/:id', verifyToken, async (req, res) => {
  try {
    await db.query('UPDATE voters SET status = "approved" WHERE id = ?', [req.params.id]);
    res.json({ message: 'Voter approved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  const { first_name, last_name, email, phone, address, status } = req.body;
  try {
    await db.query(
      `UPDATE voters SET first_name=?, last_name=?, email=?, phone=?, address=?, status=? WHERE id=?`,
      [first_name, last_name, email, phone, address, status, req.params.id]
    );
    res.json({ message: 'Voter updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM voters WHERE id = ?', [req.params.id]);
    res.json({ message: 'Voter deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;