import { describe, it, expect } from 'vitest'
import { getPagination } from '../../backend/src/utils/pagination'

describe('getPagination', () => {
  const mockReq = (query: Record<string, string>) => ({ query }) as any

  it('should return defaults when no params', () => {
    const p = getPagination(mockReq({}))
    expect(p.page).toBe(1)
    expect(p.limit).toBe(20)
    expect(p.skip).toBe(0)
  })

  it('should parse page and limit', () => {
    const p = getPagination(mockReq({ page: '3', limit: '10' }))
    expect(p.page).toBe(3)
    expect(p.limit).toBe(10)
    expect(p.skip).toBe(20)
  })

  it('should cap limit at 100', () => {
    const p = getPagination(mockReq({ limit: '999' }))
    expect(p.limit).toBe(100)
  })

  it('should floor page at 1', () => {
    const p = getPagination(mockReq({ page: '-5' }))
    expect(p.page).toBe(1)
  })
})
