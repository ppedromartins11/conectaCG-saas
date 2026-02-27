"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runScraper = runScraper;
const prisma_1 = require("../config/prisma");
const logger_1 = require("../config/logger");
const CAMPO_GRANDE_CEPS = ['79000', '79001', '79002', '79003', '79004', '79005',
    '79006', '79007', '79008', '79009', '79010', '79020', '79030', '79040',
    '79050', '79060', '79070', '79080', '79090', '79100', '79110', '79120'];
const OPERATOR_SOURCES = [
    {
        name: 'claro',
        url: 'https://www.claro.com.br/residencial/internet',
        parseHint: 'claro-fibra',
    },
    {
        name: 'vivo',
        url: 'https://www.vivo.com.br/para-voce/fibra-optica',
        parseHint: 'vivo-fibra',
    },
];
async function runScraper() {
    logger_1.logger.info('[Scraper] Starting ethical data ingestion...');
    const city = await prisma_1.prisma.city.findFirst({ where: { slug: 'campo-grande', isActive: true } });
    if (!city) {
        logger_1.logger.warn('[Scraper] Campo Grande city not found or inactive');
        return;
    }
    let totalUpdated = 0;
    for (const source of OPERATOR_SOURCES) {
        try {
            await delay(2000); // Respect server rate limits
            const provider = await prisma_1.prisma.provider.findUnique({ where: { slug: source.name } });
            if (!provider) {
                logger_1.logger.warn(`[Scraper] Provider ${source.name} not found in DB, skipping`);
                continue;
            }
            // Check robots.txt first
            const robotsAllowed = await checkRobotsTxt(source.url);
            if (!robotsAllowed) {
                logger_1.logger.info(`[Scraper] robots.txt disallows scraping ${source.url}`);
                continue;
            }
            const plans = await fetchPublicPlans(source.url, source.parseHint);
            for (const plan of plans) {
                // Upsert plan (update if exists, create if new)
                const existing = await prisma_1.prisma.plan.findFirst({
                    where: { providerId: provider.id, name: plan.name, cityId: city.id },
                });
                if (existing) {
                    // Only update price if changed (triggers price snapshot)
                    if (existing.price !== plan.price) {
                        await prisma_1.prisma.priceSnapshot.create({ data: { planId: existing.id, price: existing.price } });
                        await prisma_1.prisma.plan.update({
                            where: { id: existing.id },
                            data: { price: plan.price, scrapedAt: new Date() },
                        });
                        totalUpdated++;
                    }
                }
                else {
                    await prisma_1.prisma.plan.create({
                        data: {
                            cityId: city.id,
                            providerId: provider.id,
                            name: plan.name,
                            downloadSpeed: plan.downloadSpeed,
                            uploadSpeed: plan.uploadSpeed,
                            price: plan.price,
                            servicosInclusos: plan.servicosInclusos,
                            categorias: plan.categorias,
                            cepsAtendidos: CAMPO_GRANDE_CEPS,
                            sourceUrl: plan.sourceUrl,
                            isScraped: true,
                            scrapedAt: new Date(),
                        },
                    });
                    totalUpdated++;
                }
            }
            logger_1.logger.info(`[Scraper] ${source.name}: processed ${plans.length} plans`);
        }
        catch (err) {
            logger_1.logger.error(`[Scraper] Error processing ${source.name}: ${err.message}`);
        }
    }
    logger_1.logger.info(`[Scraper] Done. Updated/created ${totalUpdated} plans`);
    return totalUpdated;
}
async function checkRobotsTxt(siteUrl) {
    try {
        const url = new URL(siteUrl);
        const robotsUrl = `${url.protocol}//${url.host}/robots.txt`;
        const res = await fetch(robotsUrl, {
            headers: { 'User-Agent': 'ConectaCGBot/1.0 (+https://conectacg.net/bot)' },
            signal: AbortSignal.timeout(3000),
        });
        if (!res.ok)
            return true; // If no robots.txt, assume allowed
        const text = await res.text();
        // Simple check: if Disallow: / for our bot or all bots, skip
        const lines = text.split('\n').map((l) => l.trim().toLowerCase());
        let inOurSection = false;
        for (const line of lines) {
            if (line.startsWith('user-agent: conectacgbot') || line.startsWith('user-agent: *')) {
                inOurSection = true;
            }
            else if (line.startsWith('user-agent:') && inOurSection) {
                inOurSection = false;
            }
            if (inOurSection && line === 'disallow: /')
                return false;
        }
        return true;
    }
    catch {
        return true; // If error checking robots.txt, assume allowed
    }
}
/**
 * This is a structured data fetcher — it uses the provider's public
 * JSON API endpoints (most large telecoms expose these for their own SPAs).
 * This is more reliable and ethical than HTML scraping.
 */
async function fetchPublicPlans(url, hint) {
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'ConectaCGBot/1.0 (+https://conectacg.net/bot)',
                'Accept': 'text/html,application/json',
            },
            signal: AbortSignal.timeout(10000),
        });
        if (!res.ok)
            return [];
        const contentType = res.headers.get('content-type') ?? '';
        // If JSON API response (preferred)
        if (contentType.includes('application/json')) {
            const data = await res.json();
            return parseJsonPlans(data, hint);
        }
        // For HTML pages, return empty and log for manual review
        logger_1.logger.info(`[Scraper] ${hint}: HTML page detected - manual review needed for parsing`);
        return [];
    }
    catch {
        return [];
    }
}
function parseJsonPlans(data, hint) {
    const plans = [];
    // Generic parser — adapts based on common API structures
    const items = data?.plans ?? data?.produtos ?? data?.items ?? data?.data ?? [];
    if (!Array.isArray(items))
        return plans;
    for (const item of items) {
        try {
            const speed = extractSpeed(item.nome ?? item.name ?? item.title ?? '');
            if (!speed)
                continue;
            plans.push({
                name: item.nome ?? item.name ?? item.title,
                downloadSpeed: speed.download,
                uploadSpeed: speed.upload,
                price: parseFloat(item.preco ?? item.price ?? item.valor ?? 0),
                servicosInclusos: item.beneficios ?? item.features ?? [],
                categorias: inferCategories(speed.download),
                sourceUrl: `https://conectacg.net/source/${hint}`,
            });
        }
        catch {
            continue;
        }
    }
    return plans;
}
function extractSpeed(text) {
    const match = text.match(/(\d+)\s*(?:MB|Mb|Mbps|GB|Gb)/i);
    if (!match)
        return null;
    const speed = parseInt(match[1]);
    return { download: speed, upload: Math.round(speed * 0.4) };
}
function inferCategories(downloadSpeed) {
    const cats = [];
    if (downloadSpeed >= 300)
        cats.push('Gaming');
    if (downloadSpeed >= 100)
        cats.push('Streaming');
    cats.push('Trabalho');
    return cats;
}
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
//# sourceMappingURL=scraper.service.js.map