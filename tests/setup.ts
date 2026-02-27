import { beforeAll, afterAll } from 'vitest'

process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? ''
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-chars-long'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-chars-long'
process.env.JWT_EXPIRES_IN = '1h'
process.env.JWT_REFRESH_EXPIRES_IN = '7d'
process.env.REDIS_URL = 'redis://localhost:6379'
process.env.FRONTEND_URL = 'http://localhost:3000'

beforeAll(async () => {
  console.log('🧪 Test suite starting...')
})

afterAll(async () => {
  console.log('🧪 Test suite complete')
})
