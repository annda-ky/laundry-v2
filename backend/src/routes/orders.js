const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');
const { generateOrderNumber } = require('../utils/helpers');

const router = express.Router();
const prisma = new PrismaClient();

// Get all orders
router.get('/', authenticate, async (req, res, next) => {
    try {
        const { status, paymentStatus, search, startDate, endDate, limit = 50 } = req.query;

        const where = {};

        if (status) where.status = status;
        if (paymentStatus) where.paymentStatus = paymentStatus;

        if (search) {
            where.OR = [
                { orderNumber: { contains: search, mode: 'insensitive' } },
                { customer: { name: { contains: search, mode: 'insensitive' } } },
                { customer: { phone: { contains: search } } },
            ];
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const orders = await prisma.order.findMany({
            where,
            include: {
                customer: true,
                user: {
                    select: { id: true, name: true, username: true },
                },
                items: {
                    include: { service: true },
                },
                payment: true,
            },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit),
        });

        res.json({
            success: true,
            data: orders,
        });
    } catch (error) {
        next(error);
    }
});

// Get single order
router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                customer: true,
                user: {
                    select: { id: true, name: true, username: true },
                },
                items: {
                    include: { service: true },
                },
                payment: true,
                statusHistory: {
                    orderBy: { changedAt: 'desc' },
                },
            },
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order tidak ditemukan',
            });
        }

        res.json({
            success: true,
            data: order,
        });
    } catch (error) {
        next(error);
    }
});

// Create order
router.post('/', authenticate, async (req, res, next) => {
    try {
        const { customerId, customerName, customerPhone, items, notes, paymentStatus, paymentMethod } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Minimal satu item layanan harus dipilih',
            });
        }

        // Create or get customer
        let customer;
        if (customerId) {
            customer = await prisma.customer.findUnique({ where: { id: customerId } });
            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: 'Pelanggan tidak ditemukan',
                });
            }
        } else if (customerName) {
            customer = await prisma.customer.create({
                data: {
                    name: customerName,
                    phone: customerPhone,
                },
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Data pelanggan harus diisi',
            });
        }

        // Calculate totals and prepare items
        let totalAmount = 0;
        const orderItems = [];

        for (const item of items) {
            const service = await prisma.service.findUnique({
                where: { id: item.serviceId },
            });

            if (!service) {
                return res.status(400).json({
                    success: false,
                    message: `Layanan tidak ditemukan`,
                });
            }

            const quantity = parseFloat(item.quantity);
            const price = parseFloat(service.price);
            const subtotal = quantity * price;

            orderItems.push({
                serviceId: item.serviceId,
                quantity,
                price,
                subtotal,
            });

            totalAmount += subtotal;
        }

        // Generate unique order number
        let orderNumber;
        let isUnique = false;
        while (!isUnique) {
            orderNumber = generateOrderNumber();
            const existing = await prisma.order.findUnique({ where: { orderNumber } });
            if (!existing) isUnique = true;
        }

        // Create order with items
        const order = await prisma.order.create({
            data: {
                orderNumber,
                customerId: customer.id,
                userId: req.user.id,
                totalAmount,
                notes,
                paymentStatus: paymentStatus || 'BELUM_BAYAR',
                items: {
                    create: orderItems,
                },
                statusHistory: {
                    create: {
                        status: 'DITERIMA',
                        changedBy: req.user.id,
                    },
                },
            },
            include: {
                customer: true,
                items: {
                    include: { service: true },
                },
            },
        });

        // Create payment if already paid
        if (paymentStatus === 'SUDAH_BAYAR') {
            await prisma.payment.create({
                data: {
                    orderId: order.id,
                    amount: totalAmount,
                    method: paymentMethod || 'TUNAI',
                },
            });
        }

        await logActivity(req.user.id, 'CREATE_ORDER', 'Order', order.id, { orderNumber, totalAmount });

        res.status(201).json({
            success: true,
            data: order,
        });
    } catch (error) {
        next(error);
    }
});

// Update order status
router.put('/:id/status', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['DITERIMA', 'DICUCI', 'DIKERINGKAN', 'DISETRIKA', 'SELESAI', 'DIAMBIL', 'DIBATALKAN'];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status tidak valid',
            });
        }

        const existingOrder = await prisma.order.findUnique({
            where: { id },
        });

        if (!existingOrder) {
            return res.status(404).json({
                success: false,
                message: 'Order tidak ditemukan',
            });
        }

        const order = await prisma.order.update({
            where: { id },
            data: {
                status,
                statusHistory: {
                    create: {
                        status,
                        changedBy: req.user.id,
                    },
                },
            },
            include: {
                customer: true,
                items: {
                    include: { service: true },
                },
                statusHistory: {
                    orderBy: { changedAt: 'desc' },
                },
            },
        });

        await logActivity(req.user.id, 'UPDATE_ORDER_STATUS', 'Order', order.id, { status });

        res.json({
            success: true,
            data: order,
        });
    } catch (error) {
        next(error);
    }
});

// Update payment status
router.put('/:id/payment', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { paymentStatus, paymentMethod } = req.body;

        const existingOrder = await prisma.order.findUnique({
            where: { id },
            include: { payment: true },
        });

        if (!existingOrder) {
            return res.status(404).json({
                success: false,
                message: 'Order tidak ditemukan',
            });
        }

        // Update order payment status
        const order = await prisma.order.update({
            where: { id },
            data: { paymentStatus },
        });

        // Create or update payment record
        if (paymentStatus === 'SUDAH_BAYAR' && !existingOrder.payment) {
            await prisma.payment.create({
                data: {
                    orderId: id,
                    amount: existingOrder.totalAmount,
                    method: paymentMethod || 'TUNAI',
                },
            });
        }

        await logActivity(req.user.id, 'UPDATE_PAYMENT', 'Order', order.id, { paymentStatus });

        res.json({
            success: true,
            data: order,
        });
    } catch (error) {
        next(error);
    }
});

// Get order receipt/nota
router.get('/:id/receipt', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                customer: true,
                user: {
                    select: { name: true },
                },
                items: {
                    include: { service: true },
                },
                payment: true,
            },
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order tidak ditemukan',
            });
        }

        const settings = await prisma.settings.findFirst();

        res.json({
            success: true,
            data: {
                order,
                settings,
            },
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
