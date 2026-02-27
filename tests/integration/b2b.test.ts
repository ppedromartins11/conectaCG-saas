import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../../backend/src/server'
import { prisma } from '../../backend/src/config/prisma'

const PROVIDER_EMAIL = `b2b_${Date.now()}@integration.com`
let providerToken: string
let testPlanId: string

beforeAll(async () => {
  await prisma.$connect()

  // Register provider
  await request(app).post('/api/v1/b2b/register').send({
    providerName: 'Integration ISP',
    slug: `isp-test-${Date.now()}`,
    adminName: 'B2B Admin',
    adminEmail: PROVIDER_EMAIL,
    password: 'senha12345',
  })

  // Login as provider
  const login = await request(app).post('/api/v1/auth/login').send({
    email: PROVIDER_EMAIL,
    password: 'senha12345',
  })
  providerToken = login.body.data?.accessToken ?? ''
})

afterAll(async () => {
  await prisma.planDailyMetric.deleteMany({ where: { plan: { name: 'Integration Test Plan' } } })
  await prisma.plan.deleteMany({ where: { name: 'Integration Test Plan' } })
  await prisma.user.deleteMany({ where: { email: { contains: 'integration.com' } } })
  await prisma.provider.deleteMany({ where: { name: 'Integration ISP' } })
  await prisma.$disconnect()
})

describe('POST /api/v1/b2b/register', () => {
  it('should reject duplicate provider email', async () => {
    const res = await request(app).post('/api/v1/b2b/register').send({
      providerName: 'Another ISP',
      slug: `another-${Date.now()}`,
      adminName: 'Admin',
      adminEmail: PROVIDER_EMAIL,
      password: 'senha12345',
    })
    expect(res.status).toBe(409)
  })
})

describe('GET /api/v1/b2b/dashboard', () => {
  it('should return dashboard for authenticated provider', async () => {
    const res = await request(app)
      .get('/api/v1/b2b/dashboard')
      .set('Authorization', `Bearer ${providerToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data.metrics).toBeDefined()
    expect(res.body.data.metrics.totalPlans).toBeDefined()
  })

  it('should reject unauthenticated access', async () => {
    const res = await request(app).get('/api/v1/b2b/dashboard')
    expect(res.status).toBe(401)
  })
})

describe('POST /api/v1/b2b/plans', () => {
  it('should create a plan', async () => {
    const res = await request(app)
      .post('/api/v1/b2b/plans')
      .set('Authorization', `Bearer ${providerToken}`)
      .send({
        name: 'Integration Test Plan',
        downloadSpeed: 200,
        uploadSpeed: 100,
        price: 89.90,
        categorias: ['Streaming'],
        cepsAtendidos: ['79000'],
      })

    expect(res.status).toBe(201)
    expect(res.body.data.plan.name).toBe('Integration Test Plan')
    testPlanId = res.body.data.plan.id
  })

  it('should reject plan without required fields', async () => {
    const res = await request(app)
      .post('/api/v1/b2b/plans')
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ name: 'Incomplete Plan' })
    expect(res.status).toBe(400)
  })
})

describe('GET /api/v1/b2b/leads', () => {
  it('should return leads for provider', async () => {
    const res = await request(app)
      .get('/api/v1/b2b/leads')
      .set('Authorization', `Bearer ${providerToken}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data.leads)).toBe(true)
  })
})
