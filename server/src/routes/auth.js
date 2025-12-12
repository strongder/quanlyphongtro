const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { signToken } = require('../middlewares/auth');
const { encryptUser, decryptUser, encryptTenant } = require('../utils/encryption');
const { loginLimiter } = require('../middlewares/rateLimit');
const router = express.Router();

// Đăng ký quản lý (chỉ để seed nhanh trong môi trường học tập)
router.post('/register-manager', (req, res) => {
  const { username, name, phone, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username, password required' });
  
  // Kiểm tra username đã tồn tại
  const existing = db.prepare('SELECT * FROM User WHERE username = ?').get(username);
  if (existing) return res.status(400).json({ error: 'Username already exists' });
  
  // Mã hóa phone và name (không mã hóa username)
  const encrypted = encryptUser({ name, phone });
  
  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare('INSERT INTO User (role, username, name, phone, passwordHash) VALUES (?,?,?,?,?)')
    .run('MANAGER', username, encrypted.name || null, encrypted.phone || null, hash);
  
  const user = db.prepare('SELECT id, role, username, name, phone, createdAt FROM User WHERE id = ?').get(info.lastInsertRowid);
  const decryptedUser = decryptUser(user);
  const token = signToken({ userId: user.id, role: user.role });
  res.status(201).json({ token, user: decryptedUser });
});

// Đăng ký khách thuê
router.post('/register-tenant', (req, res) => {
  const { username, name, phone, password, email, diaChi, ngaySinh, gioiTinh, cccd } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username, password required' });
  if (!name) return res.status(400).json({ error: 'name required' });
  
  // Validate gioiTinh if provided
  if (gioiTinh && !['NAM', 'NU', 'KHAC'].includes(gioiTinh)) {
    return res.status(400).json({ error: 'gioiTinh must be NAM, NU, or KHAC' });
  }
  
  // Kiểm tra username đã tồn tại
  const existing = db.prepare('SELECT * FROM User WHERE username = ?').get(username);
  if (existing) return res.status(400).json({ error: 'Username already exists' });
  
  // Mã hóa phone và name (không mã hóa username)
  const encryptedUser = encryptUser({ name, phone });
  
  const hash = bcrypt.hashSync(password, 10);
  
  // Bắt đầu transaction
  const insertUser = db.prepare('INSERT INTO User (role, username, name, phone, passwordHash, status) VALUES (?,?,?,?,?,?)');
  const insertTenant = db.prepare(
    'INSERT INTO Tenant (userId, hoTen, soDienThoai, email, diaChi, ngaySinh, gioiTinh, cccd) VALUES (?,?,?,?,?,?,?,?)'
  );
  
  try {
    // Tạo User với status PENDING
    const userInfo = insertUser.run('TENANT', username, encryptedUser.name, encryptedUser.phone || null, hash, 'PENDING');
    const userId = userInfo.lastInsertRowid;
    
    // Mã hóa dữ liệu Tenant (phone + email nếu có)
    const encryptedTenant = encryptTenant({ soDienThoai: phone, email });
    
    // Tạo Tenant record liên kết với User
    insertTenant.run(
      userId,
      name,
      encryptedTenant.soDienThoai || null,
      encryptedTenant.email || null,
      diaChi || null,
      ngaySinh || null,
      gioiTinh || null,
      cccd || null
    );
    
    const user = db.prepare('SELECT id, role, username, name, phone, status, createdAt FROM User WHERE id = ?')
      .get(userId);
    
    const decryptedUser = decryptUser(user);
    
    res.status(201).json({ 
      message: 'Tài khoản đã được tạo và đang chờ duyệt từ quản lý',
      user: {
        id: user.id,
        username: user.username,
        name: decryptedUser.name,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Error creating tenant:', error);
    res.status(500).json({ error: 'Failed to create tenant account' });
  }
});

// Đăng nhập
router.post('/login', loginLimiter, (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username, password required' });
  
  const user = db.prepare('SELECT * FROM User WHERE username = ?').get(username);
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  
  const ok = bcrypt.compareSync(password, user.passwordHash || '');
  if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
  
  // Kiểm tra trạng thái duyệt
  if (user.status === 'PENDING') {
    return res.status(403).json({ 
      error: 'Tài khoản đang chờ duyệt từ quản lý',
      status: 'PENDING'
    });
  }
  
  if (user.status === 'REJECTED') {
    return res.status(403).json({ 
      error: 'Tài khoản đã bị từ chối',
      status: 'REJECTED',
      rejectedReason: user.rejectedReason
    });
  }
  
  // Giải mã dữ liệu User trước khi trả về
  const decryptedUser = decryptUser(user);
  
  const profile = { 
    id: user.id, 
    role: user.role, 
    username: user.username, 
    name: decryptedUser.name, 
    phone: decryptedUser.phone, 
    status: user.status,
    createdAt: user.createdAt 
  };
  const token = signToken({ userId: user.id, role: user.role });
  res.json({ token, user: profile });
});

module.exports = router;


