const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    // Get token from the Authorization header, which looks like "Bearer <token>"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({ message: 'A token is required for authentication.' });
    }

    try {
        // Verify the token using the secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_default_secret');
        // Attach the decoded user payload (e.g., user ID) to the request object
        req.user = decoded;
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }

    // Proceed to the next middleware or the actual route handler
    return next();
}

module.exports = verifyToken;