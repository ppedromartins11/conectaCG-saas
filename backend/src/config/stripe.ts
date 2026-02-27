import Stripe from "stripe"
import { env } from "./env"

export const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" })
  : null

export const TIER_MONTHLY_FEE: Record<string, number> = {
  FREE: 0,
  STARTER: 497,
  GROWTH: 1297,
  ENTERPRISE: 2997,
}

export const TIER_STRIPE_PRICE: Record<string, string | undefined> = {
  STARTER: env.STRIPE_PRICE_STARTER,
  GROWTH: env.STRIPE_PRICE_GROWTH,
  ENTERPRISE: env.STRIPE_PRICE_ENTERPRISE,
}
