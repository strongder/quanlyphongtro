const express = require('express');
const { db } = require('../db');
const { authRequired } = require('../middlewares/auth');
const router = express.Router();

function getSetting(key, defaultValue) {
  const row = db.prepare('SELECT value FROM Setting WHERE key = ?').get(key);
  if (!row) return defaultValue;
  const v = parseFloat(row.value);
  return Number.isNaN(v) ? defaultValue : v;
}

// router.post('/generate', (req, res) => {
//   const { ky } = req.body;
//   if (!ky) return res.status(400).json({ error: 'ky required' });
//   const donGiaDien = getSetting('donGiaDien', 3500);
//   const donGiaNuoc = getSetting('donGiaNuoc', 15000);

//   const rooms = db.prepare('SELECT * FROM Room').all();
//   const created = [];
//   const skipped = [];
//   const tx = db.transaction(() => {
//     for (const room of rooms) {
//       const exist = db.prepare('SELECT 1 FROM Invoice WHERE roomId = ? AND ky = ?').get(room.id, ky);
//       if (exist) continue;
//       // Chỉ tạo hóa đơn nếu chỉ số đã được khóa
//       const reading = db.prepare('SELECT * FROM MeterReading WHERE roomId = ? AND ky = ?').get(room.id, ky);
//       if (!reading) {
//         skipped.push({ roomId: room.id, maPhong: room.maPhong, reason: 'NO_READING' });
//         continue;
//       }
//       if (!reading.locked) {
//         skipped.push({ roomId: room.id, maPhong: room.maPhong, reason: 'READING_NOT_LOCKED' });
//         continue;
//       }
//       const dienTieuThu = Math.max(0, (reading.dienSoMoi || 0) - (reading.dienSoCu || 0));
//       const nuocTieuThu = Math.max(0, (reading.nuocSoMoi || 0) - (reading.nuocSoCu || 0));
//       const tienPhong = room.giaThue;
//       const tongCong = tienPhong + dienTieuThu * donGiaDien + nuocTieuThu * donGiaNuoc;
//       const info = db
//         .prepare(
//           'INSERT INTO Invoice (roomId, ky, tienPhong, dienTieuThu, nuocTieuThu, donGiaDien, donGiaNuoc, tongCong) VALUES (?,?,?,?,?,?,?,?)'
//         )
//         .run(room.id, ky, tienPhong, dienTieuThu, nuocTieuThu, donGiaDien, donGiaNuoc, tongCong);
//       const invoice = db.prepare('SELECT * FROM Invoice WHERE id = ?').get(info.lastInsertRowid);
//       created.push(invoice);
//     }
//   });
//   try {
//     tx();
//   } catch (e) {
//     return res.status(400).json({ error: e.message });
//   }
//   res.json({ created, skipped });
// });
// danh sach hoa don, tenant chi xem dc hoa don phong minh

    // Nếu là khách thuê, chỉ trả về hóa đơn của phòng họ đang ở
// Lấy tất cả hóa đơn cho admin/manager
router.get('/', authRequired, (req, res) => {
  const { status, ky } = req.query;
  const userRole = req.user?.role;

  // Chỉ admin/manager mới được xem tất cả hóa đơn
  if (userRole !== 'MANAGER') {
    return res.status(403).json({ error: 'Access denied' });
  }

  let sql = 'SELECT * FROM Invoice WHERE 1=1';
  const params = [];
  
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
  res.json(rows);
});

// Lấy hóa đơn của user hiện tại (tenant)
router.get('/me', authRequired, (req, res) => {
  const { status, ky } = req.query;
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
    SELECT r.id FROM Room r
    JOIN RoomTenant rt ON r.id = rt.roomId
    WHERE rt.tenantId = ? AND rt.ngayRa IS NULL
  `).get(tenant.id);

  if (!room) {
    return res.json([]); // Chưa có phòng
  }

  // Build query
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
});


router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM Invoice WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// Tenant request payment confirmation -> set status PENDING
router.post('/:id/request-payment', (req, res) => {
  if (req.user?.role !== 'TENANT') {
    return res.status(403).json({ error: 'Access denied' });
  }
  const invoice = db.prepare('SELECT * FROM Invoice WHERE id = ?').get(req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Not found' });
  if (invoice.status === 'PAID') return res.status(400).json({ error: 'Invoice already paid' });
  db.prepare("UPDATE Invoice SET status = 'PENDING', requestedAt = datetime('now') WHERE id = ?").run(req.params.id);
  const updated = db.prepare('SELECT * FROM Invoice WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.patch('/:id/pay', (req, res) => {
  // Chỉ cho phép quản lý xác nhận thanh toán
  if (req.user?.role !== 'MANAGER') {
    return res.status(403).json({ error: 'Access denied' });
  }
  const existing = db.prepare('SELECT * FROM Invoice WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (existing.status === 'PAID') {
    return res.status(400).json({ error: 'Invoice already paid' });
  }
  db.prepare("UPDATE Invoice SET status = 'PAID', paidAt = datetime('now') WHERE id = ?").run(req.params.id);
  const invoice = db.prepare('SELECT * FROM Invoice WHERE id = ?').get(req.params.id);
  res.json(invoice);
});

module.exports = router;


