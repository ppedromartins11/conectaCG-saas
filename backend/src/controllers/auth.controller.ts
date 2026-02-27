import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import * as authService from '../services/auth.service'
import { ok, created, badRequest, unauthorized } from '../utils/response'
import { AppError } from '../utils/errors'
import { AuthRequest } from '../types'
import { prisma } from '../config/prisma'

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().toLowerCase(),
  password: z.string().min(6).max(100),
  address: z.string().optional(),
  referralCode: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
})

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const data = registerSchema.parse(req.body)
    const result = await authService.registerUser(data)
    return created(res, result)
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest(res, err.errors[0].message)
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, error: err.message })
    return next(err)
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const data = loginSchema.parse(req.body)
    const result = await authService.loginUser(data.email, data.password)
    return ok(res, result)
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest(res, err.errors[0].message)
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, error: err.message })
    return next(err)
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return unauthorized(res, 'Refresh token obrigatório')
    const result = await authService.refreshTokens(refreshToken)
    return ok(res, result)
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, error: err.message })
    return next(err)
  }
}

export async function logout(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (req.user) await authService.logoutUser(req.user.userId)
    return ok(res, { message: 'Logout realizado com sucesso' })
  } catch (err) {
    return next(err)
  }
}

export async function me(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        profile: true,
        badges: { orderBy: { earnedAt: 'asc' } },
        _count: { select: { reviews: true, favorites: true } },
        providerUsers: { include: { provider: { select: { id: true, name: true, slug: true } } } },
      },
    })

    if (!user) return res.status(404).json({ success: false, error: 'Usuário não encontrado' })

    return ok(res, {
      id: user.id, name: user.name, email: user.email, role: user.role,
      address: user.address, createdAt: user.createdAt, profile: user.profile,
      badges: user.badges, reviewCount: user._count.reviews,
      favoriteCount: user._count.favorites,
      provider: user.providerUsers[0]?.provider ?? null,
    })
  } catch (err) {
    return next(err)
  }
}
