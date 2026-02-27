import { Router } from 'express'
import authRoutes from './auth.routes'
import planRoutes from './plan.routes'
import favoriteRoutes from './favorite.routes'
import alertRoutes from './alert.routes'
import providerRoutes from './provider.routes'
import analyticsRoutes from './analytics.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/plans', planRoutes)
router.use('/favorites', favoriteRoutes)
router.use('/alerts', alertRoutes)
router.use('/b2b', providerRoutes)
router.use('/analytics', analyticsRoutes)

export default router
