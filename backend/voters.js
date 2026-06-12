const express = require('express');
const router = express.Router();
const db = require('./db');
const verifyToken = require('./middleware');

// ================================================================
// ✅ FIX: VOTER SELF-SERVICE PROFILE ROUTES
// These MUST be defined BEFORE the /:id wildcard routes.
// Previously, PUT /profile was being caught by PUT /:id
// with id = "profile", so the SQL WHERE id = 'profile'
// matched ZERO rows — silently saving nothing to the database.
// ================================================================

// GET /api/voters/profile — Voter fetches their own profile (uses JWT token)
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM voters WHERE id = ?',
      [req.user.id] // ✅ ID comes from the decoded JWT token
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Voter not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/voters/profile — Voter updates their own profile (uses JWT token)
router.put('/profile', verifyToken, async (req, res) => {
  const {
    first_name, last_name, phone, address,
    birthday, gender, marital_status,
    province, city, barangay, zip_code, profile_pic
  } = req.body;

  try {
    const [result] = await db.query(
      `UPDATE voters SET
        first_name = ?, last_name = ?, phone = ?, address = ?,
        birthday = ?, gender = ?, marital_status = ?,
        province = ?, city = ?, barangay = ?, zip_code = ?, profile_pic = ?
       WHERE id = ?`,
      [
        first_name, last_name, phone, address,
        birthday, gender, marital_status,
        province, city, barangay, zip_code, profile_pic,
        req.user.id // ✅ Uses the voter's actual ID from JWT — NOT req.params.id
      ]
    );

    // ✅ Now we verify the update actually affected a row
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Voter not found or nothing changed.' });
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ================================================================
// ADMIN VOTER MANAGEMENT ROUTES
// ================================================================

// 1. GET ALL VOTERS (Admin table/list)
router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM voters ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GET SINGLE VOTER BY ID (Admin Edit Modal — always fetches fresh DB data)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM voters WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Voter not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. APPROVE VOTER — must be before PUT /:id to avoid route conflict
router.put('/approve/:id', verifyToken, async (req, res) => {
  try {
    await db.query(
      'UPDATE voters SET status = "approved" WHERE id = ?',
      [req.params.id]
    );
    res.json({ message: 'Voter approved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. UPDATE VOTER (Admin Edit Modal save)
router.put('/:id', verifyToken, async (req, res) => {
  const {
    first_name, last_name, email, phone, address, status,
    birthday, gender, marital_status, province, city, barangay, zip_code
  } = req.body;

  try {
    const [result] = await db.query(
      `UPDATE voters SET
        first_name = ?, last_name = ?, email = ?, phone = ?, address = ?, status = ?,
        birthday = ?, gender = ?, marital_status = ?,
        province = ?, city = ?, barangay = ?, zip_code = ?
       WHERE id = ?`,
      [
        first_name, last_name, email, phone, address, status,
        birthday, gender, marital_status,
        province, city, barangay, zip_code,
        req.params.id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Voter not found.' });
    }

    res.json({ message: 'Voter updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. DELETE VOTER
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM voters WHERE id = ?', [req.params.id]);
    res.json({ message: 'Voter deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;