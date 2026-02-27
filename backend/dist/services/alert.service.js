"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAlert = createAlert;
exports.getUserAlerts = getUserAlerts;
exports.deleteAlert = deleteAlert;
exports.processAlerts = processAlerts;
const prisma_1 = require("../config/prisma");
const errors_1 = require("../utils/errors");
const email_service_1 = require("./email.service");
const logger_1 = require("../config/logger");
async function createAlert(userId, data) {
    const count = await prisma_1.prisma.priceAlert.count({ where: { userId, isActive: true } });
    if (count >= 5)
        throw new errors_1.AppError('Limite de 5 alertas ativos atingido', 400);
    const alert = await prisma_1.prisma.priceAlert.create({
        data: {
            userId,
            cep: data.cep.replace(/\D/g, '').slice(0, 5),
            maxPrice: data.maxPrice,
            minSpeed: data.minSpeed,
            planId: data.planId,
        },
    });
    await prisma_1.prisma.event.create({ data: { type: 'ALERT_CREATED', userId, payload: { cep: data.cep } } }).catch(() => { });
    return alert;
}
async function getUserAlerts(userId) {
    return prisma_1.prisma.priceAlert.findMany({
        where: { userId },
        include: { plan: { select: { name: true, price: true } } },
        orderBy: { createdAt: 'desc' },
    });
}
async function deleteAlert(alertId, userId) {
    const alert = await prisma_1.prisma.priceAlert.findUnique({ where: { id: alertId } });
    if (!alert)
        throw new errors_1.AppError('Alerta não encontrado', 404);
    if (alert.userId !== userId)
        throw new errors_1.AppError('Sem permissão', 403);
    await prisma_1.prisma.priceAlert.delete({ where: { id: alertId } });
}
async function processAlerts() {
    logger_1.logger.info('[Alerts] Processing price alerts...');
    const alerts = await prisma_1.prisma.priceAlert.findMany({
        where: { isActive: true },
        include: { user: { select: { email: true } } },
    });
    let triggered = 0;
    for (const alert of alerts) {
        const matchingPlans = await prisma_1.prisma.plan.findMany({
            where: {
                isActive: true,
                cepsAtendidos: { has: alert.cep },
                price: { lte: alert.maxPrice },
                ...(alert.minSpeed && { downloadSpeed: { gte: alert.minSpeed } }),
            },
            include: { provider: { select: { name: true } } },
        });
        if (matchingPlans.length > 0) {
            await (0, email_service_1.sendPriceAlert)(alert.user.email, matchingPlans, alert).catch(() => { });
            await prisma_1.prisma.priceAlert.update({
                where: { id: alert.id },
                data: { lastTriggeredAt: new Date() },
            });
            triggered++;
        }
    }
    logger_1.logger.info(`[Alerts] ${triggered} alerts triggered`);
    return triggered;
}
//# sourceMappingURL=alert.service.js.map