const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { authRequired } = require('../middlewares/auth');
const { encryptUser, decryptUser, decryptTenant, encryptTenant } = require('../utils/encryption');
const router = express.Router();

router.get('/me', authRequired, (req, res) => {
  const user = db.prepare('SELECT id, role, username, name, phone, expoPushToken, createdAt FROM User WHERE id = ?').get(req.user.userId);
  
  // Giải mã thông tin user
  const decryptedUser = decryptUser(user);
  
  // Nếu là tenant, lấy thông tin tenant
  if (decryptedUser.role === 'TENANT') {
    const tenant = db.prepare('SELECT id, hoTen, soDienThoai, cccd FROM Tenant WHERE userId = ?').get(req.user.userId);
    if (tenant) {
      // Giải mã thông tin tenant
      decryptedUser.tenantInfo = decryptTenant(tenant);
    }
  }
  
  res.json(decryptedUser);
});

router.patch('/me', authRequired, (req, res) => {
  const { name, phone, expoPushToken } = req.body || {};
  
  // Mã hóa phone và name nếu có
  const encryptedData = encryptUser({ phone, name });
  
  db.prepare('UPDATE User SET name = COALESCE(?, name), phone = COALESCE(?, phone), expoPushToken = COALESCE(?, expoPushToken) WHERE id = ?')
    .run(encryptedData.name ?? null, encryptedData.phone ?? null, expoPushToken ?? null, req.user.userId);
  
  const user = db.prepare('SELECT id, role, name, phone, expoPushToken, createdAt FROM User WHERE id = ?').get(req.user.userId);
  const decryptedUser = decryptUser(user);
  res.json(decryptedUser);
});

/**
 * Admin API: Get all users
 * GET /users
 * Query params: role (MANAGER/TENANT), status (ACTIVE/PENDING/REJECTED), limit, offset
 */
router.get('/', authRequired, (req, res) => {
  const { role, status, limit = 20, offset = 0, includeDeleted = false } = req.query;

  // Chỉ MANAGER mới được xem danh sách users
  if (req.user.role !== 'MANAGER') {
    return res.status(403).json({ error: 'Forbidden: Admin only' });
  }

  let query = 'SELECT id, role, username, name, phone, status, createdAt FROM User WHERE 1=1';
  const params = [];

  // Loại trừ users bị xóa (trừ khi includeDeleted=true)
  if (includeDeleted !== 'true') {
    query += ' AND status != ?';
    params.push('DELETED');
  }

  if (role) {
    query += ' AND role = ?';
    params.push(role);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const users = db.prepare(query).all(...params);
  const decryptedUsers = users.map(u => decryptUser(u));

  // Get total count
  let countQuery = 'SELECT COUNT(*) as total FROM User WHERE 1=1';
  const countParams = [];
  if (role) {
    countQuery += ' AND role = ?';
    countParams.push(role);
  }
  if (status) {
    countQuery += ' AND status = ?';
    countParams.push(status);
  }

  const { total } = db.prepare(countQuery).get(...countParams) || { total: 0 };

  res.json({
    data: decryptedUsers,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      pages: Math.ceil(total / limit),
    }
  });
});

/**
 * Admin API: Get user by ID
 * GET /users/{id}
 */
