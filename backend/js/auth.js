// ... other requires
router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM admins WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const admin = rows[0];
    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await db.query('UPDATE admins SET otp_code = ?, otp_expires = DATE_ADD(NOW(), INTERVAL 5 MINUTE) WHERE id = ?', [otp, admin.id]);
    console.log(`🔐 Admin OTP for ${email}: ${otp}`);
    res.json({ message: 'OTP sent', admin_id: admin.id, otp });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.post('/admin/verify-otp', async (req, res) => {
  const { admin_id, otp } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM admins WHERE id = ? AND otp_code = ? AND otp_expires > NOW()', [admin_id, otp]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid OTP' });
    await db.query('UPDATE admins SET otp_code = NULL, otp_expires = NULL WHERE id = ?', [admin_id]);
    const token = jwt.sign({ id: rows[0].id, email: rows[0].email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, admin: { id: rows[0].id, email: rows[0].email } });
  } catch(err) { res.status(500).json({ error: err.message }); }
});