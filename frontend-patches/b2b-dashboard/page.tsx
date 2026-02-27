'use client'
// app/b2b/dashboard/page.tsx
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1'

export default function B2BDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/login'); return }
    if (!session) return

    fetch(`${API}/b2b/dashboard`, {
      headers: { Authorization: `Bearer ${(session as any).accessToken}` },
    })
      .then((r) => r.json())
      .then((d) => { setData(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [session, status])

  if (loading) return <LoadingSkeleton />

  const { metrics, provider } = data ?? {}

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-bold text-xl text-slate-900">Painel B2B</h1>
            <p className="text-sm text-slate-500">{provider?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${tierColor(metrics?.tier)}`}>
              {metrics?.tier ?? 'FREE'}
            </span>
            <a href="/b2b/billing" className="btn-primary text-sm">Upgrade</a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Metrics cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Leads hoje" value={metrics?.leadsToday ?? 0} icon="🎯" color="blue" />
          <MetricCard label="Leads 7 dias" value={metrics?.leadsWeek ?? 0} icon="📅" color="green" />
          <MetricCard label="Leads 30 dias" value={metrics?.leadsMonth ?? 0} icon="📊" color="purple" />
          <MetricCard label="Planos ativos" value={metrics?.totalPlans ?? 0} icon="📡" color="orange" />
        </div>

        {/* Leads by status */}
        <div className="card p-6">
          <h2 className="font-bold text-slate-900 mb-4">Status dos Leads</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(metrics?.leadsByStatus ?? {}).map(([status, count]) => (
              <div key={status} className="p-3 rounded-xl bg-slate-50 text-center">
                <p className="text-2xl font-bold text-slate-900">{count as number}</p>
                <p className="text-xs text-slate-500 mt-1">{statusLabel(status)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top plans */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900">Top Planos</h2>
            <a href="/b2b/plans" className="text-sm text-brand-500 hover:underline">Gerenciar →</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="pb-3 font-medium">Plano</th>
                  <th className="pb-3 font-medium text-right">Visualizações</th>
                  <th className="pb-3 font-medium text-right">Cliques</th>
                  <th className="pb-3 font-medium text-right">Conversões</th>
                  <th className="pb-3 font-medium text-right">Preço</th>
                </tr>
              </thead>
              <tbody>
                {(metrics?.topPlans ?? []).map((p: any) => (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-3 font-medium text-slate-900">{p.name}</td>
                    <td className="py-3 text-right text-slate-600">{p.viewCount.toLocaleString()}</td>
                    <td className="py-3 text-right text-slate-600">{p.clickCount.toLocaleString()}</td>
                    <td className="py-3 text-right font-semibold text-accent-600">{p.conversionCount}</td>
                    <td className="py-3 text-right text-slate-600">R$ {p.price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-3 gap-4">
          <QuickAction href="/b2b/plans/new" icon="➕" label="Novo plano" desc="Cadastrar plano de internet" />
          <QuickAction href="/b2b/leads" icon="📋" label="Ver leads" desc={`${metrics?.totalLeads ?? 0} leads recebidos`} />
          <QuickAction href="/b2b/billing" icon="💳" label="Faturamento" desc={`Plano ${metrics?.tier ?? 'FREE'}`} />
        </div>
      </main>
    </div>
  )
}

function MetricCard({ label, value, icon, color }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600', green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600', orange: 'bg-orange-50 text-orange-600',
  }
  return (
    <div className="card p-5">
      <div className={`w-10 h-10 rounded-xl ${colors[color]} flex items-center justify-center text-lg mb-3`}>{icon}</div>
      <p className="text-2xl font-bold text-slate-900">{value.toLocaleString()}</p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </div>
  )
}

function QuickAction({ href, icon, label, desc }: any) {
  return (
    <a href={href} className="card p-5 hover:shadow-md transition-shadow flex items-start gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="font-semibold text-slate-900">{label}</p>
        <p className="text-sm text-slate-500">{desc}</p>
      </div>
    </a>
  )
}

function tierColor(tier: string) {
  const map: Record<string, string> = {
    FREE: 'bg-slate-100 text-slate-600',
    STARTER: 'bg-blue-100 text-blue-700',
    GROWTH: 'bg-green-100 text-green-700',
    ENTERPRISE: 'bg-purple-100 text-purple-700',
  }
  return map[tier] ?? map.FREE
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    NEW: 'Novo', CONTACTED: 'Contactado', CONVERTED: 'Convertido', LOST: 'Perdido',
  }
  return map[status] ?? status
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto animate-pulse space-y-4">
        <div className="h-10 bg-slate-200 rounded w-1/4" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-white rounded-xl" />)}
        </div>
        <div className="h-64 bg-white rounded-xl" />
      </div>
    </div>
  )
}
