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

// Detailed results per position for an election
router.get('/details/:election_id', verifyToken, async (req, res) => {
  try {
    const [positions] = await db.query('SELECT * FROM positions WHERE election_id = ? ORDER BY display_order', [req.params.election_id]);
    const results = [];
    for (const pos of positions) {
      const [candidates] = await db.query(`
        SELECT c.id, c.name, c.party, COUNT(v.id) as vote_count
        FROM candidates c
        LEFT JOIN votes v ON v.candidate_id = c.id
        WHERE c.position_id = ?
        GROUP BY c.id
        ORDER BY vote_count DESC
      `, [pos.id]);
      results.push({
        position: pos.title,
        max_seats: pos.max_seats,
        candidates
      });
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;