const express = require('express');
const router = express.Router();
const db = require('./db');
const verifyToken = require('./middleware');

// =============================================
// GET ALL CANDIDATES
// =============================================
router.get('/:election_id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, p.name AS position_name 
       FROM candidates c
       JOIN positions p ON c.position_id = p.id
       WHERE c.election_id = ?
       ORDER BY p.display_order ASC`,
      [req.params.election_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '❌ Server error.', error: err.message });
  }
});

// =============================================
// ADD CANDIDATE
// =============================================
router.post('/', verifyToken, async (req, res) => {
  const { election_id, position_id, full_name, party, age, platform } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO candidates 
       (election_id, position_id, full_name, party, age, platform)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [election_id, position_id, full_name, party, age, platform]
    );
    await db.query(
      'INSERT INTO audit_logs (user_type, user_id, action) VALUES (?, ?, ?)',
      ['admin', req.user.id, `Added candidate: ${full_name}`]
    );
    res.json({ message: '✅ Candidate added.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: '❌ Server error.', error: err.message });
  }
});

// =============================================
// UPDATE CANDIDATE
// =============================================
router.put('/:id', verifyToken, async (req, res) => {
  const { full_name, party, age, platform } = req.body;
  try {
    await db.query(
      `UPDATE candidates SET full_name=?, party=?, age=?, platform=? WHERE id=?`,
      [full_name, party, age, platform, req.params.id]
    );
    res.json({ message: '✅ Candidate updated.' });
  } catch (err) {
    res.status(500).json({ message: '❌ Server error.', error: err.message });
  }
});

// =============================================
// DELETE CANDIDATE
// =============================================
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT full_name FROM candidates WHERE id = ?', [req.params.id]
    );
    await db.query('DELETE FROM candidates WHERE id = ?', [req.params.id]);
    await db.query(
      'INSERT INTO audit_logs (user_type, user_id, action) VALUES (?, ?, ?)',
      ['admin', req.user.id, `Deleted candidate: ${rows[0]?.full_name}`]
    );
    res.json({ message: '✅ Candidate deleted.' });
  } catch (err) {
    res.status(500).json({ message: '❌ Server error.', error: err.message });
  }
});

module.exports = router;