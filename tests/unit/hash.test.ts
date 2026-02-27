import { describe, it, expect } from 'vitest'
import { hashPassword, comparePassword } from '../../backend/src/utils/hash'

describe('hash utils', () => {
  it('should hash a password', async () => {
    const hash = await hashPassword('senha123')
    expect(hash).not.toBe('senha123')
    expect(hash.startsWith('$2b$')).toBe(true)
  })

  it('should verify correct password', async () => {
    const hash = await hashPassword('senha123')
    expect(await comparePassword('senha123', hash)).toBe(true)
  })

  it('should reject wrong password', async () => {
    const hash = await hashPassword('senha123')
    expect(await comparePassword('errada', hash)).toBe(false)
  })
})
