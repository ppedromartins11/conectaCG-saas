import { Router } from 'express'
import * as ctrl from '../controllers/alert.controller'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

router.get('/', authenticate, ctrl.list)
router.post('/', authenticate, ctrl.create)
router.delete('/:id', authenticate, ctrl.remove)

export default router
