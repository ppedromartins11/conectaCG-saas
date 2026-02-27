"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCronJobs = startCronJobs;
const node_cron_1 = __importDefault(require("node-cron"));
const logger_1 = require("../config/logger");
const plan_service_1 = require("../services/plan.service");
const alert_service_1 = require("../services/alert.service");
const scraper_service_1 = require("../services/scraper.service");
const priceSnapshot_job_1 = require("./priceSnapshot.job");
function startCronJobs() {
    // Recalculate rankings every 6 hours
    node_cron_1.default.schedule('0 */6 * * *', async () => {
        logger_1.logger.info('[Cron] Recalculating rankings...');
        await (0, plan_service_1.recalculateRankings)().catch((e) => logger_1.logger.error('[Cron] Rankings failed:', e.message));
    });
    // Process price alerts daily at 8am
    node_cron_1.default.schedule('0 8 * * *', async () => {
        logger_1.logger.info('[Cron] Processing price alerts...');
        await (0, alert_service_1.processAlerts)().catch((e) => logger_1.logger.error('[Cron] Alerts failed:', e.message));
    });
    // Capture price snapshots daily at midnight
    node_cron_1.default.schedule('0 0 * * *', async () => {
        logger_1.logger.info('[Cron] Capturing price snapshots...');
        await (0, priceSnapshot_job_1.captureAllPriceSnapshots)().catch((e) => logger_1.logger.error('[Cron] Snapshots failed:', e.message));
    });
    // Run scraper every Monday at 6am
    node_cron_1.default.schedule('0 6 * * 1', async () => {
        logger_1.logger.info('[Cron] Running scraper...');
        await (0, scraper_service_1.runScraper)().catch((e) => logger_1.logger.error('[Cron] Scraper failed:', e.message));
    });
    logger_1.logger.info('✅ Cron jobs started');
}
//# sourceMappingURL=cron.js.map