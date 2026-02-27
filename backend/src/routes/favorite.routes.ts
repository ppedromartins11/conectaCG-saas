import { Router } from 'express'
import * as ctrl from '../controllers/favorite.controller'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

router.get('/', authenticate, ctrl.list)
router.post('/:planId', authenticate, ctrl.toggle)
router.delete('/:planId', authenticate, ctrl.toggle)

export default router
