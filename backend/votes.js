// ===== Submit votes =====
router.post('/votes/submit', verifyToken, async (req, res) => {
  const { votes } = req.body;   // array of { candidate_id, position_id, election_id }
  const voter_id = req.user.id; // from JWT token
  try {
    // Check if voter already voted for this election
    const [existing] = await db.query('SELECT id FROM votes WHERE voter_id = ? AND election_id = ? LIMIT 1', [voter_id, votes[0]?.election_id]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'You have already voted in this election.' });
    }
    // Insert each vote
    for (let v of votes) {
      await db.query(
        'INSERT INTO votes (voter_id, candidate_id, election_id) VALUES (?, ?, ?)',
        [voter_id, v.candidate_id, v.election_id]
      );
    }
    res.json({ message: 'Votes recorded successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Check if voter has already voted for an election =====
router.get('/votes/has-voted', verifyToken, async (req, res) => {
  const voter_id = req.user.id;
  const election_id = req.query.election_id;
  try {
    const [rows] = await db.query('SELECT id FROM votes WHERE voter_id = ? AND election_id = ? LIMIT 1', [voter_id, election_id]);
    res.json({ hasVoted: rows.length > 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});