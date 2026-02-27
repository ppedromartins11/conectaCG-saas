import { Response } from 'express'
import { ApiResponse } from '../types'

export function ok<T>(res: Response, data: T, meta?: Record<string, unknown>) {
  return res.json({ success: true, data, ...(meta && { meta }) })
}

export function created<T>(res: Response, data: T) {
  return res.status(201).json({ success: true, data })
}

export function noContent(res: Response) {
  return res.status(204).send()
}

export function badRequest(res: Response, error: string) {
  return res.status(400).json({ success: false, error })
}

export function unauthorized(res: Response, error = 'Não autorizado') {
  return res.status(401).json({ success: false, error })
}

export function forbidden(res: Response, error = 'Acesso negado') {
  return res.status(403).json({ success: false, error })
}

export function notFound(res: Response, error = 'Não encontrado') {
  return res.status(404).json({ success: false, error })
}

export function conflict(res: Response, error: string) {
  return res.status(409).json({ success: false, error })
}

export function serverError(res: Response, error = 'Erro interno do servidor') {
  return res.status(500).json({ success: false, error })
}
