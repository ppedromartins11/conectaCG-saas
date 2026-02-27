"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCheckoutSession = createCheckoutSession;
exports.handleWebhook = handleWebhook;
exports.createBillingPortal = createBillingPortal;
const stripe_1 = require("../config/stripe");
const prisma_1 = require("../config/prisma");
const errors_1 = require("../utils/errors");
const env_1 = require("../config/env");
async function createCheckoutSession(providerId, tier) {
    if (!stripe_1.stripe)
        throw new errors_1.AppError('Pagamentos não configurados', 503);
    const priceId = stripe_1.TIER_STRIPE_PRICE[tier];
    if (!priceId)
        throw new errors_1.AppError('Plano inválido', 400);
    const account = await prisma_1.prisma.providerAccount.findUnique({ where: { providerId } });
    if (!account)
        throw new errors_1.AppError('Conta de operadora não encontrada', 404);
    // Get or create Stripe customer
    let customerId = account.stripeCustomerId;
    if (!customerId) {
        const provider = await prisma_1.prisma.provider.findUnique({ where: { id: providerId } });
        const customer = await stripe_1.stripe.customers.create({
            email: account.contactEmail ?? undefined,
            name: provider?.name,
            metadata: { providerId },
        });
        customerId = customer.id;
        await prisma_1.prisma.providerAccount.update({
            where: { providerId },
            data: { stripeCustomerId: customerId },
        });
    }
    const session = await stripe_1.stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${env_1.env.FRONTEND_URL}/b2b/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env_1.env.FRONTEND_URL}/b2b/billing?cancelled=true`,
        metadata: { providerId, tier },
    });
    return { url: session.url };
}
async function handleWebhook(rawBody, signature) {
    if (!stripe_1.stripe || !env_1.env.STRIPE_WEBHOOK_SECRET)
        throw new errors_1.AppError('Webhook não configurado', 503);
    let event;
    try {
        event = stripe_1.stripe.webhooks.constructEvent(rawBody, signature, env_1.env.STRIPE_WEBHOOK_SECRET);
    }
    catch {
        throw new errors_1.AppError('Assinatura de webhook inválida', 400);
    }
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object;
            const { providerId, tier } = session.metadata;
            await prisma_1.prisma.providerAccount.update({
                where: { providerId },
                data: {
                    tier: tier,
                    stripeSubId: session.subscription,
                    isActive: true,
                    monthlyFee: stripe_1.TIER_MONTHLY_FEE[tier] ?? 0,
                },
            });
            break;
        }
        case 'customer.subscription.deleted': {
            const sub = event.data.object;
            const account = await prisma_1.prisma.providerAccount.findFirst({ where: { stripeSubId: sub.id } });
            if (account) {
                await prisma_1.prisma.providerAccount.update({
                    where: { id: account.id },
                    data: { tier: 'FREE', stripeSubId: null },
                });
            }
            break;
        }
        case 'invoice.payment_succeeded': {
            const invoice = event.data.object;
            await prisma_1.prisma.payment.create({
                data: {
                    stripePaymentId: invoice.id,
                    amount: invoice.amount_paid / 100,
                    status: 'SUCCEEDED',
                    description: 'Assinatura ConectaCG B2B',
                },
            }).catch(() => { });
            break;
        }
    }
}
async function createBillingPortal(providerId) {
    if (!stripe_1.stripe)
        throw new errors_1.AppError('Pagamentos não configurados', 503);
    const account = await prisma_1.prisma.providerAccount.findUnique({ where: { providerId } });
    if (!account?.stripeCustomerId)
        throw new errors_1.AppError('Cliente Stripe não encontrado', 404);
    const session = await stripe_1.stripe.billingPortal.sessions.create({
        customer: account.stripeCustomerId,
        return_url: `${env_1.env.FRONTEND_URL}/b2b/billing`,
    });
    return { url: session.url };
}
//# sourceMappingURL=payment.service.js.map