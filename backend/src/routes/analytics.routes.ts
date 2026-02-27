import { Router } from 'express'
import * as ctrl from '../controllers/analytics.controller'
import { authenticate, optionalAuth, requireRole } from '../middlewares/auth.middleware'

const router = Router()

router.post('/track', optionalAuth, ctrl.track)
router.get('/admin/stats', authenticate, requireRole('SUPER_ADMIN'), ctrl.getSuperAdminStats)

export default router
