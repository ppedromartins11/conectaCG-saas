import { prisma } from '../config/prisma'
import { AppError } from '../utils/errors'
import { sendLeadNotification } from './email.service'

interface CreateLeadDto {
  planId: string
  userId?: string
  name: string
  phone: string
  cep: string
}

export async function createLead(dto: CreateLeadDto) {
  const plan = await prisma.plan.findUnique({
    where: { id: dto.planId, isActive: true },
    include: { provider: { include: { account: true } } },
  })
  if (!plan) throw new AppError('Plano não encontrado', 404)

  const lead = await prisma.lead.create({
    data: {
      planId: dto.planId,
      providerId: plan.providerId,
      userId: dto.userId,
      name: dto.name.trim(),
      phone: dto.phone.trim(),
      cep: dto.cep.replace(/\D/g, '').slice(0, 8),
    },
  })

  await Promise.all([
    prisma.planConversion.create({ data: { planId: dto.planId, userId: dto.userId } }),
    prisma.plan.update({ where: { id: dto.planId }, data: { conversionCount: { increment: 1 } } }),
    prisma.event.create({ data: { type: 'LEAD_CAPTURED', userId: dto.userId, payload: { planId: dto.planId } } }),
  ]).catch(() => {})

  // Notify provider (webhook or email)
  const account = plan.provider.account
  if (account?.webhookUrl) {
    await sendWebhook(account.webhookUrl, { lead, plan: { name: plan.name, provider: plan.provider.name } })
  } else if (account?.contactEmail) {
    await sendLeadNotification(account.contactEmail, lead, plan).catch(() => {})
  }

  await prisma.lead.update({ where: { id: lead.id }, data: { notificationSent: true, providerNotifiedAt: new Date() } })

  return lead
}

export async function getLeadsByProvider(providerId: string, status?: string, page = 1, limit = 20) {
  const where: any = { providerId }
  if (status) where.status = status

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: { plan: { select: { name: true, downloadSpeed: true, price: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.lead.count({ where }),
  ])

  return { leads, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function updateLeadStatus(leadId: string, providerId: string, status: string) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } })
  if (!lead) throw new AppError('Lead não encontrado', 404)
  if (lead.providerId !== providerId) throw new AppError('Sem permissão', 403)

  return prisma.lead.update({ where: { id: leadId }, data: { status: status as any } })
}

async function sendWebhook(url: string, payload: unknown) {
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    })
  } catch (e) { /* ignore webhook failures */ }
}
