const express = require('express');
const { db } = require('../db');
const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM Setting').all();
  const obj = {};
  for (const r of rows) obj[r.key] = r.value;
  res.json(obj);
});

router.patch('/', (req, res) => {
  const entries = Object.entries(req.body || {});
  const tx = db.transaction(() => {
    for (const [key, value] of entries) {
      db.prepare('INSERT INTO Setting(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
        .run(key, String(value));
    }
  });
  try {
    tx();
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
  res.json({ ok: true });
});

module.exports = router;


