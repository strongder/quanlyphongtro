const express = require('express');
const { db } = require('../db');
const { encryptTenant, decryptTenant, decryptTenantList } = require('../utils/encryption');
const router = express.Router();

router.get('/', (req, res) => {
  const { query } = req.query;
  if (query) {
    const q = `%${query}%`;
    const rows = db.prepare('SELECT * FROM Tenant WHERE hoTen LIKE ? OR soDienThoai LIKE ? ORDER BY id DESC').all(q, q);
    const decryptedRows = decryptTenantList(rows);
    return res.json(decryptedRows);
  }
  const rows = db.prepare('SELECT * FROM Tenant ORDER BY id DESC').all();
  const decryptedRows = decryptTenantList(rows);
  res.json(decryptedRows);
});

router.post('/', (req, res) => {
  const { userId, hoTen, soDienThoai, cccd } = req.body;
  if (!hoTen) return res.status(400).json({ error: 'hoTen required' });
  if (!userId) return res.status(400).json({ error: 'userId required' });
  
  // Kiểm tra xem user đã có tenant record chưa
  const existing = db.prepare('SELECT * FROM Tenant WHERE userId = ?').get(userId);
  if (existing) {
    return res.status(400).json({ error: 'User already has tenant record' });
  }
  
  // Mã hóa dữ liệu nhạy cảm
  const encryptedData = encryptTenant({ soDienThoai, cccd });
  
  const info = db.prepare('INSERT INTO Tenant (userId, hoTen, soDienThoai, cccd) VALUES (?,?,?,?)').run(
    userId, 
    hoTen, 
    encryptedData.soDienThoai || null, 
    encryptedData.cccd || null
  );
  
  const tenant = db.prepare('SELECT * FROM Tenant WHERE id = ?').get(info.lastInsertRowid);
  const decryptedTenant = decryptTenant(tenant);
  res.status(201).json(decryptedTenant);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM Tenant WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const decryptedRow = decryptTenant(row);
  res.json(decryptedRow);
});

router.patch('/:id', (req, res) => {
  const { hoTen, soDienThoai, cccd } = req.body;
  const existing = db.prepare('SELECT * FROM Tenant WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  
  // Mã hóa dữ liệu nhạy cảm nếu có
  const encryptedData = encryptTenant({ soDienThoai, cccd });
  
  db.prepare('UPDATE Tenant SET hoTen = COALESCE(?, hoTen), soDienThoai = COALESCE(?, soDienThoai), cccd = COALESCE(?, cccd) WHERE id = ?')
    .run(
      hoTen ?? null, 
      encryptedData.soDienThoai ?? null, 
      encryptedData.cccd ?? null, 
      req.params.id
    );
  
  const tenant = db.prepare('SELECT * FROM Tenant WHERE id = ?').get(req.params.id);
  const decryptedTenant = decryptTenant(tenant);
  res.json(decryptedTenant);
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM Tenant WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM Tenant WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// API để gán phòng cho tenant
router.post('/:id/assign-room', (req, res) => {
  const { roomId } = req.body;
  const tenantId = req.params.id;
  
  if (!roomId) return res.status(400).json({ error: 'roomId required' });
  
  // Kiểm tra tenant tồn tại
  const tenant = db.prepare('SELECT * FROM Tenant WHERE id = ?').get(tenantId);
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
  
  // Kiểm tra phòng tồn tại
  const room = db.prepare('SELECT * FROM Room WHERE id = ?').get(roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  
  // Kiểm tra phòng có đang trống không
  if (room.trangThai !== 'TRONG') {
    return res.status(400).json({ error: 'Room is not available' });
  }
  
  // Kiểm tra tenant đã có phòng chưa
  const existingAssignment = db.prepare('SELECT * FROM RoomTenant WHERE tenantId = ? AND ngayRa IS NULL').get(tenantId);
  if (existingAssignment) {
    return res.status(400).json({ error: 'Tenant already has a room' });
  }
  
  try {
    // Bắt đầu transaction
    const tx = db.transaction(() => {
      // Tạo RoomTenant record
      const ngayVao = new Date().toISOString().split('T')[0];
      db.prepare('INSERT INTO RoomTenant (roomId, tenantId, ngayVao, isPrimaryTenant) VALUES (?,?,?,?)')
        .run(roomId, tenantId, ngayVao, 1);
      
      // Cập nhật trạng thái phòng
      db.prepare('UPDATE Room SET trangThai = ? WHERE id = ?').run('CO_KHACH', roomId);
    });
    
    tx();
    
    res.json({ 
      success: true, 
      message: 'Room assigned successfully',
      roomId: roomId,
      tenantId: tenantId
    });
  } catch (error) {
    console.error('Error assigning room:', error);
    res.status(500).json({ error: 'Failed to assign room' });
  }
});

// API để trả phòng cho tenant
router.post('/:id/return-room', (req, res) => {
  const tenantId = req.params.id;
  
  // Kiểm tra tenant tồn tại
  const tenant = db.prepare('SELECT * FROM Tenant WHERE id = ?').get(tenantId);
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
  
  // Tìm phòng hiện tại của tenant
  const roomAssignment = db.prepare('SELECT * FROM RoomTenant WHERE tenantId = ? AND ngayRa IS NULL').get(tenantId);
  if (!roomAssignment) {
    return res.status(400).json({ error: 'Tenant does not have a room' });
  }
  
  try {
    // Bắt đầu transaction
    const tx = db.transaction(() => {
      // Cập nhật ngayRa
      const ngayRa = new Date().toISOString().split('T')[0];
      db.prepare('UPDATE RoomTenant SET ngayRa = ? WHERE id = ?')
        .run(ngayRa, roomAssignment.id);
      
      // Cập nhật trạng thái phòng
      db.prepare('UPDATE Room SET trangThai = ? WHERE id = ?').run('TRONG', roomAssignment.roomId);
    });
    
    tx();
    
    res.json({ 
      success: true, 
      message: 'Room returned successfully',
      roomId: roomAssignment.roomId,
      tenantId: tenantId
    });
  } catch (error) {
    console.error('Error returning room:', error);
    res.status(500).json({ error: 'Failed to return room' });
  }
});

module.exports = router;


