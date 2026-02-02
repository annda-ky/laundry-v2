const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorizeOwner } = require('../middleware/auth');
const { getStartOfDay, getEndOfDay, getStartOfMonth, getEndOfMonth, getStartOfYear, getEndOfYear } = require('../utils/helpers');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');

const router = express.Router();
const prisma = new PrismaClient();

// Helper to get orders with date range
const getOrdersInRange = async (startDate, endDate) => {
    return prisma.order.findMany({
        where: {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
            status: { not: 'DIBATALKAN' },
        },
        include: {
            customer: true,
            items: {
                include: { service: true },
            },
            payment: true,
        },
        orderBy: { createdAt: 'desc' },
    });
};

// Calculate stats from orders
const calculateStats = (orders) => {
    const totalOrders = orders.length;
    const totalRevenue = orders
        .filter(o => o.paymentStatus === 'SUDAH_BAYAR')
        .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);
    const paidOrders = orders.filter(o => o.paymentStatus === 'SUDAH_BAYAR').length;
    const unpaidOrders = orders.filter(o => o.paymentStatus === 'BELUM_BAYAR').length;

    // Service popularity
    const serviceCount = {};
    orders.forEach(order => {
        order.items.forEach(item => {
            const serviceName = item.service.name;
            if (!serviceCount[serviceName]) {
                serviceCount[serviceName] = { count: 0, revenue: 0 };
            }
            serviceCount[serviceName].count += parseFloat(item.quantity);
            serviceCount[serviceName].revenue += parseFloat(item.subtotal);
        });
    });

    const topServices = Object.entries(serviceCount)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // Customer frequency
    const customerCount = {};
    orders.forEach(order => {
        const customerName = order.customer.name;
        if (!customerCount[customerName]) {
            customerCount[customerName] = { count: 0, revenue: 0 };
        }
        customerCount[customerName].count++;
        customerCount[customerName].revenue += parseFloat(order.totalAmount);
    });

    const topCustomers = Object.entries(customerCount)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    return {
        totalOrders,
        totalRevenue,
        paidOrders,
        unpaidOrders,
        topServices,
        topCustomers,
    };
};

// Daily report
router.get('/daily', authenticate, authorizeOwner, async (req, res, next) => {
    try {
        const { date } = req.query;
        const targetDate = date ? new Date(date) : new Date();

        const startDate = getStartOfDay(targetDate);
        const endDate = getEndOfDay(targetDate);

        const orders = await getOrdersInRange(startDate, endDate);
        const stats = calculateStats(orders);

        res.json({
            success: true,
            data: {
                period: 'daily',
                date: targetDate.toISOString().split('T')[0],
                ...stats,
                orders,
            },
        });
    } catch (error) {
        next(error);
    }
});

// Monthly report
router.get('/monthly', authenticate, authorizeOwner, async (req, res, next) => {
    try {
        const { month, year } = req.query;
        const targetDate = new Date(
            parseInt(year) || new Date().getFullYear(),
            parseInt(month) - 1 || new Date().getMonth(),
            1
        );

        const startDate = getStartOfMonth(targetDate);
        const endDate = getEndOfMonth(targetDate);

        const orders = await getOrdersInRange(startDate, endDate);
        const stats = calculateStats(orders);

        // Daily breakdown
        const dailyStats = {};
        orders.forEach(order => {
            const day = order.createdAt.toISOString().split('T')[0];
            if (!dailyStats[day]) {
                dailyStats[day] = { orders: 0, revenue: 0 };
            }
            dailyStats[day].orders++;
            if (order.paymentStatus === 'SUDAH_BAYAR') {
                dailyStats[day].revenue += parseFloat(order.totalAmount);
            }
        });

        const dailyBreakdown = Object.entries(dailyStats)
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        res.json({
            success: true,
            data: {
                period: 'monthly',
                month: targetDate.getMonth() + 1,
                year: targetDate.getFullYear(),
                ...stats,
                dailyBreakdown,
                orders,
            },
        });
    } catch (error) {
        next(error);
    }
});

// Yearly report
router.get('/yearly', authenticate, authorizeOwner, async (req, res, next) => {
    try {
        const { year } = req.query;
        const targetYear = parseInt(year) || new Date().getFullYear();
        const targetDate = new Date(targetYear, 0, 1);

        const startDate = getStartOfYear(targetDate);
        const endDate = getEndOfYear(targetDate);

        const orders = await getOrdersInRange(startDate, endDate);
        const stats = calculateStats(orders);

        // Monthly breakdown
        const monthlyStats = {};
        orders.forEach(order => {
            const month = order.createdAt.getMonth() + 1;
            if (!monthlyStats[month]) {
                monthlyStats[month] = { orders: 0, revenue: 0 };
            }
            monthlyStats[month].orders++;
            if (order.paymentStatus === 'SUDAH_BAYAR') {
                monthlyStats[month].revenue += parseFloat(order.totalAmount);
            }
        });

        const monthlyBreakdown = Object.entries(monthlyStats)
            .map(([month, data]) => ({ month: parseInt(month), ...data }))
            .sort((a, b) => a.month - b.month);

        res.json({
            success: true,
            data: {
                period: 'yearly',
                year: targetYear,
                ...stats,
                monthlyBreakdown,
            },
        });
    } catch (error) {
        next(error);
    }
});

