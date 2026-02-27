import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { AuthPayload } from '../types'

export function signAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any })
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
  })
}

export function verifyAccessToken(token: string): AuthPayload {
  return jwt.verify(token, env.JWT_SECRET) as AuthPayload
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string }
}
