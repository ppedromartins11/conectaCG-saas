import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../../backend/src/server'
import { prisma } from '../../backend/src/config/prisma'

const TEST_EMAIL = `test_${Date.now()}@integration.com`

beforeAll(async () => {
  await prisma.$connect()
})

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: 'integration.com' } } })
  await prisma.$disconnect()
})

describe('POST /api/v1/auth/register', () => {
  it('should register a new user', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Integration Test User',
      email: TEST_EMAIL,
      password: 'senha123',
    })
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.accessToken).toBeDefined()
    expect(res.body.data.user.email).toBe(TEST_EMAIL)
  })

  it('should reject duplicate email', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Duplicate User',
      email: TEST_EMAIL,
      password: 'senha123',
    })
    expect(res.status).toBe(409)
    expect(res.body.success).toBe(false)
  })

  it('should reject invalid email', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Bad User',
      email: 'not-an-email',
      password: 'senha123',
    })
    expect(res.status).toBe(400)
  })

  it('should reject short password', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Bad User',
      email: 'another@integration.com',
      password: '123',
    })
    expect(res.status).toBe(400)
  })
})

describe('POST /api/v1/auth/login', () => {
  it('should login with valid credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: TEST_EMAIL,
      password: 'senha123',
    })
    expect(res.status).toBe(200)
    expect(res.body.data.accessToken).toBeDefined()
    expect(res.body.data.refreshToken).toBeDefined()
  })

  it('should reject wrong password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: TEST_EMAIL,
      password: 'senhaerrada',
    })
    expect(res.status).toBe(401)
  })

  it('should reject non-existent user', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'naoexiste@integration.com',
      password: 'senha123',
    })
    expect(res.status).toBe(401)
  })
})

describe('GET /api/v1/auth/me', () => {
  it('should return user profile with valid token', async () => {
    const login = await request(app).post('/api/v1/auth/login').send({ email: TEST_EMAIL, password: 'senha123' })
    const token = login.body.data.accessToken

    const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.email).toBe(TEST_EMAIL)
  })

  it('should reject missing token', async () => {
    const res = await request(app).get('/api/v1/auth/me')
    expect(res.status).toBe(401)
  })

  it('should reject invalid token', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', 'Bearer invalid.token')
    expect(res.status).toBe(401)
  })
})
