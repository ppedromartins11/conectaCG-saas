import cron from 'node-cron'
import { logger } from '../config/logger'
import { recalculateRankings } from '../services/plan.service'
import { processAlerts } from '../services/alert.service'
import { runScraper } from '../services/scraper.service'
import { captureAllPriceSnapshots } from './priceSnapshot.job'

export function startCronJobs() {
  // Recalculate rankings every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    logger.info('[Cron] Recalculating rankings...')
    await recalculateRankings().catch((e) => logger.error('[Cron] Rankings failed:', e.message))
  })

  // Process price alerts daily at 8am
  cron.schedule('0 8 * * *', async () => {
    logger.info('[Cron] Processing price alerts...')
    await processAlerts().catch((e) => logger.error('[Cron] Alerts failed:', e.message))
  })

  // Capture price snapshots daily at midnight
  cron.schedule('0 0 * * *', async () => {
    logger.info('[Cron] Capturing price snapshots...')
    await captureAllPriceSnapshots().catch((e) => logger.error('[Cron] Snapshots failed:', e.message))
  })

  // Run scraper every Monday at 6am
  cron.schedule('0 6 * * 1', async () => {
    logger.info('[Cron] Running scraper...')
    await runScraper().catch((e) => logger.error('[Cron] Scraper failed:', e.message))
  })

  logger.info('✅ Cron jobs started')
}
