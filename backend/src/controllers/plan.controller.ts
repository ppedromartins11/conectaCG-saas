import { Response, NextFunction } from 'express'
import { AuthRequest } from '../types'
import * as planService from '../services/plan.service'
import { ok, created, notFound } from '../utils/response'
import { AppError } from '../utils/errors'
import { z } from 'zod'

const reviewSchema = z.object({
  nota: z.number().int().min(1).max(5),
  comentario: z.string().min(5).max(500),
})

export async function getPlans(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { cep, category, city } = req.query as Record<string, string>
    const result = await planService.getPlans({
      cep,
      category,
      citySlug: city,
      userId: req.user?.userId,
      isLoggedIn: !!req.user,
    })
    return ok(res, result)
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, error: err.message })
    return next(err)
  }
}

export async function getPlan(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const plan = await planService.getPlanById(req.params.id, req.user?.userId, !!req.user)
    return ok(res, { plan })
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, error: err.message })
    return next(err)
  }
}

export async function clickPlan(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0] ?? req.ip
    await planService.registerClick(req.params.id, req.user?.userId, ip)
    return ok(res, { success: true })
  } catch (err) { return next(err) }
}

export async function createReview(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = reviewSchema.parse(req.body)
    const { prisma } = await import('../config/prisma')

    const existing = await prisma.review.findUnique({
      where: { userId_planId: { userId: req.user!.userId, planId: req.params.id } },
    })
    if (existing) return res.status(400).json({ success: false, error: 'Você já avaliou este plano' })

    const review = await prisma.review.create({
      data: { userId: req.user!.userId, planId: req.params.id, nota: data.nota, comentario: data.comentario },
      include: { user: { select: { name: true } } },
    })

    await prisma.event.create({ data: { type: 'REVIEW_PUBLISHED', userId: req.user!.userId, payload: { planId: req.params.id } } }).catch(() => {})

    return created(res, { review })
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors[0].message })
    return next(err)
  }
}

export async function getRecommendations(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { pessoas, dispositivos, atividades, velocidadeAtual, cep } = req.body
    const { prisma } = await import('../config/prisma')

    await prisma.userProfile.upsert({
      where: { userId: req.user!.userId },
      update: { pessoas, dispositivos, atividades, velocidadeAtual },
      create: { userId: req.user!.userId, pessoas, dispositivos, atividades, velocidadeAtual },
    })

    const plans = await prisma.plan.findMany({
      where: { isActive: true, ...(cep && { cepsAtendidos: { has: cep.replace(/\D/g, '').slice(0, 5) } }) },
      include: {
        provider: { select: { name: true, color: true, slug: true } },
        reviews: { select: { nota: true } },
        _count: { select: { reviews: true } },
        favorites: { where: { userId: req.user!.userId }, select: { id: true } },
      },
    })

    const scored = plans.map((p) => ({
      ...p,
      avgRating: p.reviews.length ? p.reviews.reduce((a, r) => a + r.nota, 0) / p.reviews.length : 0,
      isFavorited: p.favorites.length > 0,
      compatibilityScore: scoreplan(p, atividades ?? [], pessoas ?? 1),
      reviews: undefined,
      favorites: undefined,
    })).sort((a, b) => b.compatibilityScore - a.compatibilityScore)

    await prisma.event.create({ data: { type: 'QUESTIONNAIRE_COMPLETED', userId: req.user!.userId } }).catch(() => {})

    return ok(res, { plans: scored })
  } catch (err) { return next(err) }
}

function scoreplan(plan: any, atividades: string[], pessoas: number): number {
  let s = 0
  const actMap: Record<string, { min: number; cat: string }> = {
    Gaming: { min: 300, cat: 'Gaming' }, Streaming: { min: 200, cat: 'Streaming' },
    'Home Office': { min: 150, cat: 'Trabalho' }, Estudos: { min: 100, cat: 'Trabalho' },
  }
  for (const act of atividades) {
    const c = actMap[act]
    if (!c) continue
    s += plan.downloadSpeed >= c.min ? 20 : 8
    if (plan.categorias.includes(c.cat)) s += 15
  }
  s += plan.downloadSpeed / pessoas >= 100 ? 20 : plan.downloadSpeed / pessoas >= 50 ? 10 : 3
  s += plan.downloadSpeed / plan.price >= 4 ? 15 : 8
  return s
}
