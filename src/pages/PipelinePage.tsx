import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { money, num } from '../lib/format'
import type { DealRow } from '../lib/types'

interface DealResponse {
  data: DealRow[]
  summary: { count: number; total_value: number; weighted_value: number }
}

const FILTERS = [
  { key: 'open', label: 'Semua terbuka' },
  { key: 'stalled', label: 'Mengendap' },
  { key: 'overdue', label: 'Lewat tanggal' },
]

export function PipelinePage() {
  const [params, setParams] = useSearchParams()
  const filter = params.get('filter') ?? 'open'
  const [result, setResult] = useState<DealResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setResult(null)
    api<DealResponse>(`/deals?filter=${filter}`)
      .then(setResult)
      .catch((err) => setError(err.message))
  }, [filter])

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">Pipeline</h1>
          <p className="page-sub">
            {result
              ? `${num(result.summary.count)} deal · ${money(result.summary.total_value)} nilai kotor · ${money(result.summary.weighted_value)} tertimbang`
              : 'Memuat…'}
          </p>
        </div>
      </header>

      <div className="toolbar">
        {FILTERS.map((item) => (
          <button
            key={item.key}
            className={`chip${filter === item.key ? ' active' : ''}`}
            onClick={() => setParams(item.key === 'open' ? {} : { filter: item.key })}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="card">
        {error && <div className="empty">{error}</div>}
        {!error && !result && <div className="empty">Memuat deal…</div>}
        {result && result.data.length === 0 && <div className="empty">Tidak ada deal pada filter ini.</div>}

        {result && result.data.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Deal</th>
                  <th>Pelanggan</th>
                  <th>Pemilik</th>
                  <th>Tahap</th>
                  <th className="num">Nilai</th>
                  <th className="num">Peluang</th>
                  <th className="num">Diam</th>
                  <th>Perkiraan tutup</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((deal) => (
                  <tr key={deal.id}>
                    <td>
                      <b>{deal.title}</b>
                      {deal.is_stalled && <span className="pill alert" style={{ marginLeft: 6 }}>mengendap</span>}
                    </td>
                    <td>{deal.customer ?? '—'}</td>
                    <td>{deal.owner ?? '—'}</td>
                    <td><span className="pill">{deal.stage_label}</span></td>
                    <td className="num">{money(deal.value)}</td>
                    <td className="num">{deal.probability}%</td>
                    <td className="num">
                      {/* Angka "diam" tanpa pembanding tidak berarti apa-apa —
                          normalnya berapa hari ikut ditampilkan. */}
                      {deal.days_in_stage} hr
                      <span style={{ color: 'var(--ink-muted)' }}> / {deal.normal_days_in_stage}</span>
                    </td>
                    <td>{deal.expected_close_date ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
