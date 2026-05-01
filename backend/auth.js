const express = require('express');
const router = express.Router();
const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ADMIN LOGIN
router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('1. Login attempt:', email);

  try {
    // Check if admin exists
    const [rows] = await db.query('SELECT * FROM admins WHERE email = ?', [email]);
    
    if (rows.length === 0) {
      console.log('2. Admin not found');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const admin = rows[0];
    console.log('3. Admin found, comparing password...');
    
    // Compare password
    const isMatch = await bcrypt.compare(password, admin.password);
    console.log('4. Password match:', isMatch);

    if (!isMatch) {
      console.log('5. Password mismatch');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('6. Generated OTP:', otp);
    
    // Save OTP to database
    await db.query('UPDATE admins SET otp_code = ?, otp_expires = DATE_ADD(NOW(), INTERVAL 5 MINUTE) WHERE id = ?', [otp, admin.id]);
    console.log('7. OTP saved to database');

    res.json({ 
      message: 'OTP sent', 
      otp: otp, 
      admin_id: admin.id 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// ADMIN VERIFY OTP
router.post('/admin/verify-otp', async (req, res) => {
  const { admin_id, otp } = req.body;
  console.log('Verify OTP for admin_id:', admin_id, 'OTP:', otp);

  try {
    const [rows] = await db.query('SELECT * FROM admins WHERE id = ? AND otp_code = ? AND otp_expires > NOW()', [admin_id, otp]);

    if (rows.length === 0) {
      console.log('OTP invalid or expired');
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    console.log('OTP verified for:', rows[0].email);

    // Clear OTP
    await db.query('UPDATE admins SET otp_code = NULL, otp_expires = NULL WHERE id = ?', [admin_id]);

    // Generate JWT token
    const token = jwt.sign(
      { id: rows[0].id, email: rows[0].email, role: 'admin' },
      'secretkey123',
      { expiresIn: '8h' }
    );

    res.json({ 
      message: 'Login successful', 
      token: token,
      admin: { id: rows[0].id, email: rows[0].email }
    });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

module.exports = router;