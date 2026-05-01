const express = require('express');
const router = express.Router();
const db = require('./db');
const verifyToken = require('./middleware');

// =============================================
// GET ALL VOTERS (Admin only)
// =============================================
router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, voter_id, first_name, last_name, email, 
       address, status, has_voted, created_at 
       FROM voters ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '❌ Server error.', error: err.message });
  }
});

// =============================================
// APPROVE VOTER
// =============================================
router.put('/approve/:id', verifyToken, async (req, res) => {
  try {
    await db.query(
      'UPDATE voters SET status = ? WHERE id = ?',
      ['approved', req.params.id]
    );
    await db.query(
      'INSERT INTO audit_logs (user_type, user_id, action) VALUES (?, ?, ?)',
      ['admin', req.user.id, `Approved voter ID: ${req.params.id}`]
    );
    res.json({ message: '✅ Voter approved.' });
  } catch (err) {
    res.status(500).json({ message: '❌ Server error.', error: err.message });
  }
});

// =============================================
// REJECT VOTER
// =============================================
router.put('/reject/:id', verifyToken, async (req, res) => {
  try {
    await db.query(
      'UPDATE voters SET status = ? WHERE id = ?',
      ['rejected', req.params.id]
    );
    await db.query(
      'INSERT INTO audit_logs (user_type, user_id, action) VALUES (?, ?, ?)',
      ['admin', req.user.id, `Rejected voter ID: ${req.params.id}`]
    );
    res.json({ message: '✅ Voter rejected.' });
  } catch (err) {
    res.status(500).json({ message: '❌ Server error.', error: err.message });
  }
});

// =============================================
// GET VOTER PROFILE
// =============================================
router.get('/profile/:id', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, voter_id, first_name, last_name, 
       email, address, birthdate, phone, status, has_voted 
       FROM voters WHERE id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: '❌ Voter not found.' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: '❌ Server error.', error: err.message });
  }
});

// =============================================
// DELETE VOTER
// =============================================
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM voters WHERE id = ?', [req.params.id]);
    await db.query(
      'INSERT INTO audit_logs (user_type, user_id, action) VALUES (?, ?, ?)',
      ['admin', req.user.id, `Deleted voter ID: ${req.params.id}`]
    );
    res.json({ message: '✅ Voter deleted.' });
  } catch (err) {
    res.status(500).json({ message: '❌ Server error.', error: err.message });
  }
});

module.exports = router;