import { Request, Response, NextFunction } from 'express'
import * as paymentService from '../services/payment.service'
import { logger } from '../config/logger'

export async function handleStripeWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const sig = req.headers['stripe-signature'] as string
    if (!sig) return res.status(400).json({ error: 'Missing signature' })

    await paymentService.handleWebhook(req.body as Buffer, sig)
    return res.json({ received: true })
  } catch (err: any) {
    logger.error('[Webhook]', err.message)
    return res.status(400).json({ error: err.message })
  }
}
