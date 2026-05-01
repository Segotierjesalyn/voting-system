const express = require('express');
const router = express.Router();
const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Store OTPs in memory (use Redis in production)
const adminOtps = {};
const voterOtps = {};

// =============================================
// ADMIN LOGIN
// =============================================
router.post('/admin-login', async (req, res) => {
  const { email, password } = req.body;
  console.log('🔐 Admin login attempt:', email);

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const [rows] = await db.query('SELECT * FROM admins WHERE email = ?', [email]);

    if (rows.length === 0) {
      console.log('❌ Admin not found:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    
    if (!isMatch) {
      console.log('❌ Password mismatch for:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    adminOtps[email] = {
      otp: otp,
      timestamp: Date.now()
    };

    console.log(`📧 OTP for admin ${email}: ${otp}`);

    res.json({ 
      message: 'OTP sent to email',
      debug_otp: otp  // Remove in production
    });

  } catch (error) {
    console.error('❌ Admin login error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// =============================================
// ADMIN VERIFY OTP
// =============================================
router.post('/verify-admin-otp', async (req, res) => {
  const { email, otp } = req.body;
  console.log('🔐 Admin OTP verification:', email);

  try {
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP required' });
    }

    const storedData = adminOtps[email];

    if (!storedData) {
      console.log('❌ No OTP found for:', email);
      return res.status(401).json({ message: 'OTP expired' });
    }

    // Check OTP expiry (10 minutes)
    if (Date.now() - storedData.timestamp > 10 * 60 * 1000) {
      delete adminOtps[email];
      console.log('❌ OTP expired for:', email);
      return res.status(401).json({ message: 'OTP expired' });
    }

    if (storedData.otp !== otp) {
      console.log('❌ Invalid OTP for:', email);
      return res.status(401).json({ message: 'Invalid OTP' });
    }

    // Get admin from database
    const [rows] = await db.query('SELECT id, email, first_name, last_name FROM admins WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Admin not found' });
    }

    const admin = rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: 'admin' },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '24h' }
    );

    // Clean up OTP
    delete adminOtps[email];

    console.log(`✅ Admin ${email} logged in successfully`);

    res.json({
      message: 'Login successful',
      token: token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: `${admin.first_name} ${admin.last_name}`
      }
    });

  } catch (error) {
    console.error('❌ Admin OTP verification error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// =============================================
// FORGOT PASSWORD - Request Reset Code (VOTER)
// =============================================
router.post('/voter/forgot-password', async (req, res) => {
  const { email } = req.body;
  console.log('📧 Forgot password request for:', email);
  
  try {
    if (!email) {
      return res.status(400).json({ message: 'Email required' });
    }

    const [rows] = await db.query('SELECT id, email FROM voters WHERE email = ?', [email]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Email not found in our records.' });
    }
    
    const voter = rows[0];
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    await db.query(
      'UPDATE voters SET reset_code = ?, reset_expires = DATE_ADD(NOW(), INTERVAL 30 MINUTE) WHERE id = ?',
      [resetCode, voter.id]
    );
    
    console.log('🔐 =========================================');
    console.log(`🔐 PASSWORD RESET CODE FOR ${email}: ${resetCode}`);
    console.log('🔐 =========================================');
    
    res.json({ 
      message: 'Password reset code sent!', 
      debug_reset_code: resetCode  // Remove in production
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// RESET PASSWORD (VOTER)
// =============================================
router.post('/voter/reset-password', async (req, res) => {
  const { email, reset_code, new_password } = req.body;
  console.log('🔐 Reset password request for:', email);
  
  try {
    if (!email || !reset_code || !new_password) {
      return res.status(400).json({ message: 'All fields required' });
    }

    const [rows] = await db.query(
      'SELECT id FROM voters WHERE email = ? AND reset_code = ? AND reset_expires > NOW()',
      [email, reset_code]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid or expired reset code.' });
    }
    
    const hashedPassword = await bcrypt.hash(new_password, 10);
    
    await db.query(
      'UPDATE voters SET password = ?, reset_code = NULL, reset_expires = NULL WHERE id = ?',
      [hashedPassword, rows[0].id]
    );
    
    console.log(`✅ Password reset successful for ${email}`);
    res.json({ message: 'Password reset successful! You can now login.' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// VOTER LOGIN
// =============================================
router.post('/voter/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('🗳️ Voter login attempt:', email);

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const [rows] = await db.query('SELECT * FROM voters WHERE email = ?', [email]);

    if (rows.length === 0) {
      console.log('❌ Voter not found:', email);
      return res.status(401).json({ message: 'Voter not found.' });
    }

    const voter = rows[0];

    if (voter.status !== 'approved') {
      console.log('⚠️ Voter account not approved:', email, voter.status);
      return res.status(403).json({ message: `Account is ${voter.status}. Contact admin.` });
    }

    const isMatch = await bcrypt.compare(password, voter.password);
    if (!isMatch) {
      console.log('❌ Password mismatch for:', email);
      return res.status(401).json({ message: 'Invalid password.' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    voterOtps[voter.id] = {
      otp: otp,
      timestamp: Date.now()
    };

    await db.query(
      'UPDATE voters SET otp = ?, otp_expires = DATE_ADD(NOW(), INTERVAL 5 MINUTE) WHERE id = ?',
      [otp, voter.id]
    );

    console.log(`📧 OTP for voter ${email}: ${otp}`);

    res.json({ 
      message: 'OTP sent!', 
      debug_otp: otp,  // Remove in production
      voter_id: voter.id 
    });
  } catch (err) {
    console.error('❌ Voter login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// VOTER VERIFY OTP
// =============================================
router.post('/voter/verify-otp', async (req, res) => {
  const { voter_id, otp } = req.body;
  console.log('🗳️ Voter OTP verification for voter:', voter_id);

  try {
    if (!voter_id || !otp) {
      return res.status(400).json({ message: 'Voter ID and OTP required' });
    }

    const [rows] = await db.query(
      'SELECT * FROM voters WHERE id = ? AND otp = ? AND otp_expires > NOW()',
      [voter_id, otp]
    );

    if (rows.length === 0) {
      console.log('❌ Invalid or expired OTP for voter:', voter_id);
      return res.status(401).json({ message: 'Invalid or expired OTP.' });
    }

    const voter = rows[0];

    await db.query('UPDATE voters SET otp = NULL, otp_expires = NULL WHERE id = ?', [voter_id]);

    const token = jwt.sign(
      { id: voter.id, email: voter.email, role: 'voter' },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '4h' }
    );

    console.log(`✅ Voter ${voter.email} verified successfully`);

    res.json({ 
      token, 
      voter: { 
        id: voter.id, 
        name: `${voter.first_name} ${voter.last_name}`, 
        email: voter.email 
      } 
    });
  } catch (err) {
    console.error('❌ Voter OTP verification error:', err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// VOTER REGISTER
// =============================================
router.post('/voter/register', async (req, res) => {
  const { first_name, last_name, birthdate, address, email, password, phone } = req.body;
  console.log('📝 New voter registration:', email);

  try {
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ message: 'All fields required' });
    }

    const [existing] = await db.query('SELECT id FROM voters WHERE email = ?', [email]);
    if (existing.length > 0) {
      console.log('❌ Email already registered:', email);
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const voter_id = 'VTR-' + Date.now().toString().slice(-6);
    const hashed = await bcrypt.hash(password, 10);

    await db.query(
      `INSERT INTO voters (voter_id, first_name, last_name, birthdate, address, email, password, phone, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [voter_id, first_name, last_name, birthdate, address, email, hashed, phone]
    );

    console.log(`✅ Voter registered: ${email} with ID: ${voter_id}`);

    res.json({ 
      message: 'Registration successful! Wait for admin approval.', 
      voter_id: voter_id 
    });
  } catch (err) {
    console.error('❌ Voter registration error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;