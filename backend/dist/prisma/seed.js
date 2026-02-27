"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding database...');
    // City: Campo Grande
    const campGrande = await prisma.city.upsert({
        where: { slug: 'campo-grande' },
        update: {},
        create: { name: 'Campo Grande', state: 'MS', slug: 'campo-grande', lat: -20.4697, lng: -54.6201, population: 906092, isActive: true, launchedAt: new Date() },
    });
    // Providers
    const claro = await prisma.provider.upsert({ where: { slug: 'claro' }, update: {}, create: { name: 'Claro', slug: 'claro', color: '#E02020', website: 'https://claro.com.br', isVerified: true } });
    const vivo = await prisma.provider.upsert({ where: { slug: 'vivo' }, update: {}, create: { name: 'Vivo', slug: 'vivo', color: '#6D28D9', website: 'https://vivo.com.br', isVerified: true } });
    const technet = await prisma.provider.upsert({ where: { slug: 'technet' }, update: {}, create: { name: 'TechNet', slug: 'technet', color: '#2563EB', isVerified: false } });
    // Provider accounts
    for (const p of [claro, vivo, technet]) {
        await prisma.providerAccount.upsert({
            where: { providerId: p.id }, update: {},
            create: { providerId: p.id, tier: p.slug === 'claro' ? 'GROWTH' : p.slug === 'vivo' ? 'STARTER' : 'FREE', isActive: true, contactName: `Admin ${p.name}`, contactEmail: `admin@${p.slug}.com.br` },
        });
    }
    // Provider cities
    for (const p of [claro, vivo, technet]) {
        await prisma.providerCity.upsert({
            where: { providerId_cityId: { providerId: p.id, cityId: campGrande.id } },
            update: {}, create: { providerId: p.id, cityId: campGrande.id },
        });
    }
    // Plans
    const CEPS = ['79000', '79001', '79002', '79003', '79004', '79005', '79006', '79007', '79008', '79010', '79020', '79030', '79040', '79050', '79060', '79070', '79080', '79090', '79100', '79110'];
    const week = new Date(Date.now() + 7 * 86400000);
    const plans = [
        { name: 'Fibra Premium 500MB', providerId: claro.id, downloadSpeed: 500, uploadSpeed: 250, price: 109.90, isSponsored: true, sponsorPriority: 10, promotionPrice: 89.90, promotionExpiresAt: week, promotionLabel: 'Oferta limitada', categorias: ['Gaming', 'Streaming', 'Trabalho'], servicosInclusos: ['Roteador Wi-Fi 6', 'IP fixo', 'Suporte 24h', 'Instalação grátis'], indicadoPara: ['Família grande', 'Gamers', 'Home office'], rankingScore: 88 },
        { name: 'Fibra 300MB', providerId: claro.id, downloadSpeed: 300, uploadSpeed: 150, price: 89.90, isSponsored: false, sponsorPriority: 0, categorias: ['Streaming', 'Trabalho'], servicosInclusos: ['Roteador Wi-Fi', 'Suporte 24h'], indicadoPara: ['Família média', 'Home office'], rankingScore: 72 },
        { name: 'Fibra Gamer 600MB', providerId: vivo.id, downloadSpeed: 600, uploadSpeed: 300, price: 129.90, isSponsored: true, sponsorPriority: 8, categorias: ['Gaming', 'Streaming'], servicosInclusos: ['Roteador Gaming', 'IP fixo', 'Suporte 24h', 'Instalação grátis'], indicadoPara: ['Gamers', 'Streamers'], rankingScore: 82 },
        { name: 'Vivo 200MB', providerId: vivo.id, downloadSpeed: 200, uploadSpeed: 100, price: 79.90, isSponsored: false, sponsorPriority: 0, categorias: ['Streaming', 'Trabalho'], servicosInclusos: ['Roteador Wi-Fi', 'Suporte comercial'], indicadoPara: ['Família pequena', 'Estudos'], rankingScore: 61 },
        { name: 'TechNet 150MB', providerId: technet.id, downloadSpeed: 150, uploadSpeed: 75, price: 69.90, isSponsored: false, sponsorPriority: 0, categorias: ['Trabalho'], servicosInclusos: ['Suporte comercial'], indicadoPara: ['Uso básico', 'Estudos'], rankingScore: 45 },
        { name: 'TechNet 400MB Plus', providerId: technet.id, downloadSpeed: 400, uploadSpeed: 200, price: 99.90, isSponsored: false, sponsorPriority: 0, categorias: ['Streaming', 'Gaming', 'Trabalho'], servicosInclusos: ['Roteador Wi-Fi', 'Suporte 24h'], indicadoPara: ['Família grande', 'Gamers'], rankingScore: 65 },
    ];
    for (const plan of plans) {
        const existing = await prisma.plan.findFirst({ where: { name: plan.name, providerId: plan.providerId } });
        if (!existing) {
            await prisma.plan.create({
                data: { ...plan, cityId: campGrande.id, cepsAtendidos: CEPS, fidelidade: 12, capacidade: 'Ilimitado' },
            });
        }
    }
    // Users
    const hash = await bcryptjs_1.default.hash('senha123', 12);
    const users = [
        { id: 'user-joao', name: 'João Silva', email: 'joao@email.com' },
        { id: 'user-maria', name: 'Maria Santos', email: 'maria@email.com' },
        { id: 'user-pedro', name: 'Pedro Costa', email: 'pedro@email.com' },
        { id: 'user-admin', name: 'Admin ConectaCG', email: 'admin@conectacg.net', role: 'SUPER_ADMIN' },
    ];
    for (const u of users) {
        await prisma.user.upsert({
            where: { email: u.email }, update: {},
            create: { ...u, password: hash },
        });
    }
    // Badges
    await prisma.userBadge.createMany({
        skipDuplicates: true,
        data: [
            { userId: 'user-joao', slug: 'EXPLORER' }, { userId: 'user-joao', slug: 'EARLY_ADOPTER' },
            { userId: 'user-maria', slug: 'EXPLORER' }, { userId: 'user-pedro', slug: 'EXPLORER' },
        ],
    });
    // Price snapshots
    const allPlans = await prisma.plan.findMany({ select: { id: true, price: true } });
    await prisma.priceSnapshot.createMany({ data: allPlans.map((p) => ({ planId: p.id, price: p.price })) });
    console.log('✅ Seed complete!');
    console.log('\n📋 Test credentials:');
    console.log('  User:  joao@email.com / senha123');
    console.log('  Admin: admin@conectacg.net / senha123');
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map