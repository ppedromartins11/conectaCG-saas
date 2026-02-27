import rateLimit from 'express-rate-limit'
import { env } from '../config/env'

const skip = () => env.NODE_ENV === 'test'

export const globalLimiter = rateLimit({
  windowMs: 60_000,
  max: 100,
  skip,
  message: { success: false, error: 'Muitas requisições. Tente novamente em instantes.' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const authLimiter = rateLimit({
  windowMs: 15 * 60_000, // 15 min
  max: 10,
  skip,
  message: { success: false, error: 'Muitas tentativas de login. Aguarde 15 minutos.' },
})

export const searchLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  skip,
  message: { success: false, error: 'Limite de buscas atingido.' },
})

export const registerLimiter = rateLimit({
  windowMs: 60 * 60_000, // 1h
  max: 5,
  skip,
  message: { success: false, error: 'Limite de cadastros atingido.' },
})