// Custom period report
router.get('/custom', authenticate, authorizeOwner, async (req, res, next) => {
    try {
        const { startDate: start, endDate: end } = req.query;

        if (!start || !end) {
            return res.status(400).json({
                success: false,
                message: 'Tanggal mulai dan akhir harus diisi',
            });
        }

        const startDate = getStartOfDay(new Date(start));
        const endDate = getEndOfDay(new Date(end));

        const orders = await getOrdersInRange(startDate, endDate);
        const stats = calculateStats(orders);

        res.json({
            success: true,
            data: {
                period: 'custom',
                startDate: start,
                endDate: end,
                ...stats,
                orders,
            },
        });
    } catch (error) {
        next(error);
    }
});

// Export to Excel
router.get('/export/excel', authenticate, authorizeOwner, async (req, res, next) => {
    try {
        const { startDate: start, endDate: end, type = 'daily' } = req.query;

        let startDate, endDate;
        const now = new Date();

        switch (type) {
            case 'daily':
                startDate = getStartOfDay(start ? new Date(start) : now);
                endDate = getEndOfDay(end ? new Date(end) : now);
                break;
            case 'monthly':
                startDate = getStartOfMonth(now);
                endDate = getEndOfMonth(now);
                break;
            case 'yearly':
                startDate = getStartOfYear(now);
                endDate = getEndOfYear(now);
                break;
            default:
                startDate = getStartOfDay(new Date(start));
                endDate = getEndOfDay(new Date(end));
        }

        const orders = await getOrdersInRange(startDate, endDate);

        // Prepare data for Excel
        const excelData = orders.map(order => ({
            'No. Nota': order.orderNumber,
            'Tanggal': new Date(order.createdAt).toLocaleDateString('id-ID'),
            'Pelanggan': order.customer.name,
            'No. HP': order.customer.phone || '-',
            'Status': order.status,
            'Status Bayar': order.paymentStatus === 'SUDAH_BAYAR' ? 'Lunas' : 'Belum Bayar',
            'Total': parseFloat(order.totalAmount),
        }));

        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Laporan');

        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=laporan-${type}-${Date.now()}.xlsx`);
        res.send(buffer);
    } catch (error) {
        next(error);
    }
});

// Export to PDF
router.get('/export/pdf', authenticate, authorizeOwner, async (req, res, next) => {
    try {
        const { startDate: start, endDate: end, type = 'daily' } = req.query;

        let startDate, endDate;
        const now = new Date();

        switch (type) {
            case 'daily':
                startDate = getStartOfDay(start ? new Date(start) : now);
                endDate = getEndOfDay(end ? new Date(end) : now);
                break;
            case 'monthly':
                startDate = getStartOfMonth(now);
                endDate = getEndOfMonth(now);
                break;
            case 'yearly':
                startDate = getStartOfYear(now);
                endDate = getEndOfYear(now);
                break;
            default:
                startDate = getStartOfDay(new Date(start));
                endDate = getEndOfDay(new Date(end));
        }

        const orders = await getOrdersInRange(startDate, endDate);
        const stats = calculateStats(orders);
        const settings = await prisma.settings.findFirst();

        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=laporan-${type}-${Date.now()}.pdf`);

        doc.pipe(res);

        // Header
        doc.fontSize(20).text(settings?.businessName || 'Laundry', { align: 'center' });
        doc.fontSize(12).text(settings?.address || '', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text('Laporan Transaksi', { align: 'center' });
        doc.fontSize(10).text(`Periode: ${startDate.toLocaleDateString('id-ID')} - ${endDate.toLocaleDateString('id-ID')}`, { align: 'center' });
        doc.moveDown(2);

        // Summary
        doc.fontSize(12).text('Ringkasan:', { underline: true });
        doc.fontSize(10);
        doc.text(`Total Transaksi: ${stats.totalOrders}`);
        doc.text(`Total Pendapatan: Rp ${stats.totalRevenue.toLocaleString('id-ID')}`);
        doc.text(`Transaksi Lunas: ${stats.paidOrders}`);
        doc.text(`Transaksi Belum Bayar: ${stats.unpaidOrders}`);
        doc.moveDown(2);

        // Transaction list
        doc.fontSize(12).text('Daftar Transaksi:', { underline: true });
        doc.fontSize(9);
        doc.moveDown();

        orders.slice(0, 50).forEach((order, i) => {
            doc.text(`${i + 1}. ${order.orderNumber} | ${order.customer.name} | Rp ${parseFloat(order.totalAmount).toLocaleString('id-ID')} | ${order.status}`);
        });

        if (orders.length > 50) {
            doc.moveDown();
            doc.text(`... dan ${orders.length - 50} transaksi lainnya`);
        }

        doc.end();
    } catch (error) {
        next(error);
    }
});

module.exports = router;
