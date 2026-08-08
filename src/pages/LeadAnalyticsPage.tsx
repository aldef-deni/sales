import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { money, num, pct } from '../lib/format'
import type { LeadAnalytics } from '../lib/types'

export function LeadAnalyticsPage() {
  const [data, setData] = useState<LeadAnalytics | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<LeadAnalytics>('/leads/analytics').then(setData).catch((e) => setError(e.message))
  }, [])

  if (error) return <div className="card"><div className="empty">{error}</div></div>
  if (!data) return <div className="card"><div className="empty">Memuat analisa…</div></div>

  const best = data.channels.filter((c) => c.is_significant)[0]
  const worst = [...data.channels].filter((c) => c.is_significant).at(-1)
  const fastest = data.response_speed.filter((r) => r.is_significant)[0]
  const slowest = [...data.response_speed].filter((r) => r.is_significant).at(-1)

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">Analisa Prospek</h1>
          <p className="page-sub">Kanal mana yang layak diperbesar, di mana corong bocor, dan kenapa lead gagal.</p>
        </div>
      </header>

      {best && worst && best.channel !== worst.channel && (
        <div className="callout">
          <b>{best.label}</b> mengonversi {pct(best.conversion_rate)} dari {num(best.total)} lead, sementara{' '}
          <b>{worst.label}</b> hanya {pct(worst.conversion_rate)} dari {num(worst.total)} lead —
          padahal {worst.label} menyerap {pct(worst.share_pct)} dari seluruh lead yang masuk.
        </div>
      )}

      <section className="card" style={{ marginBottom: 14 }}>
        <div className="card-head">
          <h2 className="card-title">Performa per kanal</h2>
          <p className="card-note">
            Diurutkan dari konversi tertinggi. Kanal dengan kurang dari 10 lead ditandai — angkanya
            belum cukup untuk jadi dasar keputusan.
          </p>
        </div>
        <div className="card-body table-wrap">
          <table>
            <thead>
              <tr>
                <th>Kanal</th>
                <th className="num">Lead</th>
                <th className="num">Porsi</th>
                <th className="num">Konversi</th>
                <th className="num">Nilai per lead</th>
                <th className="num">Respons</th>
                <th className="num">Skor rata-rata</th>
              </tr>
            </thead>
            <tbody>
              {data.channels.map((c) => (
                <tr key={c.channel}>
                  <td>
                    <b>{c.label}</b>
                    {!c.is_significant && <span className="pill" style={{ marginLeft: 6 }}>sampel kecil</span>}
                  </td>
                  <td className="num">{num(c.total)}</td>
                  <td className="num">{pct(c.share_pct)}</td>
                  <td className="num"><b>{pct(c.conversion_rate)}</b></td>
                  <td className="num">{money(c.value_per_lead)}</td>
                  <td className="num">{c.avg_response_hours !== null ? `${c.avg_response_hours} j` : '—'}</td>
                  <td className="num">{c.avg_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-2" style={{ marginBottom: 14 }}>
        <section className="card">
          <div className="card-head">
            <h2 className="card-title">Kecepatan respons vs konversi</h2>
            <p className="card-note">Berapa lama lead didiamkan sebelum kontak pertama</p>
          </div>
          <div className="card-body">
            {fastest && slowest && fastest.label !== slowest.label && (
              <p className="insight-narrative" style={{ marginTop: 0 }}>
                Lead yang dihubungi {fastest.label.toLowerCase()} menutup {pct(fastest.conversion_rate)},
                yang dibiarkan {slowest.label.toLowerCase()} hanya {pct(slowest.conversion_rate)} —
                selisih {Math.round(fastest.conversion_rate / Math.max(0.1, slowest.conversion_rate))}x.
              </p>
            )}
            {data.response_speed.map((row) => (
              <div className="bar-row" key={row.label}>
                <div className="bar-top">
                  <span>{row.label}</span>
                  <span className="tnum"><b>{pct(row.conversion_rate)}</b></span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${Math.min(100, row.conversion_rate)}%` }} />
                </div>
                <div className="card-note">{num(row.total)} lead{!row.is_significant && ' · sampel kecil'}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <h2 className="card-title">Corong prospek</h2>
            <p className="card-note">Berapa lead yang pernah mencapai tiap tahap, dan berapa lama tertahan</p>
          </div>
          <div className="card-body">
            {data.funnel.map((step, i) => {
              const previous = data.funnel[i - 1]
              const dropped = previous ? previous.reached - step.reached : 0

              return (
                <div className="bar-row" key={step.status}>
                  <div className="bar-top">
                    <span>{step.label}</span>
                    <span className="tnum">{num(step.reached)} <span className="card-note">({pct(step.reach_pct)})</span></span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${step.reach_pct}%` }} />
                  </div>
                  <div className="card-note">
                    {dropped > 0 && <>turun {num(dropped)} dari tahap sebelumnya · </>}
                    {step.avg_hours_here !== null
                      ? `rata-rata ${Math.round(step.avg_hours_here)} jam di tahap ini`
                      : `${num(step.currently_here)} lead ada di sini`}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      <div className="grid grid-2">
        <section className="card">
          <div className="card-head">
            <h2 className="card-title">Kenapa lead gagal</h2>
            <p className="card-note">Sebab yang menumpuk di satu titik menunjuk masalah proses, bukan orangnya</p>
          </div>
          <div className="card-body">
            {data.loss_categories.length === 0 && <p className="card-note">Belum ada lead gagal yang dicatat sebabnya.</p>}
            {data.loss_categories.map((row) => (
              <div className="bar-row" key={row.category}>
                <div className="bar-top">
                  <span>{row.label}</span>
                  <span className="tnum">{num(row.total)} <span className="card-note">({pct(row.share_pct)})</span></span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill bar-loss" style={{ width: `${row.share_pct}%` }} />
                </div>
                <div className="card-note">estimasi nilai hilang {money(row.lost_value)}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <h2 className="card-title">Sebab gagal terbesar per kanal</h2>
            <p className="card-note">Kanal boros yang gagalnya menumpuk di satu sebab biasanya bisa diperbaiki tanpa mengurangi belanja</p>
          </div>
          <div className="card-body table-wrap">
            <table>
              <thead>
                <tr><th>Kanal</th><th>Sebab terbanyak</th><th className="num">Jumlah</th><th className="num">Total gagal</th></tr>
              </thead>
              <tbody>
                {data.loss_by_channel.map((row) => (
                  <tr key={row.label}>
                    <td><b>{row.label}</b></td>
                    <td>{row.top_reason ?? '—'}</td>
                    <td className="num">{num(row.top_reason_count)}</td>
                    <td className="num">{num(row.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  )
}
