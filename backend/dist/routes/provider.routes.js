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
const express_1 = require("express");
const ctrl = __importStar(require("../controllers/provider.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rateLimit_middleware_1 = require("../middlewares/rateLimit.middleware");
const router = (0, express_1.Router)();
// Public: register new provider
router.post('/register', rateLimit_middleware_1.registerLimiter, ctrl.registerProvider);
// Protected B2B routes
router.get('/dashboard', auth_middleware_1.authenticate, auth_middleware_1.requireProviderAccess, ctrl.getDashboard);
router.get('/dashboard/:providerId', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('SUPER_ADMIN'), ctrl.getDashboard);
router.get('/plans', auth_middleware_1.authenticate, auth_middleware_1.requireProviderAccess, ctrl.getPlans);
router.post('/plans', auth_middleware_1.authenticate, auth_middleware_1.requireProviderAccess, ctrl.createPlan);
router.put('/plans/:planId', auth_middleware_1.authenticate, auth_middleware_1.requireProviderAccess, ctrl.updatePlan);
router.delete('/plans/:planId', auth_middleware_1.authenticate, auth_middleware_1.requireProviderAccess, ctrl.deletePlan);
router.get('/leads', auth_middleware_1.authenticate, auth_middleware_1.requireProviderAccess, ctrl.getLeads);
router.patch('/leads/:leadId', auth_middleware_1.authenticate, auth_middleware_1.requireProviderAccess, ctrl.updateLead);
// Billing
router.post('/billing/checkout', auth_middleware_1.authenticate, auth_middleware_1.requireProviderAccess, ctrl.createCheckout);
router.post('/billing/portal', auth_middleware_1.authenticate, auth_middleware_1.requireProviderAccess, ctrl.billingPortal);
exports.default = router;
//# sourceMappingURL=provider.routes.js.map