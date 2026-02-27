"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TIER_STRIPE_PRICE = exports.TIER_MONTHLY_FEE = exports.stripe = void 0;
const stripe_1 = __importDefault(require("stripe"));
const env_1 = require("./env");
exports.stripe = env_1.env.STRIPE_SECRET_KEY
    ? new stripe_1.default(env_1.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" })
    : null;
exports.TIER_MONTHLY_FEE = {
    FREE: 0,
    STARTER: 497,
    GROWTH: 1297,
    ENTERPRISE: 2997,
};
exports.TIER_STRIPE_PRICE = {
    STARTER: env_1.env.STRIPE_PRICE_STARTER,
    GROWTH: env_1.env.STRIPE_PRICE_GROWTH,
    ENTERPRISE: env_1.env.STRIPE_PRICE_ENTERPRISE,
};
//# sourceMappingURL=stripe.js.map