import { Router } from 'express'
import * as ctrl from '../controllers/plan.controller'
import * as leadCtrl from '../controllers/lead.controller'
import { authenticate, optionalAuth } from '../middlewares/auth.middleware'
import { searchLimiter } from '../middlewares/rateLimit.middleware'

const router = Router()

router.get('/', searchLimiter, optionalAuth, ctrl.getPlans)
router.get('/:id', optionalAuth, ctrl.getPlan)
router.post('/:id/click', optionalAuth, ctrl.clickPlan)
router.post('/:id/review', authenticate, ctrl.createReview)
router.post('/:planId/lead', optionalAuth, leadCtrl.captureLead)
router.post('/recommend', authenticate, ctrl.getRecommendations)

export default router
