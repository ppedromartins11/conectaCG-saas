import Redis from "ioredis"
import { env } from "./env"

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  enableOfflineQueue: false,
})

redis.on("error", (err) => {
  if (env.NODE_ENV !== "test") console.error("[Redis]:", err.message)
})
