const express = require('express');
const { db } = require('../db');
const router = express.Router();

router.post('/rooms/:roomId/assign-tenant', (req, res) => {
  const { roomId } = req.params;
  const { tenantId, ngayVao, isPrimaryTenant = 1 } = req.body;
  const room = db.prepare('SELECT * FROM Room WHERE id = ?').get(roomId);
  const tenant = db.prepare('SELECT * FROM Tenant WHERE id = ?').get(tenantId);
  if (!room || !tenant) return res.status(400).json({ error: 'room or tenant not found' });
  const info = db
    .prepare('INSERT INTO RoomTenant (roomId, tenantId, ngayVao, isPrimaryTenant) VALUES (?,?,?,?)')
    .run(roomId, tenantId, ngayVao || new Date().toISOString().slice(0, 10), isPrimaryTenant ? 1 : 0);
  // update room status
  db.prepare('UPDATE Room SET trangThai = ? WHERE id = ?').run('CO_KHACH', roomId);
  const record = db.prepare('SELECT * FROM RoomTenant WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(record);
});

router.post('/rooms/:roomId/release-tenant', (req, res) => {
  const { roomId } = req.params;
  const { tenantId, ngayRa } = req.body;
  const record = db.prepare('SELECT * FROM RoomTenant WHERE roomId = ? AND tenantId = ? AND ngayRa IS NULL').get(roomId, tenantId);
  if (!record) return res.status(404).json({ error: 'Active assignment not found' });
  db.prepare('UPDATE RoomTenant SET ngayRa = ? WHERE id = ?').run(ngayRa || new Date().toISOString().slice(0, 10), record.id);
  // if no active tenants left, mark room empty
  const remain = db.prepare('SELECT COUNT(*) as c FROM RoomTenant WHERE roomId = ? AND ngayRa IS NULL').get(roomId);
  if (remain.c === 0) db.prepare('UPDATE Room SET trangThai = ? WHERE id = ?').run('TRONG', roomId);
  const updated = db.prepare('SELECT * FROM RoomTenant WHERE id = ?').get(record.id);
  res.json(updated);
});

module.exports = router;


