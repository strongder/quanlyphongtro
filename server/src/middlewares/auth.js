const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'dev-secret';

function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '30d' });
}

function authRequired(req, res, next) {
  const header = req.headers['authorization'] || '';
  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(parts[1], SECRET);
    req.user = decoded;
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = { signToken, authRequired };


