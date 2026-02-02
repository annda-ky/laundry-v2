const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorizeOwner } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Get all users (Owner only)
router.get('/', authenticate, authorizeOwner, async (req, res, next) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            success: true,
            data: users,
        });
    } catch (error) {
        next(error);
    }
});

// Create user (Owner only)
router.post('/', authenticate, authorizeOwner, async (req, res, next) => {
    try {
        const { username, password, name, email, role } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username dan password harus diisi',
            });
        }

        const existingUser = await prisma.user.findUnique({
            where: { username },
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username sudah digunakan',
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                name,
                email,
                role: role || 'KASIR',
            },
            select: {
                id: true,
                username: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
        });

        await logActivity(req.user.id, 'CREATE_USER', 'User', user.id, { username, role: user.role });

        res.status(201).json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
});

// Update user (Owner only)
router.put('/:id', authenticate, authorizeOwner, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, role, isActive, password } = req.body;

        const existingUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan',
            });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (role !== undefined) updateData.role = role;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (password) updateData.password = await bcrypt.hash(password, 10);

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                username: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
        });

        await logActivity(req.user.id, 'UPDATE_USER', 'User', user.id, updateData);

        res.json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
});

// Toggle user active status (Owner only)
router.patch('/:id/toggle-active', authenticate, authorizeOwner, async (req, res, next) => {
    try {
        const { id } = req.params;

        const existingUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan',
            });
        }

        // Prevent deactivating yourself
        if (id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Tidak dapat menonaktifkan akun sendiri',
            });
        }

        const user = await prisma.user.update({
            where: { id },
            data: { isActive: !existingUser.isActive },
            select: {
                id: true,
                username: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
        });

        await logActivity(req.user.id, user.isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER', 'User', user.id);

        res.json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
});

// Delete user (soft delete - just deactivate)
router.delete('/:id', authenticate, authorizeOwner, async (req, res, next) => {
    try {
        const { id } = req.params;

        if (id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Tidak dapat menghapus akun sendiri',
            });
        }

        await prisma.user.update({
            where: { id },
            data: { isActive: false },
        });

        await logActivity(req.user.id, 'DELETE_USER', 'User', id);

        res.json({
            success: true,
            message: 'User berhasil dinonaktifkan',
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
