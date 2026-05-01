const express = require('express');
const router = express.Router();
const db = require('./db');
const verifyToken = require('./middleware');

// =============================================
// GET RESULTS PER ELECTION
// =============================================
router.get('/:election_id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
         c.id AS candidate_id,
         c.full_name,
         c.party,
         p.name AS position,
         COUNT(v.id) AS vote_count
       FROM candidates c
       LEFT JOIN votes v ON c.id = v.candidate_id
       JOIN positions p ON c.position_id = p.id
       WHERE c.election_id = ?
       GROUP BY c.id
       ORDER BY p.display_order ASC, vote_count DESC`,
      [req.params.election_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '❌ Server error.', error: err.message });
  }
});

// =============================================
// GET TURNOUT STATS
// =============================================
router.get('/turnout/:election_id', async (req, res) => {
  try {
    const [totalVoters] = await db.query(
      'SELECT COUNT(*) AS total FROM voters WHERE status = "approved"'
    );
    const [votedCount] = await db.query(
      `SELECT COUNT(DISTINCT voter_id) AS voted 
       FROM vote_verification WHERE election_id = ?`,
      [req.params.election_id]
    );
    const total = totalVoters[0].total;
    const voted = votedCount[0].voted;
    const percentage = total > 0 ? ((voted / total) * 100).toFixed(2) : 0;

    res.json({
      total_voters: total,
      votes_cast: voted,
      turnout_percentage: percentage
    });
  } catch (err) {
    res.status(500).json({ message: '❌ Server error.', error: err.message });
  }
});

// =============================================
// GET AUDIT LOGS (Admin)
// =============================================
router.get('/audit/logs', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '❌ Server error.', error: err.message });
  }
});

module.exports = router;