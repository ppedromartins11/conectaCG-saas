import { Request, Response, NextFunction } from 'express'
import { AuthRequest } from '../types'
import { prisma } from '../config/prisma'
import { ok } from '../utils/response'

const ALLOWED_EVENTS = ['PAGE_VIEW', 'PLAN_VIEWED', 'COMPARISON_STARTED', 'CTA_LOGIN_SHOWN', 'HIRE_CLICKED', 'SIGNUP_STARTED']

export async function track(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { type, payload, sessionId } = req.body
    if (!ALLOWED_EVENTS.includes(type)) return res.status(400).json({ success: false, error: 'Event type not allowed' })

    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0] ?? req.ip

    await prisma.event.create({
      data: { type, userId: req.user?.userId, sessionId, payload, ip, userAgent: req.headers['user-agent'] },
    }).catch(() => {})

    return ok(res, { success: true })
  } catch (err) { return next(err) }
}

export async function getSuperAdminStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const monthAgo = new Date(Date.now() - 30 * 86400000)

    const [users, providers, plans, leads, events, topCities] = await Promise.all([
      prisma.user.count(),
      prisma.provider.count(),
      prisma.plan.count({ where: { isActive: true } }),
      prisma.lead.count({ where: { createdAt: { gte: monthAgo } } }),
      prisma.event.groupBy({ by: ['type'], _count: { type: true }, where: { createdAt: { gte: monthAgo } } }),
      prisma.city.findMany({ where: { isActive: true }, include: { _count: { select: { plans: true, searchHistory: true } } } }),
    ])

    return ok(res, { users, providers, plans, leadsThisMonth: leads, eventBreakdown: events, topCities })
  } catch (err) { return next(err) }
}
