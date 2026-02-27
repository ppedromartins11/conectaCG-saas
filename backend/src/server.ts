import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/env'
import { logger } from './config/logger'
import { globalLimiter } from './middlewares/rateLimit.middleware'
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.middleware'
import router from './routes'
import webhookRouter from './routes/webhook.routes'
import { startCronJobs } from './jobs/cron'
import { prisma } from './config/prisma'

const app = express()

// Stripe webhooks need raw body BEFORE json parser
app.use('/webhooks', express.raw({ type: 'application/json' }), webhookRouter)

// Security
app.use(helmet())
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}))

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }))
}

// Rate limiting
app.use(globalLimiter)

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', env: env.NODE_ENV, ts: new Date().toISOString() }))

// API Routes
app.use('/api/v1', router)

// Error handling
app.use(notFoundHandler)
app.use(errorHandler)

async function bootstrap() {
  try {
    await prisma.$connect()
    logger.info('✅ Database connected')

    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 ConectaCG API running on port ${env.PORT} [${env.NODE_ENV}]`)
    })

    if (env.NODE_ENV === 'production') {
      startCronJobs()
    }

    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down...')
      await prisma.$disconnect()
      server.close(() => process.exit(0))
    })
  } catch (err) {
    logger.error('Failed to start:', err)
    process.exit(1)
  }
}

bootstrap()

export default app
