"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.refresh = refresh;
exports.logout = logout;
exports.me = me;
const zod_1 = require("zod");
const authService = __importStar(require("../services/auth.service"));
const response_1 = require("../utils/response");
const errors_1 = require("../utils/errors");
const prisma_1 = require("../config/prisma");
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    email: zod_1.z.string().email().toLowerCase(),
    password: zod_1.z.string().min(6).max(100),
    address: zod_1.z.string().optional(),
    referralCode: zod_1.z.string().optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email().toLowerCase(),
    password: zod_1.z.string().min(1),
});
async function register(req, res, next) {
    try {
        const data = registerSchema.parse(req.body);
        const result = await authService.registerUser(data);
        return (0, response_1.created)(res, result);
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return (0, response_1.badRequest)(res, err.errors[0].message);
        if (err instanceof errors_1.AppError)
            return res.status(err.statusCode).json({ success: false, error: err.message });
        return next(err);
    }
}
async function login(req, res, next) {
    try {
        const data = loginSchema.parse(req.body);
        const result = await authService.loginUser(data.email, data.password);
        return (0, response_1.ok)(res, result);
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return (0, response_1.badRequest)(res, err.errors[0].message);
        if (err instanceof errors_1.AppError)
            return res.status(err.statusCode).json({ success: false, error: err.message });
        return next(err);
    }
}
async function refresh(req, res, next) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken)
            return (0, response_1.unauthorized)(res, 'Refresh token obrigatório');
        const result = await authService.refreshTokens(refreshToken);
        return (0, response_1.ok)(res, result);
    }
    catch (err) {
        if (err instanceof errors_1.AppError)
            return res.status(err.statusCode).json({ success: false, error: err.message });
        return next(err);
    }
}
async function logout(req, res, next) {
    try {
        if (req.user)
            await authService.logoutUser(req.user.userId);
        return (0, response_1.ok)(res, { message: 'Logout realizado com sucesso' });
    }
    catch (err) {
        return next(err);
    }
}
async function me(req, res, next) {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.userId },
            include: {
                profile: true,
                badges: { orderBy: { earnedAt: 'asc' } },
                _count: { select: { reviews: true, favorites: true } },
                providerUsers: { include: { provider: { select: { id: true, name: true, slug: true } } } },
            },
        });
        if (!user)
            return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
        return (0, response_1.ok)(res, {
            id: user.id, name: user.name, email: user.email, role: user.role,
            address: user.address, createdAt: user.createdAt, profile: user.profile,
            badges: user.badges, reviewCount: user._count.reviews,
            favoriteCount: user._count.favorites,
            provider: user.providerUsers[0]?.provider ?? null,
        });
    }
    catch (err) {
        return next(err);
    }
}
//# sourceMappingURL=auth.controller.js.map