const express = require('express');
const { db } = require('../db');
const router = express.Router();

router.get('/revenue', (req, res) => {
  const { from, to } = req.query;
  let sql = "SELECT SUM(tongCong) as total FROM Invoice WHERE status = 'PAID'";
  const params = [];
  if (from) {
    sql += ' AND createdAt >= ?';
    params.push(from);
  }
  if (to) {
    sql += ' AND createdAt <= ?';
    params.push(to);
  }
  const row = db.prepare(sql).get(...params) || { total: 0 };
  res.json({ total: row.total || 0 });
});

router.get('/rooms/summary', (req, res) => {
  const empty = db.prepare("SELECT COUNT(*) as c FROM Room WHERE trangThai = 'TRONG'").get().c;
  const occupied = db.prepare("SELECT COUNT(*) as c FROM Room WHERE trangThai = 'CO_KHACH'").get().c;
  res.json({ empty, occupied });
});

module.exports = router;


