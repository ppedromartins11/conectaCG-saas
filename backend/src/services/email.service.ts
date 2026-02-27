import nodemailer from 'nodemailer'
import { env } from '../config/env'
import { logger } from '../config/logger'

const transporter = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    })
  : null

export async function sendLeadNotification(to: string, lead: any, plan: any) {
  if (!transporter) {
    logger.warn('[Email] SMTP not configured, skipping lead notification')
    return
  }

  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject: `🎯 Novo lead: ${lead.name} interessado em ${plan.name}`,
    html: `
      <h2>Novo lead recebido no ConectaCG</h2>
      <table>
        <tr><td><b>Nome:</b></td><td>${lead.name}</td></tr>
        <tr><td><b>Telefone:</b></td><td>${lead.phone}</td></tr>
        <tr><td><b>CEP:</b></td><td>${lead.cep}</td></tr>
        <tr><td><b>Plano:</b></td><td>${plan.name}</td></tr>
        <tr><td><b>Data:</b></td><td>${new Date().toLocaleString('pt-BR')}</td></tr>
      </table>
      <p>Acesse seu painel em <a href="${env.FRONTEND_URL}/b2b">ConectaCG B2B</a></p>
    `,
  })
}

export async function sendPriceAlert(to: string, plans: any[], criteria: any) {
  if (!transporter) return

  const planList = plans.map((p) =>
    `<li><b>${p.name}</b> (${p.provider.name}) - R$ ${p.price.toFixed(2)} | ${p.downloadSpeed} Mbps</li>`
  ).join('')

  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject: '🔔 Alerta ConectaCG: Planos que combinam com você!',
    html: `
      <h2>Encontramos planos dentro do seu critério!</h2>
      <p>CEP: ${criteria.cep} | Preço máximo: R$ ${criteria.maxPrice}</p>
      <ul>${planList}</ul>
      <a href="${env.FRONTEND_URL}/planos">Ver planos</a>
    `,
  })
}
