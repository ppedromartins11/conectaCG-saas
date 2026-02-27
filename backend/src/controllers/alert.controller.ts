import { Response, NextFunction } from 'express'
import { AuthRequest } from '../types'
import * as alertService from '../services/alert.service'
import { ok, created } from '../utils/response'
import { AppError } from '../utils/errors'
import { z } from 'zod'

const createSchema = z.object({
  cep: z.string().min(5).max(9),
  maxPrice: z.number().positive(),
  minSpeed: z.number().int().positive().optional(),
  planId: z.string().optional(),
})

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = createSchema.parse(req.body)
    const alert = await alertService.createAlert(req.user!.userId, data)
    return created(res, { alert })
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors[0].message })
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, error: err.message })
    return next(err)
  }
}

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const alerts = await alertService.getUserAlerts(req.user!.userId)
    return ok(res, { alerts })
  } catch (err) { return next(err) }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await alertService.deleteAlert(req.params.id, req.user!.userId)
    return ok(res, { message: 'Alerta removido' })
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, error: err.message })
    return next(err)
  }
}
