const jwt = require('jsonwebtoken');

function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ success: false, error: { message: 'Server configuration error' } });
    }

    const payload = jwt.verify(token, secret);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: { message: 'Invalid token' } });
  }
}

module.exports = { authenticateJWT };


