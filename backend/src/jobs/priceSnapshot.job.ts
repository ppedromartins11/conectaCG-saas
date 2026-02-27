import { prisma } from '../config/prisma'
import { logger } from '../config/logger'

export async function captureAllPriceSnapshots() {
  const plans = await prisma.plan.findMany({ where: { isActive: true }, select: { id: true, price: true } })

  const data = plans.map((p) => ({ planId: p.id, price: p.price }))

  await prisma.priceSnapshot.createMany({ data })
  logger.info(`[PriceSnapshot] Captured ${data.length} snapshots`)

  return data.length
}
