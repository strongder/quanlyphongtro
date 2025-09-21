const express = require('express');
const { db } = require('../db');
const router = express.Router();

function getSetting(key, defaultValue) {
  const row = db.prepare('SELECT value FROM Setting WHERE key = ?').get(key);
  if (!row) return defaultValue;
  const v = parseFloat(row.value);
  return Number.isNaN(v) ? defaultValue : v;
}

router.post('/generate', (req, res) => {
  const { ky } = req.body;
  if (!ky) return res.status(400).json({ error: 'ky required' });
  const donGiaDien = getSetting('donGiaDien', 3500);
  const donGiaNuoc = getSetting('donGiaNuoc', 15000);

  const rooms = db.prepare('SELECT * FROM Room').all();
  const created = [];
  const tx = db.transaction(() => {
    for (const room of rooms) {
      const exist = db.prepare('SELECT 1 FROM Invoice WHERE roomId = ? AND ky = ?').get(room.id, ky);
      if (exist) continue;
      const reading = db.prepare('SELECT * FROM MeterReading WHERE roomId = ? AND ky = ?').get(room.id, ky);
      if (!reading) continue;
      const dienTieuThu = Math.max(0, (reading.dienSoMoi || 0) - (reading.dienSoCu || 0));
      const nuocTieuThu = Math.max(0, (reading.nuocSoMoi || 0) - (reading.nuocSoCu || 0));
      const tienPhong = room.giaThue;
      const tongCong = tienPhong + dienTieuThu * donGiaDien + nuocTieuThu * donGiaNuoc;
      const info = db
        .prepare(
          'INSERT INTO Invoice (roomId, ky, tienPhong, dienTieuThu, nuocTieuThu, donGiaDien, donGiaNuoc, tongCong) VALUES (?,?,?,?,?,?,?,?)'
        )
        .run(room.id, ky, tienPhong, dienTieuThu, nuocTieuThu, donGiaDien, donGiaNuoc, tongCong);
      const invoice = db.prepare('SELECT * FROM Invoice WHERE id = ?').get(info.lastInsertRowid);
      created.push(invoice);
    }
  });
  try {
    tx();
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
  res.json({ created });
});

router.get('/', (req, res) => {
  const { status, roomId, ky } = req.query;
  const userRole = req.user?.role;
  
  // Nếu là khách thuê, chỉ trả về hóa đơn của phòng họ đang ở
  if (userRole === 'TENANT') {
    const userId = req.user.userId;
    // Tìm tenant record của user này
    const tenant = db.prepare('SELECT id FROM Tenant WHERE userId = ?').get(userId);
    if (!tenant) {
      return res.json([]); // User chưa có tenant record
    }
    
    // Tìm phòng mà khách thuê đang ở
    const room = db.prepare(`
      SELECT r.id FROM Room r
      JOIN RoomTenant rt ON r.id = rt.roomId
      WHERE rt.tenantId = ? AND rt.ngayRa IS NULL
    `).get(tenant.id);
    
    if (!room) {
      return res.json([]); // Khách thuê chưa có phòng
    }
    
    let sql = 'SELECT * FROM Invoice WHERE roomId = ?';
    const params = [room.id];
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (ky) {
      sql += ' AND ky = ?';
      params.push(ky);
    }
    sql += ' ORDER BY createdAt DESC';
    const rows = db.prepare(sql).all(...params);
    return res.json(rows);
  }
  
  // Nếu là quản lý, trả về tất cả hóa đơn
  let sql = 'SELECT * FROM Invoice WHERE 1=1';
  const params = [];
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (roomId) {
    sql += ' AND roomId = ?';
    params.push(roomId);
  }
  if (ky) {
    sql += ' AND ky = ?';
    params.push(ky);
  }
  sql += ' ORDER BY createdAt DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM Invoice WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

router.patch('/:id/pay', (req, res) => {
  const existing = db.prepare('SELECT * FROM Invoice WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare("UPDATE Invoice SET status = 'PAID', paidAt = datetime('now') WHERE id = ?").run(req.params.id);
  const invoice = db.prepare('SELECT * FROM Invoice WHERE id = ?').get(req.params.id);
  res.json(invoice);
});

module.exports = router;


