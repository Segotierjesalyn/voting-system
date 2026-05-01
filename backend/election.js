const express = require('express');
const router = express.Router();
const db = require('./db');
const verifyToken = require('./middleware');
const crypto = require('crypto');

// =============================================
// GET ALL ELECTIONS
// =============================================
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM elections ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '❌ Server error.', error: err.message });
  }
});

// =============================================
// CREATE ELECTION
// =============================================
router.post('/', verifyToken, async (req, res) => {
  const { name, description, start_datetime, end_datetime } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO elections (name, description, start_datetime, end_datetime)
       VALUES (?, ?, ?, ?)`,
      [name, description, start_datetime, end_datetime]
    );
    await db.query(
      'INSERT INTO audit_logs (user_type, user_id, action) VALUES (?, ?, ?)',
      ['admin', req.user.id, `Created election: ${name}`]
    );
    res.json({ message: '✅ Election created.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: '❌ Server error.', error: err.message });
  }
});

// =============================================
// START / END ELECTION
// =============================================
router.put('/status/:id', verifyToken, async (req, res) => {
  const { status } = req.body;
  try {
    await db.query(
      'UPDATE elections SET status = ? WHERE id = ?',
      [status, req.params.id]
    );
    await db.query(
      'INSERT INTO audit_logs (user_type, user_id, action) VALUES (?, ?, ?)',
      ['admin', req.user.id, `Election status changed to: ${status}`]
    );
    res.json({ message: `✅ Election status updated to ${status}.` });
  } catch (err) {
    res.status(500).json({ message: '❌ Server error.', error: err.message });
  }
});

// =============================================
// GET POSITIONS
// =============================================
router.get('/positions/:election_id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM positions WHERE election_id = ? ORDER BY display_order ASC',
      [req.params.election_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '❌ Server error.', error: err.message });
  }
});

// =============================================
// ADD POSITION
// =============================================
router.post('/positions', verifyToken, async (req, res) => {
  const { election_id, name, max_vote, display_order } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO positions (election_id, name, max_vote, display_order)
       VALUES (?, ?, ?, ?)`,
      [election_id, name, max_vote || 1, display_order || 0]
    );
    res.json({ message: '✅ Position added.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: '❌ Server error.', error: err.message });
  }
});

// =============================================
// CAST VOTE
// =============================================
router.post('/vote', verifyToken, async (req, res) => {
  const { election_id, votes } = req.body;
  // votes = [{ candidate_id, position_id }, ...]
  const voter_id = req.user.id;

  try {
    // Check if already voted
    const [alreadyVoted] = await db.query(
      'SELECT id FROM vote_verification WHERE voter_id = ? AND election_id = ?',
      [voter_id, election_id]
    );
    if (alreadyVoted.length > 0) {
      return res.status(400).json({ message: '❌ You have already voted.' });
    }

    // Check election is active
    const [election] = await db.query(
      'SELECT status FROM elections WHERE id = ?', [election_id]
    );
    if (!election[0] || election[0].status !== 'active') {
      return res.status(400).json({ message: '❌ Election is not active.' });
    }

    // Insert votes
    for (const vote of votes) {
      await db.query(
        `INSERT INTO votes (election_id, voter_id, candidate_id, position_id)
         VALUES (?, ?, ?, ?)`,
        [election_id, voter_id, vote.candidate_id, vote.position_id]
      );
    }

    // Mark voter as voted
    await db.query(
      'UPDATE voters SET has_voted = 1 WHERE id = ?', [voter_id]
    );

    // Generate verification code
    const code = crypto.randomBytes(8).toString('hex').toUpperCase();
    await db.query(
      `INSERT INTO vote_verification (voter_id, election_id, verification_code)
       VALUES (?, ?, ?)`,
      [voter_id, election_id, code]
    );

    res.json({
      message: '✅ Vote cast successfully!',
      verification_code: code
    });

  } catch (err) {
    res.status(500).json({ message: '❌ Server error.', error: err.message });
  }
});

// =============================================
// VERIFY VOTE CODE
// =============================================
router.get('/verify/:code', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT vv.verification_code, vv.voted_at, e.name AS election_name
       FROM vote_verification vv
       JOIN elections e ON vv.election_id = e.id
       WHERE vv.verification_code = ?`,
      [req.params.code]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: '❌ Invalid verification code.' });
    }
    res.json({
      message: '✅ Your vote has been counted!',
      election: rows[0].election_name,
      voted_at: rows[0].voted_at,
      code: rows[0].verification_code
    });
  } catch (err) {
    res.status(500).json({ message: '❌ Server error.', error: err.message });
  }
});

module.exports = router;