const express = require('express');
const router = express.Router();
const db = require('./db');
const verifyToken = require('./middleware');

// Turnout stats (admin)
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
router.get('/election/:id', async (req, res) => {
  const electionId = req.params.id;
  try {
    // Get positions for this election
    const [positions] = await db.query('SELECT * FROM positions WHERE election_id = ? ORDER BY display_order', [electionId]);
    if (positions.length === 0) {
      return res.json([]);
    }
    const results = [];
    for (let pos of positions) {
      // Count votes per candidate for this position
      const [candidates] = await db.query(`
        SELECT c.id, c.full_name as name, c.party, COUNT(v.id) as vote_count
        FROM candidates c
        LEFT JOIN votes v ON v.candidate_id = c.id AND v.election_id = ?
        WHERE c.position_id = ?
        GROUP BY c.id
        ORDER BY vote_count DESC
      `, [electionId, pos.id]);
      results.push({
        position: pos.title,
        max_seats: pos.max_seats,
        candidates: candidates.map(c => ({ ...c, name: c.name || c.full_name }))
      });
    }
    res.json(results);
  } catch (err) {
    console.error('Results error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;