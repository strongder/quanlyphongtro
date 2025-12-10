const express = require('express');
const { db } = require('../db');
const router = express.Router();

router.get('/', (req, res) => {
  const { roomId, ky } = req.query;
  let rows = [];
  if (roomId && ky) {
    rows = db.prepare('SELECT * FROM MeterReading WHERE roomId = ? AND ky = ?').all(roomId, ky);
  } else if (roomId) {
    rows = db.prepare('SELECT * FROM MeterReading WHERE roomId = ? ORDER BY ky DESC').all(roomId);
  } else if (ky) {
    rows = db.prepare('SELECT * FROM MeterReading WHERE ky = ? ORDER BY roomId ASC').all(ky);
  } else {
    rows = db.prepare('SELECT * FROM MeterReading ORDER BY createdAt DESC').all();
  }
  res.json(rows);
});

router.post('/', (req, res) => {
  const { roomId, ky, dienSoMoi, nuocSoMoi } = req.body;
  if (!roomId || !ky) return res.status(400).json({ error: 'roomId, ky required' });
  // get last reading for room
  const prev = db.prepare('SELECT * FROM MeterReading WHERE roomId = ? ORDER BY ky DESC LIMIT 1').get(roomId);
  const dienSoCu = prev ? prev.dienSoMoi : 0;
  const nuocSoCu = prev ? prev.nuocSoMoi : 0;
  try {
    const info = db
      .prepare('INSERT INTO MeterReading (roomId, ky, dienSoCu, dienSoMoi, nuocSoCu, nuocSoMoi) VALUES (?,?,?,?,?,?)')
      .run(roomId, ky, dienSoCu, dienSoMoi, nuocSoCu, nuocSoMoi);
    const rec = db.prepare('SELECT * FROM MeterReading WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(rec);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.patch('/:id', (req, res) => {
  const { dienSoMoi, nuocSoMoi } = req.body;
  const r = db.prepare('SELECT * FROM MeterReading WHERE id = ?').get(req.params.id);
  if (!r) return res.status(404).json({ error: 'Not found' });
  if (r.locked) return res.status(400).json({ error: 'Locked' });
  db.prepare('UPDATE MeterReading SET dienSoMoi = COALESCE(?, dienSoMoi), nuocSoMoi = COALESCE(?, nuocSoMoi) WHERE id = ?')
    .run(dienSoMoi ?? null, nuocSoMoi ?? null, req.params.id);
  const updated = db.prepare('SELECT * FROM MeterReading WHERE id = ?').get(req.params.id);
  res.json(updated);
});
// sau khi khoa thi luu vao hoa don
router.post('/:id/lock', (req, res) => {
  const r = db.prepare('SELECT * FROM MeterReading WHERE id = ?').get(req.params.id);
  if (!r) return res.status(404).json({ error: 'Not found' });
  db.prepare('UPDATE MeterReading SET locked = 1 WHERE id = ?').run(req.params.id);
  const updated = db.prepare('SELECT * FROM MeterReading WHERE id = ?').get(req.params.id);
  res.json(updated);
  // sau khi khoa thi luu vao hoa don
  const room = db.prepare('SELECT * FROM Room WHERE id = ?').get(r.roomId);
  const roomTenant = db.prepare('SELECT tenantId FROM RoomTenant WHERE roomId = ? AND isPrimaryTenant = 1').get(r.roomId);
  if (!roomTenant) return; // Bỏ qua nếu phòng không có tenant chính
  
  const donGiaDien = db.prepare('SELECT value FROM Setting WHERE key = ?').get('donGiaDien').value;
  const donGiaNuoc = db.prepare('SELECT value FROM Setting WHERE key = ?').get('donGiaNuoc').value;
  const dienTieuThu = Math.max(0, (r.dienSoMoi || 0) - (r.dienSoCu || 0));
  const nuocTieuThu = Math.max(0, (r.nuocSoMoi || 0) - (r.nuocSoCu || 0));
  const tienPhong = room.giaThue;
  const tongCong = tienPhong + dienTieuThu * donGiaDien + nuocTieuThu * donGiaNuoc;
  db.prepare(
    'INSERT INTO Invoice (roomId, tenantId, ky, tienPhong, dienTieuThu, nuocTieuThu, donGiaDien, donGiaNuoc, tongCong) VALUES (?,?,?,?,?,?,?,?,?)'
  ).run(r.roomId, roomTenant.tenantId, r.ky, tienPhong, dienTieuThu, nuocTieuThu, donGiaDien, donGiaNuoc, tongCong);
});
// api lấy chi số theo phòng và kỳ gần nhất ( ví dụ : tháng 8: số điện:90, số nước:50; tháng 9 không sử dung thì tháng 10 vẫn lấy số tháng 8 để tính tiền)
router.get('/latest/:roomId', (req, res) => {
  const { roomId } = req.params;
  const reading = db.prepare('SELECT * FROM MeterReading WHERE roomId = ? ORDER BY ky DESC LIMIT 1').get(roomId);
  res.json(reading);
});
module.exports = router;


