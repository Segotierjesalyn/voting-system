const express = require('express');
const router = express.Router();
const db = require('./db');
const verifyToken = require('./middleware');

// Submit votes
router.post('/submit', verifyToken, async (req, res) => {
  const { votes } = req.body;
  const voter_id = req.user.id;

  if (!votes || votes.length === 0) {
    return res.status(400).json({ message: 'No votes to submit' });
  }

  // Use election_id from first vote (all votes belong to same election)
  const election_id = votes[0].election_id;

  try {
    // Check if already voted
    const [existing] = await db.query(
      'SELECT id FROM votes WHERE voter_id = ? AND election_id = ? LIMIT 1',
      [voter_id, election_id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'You have already voted in this election' });
    }

    // Insert each vote, including position_id
    for (let v of votes) {
      await db.query(
        'INSERT INTO votes (voter_id, candidate_id, election_id, position_id) VALUES (?, ?, ?, ?)',
        [voter_id, v.candidate_id, v.election_id, v.position_id]
      );
    }

    // Update voter's has_voted flag
    await db.query('UPDATE voters SET has_voted = 1 WHERE id = ?', [voter_id]);

    res.json({ message: 'Votes recorded successfully' });
  } catch (err) {
    console.error('Vote submission error:', err);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
});

// Check if voter already voted
router.get('/has-voted', verifyToken, async (req, res) => {
  const voter_id = req.user.id;
  const election_id = req.query.election_id;
  if (!election_id) return res.status(400).json({ error: 'Missing election_id' });
  try {
    const [rows] = await db.query(
      'SELECT id FROM votes WHERE voter_id = ? AND election_id = ? LIMIT 1',
      [voter_id, election_id]
    );
    res.json({ hasVoted: rows.length > 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;