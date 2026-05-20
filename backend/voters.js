const express = require('express');
const router = express.Router();
const db = require('./db');
const verifyToken = require('./middleware');

// 1. GET ALL VOTERS (Dito makikita ng admin lahat ng nag-register)
router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM voters ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. APPROVE REGISTERED VOTER (Para baguhin ang status mula 'pending' tungong 'approved')
router.put('/approve/:id', verifyToken, async (req, res) => {
  try {
    await db.query('UPDATE voters SET status = "approved" WHERE id = ?', [req.params.id]);
    res.json({ message: 'Voter approved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. EDIT/UPDATE VOTER INFO
router.put('/:id', verifyToken, async (req, res) => {
  const { first_name, last_name, email, phone, address, status } = req.body;
  try {
    await db.query(
      `UPDATE voters SET first_name=?, last_name=?, email=?, phone=?, address=?, status=? WHERE id=?`,
      [first_name, last_name, email, phone, address, status, req.params.id]
    );
    res.json({ message: 'Voter updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. DELETE VOTER
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM voters WHERE id = ?', [req.params.id]);
    res.json({ message: 'Voter deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;