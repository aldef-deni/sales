import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ImportDialog } from '../components/leads/ImportDialog'
import { LeadDetail } from '../components/leads/LeadDetail'
import { NewLeadDialog } from '../components/leads/NewLeadDialog'
import { api } from '../lib/api'
import { money, num } from '../lib/format'
import type { LeadListResponse, LeadRow } from '../lib/types'

const FILTERS = [
  { key: 'open', label: 'Aktif' },
  { key: 'due', label: 'Harus dihubungi' },
  { key: 'hot', label: 'Prioritas panas' },
  { key: 'untouched', label: 'Belum disentuh' },
  { key: 'failed', label: 'Gagal' },
  { key: '', label: 'Semua' },
]

export function LeadsPage() {
  const [params, setParams] = useSearchParams()
  const filter = params.get('filter') ?? 'open'
  const source = params.get('source') ?? ''

  const [result, setResult] = useState<LeadListResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<number | null>(null)
  const [dialog, setDialog] = useState<'none' | 'new' | 'import'>('none')
  const [flash, setFlash] = useState<string | null>(null)

  const load = useCallback(() => {
    const query = new URLSearchParams()
    if (filter) query.set('filter', filter)
    if (source) query.set('source', source)
    if (search.trim()) query.set('q', search.trim())

    api<LeadListResponse>(`/leads?${query}`).then(setResult).catch((e) => setError(e.message))
  }, [filter, source, search])

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0) // tahan sebentar saat mengetik
    return () => clearTimeout(timer)
  }, [load, search])

  const setFilter = (key: string) => {
    const next = new URLSearchParams(params)
    key ? next.set('filter', key) : next.delete('filter')
    setParams(next)
  }

  const s = result?.summary

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">Prospek</h1>
          <p className="page-sub">
            Lead dari 12 kanal, otomatis dicek ganda, diberi skor, dan dijadwalkan follow-up.
          </p>
        </div>
        <div className="view-switch">
          <button className="btn btn-ghost" onClick={() => setDialog('import')}>Import Excel</button>
          <button className="btn" onClick={() => setDialog('new')}>Tambah lead</button>
        </div>
      </header>

      {flash && <div className="flash">{flash}</div>}

      {s && (
        <div className="grid grid-4" style={{ marginBottom: 14 }}>
          <button className="card stat stat-btn" onClick={() => setFilter('due')}>
            <div className="stat-label">Harus dihubungi hari ini</div>
            <div className={`stat-value tnum${s.follow_up_due ? ' is-alert' : ''}`}>{num(s.follow_up_due)}</div>
            <div className="stat-context">sudah lewat jadwal follow-up</div>
          </button>
          <button className="card stat stat-btn" onClick={() => setFilter('hot')}>
            <div className="stat-label">Prioritas panas</div>
            <div className="stat-value tnum">{num(s.hot)}</div>
            <div className="stat-context">dari {num(s.open)} lead aktif</div>
          </button>
          <div className="card stat">
            <div className="stat-label">Nilai prospek aktif</div>
            <div className="stat-value tnum">{money(s.open_value)}</div>
            <div className="stat-context">estimasi gabungan</div>
          </div>
          <div className="card stat">
            <div className="stat-label">Rata-rata respons</div>
            <div className="stat-value tnum">{s.avg_response_hours !== null ? `${s.avg_response_hours} jam` : '—'}</div>
            <div className="stat-context">{num(s.duplicates_merged)} lead ganda dicegah</div>
          </div>
        </div>
      )}

      <div className="toolbar">
        {FILTERS.map((item) => (
          <button
            key={item.key || 'all'}
            className={`chip${filter === item.key ? ' active' : ''}`}
            onClick={() => setFilter(item.key)}
          >
            {item.label}
          </button>
        ))}

        <select
          className="chip select-chip"
          value={source}
          onChange={(e) => {
            const next = new URLSearchParams(params)
            e.target.value ? next.set('source', e.target.value) : next.delete('source')
            setParams(next)
          }}
        >
          <option value="">Semua kanal</option>
          {result?.channels.filter((c) => c.total > 0).map((c) => (
            <option key={c.value} value={c.value}>{c.label} ({c.total})</option>
          ))}
        </select>

        <input
          className="search-input"
          placeholder="Cari nama, perusahaan, telepon…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card">
        {error && <div className="empty">{error}</div>}
        {!error && !result && <div className="empty">Memuat prospek…</div>}
        {result && result.data.length === 0 && <div className="empty">Tidak ada prospek pada filter ini.</div>}

        {result && result.data.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Prioritas</th>
                  <th className="num">Skor</th>
                  <th>Nama</th>
                  <th>Kanal</th>
                  <th>Status</th>
                  <th>Ditugaskan</th>
                  <th className="num">Estimasi</th>
                  <th>Follow-up</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((lead) => (
                  <tr key={lead.id} className="row-btn" onClick={() => setSelected(lead.id)}>
                    <td><span className={`pri pri-${lead.priority}`}>{lead.priority_label}</span></td>
                    <td className="num"><b>{lead.score}</b></td>
                    <td>
                      <b>{lead.name}</b>
                      {lead.company && <div className="card-note">{lead.company}</div>}
                    </td>
                    <td>{lead.source_label}</td>
                    <td><span className="pill">{lead.status_label}</span></td>
                    <td>{lead.assignee ?? '—'}</td>
                    <td className="num">{money(lead.estimated_value)}</td>
                    <td><FollowUpCell lead={lead} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected !== null && (
        <LeadDetail leadId={selected} onClose={() => setSelected(null)} onChanged={load} />
      )}

      {dialog === 'new' && result && (
        <NewLeadDialog
          channels={result.channels}
          onClose={() => setDialog('none')}
          onCreated={(message) => { setDialog('none'); setFlash(message); load() }}
        />
      )}

      {dialog === 'import' && (
        <ImportDialog onClose={() => setDialog('none')} onDone={load} />
      )}
    </>
  )
}

/** Kolom follow-up membawa dua hal sekaligus: kapan, dan apakah sudah telat. */
function FollowUpCell({ lead }: { lead: LeadRow }) {
  if (lead.is_untouched) return <span className="pill warn">belum disentuh</span>
  if (!lead.next_follow_up_at) return <span className="card-note">—</span>

  const due = new Date(lead.next_follow_up_at)
  const days = Math.round((due.getTime() - Date.now()) / 864e5)

  if (lead.follow_up_due) {
    return <span className="pill alert">telat {Math.abs(days)} hari</span>
  }

  return <span className="card-note">{days <= 0 ? 'hari ini' : `${days} hari lagi`}</span>
}
