const express = require('express');
const router = express.Router();
const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// VOTER REGISTER
router.post('/voter/register', async (req, res) => {
  const { first_name, last_name, birthdate, address, email, password, phone } = req.body;

  try {
    const [existing] = await db.query('SELECT id FROM voters WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const voter_id = 'VTR-' + Date.now().toString().slice(-6);
    const hashed = await bcrypt.hash(password, 10);

    await db.query(
      `INSERT INTO voters (voter_id, first_name, last_name, birthdate, address, email, password, phone, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [voter_id, first_name, last_name, birthdate, address, email, hashed, phone]
    );

    res.json({ message: 'Registration successful! Wait for admin approval.', voter_id: voter_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// VOTER LOGIN
router.post('/voter/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Voter login:', email);

  try {
    const [rows] = await db.query('SELECT * FROM voters WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Voter not found.' });
    }

    const voter = rows[0];

    if (voter.status !== 'approved') {
      return res.status(403).json({ message: `Account is ${voter.status}. Contact admin.` });
    }

    const isMatch = await bcrypt.compare(password, voter.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await db.query('UPDATE voters SET otp = ?, otp_expires = DATE_ADD(NOW(), INTERVAL 5 MINUTE) WHERE id = ?', [otp, voter.id]);

    console.log(`🔐 Voter OTP for ${email}: ${otp}`);

    res.json({ message: 'OTP sent', otp: otp, voter_id: voter.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// VOTER VERIFY OTP
router.post('/voter/verify-otp', async (req, res) => {
  const { voter_id, otp } = req.body;

  try {
    const [rows] = await db.query('SELECT * FROM voters WHERE id = ? AND otp = ? AND otp_expires > NOW()', [voter_id, otp]);

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid or expired OTP.' });
    }

    await db.query('UPDATE voters SET otp = NULL, otp_expires = NULL WHERE id = ?', [voter_id]);

    const token = jwt.sign(
      { id: rows[0].id, email: rows[0].email, role: 'voter' },
      'secretkey123',
      { expiresIn: '4h' }
    );

    res.json({ token, voter: { id: rows[0].id, name: `${rows[0].first_name} ${rows[0].last_name}`, email: rows[0].email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// FORGOT PASSWORD
router.post('/voter/forgot-password', async (req, res) => {
  const { email } = req.body;
  console.log('Forgot password:', email);

  try {
    const [rows] = await db.query('SELECT id FROM voters WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Email not found' });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    await db.query('UPDATE voters SET reset_code = ?, reset_expires = DATE_ADD(NOW(), INTERVAL 30 MINUTE) WHERE id = ?', [resetCode, rows[0].id]);

    console.log(`🔐 Reset code for ${email}: ${resetCode}`);

    res.json({ message: 'Reset code sent', reset_code: resetCode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// RESET PASSWORD
router.post('/voter/reset-password', async (req, res) => {
  const { email, reset_code, new_password } = req.body;

  try {
    const [rows] = await db.query('SELECT id FROM voters WHERE email = ? AND reset_code = ? AND reset_expires > NOW()', [email, reset_code]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid or expired reset code' });
    }

    const hashed = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE voters SET password = ?, reset_code = NULL, reset_expires = NULL WHERE id = ?', [hashed, rows[0].id]);

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;