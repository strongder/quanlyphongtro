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

router.post('/:id/lock', (req, res) => {
  const r = db.prepare('SELECT * FROM MeterReading WHERE id = ?').get(req.params.id);
  if (!r) return res.status(404).json({ error: 'Not found' });
  db.prepare('UPDATE MeterReading SET locked = 1 WHERE id = ?').run(req.params.id);
  const updated = db.prepare('SELECT * FROM MeterReading WHERE id = ?').get(req.params.id);
  res.json(updated);
});

module.exports = router;


