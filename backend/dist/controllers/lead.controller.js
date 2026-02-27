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
exports.captureLead = captureLead;
const leadService = __importStar(require("../services/lead.service"));
const response_1 = require("../utils/response");
const errors_1 = require("../utils/errors");
const zod_1 = require("zod");
const schema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    phone: zod_1.z.string().min(8).max(20),
    cep: zod_1.z.string().min(5).max(9),
});
async function captureLead(req, res, next) {
    try {
        const data = schema.parse(req.body);
        const lead = await leadService.createLead({
            planId: req.params.planId,
            userId: req.user?.userId,
            ...data,
        });
        return (0, response_1.created)(res, { lead, message: 'Interesse registrado! A operadora entrará em contato.' });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, error: err.errors[0].message });
        if (err instanceof errors_1.AppError)
            return res.status(err.statusCode).json({ success: false, error: err.message });
        return next(err);
    }
}
//# sourceMappingURL=lead.controller.js.map