"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const env_1 = require("./config/env");
const logger_1 = require("./config/logger");
const rateLimit_middleware_1 = require("./middlewares/rateLimit.middleware");
const errorHandler_middleware_1 = require("./middlewares/errorHandler.middleware");
const routes_1 = __importDefault(require("./routes"));
const webhook_routes_1 = __importDefault(require("./routes/webhook.routes"));
const cron_1 = require("./jobs/cron");
const prisma_1 = require("./config/prisma");
const app = (0, express_1.default)();
// Stripe webhooks need raw body BEFORE json parser
app.use('/webhooks', express_1.default.raw({ type: 'application/json' }), webhook_routes_1.default);
// Security
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: env_1.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Logging
if (env_1.env.NODE_ENV !== 'test') {
    app.use((0, morgan_1.default)('combined', { stream: { write: (msg) => logger_1.logger.info(msg.trim()) } }));
}
// Rate limiting
app.use(rateLimit_middleware_1.globalLimiter);
// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', env: env_1.env.NODE_ENV, ts: new Date().toISOString() }));
// API Routes
app.use('/api/v1', routes_1.default);
// Error handling
app.use(errorHandler_middleware_1.notFoundHandler);
app.use(errorHandler_middleware_1.errorHandler);
async function bootstrap() {
    try {
        await prisma_1.prisma.$connect();
        logger_1.logger.info('✅ Database connected');
        const server = app.listen(env_1.env.PORT, () => {
            logger_1.logger.info(`🚀 ConectaCG API running on port ${env_1.env.PORT} [${env_1.env.NODE_ENV}]`);
        });
        if (env_1.env.NODE_ENV === 'production') {
            (0, cron_1.startCronJobs)();
        }
        process.on('SIGTERM', async () => {
            logger_1.logger.info('SIGTERM received, shutting down...');
            await prisma_1.prisma.$disconnect();
            server.close(() => process.exit(0));
        });
    }
    catch (err) {
        logger_1.logger.error('Failed to start:', err);
        process.exit(1);
    }
}
bootstrap();
exports.default = app;
//# sourceMappingURL=server.js.map