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
exports.getPlans = getPlans;
exports.getPlan = getPlan;
exports.clickPlan = clickPlan;
exports.createReview = createReview;
exports.getRecommendations = getRecommendations;
const planService = __importStar(require("../services/plan.service"));
const response_1 = require("../utils/response");
const errors_1 = require("../utils/errors");
const zod_1 = require("zod");
const reviewSchema = zod_1.z.object({
    nota: zod_1.z.number().int().min(1).max(5),
    comentario: zod_1.z.string().min(5).max(500),
});
async function getPlans(req, res, next) {
    try {
        const { cep, category, city } = req.query;
        const result = await planService.getPlans({
            cep,
            category,
            citySlug: city,
            userId: req.user?.userId,
            isLoggedIn: !!req.user,
        });
        return (0, response_1.ok)(res, result);
    }
    catch (err) {
        if (err instanceof errors_1.AppError)
            return res.status(err.statusCode).json({ success: false, error: err.message });
        return next(err);
    }
}
async function getPlan(req, res, next) {
    try {
        const plan = await planService.getPlanById(req.params.id, req.user?.userId, !!req.user);
        return (0, response_1.ok)(res, { plan });
    }
    catch (err) {
        if (err instanceof errors_1.AppError)
            return res.status(err.statusCode).json({ success: false, error: err.message });
        return next(err);
    }
}
async function clickPlan(req, res, next) {
    try {
        const ip = req.headers['x-forwarded-for']?.toString().split(',')[0] ?? req.ip;
        await planService.registerClick(req.params.id, req.user?.userId, ip);
        return (0, response_1.ok)(res, { success: true });
    }
    catch (err) {
        return next(err);
    }
}
async function createReview(req, res, next) {
    try {
        const data = reviewSchema.parse(req.body);
        const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/prisma')));
        const existing = await prisma.review.findUnique({
            where: { userId_planId: { userId: req.user.userId, planId: req.params.id } },
        });
        if (existing)
            return res.status(400).json({ success: false, error: 'Você já avaliou este plano' });
        const review = await prisma.review.create({
            data: { userId: req.user.userId, planId: req.params.id, nota: data.nota, comentario: data.comentario },
            include: { user: { select: { name: true } } },
        });
        await prisma.event.create({ data: { type: 'REVIEW_PUBLISHED', userId: req.user.userId, payload: { planId: req.params.id } } }).catch(() => { });
        return (0, response_1.created)(res, { review });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, error: err.errors[0].message });
        return next(err);
    }
}
async function getRecommendations(req, res, next) {
    try {
        const { pessoas, dispositivos, atividades, velocidadeAtual, cep } = req.body;
        const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/prisma')));
        await prisma.userProfile.upsert({
            where: { userId: req.user.userId },
            update: { pessoas, dispositivos, atividades, velocidadeAtual },
            create: { userId: req.user.userId, pessoas, dispositivos, atividades, velocidadeAtual },
        });
        const plans = await prisma.plan.findMany({
            where: { isActive: true, ...(cep && { cepsAtendidos: { has: cep.replace(/\D/g, '').slice(0, 5) } }) },
            include: {
                provider: { select: { name: true, color: true, slug: true } },
                reviews: { select: { nota: true } },
                _count: { select: { reviews: true } },
                favorites: { where: { userId: req.user.userId }, select: { id: true } },
            },
        });
        const scored = plans.map((p) => ({
            ...p,
            avgRating: p.reviews.length ? p.reviews.reduce((a, r) => a + r.nota, 0) / p.reviews.length : 0,
            isFavorited: p.favorites.length > 0,
            compatibilityScore: scoreplan(p, atividades ?? [], pessoas ?? 1),
            reviews: undefined,
            favorites: undefined,
        })).sort((a, b) => b.compatibilityScore - a.compatibilityScore);
        await prisma.event.create({ data: { type: 'QUESTIONNAIRE_COMPLETED', userId: req.user.userId } }).catch(() => { });
        return (0, response_1.ok)(res, { plans: scored });
    }
    catch (err) {
        return next(err);
    }
}
function scoreplan(plan, atividades, pessoas) {
    let s = 0;
    const actMap = {
        Gaming: { min: 300, cat: 'Gaming' }, Streaming: { min: 200, cat: 'Streaming' },
        'Home Office': { min: 150, cat: 'Trabalho' }, Estudos: { min: 100, cat: 'Trabalho' },
    };
    for (const act of atividades) {
        const c = actMap[act];
        if (!c)
            continue;
        s += plan.downloadSpeed >= c.min ? 20 : 8;
        if (plan.categorias.includes(c.cat))
            s += 15;
    }
    s += plan.downloadSpeed / pessoas >= 100 ? 20 : plan.downloadSpeed / pessoas >= 50 ? 10 : 3;
    s += plan.downloadSpeed / plan.price >= 4 ? 15 : 8;
    return s;
}
//# sourceMappingURL=plan.controller.js.map