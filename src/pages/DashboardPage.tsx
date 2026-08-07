import { useEffect, useState } from 'react'
import { InsightCard } from '../components/InsightCard'
import { LeadSourceScatter } from '../components/charts/LeadSourceScatter'
import { PipelineFunnel } from '../components/charts/PipelineFunnel'
import { RevenueTrend } from '../components/charts/RevenueTrend'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { money, num, pct } from '../lib/format'
import type { Dashboard } from '../lib/types'

export function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<Dashboard | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<Dashboard>('/dashboard')
      .then(setData)
      .catch((err) => setError(err.message))
  }, [])

  if (error) return <div className="card"><div className="empty">{error}</div></div>
  if (!data) return <div className="card"><div className="empty">Memuat dashboard…</div></div>

  const h = data.headline
  const needsAttention = data.insights.filter((i) => i.severity !== 'positive').length

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">Selamat datang, {user?.name.split(' ')[0]}</h1>
          <p className="page-sub">
            {data.period.label} · {data.period.progress_pct}% berjalan · {data.period.days_left} hari tersisa ·{' '}
            {data.scope === 'team' ? 'tampilan seluruh tim' : 'tampilan data Anda sendiri'}
          </p>
        </div>
      </header>

      {/* Angka utama, masing-masing dengan pembandingnya — bukan angka telanjang. */}
      <div className="grid grid-4" style={{ marginBottom: 14 }}>
        <div className="card stat">
          <div className="stat-label">Omzet bulan ini</div>
          <div className="stat-value tnum">{money(h.revenue)}</div>
          <PaceBar actual={h.revenue} target={h.target} progressPct={data.period.progress_pct} />
        </div>

        <div className="card stat">
          <div className="stat-label">Dibanding bulan lalu</div>
          <div className="stat-value tnum">
            {h.vs_last_month_pct === null ? '—' : (
              <span className={h.vs_last_month_pct >= 0 ? 'delta up' : 'delta down'}>
                {h.vs_last_month_pct >= 0 ? '↑' : '↓'} {pct(Math.abs(h.vs_last_month_pct))}
              </span>
            )}
          </div>
          <div className="stat-context">pada titik waktu yang sama di bulan lalu</div>
        </div>

        <div className="card stat">
          <div className="stat-label">Pipeline tertimbang</div>
          <div className="stat-value tnum">{money(h.weighted_pipeline)}</div>
          <div className="stat-context">
            {num(h.open_deals)} deal terbuka · rata-rata {money(h.avg_deal_size)}
          </div>
        </div>

        <div className="card stat">
          <div className="stat-label">Komisi belum cair</div>
          <div className="stat-value tnum">{money(h.outstanding_commission)}</div>
          <div className="stat-context">{money(h.commission_this_month)} terbentuk bulan ini</div>
        </div>
      </div>

      {/* Bagian utama: temuan, bukan angka. */}
      <section className="card" style={{ marginBottom: 14 }}>
        <div className="card-head" style={{ paddingBottom: 12 }}>
          <h2 className="card-title">Yang perlu Anda ketahui</h2>
          <p className="card-note">
            {needsAttention > 0
              ? `${needsAttention} temuan butuh perhatian, diurutkan dari yang paling mendesak.`
              : 'Tidak ada yang mendesak. Semua indikator dalam batas wajar.'}
          </p>
        </div>
        <div>
          {data.insights.map((insight) => (
            <InsightCard key={insight.key} insight={insight} />
          ))}
        </div>
      </section>

      <div className="grid grid-2" style={{ marginBottom: 14 }}>
        <section className="card">
          <div className="card-head">
            <h2 className="card-title">Omzet vs target</h2>
            <p className="card-note">Tujuh bulan terakhir</p>
          </div>
          <div className="card-body">
            <RevenueTrend data={data.revenue_trend} />
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <h2 className="card-title">Pipeline per tahap</h2>
            <p className="card-note">Hanya deal yang masih terbuka</p>
          </div>
          <div className="card-body">
            <PipelineFunnel data={data.pipeline} />
          </div>
        </section>
      </div>

      <div className="grid grid-2">
        <section className="card">
          <div className="card-head">
            <h2 className="card-title">Volume lead vs hasilnya</h2>
            <p className="card-note">Ke mana usaha mengalir, dan dari mana hasilnya datang</p>
          </div>
          <div className="card-body">
            <LeadSourceScatter data={data.lead_sources} />
          </div>
        </section>

        {data.team.length > 0 && (
          <section className="card">
            <div className="card-head">
              <h2 className="card-title">Performa tim</h2>
              <p className="card-note">Win rate: 60 hari terakhir dibanding 120 hari sebelumnya</p>
            </div>
            <div className="card-body table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Sales</th>
                    <th className="num">Omzet</th>
                    <th className="num">Target</th>
                    <th className="num">Win rate</th>
                    <th className="num">Pipeline</th>
                  </tr>
                </thead>
                <tbody>
                  {data.team.map((rep) => {
                    const delta =
                      rep.recent_win_rate !== null && rep.prior_win_rate !== null
                        ? rep.recent_win_rate - rep.prior_win_rate
                        : null
                    return (
                      <tr key={rep.user_id}>
                        <td><b>{rep.name}</b></td>
                        <td className="num">{money(rep.revenue)}</td>
                        <td className="num">
                          {rep.attainment === null ? '—' : (
                            <span className={rep.attainment >= data.period.progress_pct ? 'delta up' : 'delta down'}>
                              {pct(rep.attainment, 0)}
                            </span>
                          )}
                        </td>
                        <td className="num">
                          {rep.recent_win_rate === null ? '—' : (
                            <>
                              {pct(rep.recent_win_rate, 0)}{' '}
                              {delta !== null && Math.abs(delta) >= 5 && (
                                <span className={delta > 0 ? 'delta up' : 'delta down'}>
                                  {delta > 0 ? '↑' : '↓'}{Math.abs(Math.round(delta))}
                                </span>
                              )}
                            </>
                          )}
                        </td>
                        <td className="num">{money(rep.open_pipeline)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </>
  )
}

/**
 * Membandingkan realisasi terhadap posisi yang seharusnya pada titik waktu ini,
 * bukan terhadap target akhir bulan. Bar 40% di tanggal 8 itu bagus; di tanggal
 * 28 itu masalah — dan hanya penanda jadwal yang bisa menunjukkan bedanya.
 */
function PaceBar({ actual, target, progressPct }: { actual: number; target: number; progressPct: number }) {
  if (target <= 0) return <div className="stat-context">Target belum ditetapkan</div>

  const attainment = (actual / target) * 100
  const ahead = attainment >= progressPct

  return (
    <div className="pace">
      <div className="pace-track">
        <div className="pace-fill" style={{ width: `${Math.min(100, attainment)}%` }} />
        <div className="pace-mark" style={{ left: `${Math.min(100, progressPct)}%` }} title={`Seharusnya ${progressPct}% pada hari ini`} />
      </div>
      <div className="pace-legend">
        <span className={ahead ? 'delta up' : 'delta down'}>
          {pct(Math.round(attainment * 10) / 10)} dari target
        </span>
        <span>garis = jadwal {progressPct}%</span>
      </div>
    </div>
  )
}
