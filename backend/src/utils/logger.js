const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const logActivity = async (userId, action, entity, entityId = null, details = null) => {
    try {
        await prisma.activityLog.create({
            data: {
                userId,
                action,
                entity,
                entityId,
                details,
            },
        });
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
};

module.exports = { logActivity };
