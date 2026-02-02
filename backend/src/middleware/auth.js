const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authenticate = async (req, res, next) => {
    try {
        let token;
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.query.token) {
            token = req.query.token;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token tidak ditemukan',
            });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                username: true,
                name: true,
                role: true,
                isActive: true,
            },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User tidak ditemukan',
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Akun tidak aktif',
            });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token tidak valid',
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token sudah expired',
            });
        }
        next(error);
    }
};

const authorizeOwner = (req, res, next) => {
    if (req.user.role !== 'OWNER') {
        return res.status(403).json({
            success: false,
            message: 'Akses ditolak. Hanya Owner yang dapat mengakses.',
        });
    }
    next();
};

const authorizeKasir = (req, res, next) => {
    if (req.user.role !== 'KASIR' && req.user.role !== 'OWNER') {
        return res.status(403).json({
            success: false,
            message: 'Akses ditolak',
        });
    }
    next();
};

module.exports = {
    authenticate,
    authorizeOwner,
    authorizeKasir,
};
