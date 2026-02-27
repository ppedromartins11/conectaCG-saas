import { Router } from 'express'
import * as ctrl from '../controllers/provider.controller'
import { authenticate, requireProviderAccess, requireRole } from '../middlewares/auth.middleware'
import { registerLimiter } from '../middlewares/rateLimit.middleware'

const router = Router()

// Public: register new provider
router.post('/register', registerLimiter, ctrl.registerProvider)

// Protected B2B routes
router.get('/dashboard', authenticate, requireProviderAccess, ctrl.getDashboard)
router.get('/dashboard/:providerId', authenticate, requireRole('SUPER_ADMIN'), ctrl.getDashboard)
router.get('/plans', authenticate, requireProviderAccess, ctrl.getPlans)
router.post('/plans', authenticate, requireProviderAccess, ctrl.createPlan)
router.put('/plans/:planId', authenticate, requireProviderAccess, ctrl.updatePlan)
router.delete('/plans/:planId', authenticate, requireProviderAccess, ctrl.deletePlan)
router.get('/leads', authenticate, requireProviderAccess, ctrl.getLeads)
router.patch('/leads/:leadId', authenticate, requireProviderAccess, ctrl.updateLead)

// Billing
router.post('/billing/checkout', authenticate, requireProviderAccess, ctrl.createCheckout)
router.post('/billing/portal', authenticate, requireProviderAccess, ctrl.billingPortal)

export default router
