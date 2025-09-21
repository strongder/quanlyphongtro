const express = require('express');
const { db } = require('../db');
const { authRequired } = require('../middlewares/auth');
const router = express.Router();

router.get('/me', authRequired, (req, res) => {
  const user = db.prepare('SELECT id, role, username, name, phone, expoPushToken, createdAt FROM User WHERE id = ?').get(req.user.userId);
  
  // Nếu là tenant, lấy thông tin tenant
  if (user.role === 'TENANT') {
    const tenant = db.prepare('SELECT id, hoTen, soDienThoai, cccd FROM Tenant WHERE userId = ?').get(req.user.userId);
    if (tenant) {
      user.tenantInfo = tenant;
    }
  }
  
  res.json(user);
});

router.patch('/me', authRequired, (req, res) => {
  const { name, phone, expoPushToken } = req.body || {};
  db.prepare('UPDATE User SET name = COALESCE(?, name), phone = COALESCE(?, phone), expoPushToken = COALESCE(?, expoPushToken) WHERE id = ?')
    .run(name ?? null, phone ?? null, expoPushToken ?? null, req.user.userId);
  const user = db.prepare('SELECT id, role, name, phone, expoPushToken, createdAt FROM User WHERE id = ?').get(req.user.userId);
  res.json(user);
});

module.exports = router;


