import jwt from 'jsonwebtoken';

const isAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized - Token Required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.is_admin) {
            // User is authenticated but not authorized as admin
            return res.status(403).json({ message: 'Forbidden - Admin Access Required' });
        }

        req.user = decoded; // Attach decoded user info to request
        next();
    } catch (error) {
        console.error('Authorization error:', error);
        return res.status(403).json({ message: 'Invalid token', error });
    }
};

const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Get token from Authorization header

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized - Token Required' }); // Unauthorized
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token', error: err }); // Forbidden
        }
        req.user = user; // Attach user info to request
        next();
    });
};

export { isAdmin, authenticateToken };
