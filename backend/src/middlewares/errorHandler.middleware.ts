import { Request, Response, NextFunction } from 'express'
import { logger } from '../config/logger'
import { env } from '../config/env'

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  logger.error(err.message, { stack: err.stack, path: req.path, method: req.method })

  return res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
  })
}

export function notFoundHandler(req: Request, res: Response) {
  return res.status(404).json({ success: false, error: `Rota ${req.path} não encontrada` })
}
