import { Response, NextFunction } from 'express'
import { AuthRequest } from '../types'
import * as favoriteService from '../services/favorite.service'
import { ok } from '../utils/response'

export async function toggle(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await favoriteService.toggleFavorite(req.user!.userId, req.params.planId)
    return ok(res, result)
  } catch (err) { return next(err) }
}

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const favorites = await favoriteService.getUserFavorites(req.user!.userId)
    return ok(res, { favorites })
  } catch (err) { return next(err) }
}
