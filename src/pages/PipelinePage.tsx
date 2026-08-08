import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PipelineBoard } from '../components/pipeline/PipelineBoard'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { money, num } from '../lib/format'
import type { Board, DealRow } from '../lib/types'

interface DealResponse {
  data: DealRow[]
  summary: { count: number; total_value: number; weighted_value: number }
}

const LIST_FILTERS = [
  { key: 'open', label: 'Semua terbuka' },
  { key: 'stalled', label: 'Mengendap' },
  { key: 'overdue', label: 'Lewat tanggal' },
]

export function PipelinePage() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()

  // Filter "mengendap"/"lewat tanggal" hanya masuk akal pada tampilan daftar,
  // jadi tautan insight yang membawa filter langsung membuka daftar.
  const filter = params.get('filter') ?? ''
  const view = params.get('view') ?? (filter ? 'list' : 'board')

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">Pipeline</h1>
        </div>
        <div className="view-switch">
          <button
            className={`chip${view === 'board' ? ' active' : ''}`}
            onClick={() => setParams({})}
          >
            Papan
          </button>
          <button
            className={`chip${view === 'list' ? ' active' : ''}`}
            onClick={() => setParams({ view: 'list' })}
          >
            Daftar
          </button>
        </div>
      </header>

      {view === 'board'
        ? <BoardView currentUserId={user?.id ?? 0} />
        : <ListView filter={filter || 'open'} onFilter={(f) => setParams(f === 'open' ? { view: 'list' } : { view: 'list', filter: f })} />}
    </>
  )
}

function BoardView({ currentUserId }: { currentUserId: number }) {
  const [board, setBoard] = useState<Board | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<Board>('/deals/board').then(setBoard).catch((err) => setError(err.message))
  }, [])

  if (error) return <div className="card"><div className="empty">{error}</div></div>
  if (!board) return <div className="card"><div className="empty">Memuat papan…</div></div>

  return <PipelineBoard board={board} currentUserId={currentUserId} onBoardChange={setBoard} />
}

function ListView({ filter, onFilter }: { filter: string; onFilter: (f: string) => void }) {
  const [result, setResult] = useState<DealResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setResult(null)
    api<DealResponse>(`/deals?filter=${filter}`).then(setResult).catch((err) => setError(err.message))
  }, [filter])

  return (
    <>
      <p className="page-sub" style={{ marginTop: -8, marginBottom: 14 }}>
        {result
          ? `${num(result.summary.count)} deal · ${money(result.summary.total_value)} nilai kotor · ${money(result.summary.weighted_value)} tertimbang`
          : 'Memuat…'}
      </p>

      <div className="toolbar">
        {LIST_FILTERS.map((item) => (
          <button
            key={item.key}
            className={`chip${filter === item.key ? ' active' : ''}`}
            onClick={() => onFilter(item.key)}
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
