import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source])
    if (!result.success) {
      const error = result.error.errors[0]
      return res.status(400).json({
        success: false,
        error: `${error.path.join('.')}: ${error.message}`,
      })
    }
    req[source] = result.data
    return next()
  }
}
