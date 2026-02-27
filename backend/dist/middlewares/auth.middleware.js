"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.optionalAuth = optionalAuth;
exports.requireRole = requireRole;
exports.requireProviderAccess = requireProviderAccess;
const jwt_1 = require("../utils/jwt");
const response_1 = require("../utils/response");
const prisma_1 = require("../config/prisma");
function authenticate(req, res, next) {
    try {
        const header = req.headers.authorization;
        if (!header?.startsWith('Bearer '))
            return (0, response_1.unauthorized)(res);
        const token = header.split(' ')[1];
        const payload = (0, jwt_1.verifyAccessToken)(token);
        req.user = payload;
        return next();
    }
    catch {
        return (0, response_1.unauthorized)(res, 'Token inválido ou expirado');
    }
}
function optionalAuth(req, res, next) {
    try {
        const header = req.headers.authorization;
        if (header?.startsWith('Bearer ')) {
            const token = header.split(' ')[1];
            req.user = (0, jwt_1.verifyAccessToken)(token);
        }
    }
    catch { /* silent */ }
    return next();
}
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user)
            return (0, response_1.unauthorized)(res);
        if (!roles.includes(req.user.role))
            return (0, response_1.forbidden)(res);
        return next();
    };
}
async function requireProviderAccess(req, res, next) {
    if (!req.user)
        return (0, response_1.unauthorized)(res);
    if (req.user.role === 'SUPER_ADMIN')
        return next();
    const providerUser = await prisma_1.prisma.providerUser.findFirst({
        where: { userId: req.user.userId },
        include: { provider: { include: { account: true } } },
    });
    if (!providerUser)
        return (0, response_1.forbidden)(res, 'Sem acesso a nenhuma operadora');
    req.user.providerId = providerUser.providerId;
    return next();
}
//# sourceMappingURL=auth.middleware.js.map