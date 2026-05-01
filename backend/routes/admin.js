const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// TEST ROUTE - Check if route works
router.get('/test', (req, res) => {
  res.json({ message: 'Admin route is working!' });
});

// ADMIN LOGIN - Step 1
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const [rows] = await db.query(
      'SELECT * FROM admins WHERE email = ?',
      [email]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const admin = rows[0];
    const isValid = await bcrypt.compare(password, admin.password);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    await db.query(
      'UPDATE admins SET otp_code = ?, otp_expires = DATE_ADD(NOW(), INTERVAL 5 MINUTE) WHERE id = ?',
      [otp, admin.id]
    );
    
    console.log(`📧 OTP for ${email}: ${otp}`);
    
    res.json({ message: 'OTP sent successfully', adminId: admin.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// VERIFY OTP - Step 2
router.post('/verify-otp', async (req, res) => {
  const { adminId, otp } = req.body;
  
  try {
    const [rows] = await db.query(
      'SELECT * FROM admins WHERE id = ? AND otp_code = ? AND otp_expires > NOW()',
      [adminId, otp]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }
    
    await db.query(
      'UPDATE admins SET otp_code = NULL, otp_expires = NULL WHERE id = ?',
      [adminId]
    );
    
    const token = jwt.sign(
      { id: adminId, email: rows[0].email, role: 'admin' },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '8h' }
    );
    
    res.json({ token, message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;