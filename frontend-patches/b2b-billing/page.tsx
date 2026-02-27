'use client'
// app/b2b/billing/page.tsx
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1'

const PLANS = [
  { tier: 'FREE', price: 'Grátis', features: ['Perfil básico', 'Listagem gratuita', 'Métricas básicas'], cta: 'Plano atual', disabled: true },
  { tier: 'STARTER', price: 'R$ 497/mês', features: ['3 planos em destaque', 'Captura de leads', 'Dashboard completo', 'Notificação de leads'], cta: 'Assinar Starter', disabled: false, recommended: false },
  { tier: 'GROWTH', price: 'R$ 1.297/mês', features: ['8 planos em destaque', 'Posição prioritária', 'Promoções com countdown', 'Webhook para CRM', 'Relatório competitivo'], cta: 'Assinar Growth', disabled: false, recommended: true },
  { tier: 'ENTERPRISE', price: 'R$ 2.997/mês', features: ['Tudo do Growth', 'Exclusividade de categoria', 'Gerente dedicado', 'API de leads', 'Relatórios personalizados'], cta: 'Contato comercial', disabled: false, recommended: false },
]

export default function BillingPage() {
  const { data: session } = useSession()
  const params = useSearchParams()
  const [loading, setLoading] = useState<string | null>(null)

  const success = params.get('success')
  const cancelled = params.get('cancelled')

  const checkout = async (tier: string) => {
    if (tier === 'ENTERPRISE') { window.open('mailto:comercial@conectacg.net?subject=Enterprise', '_blank'); return }

    setLoading(tier)
    try {
      const r = await fetch(`${API}/b2b/billing/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${(session as any)?.accessToken}` },
        body: JSON.stringify({ tier }),
      })
      const d = await r.json()
      if (d.data?.url) window.location.href = d.data.url
    } finally {
      setLoading(null)
    }
  }

  const openPortal = async () => {
    const r = await fetch(`${API}/b2b/billing/portal`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${(session as any)?.accessToken}` },
    })
    const d = await r.json()
    if (d.data?.url) window.location.href = d.data.url
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Planos para Operadoras</h1>
          <p className="text-slate-500 mt-2">Escolha o plano ideal para crescer com o ConectaCG</p>
        </div>

        {success && (
          <div className="card p-4 bg-green-50 border-green-200 text-green-800 text-center mb-8">
            ✅ Pagamento confirmado! Seu plano foi ativado.
          </div>
        )}

        {cancelled && (
          <div className="card p-4 bg-yellow-50 border-yellow-200 text-yellow-800 text-center mb-8">
            ⚠️ Pagamento cancelado. Você pode tentar novamente.
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {PLANS.map((plan) => (
            <div key={plan.tier} className={`card p-6 relative ${plan.recommended ? 'ring-2 ring-brand-400' : ''}`}>
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Mais popular
                </div>
              )}
              <h3 className="font-bold text-lg text-slate-900 mb-1">{plan.tier}</h3>
              <p className="text-2xl font-bold text-brand-600 mb-4">{plan.price}</p>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="text-accent-500 font-bold mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => checkout(plan.tier)}
                disabled={plan.disabled || loading === plan.tier}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition ${plan.disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : plan.recommended ? 'btn-primary' : 'btn-secondary'}`}
              >
                {loading === plan.tier ? 'Carregando...' : plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button onClick={openPortal} className="btn-secondary text-sm">
            Gerenciar assinatura / histórico de faturas
          </button>
        </div>
      </div>
    </div>
  )
}
