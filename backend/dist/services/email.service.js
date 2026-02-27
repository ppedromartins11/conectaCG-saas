"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendLeadNotification = sendLeadNotification;
exports.sendPriceAlert = sendPriceAlert;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../config/env");
const logger_1 = require("../config/logger");
const transporter = env_1.env.SMTP_HOST
    ? nodemailer_1.default.createTransport({
        host: env_1.env.SMTP_HOST,
        port: env_1.env.SMTP_PORT,
        auth: { user: env_1.env.SMTP_USER, pass: env_1.env.SMTP_PASS },
    })
    : null;
async function sendLeadNotification(to, lead, plan) {
    if (!transporter) {
        logger_1.logger.warn('[Email] SMTP not configured, skipping lead notification');
        return;
    }
    await transporter.sendMail({
        from: env_1.env.EMAIL_FROM,
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
      <p>Acesse seu painel em <a href="${env_1.env.FRONTEND_URL}/b2b">ConectaCG B2B</a></p>
    `,
    });
}
async function sendPriceAlert(to, plans, criteria) {
    if (!transporter)
        return;
    const planList = plans.map((p) => `<li><b>${p.name}</b> (${p.provider.name}) - R$ ${p.price.toFixed(2)} | ${p.downloadSpeed} Mbps</li>`).join('');
    await transporter.sendMail({
        from: env_1.env.EMAIL_FROM,
        to,
        subject: '🔔 Alerta ConectaCG: Planos que combinam com você!',
        html: `
      <h2>Encontramos planos dentro do seu critério!</h2>
      <p>CEP: ${criteria.cep} | Preço máximo: R$ ${criteria.maxPrice}</p>
      <ul>${planList}</ul>
      <a href="${env_1.env.FRONTEND_URL}/planos">Ver planos</a>
    `,
    });
}
//# sourceMappingURL=email.service.js.map