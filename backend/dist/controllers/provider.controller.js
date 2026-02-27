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
exports.registerProvider = registerProvider;
exports.getDashboard = getDashboard;
exports.getPlans = getPlans;
exports.createPlan = createPlan;
exports.updatePlan = updatePlan;
exports.deletePlan = deletePlan;
exports.getLeads = getLeads;
exports.updateLead = updateLead;
exports.createCheckout = createCheckout;
exports.billingPortal = billingPortal;
const providerService = __importStar(require("../services/provider.service"));
const leadService = __importStar(require("../services/lead.service"));
const paymentService = __importStar(require("../services/payment.service"));
const response_1 = require("../utils/response");
const errors_1 = require("../utils/errors");
const zod_1 = require("zod");
const registerSchema = zod_1.z.object({
    providerName: zod_1.z.string().min(2),
    slug: zod_1.z.string().min(2).regex(/^[a-z0-9-]+$/),
    cnpj: zod_1.z.string().optional(),
    website: zod_1.z.string().url().optional(),
    adminName: zod_1.z.string().min(2),
    adminEmail: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    contactPhone: zod_1.z.string().optional(),
});
const planSchema = zod_1.z.object({
    name: zod_1.z.string().min(3),
    downloadSpeed: zod_1.z.number().int().positive(),
    uploadSpeed: zod_1.z.number().int().positive(),
    price: zod_1.z.number().positive(),
    fidelidade: zod_1.z.number().int().default(12),
    capacidade: zod_1.z.string().optional(),
    servicosInclusos: zod_1.z.array(zod_1.z.string()).default([]),
    indicadoPara: zod_1.z.array(zod_1.z.string()).default([]),
    categorias: zod_1.z.array(zod_1.z.string()).default([]),
    cepsAtendidos: zod_1.z.array(zod_1.z.string()).default([]),
    promotionPrice: zod_1.z.number().optional(),
    promotionExpiresAt: zod_1.z.string().optional(),
    promotionLabel: zod_1.z.string().optional(),
    citySlug: zod_1.z.string().default('campo-grande'),
    isActive: zod_1.z.boolean().default(true),
});
async function registerProvider(req, res, next) {
    try {
        const data = registerSchema.parse(req.body);
        const result = await providerService.registerProvider(data);
        return (0, response_1.created)(res, result);
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, error: err.errors[0].message });
        if (err instanceof errors_1.AppError)
            return res.status(err.statusCode).json({ success: false, error: err.message });
        return next(err);
    }
}
async function getDashboard(req, res, next) {
    try {
        const providerId = req.user.role === 'SUPER_ADMIN'
            ? req.params.providerId
            : req.user.providerId;
        const data = await providerService.getProviderDashboard(providerId);
        return (0, response_1.ok)(res, data);
    }
    catch (err) {
        return next(err);
    }
}
async function getPlans(req, res, next) {
    try {
        const providerId = req.user.providerId;
        const plans = await providerService.getProviderPlans(providerId);
        return (0, response_1.ok)(res, { plans });
    }
    catch (err) {
        return next(err);
    }
}
async function createPlan(req, res, next) {
    try {
        const data = planSchema.parse(req.body);
        const plan = await providerService.createPlan(req.user.providerId, data);
        return (0, response_1.created)(res, { plan });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, error: err.errors[0].message });
        if (err instanceof errors_1.AppError)
            return res.status(err.statusCode).json({ success: false, error: err.message });
        return next(err);
    }
}
async function updatePlan(req, res, next) {
    try {
        const data = planSchema.partial().parse(req.body);
        const plan = await providerService.updatePlan(req.params.planId, req.user.providerId, data);
        return (0, response_1.ok)(res, { plan });
    }
    catch (err) {
        if (err instanceof errors_1.AppError)
            return res.status(err.statusCode).json({ success: false, error: err.message });
        return next(err);
    }
}
async function deletePlan(req, res, next) {
    try {
        const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/prisma')));
        const plan = await prisma.plan.findUnique({ where: { id: req.params.planId } });
        if (!plan || plan.providerId !== req.user.providerId) {
            return res.status(403).json({ success: false, error: 'Sem permissão' });
        }
        await prisma.plan.update({ where: { id: req.params.planId }, data: { isActive: false } });
        return (0, response_1.ok)(res, { message: 'Plano desativado com sucesso' });
    }
    catch (err) {
        return next(err);
    }
}
async function getLeads(req, res, next) {
    try {
        const { status, page, limit } = req.query;
        const data = await leadService.getLeadsByProvider(req.user.providerId, status, parseInt(page ?? '1'), parseInt(limit ?? '20'));
        return (0, response_1.ok)(res, data);
    }
    catch (err) {
        return next(err);
    }
}
async function updateLead(req, res, next) {
    try {
        const { status } = req.body;
        const lead = await leadService.updateLeadStatus(req.params.leadId, req.user.providerId, status);
        return (0, response_1.ok)(res, { lead });
    }
    catch (err) {
        if (err instanceof errors_1.AppError)
            return res.status(err.statusCode).json({ success: false, error: err.message });
        return next(err);
    }
}
async function createCheckout(req, res, next) {
    try {
        const { tier } = req.body;
        const data = await paymentService.createCheckoutSession(req.user.providerId, tier);
        return (0, response_1.ok)(res, data);
    }
    catch (err) {
        if (err instanceof errors_1.AppError)
            return res.status(err.statusCode).json({ success: false, error: err.message });
        return next(err);
    }
}
async function billingPortal(req, res, next) {
    try {
        const data = await paymentService.createBillingPortal(req.user.providerId);
        return (0, response_1.ok)(res, data);
    }
    catch (err) {
        if (err instanceof errors_1.AppError)
            return res.status(err.statusCode).json({ success: false, error: err.message });
        return next(err);
    }
}
//# sourceMappingURL=provider.controller.js.map