import jwt from 'jsonwebtoken';

// Middleware to protect routes and verify JWT token
const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
            ...decoded,
            _id: decoded._id || decoded.id,
        };
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token, authorization denied' });
    }
};

export default authMiddleware;