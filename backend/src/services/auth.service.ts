import { prisma } from '../config/prisma'
import { hashPassword, comparePassword } from '../utils/hash'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt'
import { AppError } from '../utils/errors'

interface RegisterDto {
  name: string
  email: string
  password: string
  address?: string
  referralCode?: string
}

export async function registerUser(dto: RegisterDto) {
  const existing = await prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } })
  if (existing) throw new AppError('E-mail já cadastrado', 409)

  const password = await hashPassword(dto.password)
  const user = await prisma.user.create({
    data: { name: dto.name.trim(), email: dto.email.toLowerCase(), password, address: dto.address },
  })

  // Handle referral
  if (dto.referralCode) {
    const referrer = await prisma.user.findUnique({ where: { id: dto.referralCode } })
    if (referrer && referrer.id !== user.id) {
      await prisma.referral.create({
        data: { referrerId: referrer.id, referredId: user.id, status: 'COMPLETED' },
      }).catch(() => {})
    }
  }

  await awardBadgeIfEarned(user.id, 'EARLY_ADOPTER')
  await trackEvent({ type: 'SIGNUP_COMPLETED', userId: user.id })

  const accessToken = signAccessToken({ userId: user.id, role: user.role })
  const refreshToken = signRefreshToken(user.id)
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } })

  return { user: { id: user.id, name: user.name, email: user.email, role: user.role }, accessToken, refreshToken }
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (!user || !user.isActive) throw new AppError('Credenciais inválidas', 401)

  const valid = await comparePassword(password, user.password)
  if (!valid) throw new AppError('Credenciais inválidas', 401)

  const providerUser = await prisma.providerUser.findFirst({ where: { userId: user.id } })

  const accessToken = signAccessToken({
    userId: user.id,
    role: user.role,
    providerId: providerUser?.providerId,
  })
  const refreshToken = signRefreshToken(user.id)
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } })
  await trackEvent({ type: 'LOGIN', userId: user.id })

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  }
}

export async function refreshTokens(token: string) {
  let payload: { userId: string }
  try {
    payload = verifyRefreshToken(token)
  } catch {
    throw new AppError('Refresh token inválido', 401)
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user || user.refreshToken !== token) throw new AppError('Refresh token revogado', 401)

  const providerUser = await prisma.providerUser.findFirst({ where: { userId: user.id } })
  const accessToken = signAccessToken({ userId: user.id, role: user.role, providerId: providerUser?.providerId })
  const newRefresh = signRefreshToken(user.id)
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken: newRefresh } })

  return { accessToken, refreshToken: newRefresh }
}

export async function logoutUser(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { refreshToken: null } })
}

async function trackEvent(data: { type: any; userId?: string }) {
  await prisma.event.create({ data }).catch(() => {})
}

async function awardBadgeIfEarned(userId: string, slug: any) {
  const count = await prisma.user.count()
  if (count <= 100) {
    await prisma.userBadge.create({ data: { userId, slug } }).catch(() => {})
  }
}
