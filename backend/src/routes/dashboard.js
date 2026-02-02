const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorizeOwner } = require('../middleware/auth');
const { getStartOfDay, getEndOfDay, getStartOfMonth, getEndOfMonth, getStartOfYear, getEndOfYear } = require('../utils/helpers');

const router = express.Router();
const prisma = new PrismaClient();

// Owner Dashboard
router.get('/owner', authenticate, authorizeOwner, async (req, res, next) => {
    try {
        const now = new Date();

        // Today's stats
        const todayStart = getStartOfDay(now);
        const todayEnd = getEndOfDay(now);

        const todayOrders = await prisma.order.findMany({
            where: {
                createdAt: { gte: todayStart, lte: todayEnd },
                status: { not: 'DIBATALKAN' },
            },
        });

        const todayRevenue = todayOrders
            .filter(o => o.paymentStatus === 'SUDAH_BAYAR')
            .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);

        // Monthly stats
        const monthStart = getStartOfMonth(now);
        const monthEnd = getEndOfMonth(now);

        const monthlyOrders = await prisma.order.findMany({
            where: {
                createdAt: { gte: monthStart, lte: monthEnd },
                status: { not: 'DIBATALKAN' },
            },
        });

        const monthlyRevenue = monthlyOrders
            .filter(o => o.paymentStatus === 'SUDAH_BAYAR')
            .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);

        // Yearly stats
        const yearStart = getStartOfYear(now);
        const yearEnd = getEndOfYear(now);

        const yearlyOrders = await prisma.order.findMany({
            where: {
                createdAt: { gte: yearStart, lte: yearEnd },
                status: { not: 'DIBATALKAN' },
            },
        });

        const yearlyRevenue = yearlyOrders
            .filter(o => o.paymentStatus === 'SUDAH_BAYAR')
            .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);

        // Daily revenue for chart (last 7 days)
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dayStart = getStartOfDay(date);
            const dayEnd = getEndOfDay(date);

            const dayOrders = await prisma.order.findMany({
                where: {
                    createdAt: { gte: dayStart, lte: dayEnd },
                    status: { not: 'DIBATALKAN' },
                    paymentStatus: 'SUDAH_BAYAR',
                },
            });

            last7Days.push({
                date: date.toISOString().split('T')[0],
                day: date.toLocaleDateString('id-ID', { weekday: 'short' }),
                revenue: dayOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0),
                orders: dayOrders.length,
            });
        }

        // Monthly revenue for chart (last 6 months)
        const last6Months = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now);
            date.setMonth(date.getMonth() - i);
            const mStart = getStartOfMonth(date);
            const mEnd = getEndOfMonth(date);

            const mOrders = await prisma.order.findMany({
                where: {
                    createdAt: { gte: mStart, lte: mEnd },
                    status: { not: 'DIBATALKAN' },
                    paymentStatus: 'SUDAH_BAYAR',
                },
            });

            last6Months.push({
                month: date.toLocaleDateString('id-ID', { month: 'short' }),
                revenue: mOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0),
                orders: mOrders.length,
            });
        }

        // Top services
        const allOrderItems = await prisma.orderItem.findMany({
            where: {
                order: {
                    createdAt: { gte: monthStart, lte: monthEnd },
                    status: { not: 'DIBATALKAN' },
                },
            },
            include: { service: true },
        });

        const serviceStats = {};
        allOrderItems.forEach(item => {
            const name = item.service.name;
            if (!serviceStats[name]) {
                serviceStats[name] = { count: 0, revenue: 0 };
            }
            serviceStats[name].count += parseFloat(item.quantity);
            serviceStats[name].revenue += parseFloat(item.subtotal);
        });

        const topServices = Object.entries(serviceStats)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Top customers
        const customerStats = {};
        monthlyOrders.forEach(order => {
            const customerId = order.customerId;
            if (!customerStats[customerId]) {
                customerStats[customerId] = { count: 0, revenue: 0 };
            }
            customerStats[customerId].count++;
            customerStats[customerId].revenue += parseFloat(order.totalAmount);
        });

        const customerIds = Object.keys(customerStats);
        const customers = await prisma.customer.findMany({
            where: { id: { in: customerIds } },
        });

        const topCustomers = customers
            .map(c => ({
                name: c.name,
                ...customerStats[c.id],
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        res.json({
            success: true,
            data: {
                today: {
                    revenue: todayRevenue,
                    orders: todayOrders.length,
                },
                monthly: {
                    revenue: monthlyRevenue,
                    orders: monthlyOrders.length,
                },
                yearly: {
                    revenue: yearlyRevenue,
                    orders: yearlyOrders.length,
                },
                charts: {
                    daily: last7Days,
                    monthly: last6Months,
                },
                topServices,
                topCustomers,
            },
        });
    } catch (error) {
        next(error);
    }
});

// Kasir Dashboard
router.get('/kasir', authenticate, async (req, res, next) => {
    try {
        const now = new Date();
        const todayStart = getStartOfDay(now);
        const todayEnd = getEndOfDay(now);

        // Today's orders
        const todayOrders = await prisma.order.findMany({
            where: {
                createdAt: { gte: todayStart, lte: todayEnd },
            },
            include: {
                customer: true,
                items: {
                    include: { service: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const todayRevenue = todayOrders
            .filter(o => o.paymentStatus === 'SUDAH_BAYAR' && o.status !== 'DIBATALKAN')
            .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);

        // Unpaid orders
        const unpaidOrders = await prisma.order.count({
            where: {
                paymentStatus: 'BELUM_BAYAR',
                status: { not: 'DIBATALKAN' },
            },
        });

        // Orders not picked up
        const notPickedUp = await prisma.order.count({
            where: {
                status: 'SELESAI',
            },
        });

        // Orders by status
        const pendingOrders = await prisma.order.findMany({
            where: {
                status: { notIn: ['DIAMBIL', 'DIBATALKAN'] },
            },
            include: {
                customer: true,
                items: {
                    include: { service: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });

        res.json({
            success: true,
            data: {
                today: {
                    revenue: todayRevenue,
                    orders: todayOrders.length,
                },
                unpaidOrders,
                notPickedUp,
                recentOrders: todayOrders.slice(0, 10),
                pendingOrders,
            },
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
