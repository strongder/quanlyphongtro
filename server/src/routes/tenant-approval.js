const express = require('express');
const { db } = require('../db');
const { authRequired } = require('../middlewares/auth');
const { decryptUser, decryptTenant } = require('../utils/encryption');
const router = express.Router();

// Lấy danh sách tenant chờ duyệt
router.get('/pending', authRequired, (req, res) => {
  // Chỉ manager mới có thể xem
  if (req.user.role !== 'MANAGER') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const tenants = db.prepare(`
    SELECT u.id, u.username, u.name, u.phone, u.status, u.createdAt,
           t.id as tenantId, t.hoTen, t.soDienThoai, t.cccd, t.email, t.diaChi, t.ngaySinh
    FROM User u
    LEFT JOIN Tenant t ON u.id = t.userId
    WHERE u.role = 'TENANT' AND u.status = 'PENDING'
    ORDER BY u.createdAt ASC
  `).all();
  
  // Giải mã User name, phone và Tenant sốDiệnThoại, cccd
  const decryptedTenants = tenants.map(t => {
    const decryptedUser = decryptUser(t);
    const decryptedTenant = decryptTenant(t);
    return {
      ...t,
      name: decryptedUser.name,
      phone: decryptedUser.phone,
      soDienThoai: decryptedTenant.soDienThoai,
      cccd: decryptedTenant.cccd,
      email: decryptedTenant.email,
      diaChi: decryptedTenant.diaChi,
      ngaySinh: decryptedTenant.ngaySinh
    };
  });
  
  res.json(decryptedTenants);
});

// Duyệt tenant
router.post('/:userId/approve', authRequired, (req, res) => {
  // Chỉ manager mới có thể duyệt
  if (req.user.role !== 'MANAGER') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const userId = req.params.userId;
  const { roomId } = req.body || {};
  
  // Kiểm tra user tồn tại và đang chờ duyệt
  const user = db.prepare('SELECT * FROM User WHERE id = ? AND role = ? AND status = ?')
    .get(userId, 'TENANT', 'PENDING');
  
  if (!user) {
    return res.status(404).json({ error: 'Tenant not found or not pending approval' });
  }
  
  try {
    // Bắt buộc phải truyền roomId để gán phòng khi duyệt
    if (!roomId) {
      return res.status(400).json({ error: 'roomId required to approve tenant' });
    }

    // Kiểm tra phòng tồn tại và còn trống
    const room = db.prepare('SELECT * FROM Room WHERE id = ?').get(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    if (room.trangThai !== 'TRONG') {
      return res.status(400).json({ error: 'Room is not available' });
    }

    // Tìm hoặc tạo Tenant record cho user này
    let tenant = db.prepare('SELECT * FROM Tenant WHERE userId = ?').get(userId);
    if (!tenant) {
      const { encryptUser } = require('../utils/encryption');
      const encrypted = encryptUser({ name: user.name, phone: user.phone });
      const info = db.prepare('INSERT INTO Tenant (userId, hoTen, soDienThoai, cccd, email, diaChi, ngaySinh, gioiTinh) VALUES (?,?,?,?,?,?,?,?)')
        .run(user.id, encrypted.name, encrypted.phone, null, null, null, null, null);
      tenant = db.prepare('SELECT * FROM Tenant WHERE id = ?').get(info.lastInsertRowid);
    }

    // Transaction: tạo RoomTenant, cập nhật trạng thái phòng, cập nhật trạng thái user
    const tx = db.transaction(() => {
      const ngayVao = new Date().toISOString().split('T')[0];
      db.prepare('INSERT INTO RoomTenant (roomId, tenantId, ngayVao, isPrimaryTenant) VALUES (?,?,?,?)')
        .run(roomId, tenant.id, ngayVao, 1);

      db.prepare('UPDATE Room SET trangThai = ? WHERE id = ?').run('CO_KHACH', roomId);

      const approvedAt = new Date().toISOString();
      db.prepare('UPDATE User SET status = ?, approvedAt = ? WHERE id = ?')
        .run('ACTIVE', approvedAt, userId);
    });

    tx();

    const approvedAt = new Date().toISOString();
    return res.json({
      success: true,
      message: 'Tenant đã được duyệt và gán phòng thành công',
      userId,
      tenantId: tenant.id,
      roomId,
      approvedAt
    });
  } catch (error) {
    console.error('Error approving tenant:', error);
    res.status(500).json({ error: 'Failed to approve tenant' });
  }
});

// Từ chối tenant
router.post('/:userId/reject', authRequired, (req, res) => {
  // Chỉ manager mới có thể từ chối
  if (req.user.role !== 'MANAGER') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const userId = req.params.userId;
  const { reason } = req.body || {};
  
  // Kiểm tra user tồn tại và đang chờ duyệt
  const user = db.prepare('SELECT * FROM User WHERE id = ? AND role = ? AND status = ?')
    .get(userId, 'TENANT', 'PENDING');
  
  if (!user) {
    return res.status(404).json({ error: 'Tenant not found or not pending approval' });
  }
  
  try {
    // Cập nhật status thành REJECTED và thêm lý do từ chối
    const rejectedAt = new Date().toISOString();
    db.prepare('UPDATE User SET status = ?, rejectedAt = ?, rejectedReason = ? WHERE id = ?')
      .run('REJECTED', rejectedAt, reason || 'Không đủ điều kiện', userId);
    
    res.json({ 
      success: true, 
      message: 'Tenant đã bị từ chối',
      userId: userId,
      rejectedAt: rejectedAt,
      rejectedReason: reason || 'Không đủ điều kiện'
    });
  } catch (error) {
    console.error('Error rejecting tenant:', error);
    res.status(500).json({ error: 'Failed to reject tenant' });
  }
});

// Lấy thống kê duyệt tenant
router.get('/stats', authRequired, (req, res) => {
  // Chỉ manager mới có thể xem
  if (req.user.role !== 'MANAGER') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const stats = db.prepare(`
    SELECT 
      status,
      COUNT(*) as count
    FROM User 
    WHERE role = 'TENANT'
    GROUP BY status
  `).all();
  
  const totalPending = stats.find(s => s.status === 'PENDING')?.count || 0;
  const totalApproved = stats.find(s => s.status === 'ACTIVE')?.count || 0;
  const totalRejected = stats.find(s => s.status === 'REJECTED')?.count || 0;
  
  res.json({
    pending: totalPending,
    approved: totalApproved,
    rejected: totalRejected,
    total: totalPending + totalApproved + totalRejected
  });
});

module.exports = router;
