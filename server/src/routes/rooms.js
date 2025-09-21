const express = require('express');
const { db } = require('../db');
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
  res.json(rows);
});

router.post('/', (req, res) => {
  const { maPhong, giaThue, trangThai = 'TRONG', note } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO Room (maPhong, giaThue, trangThai, note) VALUES (?,?,?,?)');
    const info = stmt.run(maPhong, giaThue, trangThai, note || null);
    const room = db.prepare('SELECT * FROM Room WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(room);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM Room WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

router.patch('/:id', (req, res) => {
  const { maPhong, giaThue, trangThai, note } = req.body;
  const existing = db.prepare('SELECT * FROM Room WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  try {
    db.prepare('UPDATE Room SET maPhong = COALESCE(?, maPhong), giaThue = COALESCE(?, giaThue), trangThai = COALESCE(?, trangThai), note = COALESCE(?, note) WHERE id = ?')
      .run(maPhong ?? null, giaThue ?? null, trangThai ?? null, note ?? null, req.params.id);
    const room = db.prepare('SELECT * FROM Room WHERE id = ?').get(req.params.id);
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


