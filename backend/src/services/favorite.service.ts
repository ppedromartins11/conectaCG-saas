import { prisma } from '../config/prisma'
import { AppError } from '../utils/errors'

export async function toggleFavorite(userId: string, planId: string) {
  const existing = await prisma.favorite.findUnique({
    where: { userId_planId: { userId, planId } },
  })

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } })
    await prisma.event.create({ data: { type: 'FAVORITE_REMOVED', userId, payload: { planId } } }).catch(() => {})
    return { action: 'removed', isFavorited: false }
  }

  await prisma.favorite.create({ data: { userId, planId } })
  await prisma.event.create({ data: { type: 'FAVORITE_ADDED', userId, payload: { planId } } }).catch(() => {})
  await checkBadges(userId)

  return { action: 'added', isFavorited: true }
}

export async function getUserFavorites(userId: string) {
  return prisma.favorite.findMany({
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
  })
}

async function checkBadges(userId: string) {
  const count = await prisma.favorite.count({ where: { userId } })
  if (count >= 3) {
    await prisma.userBadge.create({ data: { userId, slug: 'SPECIALIST' } }).catch(() => {})
  }
}
