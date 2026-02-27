"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().default(4000),
    DATABASE_URL: zod_1.z.string(),
    REDIS_URL: zod_1.z.string().default('redis://localhost:6379'),
    JWT_SECRET: zod_1.z.string().min(10),
    JWT_EXPIRES_IN: zod_1.z.string().default('7d'),
    JWT_REFRESH_SECRET: zod_1.z.string().min(10),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('30d'),
    FRONTEND_URL: zod_1.z.string().default('http://localhost:3000'),
    STRIPE_SECRET_KEY: zod_1.z.string().optional(),
    STRIPE_WEBHOOK_SECRET: zod_1.z.string().optional(),
    STRIPE_PRICE_STARTER: zod_1.z.string().optional(),
    STRIPE_PRICE_GROWTH: zod_1.z.string().optional(),
    STRIPE_PRICE_ENTERPRISE: zod_1.z.string().optional(),
    SMTP_HOST: zod_1.z.string().optional(),
    SMTP_PORT: zod_1.z.coerce.number().default(587),
    SMTP_USER: zod_1.z.string().optional(),
    SMTP_PASS: zod_1.z.string().optional(),
    EMAIL_FROM: zod_1.z.string().default('ConectaCG <noreply@conectacg.net>'),
    ADMIN_EMAIL: zod_1.z.string().default('admin@conectacg.net'),
    ADMIN_PASSWORD: zod_1.z.string().default('admin123'),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    process.exit(1);
}
exports.env = parsed.data;
//# sourceMappingURL=env.js.map