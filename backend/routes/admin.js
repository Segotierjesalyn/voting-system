const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ADMIN LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Admin login:', email);

  try {
    const [rows] = await db.query('SELECT * FROM admins WHERE email = ?', [email]);
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const admin = rows[0];
    const isValid = await bcrypt.compare(password, admin.password);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await db.query('UPDATE admins SET otp_code = ?, otp_expires = DATE_ADD(NOW(), INTERVAL 5 MINUTE) WHERE id = ?', [otp, admin.id]);
    
    console.log(`🔐 Admin OTP for ${email}: ${otp}`);
    
    res.json({ message: 'OTP sent', admin_id: admin.id, otp: otp });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN VERIFY OTP
router.post('/verify-otp', async (req, res) => {
  const { admin_id, otp } = req.body;
  console.log('Verify admin OTP:', admin_id, otp);

  try {
    const [rows] = await db.query('SELECT * FROM admins WHERE id = ? AND otp_code = ? AND otp_expires > NOW()', [admin_id, otp]);
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }
    
    await db.query('UPDATE admins SET otp_code = NULL, otp_expires = NULL WHERE id = ?', [admin_id]);
    
    const token = jwt.sign(
      { id: admin_id, email: rows[0].email, role: 'admin' },
      'secretkey123',
      { expiresIn: '8h' }
    );
    
    res.json({ token, message: 'Login successful', admin: { id: admin_id, email: rows[0].email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;