router.get('/:id', authRequired, (req, res) => {
  const { id } = req.params;

  // Chỉ MANAGER hoặc chính user đó mới được xem
  if (req.user.role !== 'MANAGER' && req.user.userId !== parseInt(id)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const user = db.prepare('SELECT id, role, username, name, phone, status, createdAt FROM User WHERE id = ?').get(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const decryptedUser = decryptUser(user);

  // Nếu là tenant, lấy tenant info
  if (user.role === 'TENANT') {
    const tenant = db.prepare('SELECT id, userId, hoTen, soDienThoai, cccd, email, diaChi, ngaySinh, gioiTinh, createdAt FROM Tenant WHERE userId = ?').get(id);
    if (tenant) {
      decryptedUser.tenantInfo = decryptTenant(tenant);
    }
  }

  res.json(decryptedUser);
});

/**
 * Admin API: Update user info
 * PATCH /users/{id}
 * Body: { name, phone, password, status }
 */
router.patch('/:id', authRequired, (req, res) => {
  const { id } = req.params;
  const { name, phone, password, status } = req.body || {};

  // Chỉ MANAGER mới được update user khác
  if (req.user.role !== 'MANAGER' && req.user.userId !== parseInt(id)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Validate status if provided
  if (status && !['ACTIVE', 'PENDING', 'REJECTED', 'DELETED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  // Validate password length if provided
  if (password && password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const user = db.prepare('SELECT * FROM User WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Mã hóa phone và name nếu có
    const encryptedData = encryptUser({ phone, name });

    // Hash password nếu có
    let passwordHash = user.passwordHash;
    if (password) {
      passwordHash = bcrypt.hashSync(password, 10);
    }

    // Update User
    db.prepare(`
      UPDATE User SET
        name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        passwordHash = COALESCE(?, passwordHash),
        status = COALESCE(?, status)
      WHERE id = ?
    `).run(
      encryptedData.name ?? null,
      encryptedData.phone ?? null,
      passwordHash === user.passwordHash ? null : passwordHash,
      status ?? null,
      id
    );

    const updatedUser = db.prepare('SELECT id, role, username, name, phone, status, createdAt FROM User WHERE id = ?').get(id);
    const decryptedUser = decryptUser(updatedUser);

    res.json({
      success: true,
      message: 'User updated successfully',
      user: decryptedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * Admin API: Delete user (soft delete)
 * DELETE /users/{id}
 */
router.delete('/:id', authRequired, (req, res) => {
  const { id } = req.params;

  // Chỉ MANAGER mới được xóa user
  if (req.user.role !== 'MANAGER') {
    return res.status(403).json({ error: 'Forbidden: Admin only' });
  }

  try {
    const user = db.prepare('SELECT * FROM User WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Soft delete: chỉ cập nhật status thành DELETED
    db.prepare('UPDATE User SET status = ? WHERE id = ?').run('DELETED', id);

    res.json({
      success: true,
      message: 'User deleted successfully',
      userId: id
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

/**
 * Admin API: Update tenant info
 * PATCH /users/{userId}/tenant
 * Body: { hoTen, soDienThoai, cccd, email, diaChi, ngaySinh, gioiTinh }
 */
router.patch('/:userId/tenant', authRequired, (req, res) => {
  const { userId } = req.params;
  const { hoTen, soDienThoai, cccd, email, diaChi, ngaySinh, gioiTinh } = req.body || {};

  // Chỉ MANAGER mới được update tenant info
  if (req.user.role !== 'MANAGER') {
    return res.status(403).json({ error: 'Forbidden: Admin only' });
  }

  // Validate gioiTinh if provided
  if (gioiTinh && !['NAM', 'NU', 'KHAC'].includes(gioiTinh)) {
    return res.status(400).json({ error: 'Invalid gioiTinh' });
  }

  try {
    const user = db.prepare('SELECT * FROM User WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'TENANT') {
      return res.status(400).json({ error: 'User is not a tenant' });
    }

    const tenant = db.prepare('SELECT * FROM Tenant WHERE userId = ?').get(userId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Mã hóa các trường nhạy cảm
    const encryptedData = encryptTenant({ soDienThoai, email, diaChi, ngaySinh });

    // Update Tenant
    db.prepare(`
      UPDATE Tenant SET
        hoTen = COALESCE(?, hoTen),
        soDienThoai = COALESCE(?, soDienThoai),
        cccd = COALESCE(?, cccd),
        email = COALESCE(?, email),
        diaChi = COALESCE(?, diaChi),
        ngaySinh = COALESCE(?, ngaySinh),
        gioiTinh = COALESCE(?, gioiTinh)
      WHERE userId = ?
    `).run(
      hoTen ?? null,
      encryptedData.soDienThoai ?? null,
      cccd ?? null,
      encryptedData.email ?? null,
      encryptedData.diaChi ?? null,
      encryptedData.ngaySinh ?? null,
      gioiTinh ?? null,
      userId
    );

    const updatedTenant = db.prepare('SELECT * FROM Tenant WHERE userId = ?').get(userId);
    const decryptedTenant = decryptTenant(updatedTenant);

    res.json({
      success: true,
      message: 'Tenant info updated successfully',
      tenant: decryptedTenant
    });
  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({ error: 'Failed to update tenant info' });
  }
});

module.exports = router;


