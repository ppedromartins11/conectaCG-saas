"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerLimiter = exports.searchLimiter = exports.authLimiter = exports.globalLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("../config/env");
const skip = () => env_1.env.NODE_ENV === 'test';
exports.globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60_000,
    max: 100,
    skip,
    message: { success: false, error: 'Muitas requisições. Tente novamente em instantes.' },
    standardHeaders: true,
    legacyHeaders: false,
});
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60_000, // 15 min
    max: 10,
    skip,
    message: { success: false, error: 'Muitas tentativas de login. Aguarde 15 minutos.' },
});
exports.searchLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60_000,
    max: 30,
    skip,
    message: { success: false, error: 'Limite de buscas atingido.' },
});
exports.registerLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60_000, // 1h
    max: 5,
    skip,
    message: { success: false, error: 'Limite de cadastros atingido.' },
});
//# sourceMappingURL=rateLimit.middleware.js.map