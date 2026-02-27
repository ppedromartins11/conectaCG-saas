"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLead = createLead;
exports.getLeadsByProvider = getLeadsByProvider;
exports.updateLeadStatus = updateLeadStatus;
const prisma_1 = require("../config/prisma");
const errors_1 = require("../utils/errors");
const email_service_1 = require("./email.service");
async function createLead(dto) {
    const plan = await prisma_1.prisma.plan.findUnique({
        where: { id: dto.planId, isActive: true },
        include: { provider: { include: { account: true } } },
    });
    if (!plan)
        throw new errors_1.AppError('Plano não encontrado', 404);
    const lead = await prisma_1.prisma.lead.create({
        data: {
            planId: dto.planId,
            providerId: plan.providerId,
            userId: dto.userId,
            name: dto.name.trim(),
            phone: dto.phone.trim(),
            cep: dto.cep.replace(/\D/g, '').slice(0, 8),
        },
    });
    await Promise.all([
        prisma_1.prisma.planConversion.create({ data: { planId: dto.planId, userId: dto.userId } }),
        prisma_1.prisma.plan.update({ where: { id: dto.planId }, data: { conversionCount: { increment: 1 } } }),
        prisma_1.prisma.event.create({ data: { type: 'LEAD_CAPTURED', userId: dto.userId, payload: { planId: dto.planId } } }),
    ]).catch(() => { });
    // Notify provider (webhook or email)
    const account = plan.provider.account;
    if (account?.webhookUrl) {
        await sendWebhook(account.webhookUrl, { lead, plan: { name: plan.name, provider: plan.provider.name } });
    }
    else if (account?.contactEmail) {
        await (0, email_service_1.sendLeadNotification)(account.contactEmail, lead, plan).catch(() => { });
    }
    await prisma_1.prisma.lead.update({ where: { id: lead.id }, data: { notificationSent: true, providerNotifiedAt: new Date() } });
    return lead;
}
async function getLeadsByProvider(providerId, status, page = 1, limit = 20) {
    const where = { providerId };
    if (status)
        where.status = status;
    const [leads, total] = await Promise.all([
        prisma_1.prisma.lead.findMany({
            where,
            include: { plan: { select: { name: true, downloadSpeed: true, price: true } } },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma_1.prisma.lead.count({ where }),
    ]);
    return { leads, total, page, limit, totalPages: Math.ceil(total / limit) };
}
async function updateLeadStatus(leadId, providerId, status) {
    const lead = await prisma_1.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead)
        throw new errors_1.AppError('Lead não encontrado', 404);
    if (lead.providerId !== providerId)
        throw new errors_1.AppError('Sem permissão', 403);
    return prisma_1.prisma.lead.update({ where: { id: leadId }, data: { status: status } });
}
async function sendWebhook(url, payload) {
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(5000),
        });
    }
    catch (e) { /* ignore webhook failures */ }
}
//# sourceMappingURL=lead.service.js.map