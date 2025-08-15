const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET || 'yoursecretkey';

function verifyToken(req, res, next) {
  const token = req.cookies?.token; // safely access cookie

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, jwtSecret); // use variable here
    req.user = decoded;
  } catch (err) {
    req.user = null;
  }

  next();
}

module.exports = verifyToken;
