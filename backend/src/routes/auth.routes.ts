import { Router } from 'express'
import * as ctrl from '../controllers/auth.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { authLimiter, registerLimiter } from '../middlewares/rateLimit.middleware'

const router = Router()

router.post('/register', registerLimiter, ctrl.register)
router.post('/login', authLimiter, ctrl.login)
router.post('/refresh', ctrl.refresh)
router.post('/logout', authenticate, ctrl.logout)
router.get('/me', authenticate, ctrl.me)

export default router
