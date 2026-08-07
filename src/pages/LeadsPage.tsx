import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { money, num, pct } from '../lib/format'
import type { LeadRow, LeadSource } from '../lib/types'

interface LeadResponse {
  data: LeadRow[]
  summary: { count: number; estimated_value: number; untouched: number }
  sources: LeadSource[]
}

const FILTERS = [
  { key: '', label: 'Semua prospek' },
  { key: 'untouched', label: 'Belum dihubungi' },
]

export function LeadsPage() {
  const [params, setParams] = useSearchParams()
  const filter = params.get('filter') ?? ''
  const [result, setResult] = useState<LeadResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setResult(null)
    api<LeadResponse>(`/leads${filter ? `?filter=${filter}` : ''}`)
      .then(setResult)
      .catch((err) => setError(err.message))
  }, [filter])

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">Prospek</h1>
          <p className="page-sub">
            {result
              ? `${num(result.summary.count)} prospek · estimasi ${money(result.summary.estimated_value)} · ${num(result.summary.untouched)} belum pernah dihubungi`
              : 'Memuat…'}
          </p>
        </div>
      </header>

      <div className="toolbar">
        {FILTERS.map((item) => (
          <button
            key={item.key || 'all'}
            className={`chip${filter === item.key ? ' active' : ''}`}
            onClick={() => setParams(item.key ? { filter: item.key } : {})}
          >
            {item.label}
          </button>
        ))}
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
                  <th className="num">Skor</th>
                  <th>Nama</th>
                  <th>Perusahaan</th>
                  <th>Sumber</th>
                  <th>Status</th>
                  <th>Ditugaskan</th>
                  <th className="num">Estimasi</th>
                  <th className="num">Umur</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((lead) => (
                  <tr key={lead.id}>
                    <td className="num">
                      <b>{lead.score}</b>
                    </td>
                    <td>
                      {lead.name}
                      {lead.is_untouched && <span className="pill warn" style={{ marginLeft: 6 }}>belum dihubungi</span>}
                    </td>
                    <td>{lead.company ?? '—'}</td>
                    <td>{lead.source_label}</td>
                    <td><span className="pill">{lead.status}</span></td>
                    <td>{lead.assignee ?? '—'}</td>
                    <td className="num">{money(lead.estimated_value)}</td>
                    <td className="num">{lead.age_days} hr</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {result && result.sources.length > 0 && (
        <section className="card" style={{ marginTop: 14 }}>
          <div className="card-head">
            <h2 className="card-title">Konversi per sumber</h2>
            <p className="card-note">Tabel yang sama dengan sebaran di dashboard, untuk dibaca angkanya</p>
          </div>
          <div className="card-body table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Sumber</th>
                  <th className="num">Lead masuk</th>
                  <th className="num">Terkualifikasi</th>
                  <th className="num">Jadi pelanggan</th>
                  <th className="num">Konversi</th>
                </tr>
              </thead>
              <tbody>
                {result.sources.map((source) => (
                  <tr key={source.source}>
                    <td><b>{source.label}</b></td>
                    <td className="num">{num(source.total)}</td>
                    <td className="num">{num(source.qualified)}</td>
                    <td className="num">{num(source.converted)}</td>
                    <td className="num">{pct(source.conversion_rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  )
}
