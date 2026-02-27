import { Response, NextFunction } from 'express'
import { AuthRequest } from '../types'
import * as leadService from '../services/lead.service'
import { created } from '../utils/response'
import { AppError } from '../utils/errors'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().min(8).max(20),
  cep: z.string().min(5).max(9),
})

export async function captureLead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = schema.parse(req.body)
    const lead = await leadService.createLead({
      planId: req.params.planId,
      userId: req.user?.userId,
      ...data,
    })
    return created(res, { lead, message: 'Interesse registrado! A operadora entrará em contato.' })
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors[0].message })
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, error: err.message })
    return next(err)
  }
}
