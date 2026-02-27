import { stripe, TIER_STRIPE_PRICE, TIER_MONTHLY_FEE } from '../config/stripe'
import { prisma } from '../config/prisma'
import { AppError } from '../utils/errors'
import { env } from '../config/env'

export async function createCheckoutSession(providerId: string, tier: string) {
  if (!stripe) throw new AppError('Pagamentos não configurados', 503)

  const priceId = TIER_STRIPE_PRICE[tier]
  if (!priceId) throw new AppError('Plano inválido', 400)

  const account = await prisma.providerAccount.findUnique({ where: { providerId } })
  if (!account) throw new AppError('Conta de operadora não encontrada', 404)

  // Get or create Stripe customer
  let customerId = account.stripeCustomerId
  if (!customerId) {
    const provider = await prisma.provider.findUnique({ where: { id: providerId } })
    const customer = await stripe.customers.create({
      email: account.contactEmail ?? undefined,
      name: provider?.name,
      metadata: { providerId },
    })
    customerId = customer.id
    await prisma.providerAccount.update({
      where: { providerId },
      data: { stripeCustomerId: customerId },
    })
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.FRONTEND_URL}/b2b/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.FRONTEND_URL}/b2b/billing?cancelled=true`,
    metadata: { providerId, tier },
  })

  return { url: session.url }
}

export async function handleWebhook(rawBody: Buffer, signature: string) {
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) throw new AppError('Webhook não configurado', 503)

  let event: any
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET)
  } catch {
    throw new AppError('Assinatura de webhook inválida', 400)
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const { providerId, tier } = session.metadata
      await prisma.providerAccount.update({
        where: { providerId },
        data: {
          tier: tier as any,
          stripeSubId: session.subscription,
          isActive: true,
          monthlyFee: TIER_MONTHLY_FEE[tier] ?? 0,
        },
      })
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object
      const account = await prisma.providerAccount.findFirst({ where: { stripeSubId: sub.id } })
      if (account) {
        await prisma.providerAccount.update({
          where: { id: account.id },
          data: { tier: 'FREE', stripeSubId: null },
        })
      }
      break
    }
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object
      await prisma.payment.create({
        data: {
          stripePaymentId: invoice.id,
          amount: invoice.amount_paid / 100,
          status: 'SUCCEEDED',
          description: 'Assinatura ConectaCG B2B',
        },
      }).catch(() => {})
      break
    }
  }
}

export async function createBillingPortal(providerId: string) {
  if (!stripe) throw new AppError('Pagamentos não configurados', 503)

  const account = await prisma.providerAccount.findUnique({ where: { providerId } })
  if (!account?.stripeCustomerId) throw new AppError('Cliente Stripe não encontrado', 404)

  const session = await stripe.billingPortal.sessions.create({
    customer: account.stripeCustomerId,
    return_url: `${env.FRONTEND_URL}/b2b/billing`,
  })

  return { url: session.url }
}
