import { prisma } from '../config/prisma'
import { AppError } from '../utils/errors'
import { sendPriceAlert } from './email.service'
import { logger } from '../config/logger'

export async function createAlert(userId: string, data: { cep: string; maxPrice: number; minSpeed?: number; planId?: string }) {
  const count = await prisma.priceAlert.count({ where: { userId, isActive: true } })
  if (count >= 5) throw new AppError('Limite de 5 alertas ativos atingido', 400)

  const alert = await prisma.priceAlert.create({
    data: {
      userId,
      cep: data.cep.replace(/\D/g, '').slice(0, 5),
      maxPrice: data.maxPrice,
      minSpeed: data.minSpeed,
      planId: data.planId,
    },
  })

  await prisma.event.create({ data: { type: 'ALERT_CREATED', userId, payload: { cep: data.cep } } }).catch(() => {})
  return alert
}

export async function getUserAlerts(userId: string) {
  return prisma.priceAlert.findMany({
    where: { userId },
    include: { plan: { select: { name: true, price: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function deleteAlert(alertId: string, userId: string) {
  const alert = await prisma.priceAlert.findUnique({ where: { id: alertId } })
  if (!alert) throw new AppError('Alerta não encontrado', 404)
  if (alert.userId !== userId) throw new AppError('Sem permissão', 403)
  await prisma.priceAlert.delete({ where: { id: alertId } })
}

export async function processAlerts() {
  logger.info('[Alerts] Processing price alerts...')

  const alerts = await prisma.priceAlert.findMany({
    where: { isActive: true },
    include: { user: { select: { email: true } } },
  })

  let triggered = 0

  for (const alert of alerts) {
    const matchingPlans = await prisma.plan.findMany({
      where: {
        isActive: true,
        cepsAtendidos: { has: alert.cep },
        price: { lte: alert.maxPrice },
        ...(alert.minSpeed && { downloadSpeed: { gte: alert.minSpeed } }),
      },
      include: { provider: { select: { name: true } } },
    })

    if (matchingPlans.length > 0) {
      await sendPriceAlert(alert.user.email, matchingPlans, alert).catch(() => {})
      await prisma.priceAlert.update({
        where: { id: alert.id },
        data: { lastTriggeredAt: new Date() },
      })
      triggered++
    }
  }

  logger.info(`[Alerts] ${triggered} alerts triggered`)
  return triggered
}
