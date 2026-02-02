const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorizeOwner } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Get all services
router.get('/', authenticate, async (req, res, next) => {
    try {
        const { includeInactive } = req.query;

        const where = {};
        if (includeInactive !== 'true') {
            where.isActive = true;
        }

        const services = await prisma.service.findMany({
            where,
            orderBy: [{ type: 'asc' }, { name: 'asc' }],
        });

        res.json({
            success: true,
            data: services,
        });
    } catch (error) {
        next(error);
    }
});

// Get single service
router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;

        const service = await prisma.service.findUnique({
            where: { id },
        });

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Layanan tidak ditemukan',
            });
        }

        res.json({
            success: true,
            data: service,
        });
    } catch (error) {
        next(error);
    }
});

// Create service (Owner only)
router.post('/', authenticate, authorizeOwner, async (req, res, next) => {
    try {
        const { name, type, price, estimatedTime } = req.body;

        if (!name || !type || !price) {
            return res.status(400).json({
                success: false,
                message: 'Nama, jenis, dan harga harus diisi',
            });
        }

        const service = await prisma.service.create({
            data: {
                name,
                type,
                price: parseFloat(price),
                estimatedTime: parseInt(estimatedTime) || 24,
            },
        });

        await logActivity(req.user.id, 'CREATE_SERVICE', 'Service', service.id, { name, type, price });

        res.status(201).json({
            success: true,
            data: service,
        });
    } catch (error) {
        next(error);
    }
});

// Update service (Owner only)
router.put('/:id', authenticate, authorizeOwner, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, type, price, estimatedTime, isActive } = req.body;

        const existingService = await prisma.service.findUnique({
            where: { id },
        });

        if (!existingService) {
            return res.status(404).json({
                success: false,
                message: 'Layanan tidak ditemukan',
            });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (type !== undefined) updateData.type = type;
        if (price !== undefined) updateData.price = parseFloat(price);
        if (estimatedTime !== undefined) updateData.estimatedTime = parseInt(estimatedTime);
        if (isActive !== undefined) updateData.isActive = isActive;

        const service = await prisma.service.update({
            where: { id },
            data: updateData,
        });

        await logActivity(req.user.id, 'UPDATE_SERVICE', 'Service', service.id, updateData);

        res.json({
            success: true,
            data: service,
        });
    } catch (error) {
        next(error);
    }
});

// Delete service (Owner only - soft delete)
router.delete('/:id', authenticate, authorizeOwner, async (req, res, next) => {
    try {
        const { id } = req.params;

        const existingService = await prisma.service.findUnique({
            where: { id },
        });

        if (!existingService) {
            return res.status(404).json({
                success: false,
                message: 'Layanan tidak ditemukan',
            });
        }

        await prisma.service.update({
            where: { id },
            data: { isActive: false },
        });

        await logActivity(req.user.id, 'DELETE_SERVICE', 'Service', id);

        res.json({
            success: true,
            message: 'Layanan berhasil dihapus',
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
