"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleFavorite = toggleFavorite;
exports.getUserFavorites = getUserFavorites;
const prisma_1 = require("../config/prisma");
async function toggleFavorite(userId, planId) {
    const existing = await prisma_1.prisma.favorite.findUnique({
        where: { userId_planId: { userId, planId } },
    });
    if (existing) {
        await prisma_1.prisma.favorite.delete({ where: { id: existing.id } });
        await prisma_1.prisma.event.create({ data: { type: 'FAVORITE_REMOVED', userId, payload: { planId } } }).catch(() => { });
        return { action: 'removed', isFavorited: false };
    }
    await prisma_1.prisma.favorite.create({ data: { userId, planId } });
    await prisma_1.prisma.event.create({ data: { type: 'FAVORITE_ADDED', userId, payload: { planId } } }).catch(() => { });
    await checkBadges(userId);
    return { action: 'added', isFavorited: true };
}
async function getUserFavorites(userId) {
    return prisma_1.prisma.favorite.findMany({
        where: { userId },
        include: {
            plan: {
                include: {
                    provider: { select: { name: true, color: true } },
                    reviews: { select: { nota: true } },
                    _count: { select: { reviews: true } },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
}
async function checkBadges(userId) {
    const count = await prisma_1.prisma.favorite.count({ where: { userId } });
    if (count >= 3) {
        await prisma_1.prisma.userBadge.create({ data: { userId, slug: 'SPECIALIST' } }).catch(() => { });
    }
}
//# sourceMappingURL=favorite.service.js.map