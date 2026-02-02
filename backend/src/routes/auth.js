const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Login
router.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username dan password harus diisi',
            });
        }

        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah',
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Akun tidak aktif. Hubungi administrator.',
            });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah',
            });
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        await logActivity(user.id, 'LOGIN', 'User', user.id);

        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    name: user.name,
                    role: user.role,
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
    res.json({
        success: true,
        data: req.user,
    });
});

// Logout (client-side token removal, but we log it)
router.post('/logout', authenticate, async (req, res, next) => {
    try {
        await logActivity(req.user.id, 'LOGOUT', 'User', req.user.id);
        res.json({
            success: true,
            message: 'Logout berhasil',
        });
    } catch (error) {
        next(error);
    }
});

// Change password
router.post('/change-password', authenticate, async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Password lama dan baru harus diisi',
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
        });

        const isValidPassword = await bcrypt.compare(currentPassword, user.password);

        if (!isValidPassword) {
            return res.status(400).json({
                success: false,
                message: 'Password lama tidak sesuai',
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: req.user.id },
            data: { password: hashedPassword },
        });

        await logActivity(req.user.id, 'CHANGE_PASSWORD', 'User', req.user.id);

        res.json({
            success: true,
            message: 'Password berhasil diubah',
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
