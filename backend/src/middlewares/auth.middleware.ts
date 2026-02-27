import { Response, NextFunction } from 'express'
import { AuthRequest } from '../types'
import { verifyAccessToken } from '../utils/jwt'
import { unauthorized, forbidden } from '../utils/response'
import { prisma } from '../config/prisma'

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) return unauthorized(res)

    const token = header.split(' ')[1]
    const payload = verifyAccessToken(token)
    req.user = payload
    return next()
  } catch {
    return unauthorized(res, 'Token inválido ou expirado')
  }
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization
    if (header?.startsWith('Bearer ')) {
      const token = header.split(' ')[1]
      req.user = verifyAccessToken(token)
    }
  } catch { /* silent */ }
  return next()
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return unauthorized(res)
    if (!roles.includes(req.user.role)) return forbidden(res)
    return next()
  }
}

export async function requireProviderAccess(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) return unauthorized(res)
  if (req.user.role === 'SUPER_ADMIN') return next()

  const providerUser = await prisma.providerUser.findFirst({
    where: { userId: req.user.userId },
    include: { provider: { include: { account: true } } },
  })

  if (!providerUser) return forbidden(res, 'Sem acesso a nenhuma operadora')

  req.user.providerId = providerUser.providerId
  return next()
}
