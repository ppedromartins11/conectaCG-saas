import { Router } from 'express'
import * as ctrl from '../controllers/webhook.controller'

const router = Router()

// Raw body needed for Stripe signature verification
router.post('/stripe', ctrl.handleStripeWebhook)

export default router
