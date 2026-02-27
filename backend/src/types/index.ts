import { Request } from "express"

export interface AuthRequest extends Request {
  user?: any
}

export interface AuthPayload {
  userId: string
  role: string
  providerId?: string
}

export interface AuthRequest extends Request {
  user?: AuthPayload
}

export interface PaginationParams {
  page: number
  limit: number
  skip: number
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  meta?: Record<string, unknown>
}
