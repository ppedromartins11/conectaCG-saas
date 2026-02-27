import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../../backend/src/server'
import { prisma } from '../../backend/src/config/prisma'

let token: string

beforeAll(async () => {
  await prisma.$connect()
  const res = await request(app).post('/api/v1/auth/login').send({ email: 'joao@email.com', password: 'senha123' })
  token = res.body.data?.accessToken ?? ''
})

afterAll(async () => { await prisma.$disconnect() })

describe('GET /api/v1/plans', () => {
  it('should return plans for visitors (max 2, masked)', async () => {
    const res = await request(app).get('/api/v1/plans?cep=79000')
    expect(res.status).toBe(200)
    expect(res.body.data.plans.length).toBeLessThanOrEqual(2)
    expect(res.body.data.isLoggedIn).toBe(false)
    if (res.body.data.plans.length > 0) {
      expect(res.body.data.plans[0].downloadSpeed).toBeNull()
      expect(res.body.data.plans[0]._masked).toBe(true)
    }
  })

  it('should return all plans for authenticated users', async () => {
    const res = await request(app)
      .get('/api/v1/plans?cep=79000')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.isLoggedIn).toBe(true)
    if (res.body.data.plans.length > 0) {
      expect(res.body.data.plans[0].downloadSpeed).toBeDefined()
      expect(res.body.data.plans[0].downloadSpeed).not.toBeNull()
    }
  })

  it('should filter by category', async () => {
    const res = await request(app)
      .get('/api/v1/plans?cep=79000&category=Gaming')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    for (const p of res.body.data.plans) {
      expect(p.categorias).toContain('Gaming')
    }
  })
})

describe('GET /api/v1/plans/:id', () => {
  it('should return plan details', async () => {
    const plansRes = await request(app).get('/api/v1/plans').set('Authorization', `Bearer ${token}`)
    if (plansRes.body.data.plans.length === 0) return

    const planId = plansRes.body.data.plans[0].id
    const res = await request(app).get(`/api/v1/plans/${planId}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.plan.id).toBe(planId)
  })

  it('should return 404 for non-existent plan', async () => {
    const res = await request(app).get('/api/v1/plans/non-existent-id').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})
