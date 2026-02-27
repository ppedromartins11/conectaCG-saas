"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.captureAllPriceSnapshots = captureAllPriceSnapshots;
const prisma_1 = require("../config/prisma");
const logger_1 = require("../config/logger");
async function captureAllPriceSnapshots() {
    const plans = await prisma_1.prisma.plan.findMany({ where: { isActive: true }, select: { id: true, price: true } });
    const data = plans.map((p) => ({ planId: p.id, price: p.price }));
    await prisma_1.prisma.priceSnapshot.createMany({ data });
    logger_1.logger.info(`[PriceSnapshot] Captured ${data.length} snapshots`);
    return data.length;
}
//# sourceMappingURL=priceSnapshot.job.js.map