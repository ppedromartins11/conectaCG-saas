"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.track = track;
exports.getSuperAdminStats = getSuperAdminStats;
const prisma_1 = require("../config/prisma");
const response_1 = require("../utils/response");
const ALLOWED_EVENTS = ['PAGE_VIEW', 'PLAN_VIEWED', 'COMPARISON_STARTED', 'CTA_LOGIN_SHOWN', 'HIRE_CLICKED', 'SIGNUP_STARTED'];
async function track(req, res, next) {
    try {
        const { type, payload, sessionId } = req.body;
        if (!ALLOWED_EVENTS.includes(type))
            return res.status(400).json({ success: false, error: 'Event type not allowed' });
        const ip = req.headers['x-forwarded-for']?.toString().split(',')[0] ?? req.ip;
        await prisma_1.prisma.event.create({
            data: { type, userId: req.user?.userId, sessionId, payload, ip, userAgent: req.headers['user-agent'] },
        }).catch(() => { });
        return (0, response_1.ok)(res, { success: true });
    }
    catch (err) {
        return next(err);
    }
}
async function getSuperAdminStats(req, res, next) {
    try {
        const monthAgo = new Date(Date.now() - 30 * 86400000);
        const [users, providers, plans, leads, events, topCities] = await Promise.all([
            prisma_1.prisma.user.count(),
            prisma_1.prisma.provider.count(),
            prisma_1.prisma.plan.count({ where: { isActive: true } }),
            prisma_1.prisma.lead.count({ where: { createdAt: { gte: monthAgo } } }),
            prisma_1.prisma.event.groupBy({ by: ['type'], _count: { type: true }, where: { createdAt: { gte: monthAgo } } }),
            prisma_1.prisma.city.findMany({ where: { isActive: true }, include: { _count: { select: { plans: true, searchHistory: true } } } }),
        ]);
        return (0, response_1.ok)(res, { users, providers, plans, leadsThisMonth: leads, eventBreakdown: events, topCities });
    }
    catch (err) {
        return next(err);
    }
}
//# sourceMappingURL=analytics.controller.js.map