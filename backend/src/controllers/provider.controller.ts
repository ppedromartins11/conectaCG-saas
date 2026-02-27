import { Response, NextFunction } from 'express'
import { AuthRequest } from '../types'
import * as providerService from '../services/provider.service'
import * as leadService from '../services/lead.service'
import * as paymentService from '../services/payment.service'
import { ok, created, notFound } from '../utils/response'
import { AppError } from '../utils/errors'
import { z } from 'zod'

const registerSchema = z.object({
  providerName: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  cnpj: z.string().optional(),
  website: z.string().url().optional(),
  adminName: z.string().min(2),
  adminEmail: z.string().email(),
  password: z.string().min(8),
  contactPhone: z.string().optional(),
})

const planSchema = z.object({
  name: z.string().min(3),
  downloadSpeed: z.number().int().positive(),
  uploadSpeed: z.number().int().positive(),
  price: z.number().positive(),
  fidelidade: z.number().int().default(12),
  capacidade: z.string().optional(),
  servicosInclusos: z.array(z.string()).default([]),
  indicadoPara: z.array(z.string()).default([]),
  categorias: z.array(z.string()).default([]),
  cepsAtendidos: z.array(z.string()).default([]),
  promotionPrice: z.number().optional(),
  promotionExpiresAt: z.string().optional(),
  promotionLabel: z.string().optional(),
  citySlug: z.string().default('campo-grande'),
  isActive: z.boolean().default(true),
})

export async function registerProvider(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = registerSchema.parse(req.body)
    const result = await providerService.registerProvider(data)
    return created(res, result)
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors[0].message })
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, error: err.message })
    return next(err)
  }
}

export async function getDashboard(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const providerId = req.user!.role === 'SUPER_ADMIN'
      ? req.params.providerId
      : req.user!.providerId!

    const data = await providerService.getProviderDashboard(providerId)
    return ok(res, data)
  } catch (err) { return next(err) }
}

export async function getPlans(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const providerId = req.user!.providerId!
    const plans = await providerService.getProviderPlans(providerId)
    return ok(res, { plans })
  } catch (err) { return next(err) }
}

export async function createPlan(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = planSchema.parse(req.body)
    const plan = await providerService.createPlan(req.user!.providerId!, data)
    return created(res, { plan })
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors[0].message })
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, error: err.message })
    return next(err)
  }
}

export async function updatePlan(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = planSchema.partial().parse(req.body)
    const plan = await providerService.updatePlan(req.params.planId, req.user!.providerId!, data)
    return ok(res, { plan })
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, error: err.message })
    return next(err)
  }
}

export async function deletePlan(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { prisma } = await import('../config/prisma')
    const plan = await prisma.plan.findUnique({ where: { id: req.params.planId } })
    if (!plan || plan.providerId !== req.user!.providerId) {
      return res.status(403).json({ success: false, error: 'Sem permissão' })
    }
    await prisma.plan.update({ where: { id: req.params.planId }, data: { isActive: false } })
    return ok(res, { message: 'Plano desativado com sucesso' })
  } catch (err) { return next(err) }
}

export async function getLeads(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { status, page, limit } = req.query as Record<string, string>
    const data = await leadService.getLeadsByProvider(
      req.user!.providerId!,
      status,
      parseInt(page ?? '1'),
      parseInt(limit ?? '20')
    )
    return ok(res, data)
  } catch (err) { return next(err) }
}

export async function updateLead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { status } = req.body
    const lead = await leadService.updateLeadStatus(req.params.leadId, req.user!.providerId!, status)
    return ok(res, { lead })
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, error: err.message })
    return next(err)
  }
}

export async function createCheckout(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { tier } = req.body
    const data = await paymentService.createCheckoutSession(req.user!.providerId!, tier)
    return ok(res, data)
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, error: err.message })
    return next(err)
  }
}

export async function billingPortal(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await paymentService.createBillingPortal(req.user!.providerId!)
    return ok(res, data)
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, error: err.message })
    return next(err)
  }
}
