const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Get all customers
router.get('/', authenticate, async (req, res, next) => {
    try {
        const { search } = req.query;

        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
            ];
        }

        const customers = await prisma.customer.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { orders: true },
                },
            },
        });

        res.json({
            success: true,
            data: customers,
        });
    } catch (error) {
        next(error);
    }
});

// Get single customer with orders
router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;

        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                orders: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    include: {
                        items: {
                            include: { service: true },
                        },
                    },
                },
            },
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Pelanggan tidak ditemukan',
            });
        }

        res.json({
            success: true,
            data: customer,
        });
    } catch (error) {
        next(error);
    }
});

// Create customer
router.post('/', authenticate, async (req, res, next) => {
    try {
        const { name, phone, address } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Nama pelanggan harus diisi',
            });
        }

        const customer = await prisma.customer.create({
            data: {
                name,
                phone,
                address,
            },
        });

        await logActivity(req.user.id, 'CREATE_CUSTOMER', 'Customer', customer.id, { name });

        res.status(201).json({
            success: true,
            data: customer,
        });
    } catch (error) {
        next(error);
    }
});

// Update customer
router.put('/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, phone, address } = req.body;

        const existingCustomer = await prisma.customer.findUnique({
            where: { id },
        });

        if (!existingCustomer) {
            return res.status(404).json({
                success: false,
                message: 'Pelanggan tidak ditemukan',
            });
        }

        const customer = await prisma.customer.update({
            where: { id },
            data: {
                name: name || existingCustomer.name,
                phone,
                address,
            },
        });

        await logActivity(req.user.id, 'UPDATE_CUSTOMER', 'Customer', customer.id);

        res.json({
            success: true,
            data: customer,
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
