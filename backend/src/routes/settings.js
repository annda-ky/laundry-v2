const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorizeOwner } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Get settings
router.get('/', authenticate, async (req, res, next) => {
    try {
        let settings = await prisma.settings.findFirst();

        if (!settings) {
            settings = await prisma.settings.create({
                data: {
                    id: 'default-settings',
                    businessName: 'LaundryKu',
                    address: '',
                    phone: '',
                    footer: 'Terima kasih telah menggunakan jasa kami!',
                    template: 'simple',
                },
            });
        }

        res.json({
            success: true,
            data: settings,
        });
    } catch (error) {
        next(error);
    }
});

// Update settings (Owner only)
router.put('/', authenticate, authorizeOwner, async (req, res, next) => {
    try {
        const { businessName, address, phone, footer, template, logoUrl } = req.body;

        let settings = await prisma.settings.findFirst();

        if (!settings) {
            settings = await prisma.settings.create({
                data: {
                    id: 'default-settings',
                    businessName: businessName || 'LaundryKu',
                    address,
                    phone,
                    footer,
                    template: template || 'simple',
                    logoUrl,
                },
            });
        } else {
            settings = await prisma.settings.update({
                where: { id: settings.id },
                data: {
                    businessName,
                    address,
                    phone,
                    footer,
                    template,
                    logoUrl,
                },
            });
        }

        await logActivity(req.user.id, 'UPDATE_SETTINGS', 'Settings', settings.id);

        res.json({
            success: true,
            data: settings,
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
