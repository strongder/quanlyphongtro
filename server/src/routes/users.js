const express = require('express');
const { db } = require('../db');
const { authRequired } = require('../middlewares/auth');
const { encryptUser, decryptUser, decryptTenant } = require('../utils/encryption');
const router = express.Router();

router.get('/me', authRequired, (req, res) => {
  const user = db.prepare('SELECT id, role, username, name, phone, expoPushToken, createdAt FROM User WHERE id = ?').get(req.user.userId);
  
  // Giải mã thông tin user
  const decryptedUser = decryptUser(user);
  
  // Nếu là tenant, lấy thông tin tenant
  if (decryptedUser.role === 'TENANT') {
    const tenant = db.prepare('SELECT id, hoTen, soDienThoai, cccd FROM Tenant WHERE userId = ?').get(req.user.userId);
    if (tenant) {
      // Giải mã thông tin tenant
      decryptedUser.tenantInfo = decryptTenant(tenant);
    }
  }
  
  res.json(decryptedUser);
});

router.patch('/me', authRequired, (req, res) => {
  const { name, phone, expoPushToken } = req.body || {};
  
  // Mã hóa phone nếu có
  const encryptedData = encryptUser({ phone });
  
  db.prepare('UPDATE User SET name = COALESCE(?, name), phone = COALESCE(?, phone), expoPushToken = COALESCE(?, expoPushToken) WHERE id = ?')
    .run(name ?? null, encryptedData.phone ?? null, expoPushToken ?? null, req.user.userId);
  
  const user = db.prepare('SELECT id, role, name, phone, expoPushToken, createdAt FROM User WHERE id = ?').get(req.user.userId);
  const decryptedUser = decryptUser(user);
  res.json(decryptedUser);
});

module.exports = router;


