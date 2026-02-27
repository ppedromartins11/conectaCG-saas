"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlans = getPlans;
exports.getPlanById = getPlanById;
exports.registerClick = registerClick;
exports.recalculateRankings = recalculateRankings;
const prisma_1 = require("../config/prisma");
const errors_1 = require("../utils/errors");
const VISITOR_LIMIT = 2;
async function getPlans(dto) {
    const cepPrefix = dto.cep ? dto.cep.replace(/\D/g, '').slice(0, 5) : null;
    // Resolve city
    let cityId;
    if (dto.citySlug) {
        const city = await prisma_1.prisma.city.findUnique({ where: { slug: dto.citySlug, isActive: true } });
        if (!city)
            throw new errors_1.AppError('Cidade não encontrada', 404);
        cityId = city.id;
    }
    else {
        // Default to Campo Grande
        const city = await prisma_1.prisma.city.findFirst({ where: { slug: 'campo-grande', isActive: true } });
        cityId = city?.id;
    }
    const where = { isActive: true, ...(cityId && { cityId }) };
    if (cepPrefix)
        where.cepsAtendidos = { has: cepPrefix };
    if (dto.category && dto.category !== 'Todos')
        where.categorias = { has: dto.category };
    const plans = await prisma_1.prisma.plan.findMany({
        where,
        include: {
            provider: { select: { id: true, name: true, color: true, slug: true, logo: true } },
            reviews: { select: { nota: true } },
            _count: { select: { reviews: true, favorites: true } },
            ...(dto.userId && {
                favorites: { where: { userId: dto.userId }, select: { id: true } },
            }),
        },
        orderBy: [
            { isSponsored: 'desc' },
            { sponsorPriority: 'desc' },
            { rankingScore: 'desc' },
            { price: 'asc' },
        ],
    });
    const enriched = plans.map((p) => enrichPlan(p, dto.isLoggedIn, dto.userId));
    const visiblePlans = dto.isLoggedIn ? enriched : enriched.slice(0, VISITOR_LIMIT);
    // Save search history for logged-in users
    if (dto.userId && cepPrefix) {
        await prisma_1.prisma.searchHistory.create({
            data: { userId: dto.userId, cep: cepPrefix, resultsCount: plans.length, cityId },
        }).catch(() => { });
        await prisma_1.prisma.event.create({
            data: { type: 'CEP_SEARCHED', userId: dto.userId, payload: { cep: cepPrefix, count: plans.length } },
        }).catch(() => { });
    }
    return {
        plans: visiblePlans,
        total: plans.length,
        hiddenCount: dto.isLoggedIn ? 0 : Math.max(0, plans.length - VISITOR_LIMIT),
        isLoggedIn: dto.isLoggedIn,
    };
}
async function getPlanById(planId, userId, isLoggedIn = false) {
    const plan = await prisma_1.prisma.plan.findUnique({
        where: { id: planId, isActive: true },
        include: {
            provider: true,
            reviews: {
                include: { user: { select: { name: true } } },
                orderBy: { createdAt: 'desc' },
                take: isLoggedIn ? 50 : 1,
            },
            _count: { select: { reviews: true, favorites: true } },
            ...(userId && { favorites: { where: { userId }, select: { id: true } } }),
        },
    });
    if (!plan)
        throw new errors_1.AppError('Plano não encontrado', 404);
    await prisma_1.prisma.plan.update({ where: { id: planId }, data: { viewCount: { increment: 1 } } }).catch(() => { });
    await prisma_1.prisma.event.create({
        data: { type: 'PLAN_DETAIL_OPENED', userId, payload: { planId } },
    }).catch(() => { });
    return enrichPlan(plan, isLoggedIn, userId);
}
async function registerClick(planId, userId, ip) {
    await Promise.all([
        prisma_1.prisma.planClick.create({ data: { planId, userId, ip } }),
        prisma_1.prisma.plan.update({ where: { id: planId }, data: { clickCount: { increment: 1 } } }),
        upsertDailyMetric(planId, 'clicks'),
    ]).catch(() => { });
}
async function recalculateRankings() {
    const plans = await prisma_1.prisma.plan.findMany({
        include: {
            reviews: { select: { nota: true } },
            _count: { select: { clicks: true, conversions: true, favorites: true } },
        },
    });
    for (const plan of plans) {
        const avgRating = plan.reviews.length
            ? plan.reviews.reduce((a, r) => a + r.nota, 0) / plan.reviews.length
            : 0;
        const score = (avgRating / 5) * 40 +
            Math.min(plan._count.conversions / 10, 1) * 30 +
            Math.min(plan._count.clicks / 100, 1) * 20 +
            Math.min(plan._count.favorites / 20, 1) * 10;
        await prisma_1.prisma.plan.update({ where: { id: plan.id }, data: { rankingScore: score } });
    }
}
async function upsertDailyMetric(planId, field) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma_1.prisma.planDailyMetric.upsert({
        where: { planId_date: { planId, date: today } },
        update: { [field]: { increment: 1 } },
        create: { planId, date: today, [field]: 1 },
    }).catch(() => { });
}
function enrichPlan(plan, isLoggedIn, userId) {
    const avgRating = plan.reviews?.length
        ? Math.round((plan.reviews.reduce((a, r) => a + r.nota, 0) / plan.reviews.length) * 10) / 10
        : 0;
    const hasPromo = plan.promotionPrice && plan.promotionExpiresAt && new Date(plan.promotionExpiresAt) > new Date();
    const base = {
        id: plan.id,
        name: plan.name,
        provider: plan.provider,
        price: plan.price,
        fidelidade: plan.fidelidade,
        categorias: plan.categorias,
        isSponsored: plan.isSponsored,
        promotionPrice: hasPromo ? plan.promotionPrice : null,
        promotionExpiresAt: hasPromo ? plan.promotionExpiresAt : null,
        promotionLabel: hasPromo ? plan.promotionLabel : null,
        rankingScore: plan.rankingScore,
        clickCount: plan.clickCount,
        avgRating,
        reviewCount: plan._count?.reviews ?? plan.reviews?.length ?? 0,
        favoriteCount: plan._count?.favorites ?? 0,
        isFavorited: userId ? (plan.favorites?.length > 0) : false,
    };
    if (isLoggedIn) {
        return {
            ...base,
            downloadSpeed: plan.downloadSpeed,
            uploadSpeed: plan.uploadSpeed,
            servicosInclusos: plan.servicosInclusos,
            indicadoPara: plan.indicadoPara,
            capacidade: plan.capacidade,
            reviews: plan.reviews,
        };
    }
    return { ...base, downloadSpeed: null, uploadSpeed: null, servicosInclusos: [], indicadoPara: [], reviews: plan.reviews?.slice(0, 1) ?? [], _masked: true };
}
//# sourceMappingURL=plan.service.js.map