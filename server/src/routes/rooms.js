const express = require('express');
const { db } = require('../db');
const { authRequired } = require('../middlewares/auth');
const { decryptTenantList } = require('../utils/encryption');
const router = express.Router();

router.get('/', (req, res) => {
  const { status } = req.query;
  const userRole = req.user?.role;
  
  // Nếu là khách thuê, chỉ trả về phòng của họ
  if (userRole === 'TENANT') {
    const userId = req.user.userId;
    // Tìm tenant record của user này
    const tenant = db.prepare('SELECT id FROM Tenant WHERE userId = ?').get(userId);
    if (!tenant) {
      return res.json([]); // User chưa có tenant record
    }
    
    // Tìm phòng mà khách thuê đang ở (có ngayRa = null)
    const rows = db.prepare(`
      SELECT r.* FROM Room r
      JOIN RoomTenant rt ON r.id = rt.roomId
      WHERE rt.tenantId = ? AND rt.ngayRa IS NULL
      ORDER BY r.id DESC
    `).all(tenant.id);
    return res.json(rows);
  }
  
  // Nếu là quản lý, trả về tất cả phòng
  let rows;
  if (status) {
    rows = db.prepare('SELECT * FROM Room WHERE trangThai = ? ORDER BY id DESC').all(status);
  } else {
    rows = db.prepare('SELECT * FROM Room ORDER BY id DESC').all();
  }
  // Gắn danh sách tenant đang ở cho từng phòng (ngayRa IS NULL)
  const result = rows.map((room) => {
    const tenants = db.prepare(`
      SELECT t.id, t.hoTen, t.soDienThoai, u.username, rt.isPrimaryTenant, rt.ngayVao
      FROM RoomTenant rt
      JOIN Tenant t ON t.id = rt.tenantId
      JOIN User u ON u.id = t.userId
      WHERE rt.roomId = ? AND rt.ngayRa IS NULL
      ORDER BY rt.isPrimaryTenant DESC, t.id ASC
    `).all(room.id);
     const decryptedTenants = decryptTenantList(tenants);
    return { ...room, currentTenants: decryptedTenants };
  });
  res.json(result);
});

router.post('/', (req, res) => {
  const { maPhong, giaThue, trangThai = 'TRONG', dienTich, taiSan, note } = req.body;
  try {
    // Nếu taiSan là object, chuyển thành JSON string
    const taiSanStr = taiSan ? (typeof taiSan === 'string' ? taiSan : JSON.stringify(taiSan)) : null;
    
    const stmt = db.prepare('INSERT INTO Room (maPhong, giaThue, trangThai, dienTich, taiSan, note) VALUES (?,?,?,?,?,?)');
    const info = stmt.run(maPhong, giaThue, trangThai, dienTich || null, taiSanStr, note || null);
    const room = db.prepare('SELECT * FROM Room WHERE id = ?').get(info.lastInsertRowid);
    
    // Parse taiSan trước khi trả về
    if (room.taiSan) {
      try {
        room.taiSan = JSON.parse(room.taiSan);
      } catch (e) {
        // Nếu không parse được, giữ nguyên string
      }
    }
    
    res.status(201).json(room);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/:id', (req, res) => {
  const room = db.prepare('SELECT * FROM Room WHERE id = ?').get(req.params.id);
  if (!room) return res.status(404).json({ error: 'Not found' });
  
  // Parse taiSan JSON
  if (room.taiSan) {
    try {
      room.taiSan = JSON.parse(room.taiSan);
    } catch (e) {
      // Giữ nguyên nếu không parse được
    }
  }
  
  const tenants = db.prepare(`
    SELECT t.id, t.hoTen, t.soDienThoai, u.username, rt.isPrimaryTenant, rt.ngayVao
    FROM RoomTenant rt
    JOIN Tenant t ON t.id = rt.tenantId
    JOIN User u ON u.id = t.userId
    WHERE rt.roomId = ? AND rt.ngayRa IS NULL
    ORDER BY rt.isPrimaryTenant DESC, t.id ASC
  `).all(room.id);
  res.json({ ...room, currentTenants: tenants });
});

// Lấy phòng của tenant hiện tại
router.get('/me/tenant', authRequired, (req, res) => {
  const currentUser = req.user;
  if (!currentUser) {
    return res.status(401).json({ error: 'Unauthenticated' });
  }
  const userId = currentUser.userId; // JWT lưu userId, không phải id
  const userRole = currentUser.role;
  
  // Chỉ tenant mới được sử dụng endpoint này
  if (userRole !== 'TENANT') {
    return res.status(403).json({ error: 'This endpoint is for tenants only' });
  }
  
  // Tìm tenant record của user này
  const tenant = db.prepare('SELECT id FROM Tenant WHERE userId = ?').get(userId);
  if (!tenant) {
    return res.json([]); // User chưa có tenant
  }
  
  // Tìm phòng mà khách thuê đang ở
  const room = db.prepare(`
    SELECT r.* FROM Room r
    JOIN RoomTenant rt ON rt.roomId = r.id
    WHERE rt.tenantId = ? AND rt.ngayRa IS NULL
  `).get(tenant.id);
  
  if (!room) {
    return res.json([]); // Tenant chưa thuê phòng nào
  }
  
  res.json([room]);
});

router.patch('/:id', (req, res) => {
  const { maPhong, giaThue, trangThai, dienTich, taiSan, note } = req.body;
  const existing = db.prepare('SELECT * FROM Room WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  try {
    // Nếu taiSan là object, chuyển thành JSON string
    const taiSanStr = taiSan ? (typeof taiSan === 'string' ? taiSan : JSON.stringify(taiSan)) : null;
    
    db.prepare('UPDATE Room SET maPhong = COALESCE(?, maPhong), giaThue = COALESCE(?, giaThue), trangThai = COALESCE(?, trangThai), dienTich = COALESCE(?, dienTich), taiSan = COALESCE(?, taiSan), note = COALESCE(?, note) WHERE id = ?')
      .run(maPhong ?? null, giaThue ?? null, trangThai ?? null, dienTich ?? null, taiSanStr ?? null, note ?? null, req.params.id);
    
    const room = db.prepare('SELECT * FROM Room WHERE id = ?').get(req.params.id);
    
    // Parse taiSan JSON
    if (room.taiSan) {
      try {
        room.taiSan = JSON.parse(room.taiSan);
      } catch (e) {
        // Giữ nguyên nếu không parse được
      }
    }
    
    res.json(room);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM Room WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  try {
    db.prepare('DELETE FROM Room WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;


