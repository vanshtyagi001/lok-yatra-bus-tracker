const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({ message: 'A token is required for authentication.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_default_secret');
        req.user = decoded;
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }

    return next();
}

module.exports = verifyToken;