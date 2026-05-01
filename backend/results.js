const express = require('express');
const router = express.Router();
const db = require('./db');
const verifyToken = require('./middleware');

router.get('/turnout/:election_id', verifyToken, async (req, res) => {
  try {
    const [total] = await db.query('SELECT COUNT(*) as total FROM voters WHERE status="approved"');
    const [voted] = await db.query('SELECT COUNT(DISTINCT voter_id) as voted FROM votes WHERE election_id=?', [req.params.election_id]);
    const turnout = total[0].total ? (voted[0].voted / total[0].total * 100).toFixed(2) : 0;
    res.json({ votes_cast: voted[0].voted || 0, turnout_percentage: turnout });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;