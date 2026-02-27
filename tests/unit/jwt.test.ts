import { describe, it, expect } from 'vitest'
import { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } from '../../backend/src/utils/jwt'

process.env.JWT_SECRET = 'test-secret-key-at-least-ten-chars'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-ten-chars'
process.env.JWT_EXPIRES_IN = '1h'
process.env.JWT_REFRESH_EXPIRES_IN = '7d'

describe('JWT utils', () => {
  it('should sign and verify access token', () => {
    const payload = { userId: 'abc123', role: 'USER' }
    const token = signAccessToken(payload)
    const decoded = verifyAccessToken(token)
    expect(decoded.userId).toBe('abc123')
    expect(decoded.role).toBe('USER')
  })

  it('should sign and verify refresh token', () => {
    const token = signRefreshToken('abc123')
    const decoded = verifyRefreshToken(token)
    expect(decoded.userId).toBe('abc123')
  })

  it('should throw on invalid access token', () => {
    expect(() => verifyAccessToken('invalid.token.here')).toThrow()
  })
})
