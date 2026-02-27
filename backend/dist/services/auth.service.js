"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.refreshTokens = refreshTokens;
exports.logoutUser = logoutUser;
const prisma_1 = require("../config/prisma");
const hash_1 = require("../utils/hash");
const jwt_1 = require("../utils/jwt");
const errors_1 = require("../utils/errors");
async function registerUser(dto) {
    const existing = await prisma_1.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing)
        throw new errors_1.AppError('E-mail já cadastrado', 409);
    const password = await (0, hash_1.hashPassword)(dto.password);
    const user = await prisma_1.prisma.user.create({
        data: { name: dto.name.trim(), email: dto.email.toLowerCase(), password, address: dto.address },
    });
    // Handle referral
    if (dto.referralCode) {
        const referrer = await prisma_1.prisma.user.findUnique({ where: { id: dto.referralCode } });
        if (referrer && referrer.id !== user.id) {
            await prisma_1.prisma.referral.create({
                data: { referrerId: referrer.id, referredId: user.id, status: 'COMPLETED' },
            }).catch(() => { });
        }
    }
    await awardBadgeIfEarned(user.id, 'EARLY_ADOPTER');
    await trackEvent({ type: 'SIGNUP_COMPLETED', userId: user.id });
    const accessToken = (0, jwt_1.signAccessToken)({ userId: user.id, role: user.role });
    const refreshToken = (0, jwt_1.signRefreshToken)(user.id);
    await prisma_1.prisma.user.update({ where: { id: user.id }, data: { refreshToken } });
    return { user: { id: user.id, name: user.name, email: user.email, role: user.role }, accessToken, refreshToken };
}
async function loginUser(email, password) {
    const user = await prisma_1.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.isActive)
        throw new errors_1.AppError('Credenciais inválidas', 401);
    const valid = await (0, hash_1.comparePassword)(password, user.password);
    if (!valid)
        throw new errors_1.AppError('Credenciais inválidas', 401);
    const providerUser = await prisma_1.prisma.providerUser.findFirst({ where: { userId: user.id } });
    const accessToken = (0, jwt_1.signAccessToken)({
        userId: user.id,
        role: user.role,
        providerId: providerUser?.providerId,
    });
    const refreshToken = (0, jwt_1.signRefreshToken)(user.id);
    await prisma_1.prisma.user.update({ where: { id: user.id }, data: { refreshToken } });
    await trackEvent({ type: 'LOGIN', userId: user.id });
    return {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        accessToken,
        refreshToken,
    };
}
async function refreshTokens(token) {
    let payload;
    try {
        payload = (0, jwt_1.verifyRefreshToken)(token);
    }
    catch {
        throw new errors_1.AppError('Refresh token inválido', 401);
    }
    const user = await prisma_1.prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.refreshToken !== token)
        throw new errors_1.AppError('Refresh token revogado', 401);
    const providerUser = await prisma_1.prisma.providerUser.findFirst({ where: { userId: user.id } });
    const accessToken = (0, jwt_1.signAccessToken)({ userId: user.id, role: user.role, providerId: providerUser?.providerId });
    const newRefresh = (0, jwt_1.signRefreshToken)(user.id);
    await prisma_1.prisma.user.update({ where: { id: user.id }, data: { refreshToken: newRefresh } });
    return { accessToken, refreshToken: newRefresh };
}
async function logoutUser(userId) {
    await prisma_1.prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
}
async function trackEvent(data) {
    await prisma_1.prisma.event.create({ data }).catch(() => { });
}
async function awardBadgeIfEarned(userId, slug) {
    const count = await prisma_1.prisma.user.count();
    if (count <= 100) {
        await prisma_1.prisma.userBadge.create({ data: { userId, slug } }).catch(() => { });
    }
}
//# sourceMappingURL=auth.service.js.map