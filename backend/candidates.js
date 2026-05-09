const express = require('express');
const router = express.Router();
const db = require('./db');
const verifyToken = require('./middleware');

// Helper to map full_name to name for frontend
function mapCandidate(c) {
  if (c) {
    c.name = c.full_name;
  }
  return c;
}

// GET all candidates (optionally filtered by election)
router.get('/', async (req, res) => {
  try {
    let query = `SELECT c.*, p.name as position_name, e.name as election_name 
                 FROM candidates c
                 JOIN positions p ON c.position_id = p.id
                 JOIN elections e ON c.election_id = e.id`;
    const params = [];
    if (req.query.election_id) {
      query += ' WHERE c.election_id = ?';
      params.push(req.query.election_id);
    }
    query += ' ORDER BY p.display_order, c.full_name';
    const [rows] = await db.query(query, params);
    rows.forEach(mapCandidate);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET candidates for a specific position (used by admin and user ballot)
router.get('/position/:position_id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM candidates WHERE position_id = ? ORDER BY full_name', [req.params.position_id]);
    rows.forEach(mapCandidate);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single candidate by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM candidates WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const candidate = rows[0];
    candidate.name = candidate.full_name;
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE candidate (uses full_name column)
router.post('/', verifyToken, async (req, res) => {
  const { election_id, position_id, name, party, description } = req.body;
  if (!election_id || !position_id || !name) {
    return res.status(400).json({ error: 'Missing required fields (election_id, position_id, name)' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO candidates (election_id, position_id, full_name, party, description) VALUES (?, ?, ?, ?, ?)',
      [election_id, position_id, name, party || null, description || null]
    );
    res.json({ message: 'Candidate added', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE candidate (uses full_name)
router.put('/:id', verifyToken, async (req, res) => {
  const { name, party, description, position_id } = req.body;
  try {
    await db.query(
      'UPDATE candidates SET full_name=?, party=?, description=?, position_id=? WHERE id=?',
      [name, party || null, description || null, position_id, req.params.id]
    );
    res.json({ message: 'Candidate updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE candidate
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM candidates WHERE id = ?', [req.params.id]);
    res.json({ message: 'Candidate deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;