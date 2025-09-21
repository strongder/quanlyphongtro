const express = require('express');
const router = express.Router();

// Chỉ test: giả lập gửi thông báo, trả JSON.
router.post('/test', (req, res) => {
  const { to, title, body } = req.body || {};
  res.json({ sent: true, to: to || 'demo-token', title: title || 'Test', body: body || 'Hello' });
});

module.exports = router;


