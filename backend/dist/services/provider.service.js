"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerProvider = registerProvider;
exports.getProviderDashboard = getProviderDashboard;
exports.createPlan = createPlan;
exports.updatePlan = updatePlan;
exports.getProviderPlans = getProviderPlans;
const prisma_1 = require("../config/prisma");
const errors_1 = require("../utils/errors");
const hash_1 = require("../utils/hash");
async function registerProvider(dto) {
    const existingEmail = await prisma_1.prisma.user.findUnique({ where: { email: dto.adminEmail.toLowerCase() } });
    if (existingEmail)
        throw new errors_1.AppError('E-mail já cadastrado', 409);
    const existingSlug = await prisma_1.prisma.provider.findUnique({ where: { slug: dto.slug } });
    if (existingSlug)
        throw new errors_1.AppError('Slug já em uso', 409);
    const hashed = await (0, hash_1.hashPassword)(dto.password);
    // Create in transaction
    const result = await prisma_1.prisma.$transaction(async (tx) => {
        const provider = await tx.provider.create({
            data: {
                name: dto.providerName,
                slug: dto.slug.toLowerCase().replace(/\s/g, '-'),
                cnpj: dto.cnpj,
                website: dto.website,
            },
        });
        await tx.providerAccount.create({
            data: {
                providerId: provider.id,
                contactName: dto.adminName,
                contactEmail: dto.adminEmail.toLowerCase(),
                contactPhone: dto.contactPhone,
            },
        });
        const user = await tx.user.create({
            data: {
                name: dto.adminName,
                email: dto.adminEmail.toLowerCase(),
                password: hashed,
                role: 'PROVIDER_ADMIN',
            },
        });
        await tx.providerUser.create({
            data: { providerId: provider.id, userId: user.id, role: 'PROVIDER_ADMIN' },
        });
        return { provider, user };
    });
    return result;
}
async function getProviderDashboard(providerId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today.getTime() - 7 * 86400000);
    const monthAgo = new Date(today.getTime() - 30 * 86400000);
    const [provider, leadsToday, leadsWeek, leadsMonth, leadsByStatus, topPlans] = await Promise.all([
        prisma_1.prisma.provider.findUnique({
            where: { id: providerId },
            include: { account: true, _count: { select: { plans: { where: { isActive: true } }, leads: true } } },
        }),
        prisma_1.prisma.lead.count({ where: { providerId, createdAt: { gte: today } } }),
        prisma_1.prisma.lead.count({ where: { providerId, createdAt: { gte: weekAgo } } }),
        prisma_1.prisma.lead.count({ where: { providerId, createdAt: { gte: monthAgo } } }),
        prisma_1.prisma.lead.groupBy({
            by: ['status'],
            where: { providerId },
            _count: { status: true },
        }),
        prisma_1.prisma.plan.findMany({
            where: { providerId, isActive: true },
            select: { id: true, name: true, clickCount: true, conversionCount: true, viewCount: true, rankingScore: true, price: true },
            orderBy: { conversionCount: 'desc' },
            take: 5,
        }),
    ]);
    const metrics = {
        leadsToday,
        leadsWeek,
        leadsMonth,
        totalPlans: provider?._count.plans ?? 0,
        totalLeads: provider?._count.leads ?? 0,
        leadsByStatus: Object.fromEntries(leadsByStatus.map((l) => [l.status, l._count.status])),
        topPlans,
        tier: provider?.account?.tier ?? 'FREE',
    };
    return { provider, metrics };
}
async function createPlan(providerId, data) {
    const city = await prisma_1.prisma.city.findFirst({ where: { slug: data.citySlug ?? 'campo-grande', isActive: true } });
    if (!city)
        throw new errors_1.AppError('Cidade não encontrada', 404);
    return prisma_1.prisma.plan.create({
        data: {
            cityId: city.id,
            providerId,
            name: data.name,
            downloadSpeed: data.downloadSpeed,
            uploadSpeed: data.uploadSpeed,
            price: data.price,
            fidelidade: data.fidelidade ?? 12,
            capacidade: data.capacidade,
            servicosInclusos: data.servicosInclusos ?? [],
            indicadoPara: data.indicadoPara ?? [],
            categorias: data.categorias ?? [],
            cepsAtendidos: data.cepsAtendidos ?? [],
            promotionPrice: data.promotionPrice,
            promotionExpiresAt: data.promotionExpiresAt ? new Date(data.promotionExpiresAt) : undefined,
            promotionLabel: data.promotionLabel,
        },
    });
}
async function updatePlan(planId, providerId, data) {
    const plan = await prisma_1.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan)
        throw new errors_1.AppError('Plano não encontrado', 404);
    if (plan.providerId !== providerId)
        throw new errors_1.AppError('Sem permissão', 403);
    return prisma_1.prisma.plan.update({
        where: { id: planId },
        data: {
            name: data.name,
            downloadSpeed: data.downloadSpeed,
            uploadSpeed: data.uploadSpeed,
            price: data.price,
            fidelidade: data.fidelidade,
            capacidade: data.capacidade,
            servicosInclusos: data.servicosInclusos,
            indicadoPara: data.indicadoPara,
            categorias: data.categorias,
            cepsAtendidos: data.cepsAtendidos,
            promotionPrice: data.promotionPrice ?? null,
            promotionExpiresAt: data.promotionExpiresAt ? new Date(data.promotionExpiresAt) : null,
            promotionLabel: data.promotionLabel ?? null,
            isActive: data.isActive,
        },
    });
}
async function getProviderPlans(providerId) {
    return prisma_1.prisma.plan.findMany({
        where: { providerId },
        include: {
            _count: { select: { leads: true, clicks: true, favorites: true } },
            dailyMetrics: { orderBy: { date: 'desc' }, take: 7 },
        },
        orderBy: { createdAt: 'desc' },
    });
}
//# sourceMappingURL=provider.service.js.map