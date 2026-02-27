'use client'
// app/b2b/leads/page.tsx
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1'
const STATUS_OPTIONS = ['NEW', 'CONTACTED', 'CONVERTED', 'LOST']
const STATUS_LABELS: Record<string, string> = { NEW: 'Novo', CONTACTED: 'Contactado', CONVERTED: 'Convertido', LOST: 'Perdido' }
const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700', CONTACTED: 'bg-yellow-100 text-yellow-700',
  CONVERTED: 'bg-green-100 text-green-700', LOST: 'bg-red-100 text-red-700',
}

export default function LeadsPage() {
  const { data: session } = useSession()
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  const fetchLeads = async (status = '') => {
    setLoading(true)
    const url = `${API}/b2b/leads${status ? `?status=${status}` : ''}`
    const r = await fetch(url, { headers: { Authorization: `Bearer ${(session as any)?.accessToken}` } })
    const d = await r.json()
    setLeads(d.data?.leads ?? [])
    setLoading(false)
  }

  useEffect(() => { if (session) fetchLeads(filter) }, [session, filter])

  const updateStatus = async (leadId: string, status: string) => {
    await fetch(`${API}/b2b/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${(session as any)?.accessToken}` },
      body: JSON.stringify({ status }),
    })
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status } : l))
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">📋 Central de Leads</h1>
          <button onClick={() => fetchLeads(filter)} className="btn-secondary text-sm">↻ Atualizar</button>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button onClick={() => setFilter('')} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${!filter ? 'bg-brand-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-300'}`}>
            Todos ({leads.length})
          </button>
          {STATUS_OPTIONS.map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${filter === s ? 'bg-brand-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-300'}`}>
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-white rounded-xl" />)}
          </div>
        ) : leads.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-semibold text-slate-900">Nenhum lead encontrado</p>
            <p className="text-sm text-slate-500 mt-1">Os leads aparecem aqui quando usuários clicam em "Contratar"</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leads.map((lead) => (
              <div key={lead.id} className="card p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-sm">
                      {lead.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{lead.name}</p>
                      <p className="text-sm text-slate-500">{lead.phone} · CEP: {lead.cep}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Plano: <span className="font-medium text-slate-600">{lead.plan?.name}</span> ·{' '}
                        {new Date(lead.createdAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[lead.status]}`}>
                      {STATUS_LABELS[lead.status]}
                    </span>
                    <select
                      value={lead.status}
                      onChange={(e) => updateStatus(lead.id, e.target.value)}
                      className="input py-1 px-2 text-xs w-auto"
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
