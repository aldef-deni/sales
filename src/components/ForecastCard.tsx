import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { money, pct } from '../lib/format'
import type { Forecast } from '../lib/types'

/**
 * Prediksi penjualan disajikan sebagai rentang di atas garis target.
 *
 * Ramalan satu angka selalu meleset; yang berguna adalah batas bawah yang
 * hampir pasti tercapai dan batas atas yang menuntut semuanya berjalan mulus.
 */
export function ForecastCard() {
  const [data, setData] = useState<Forecast | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<Forecast>('/forecast').then(setData).catch((e) => setError(e.message))
  }, [])

  if (error) return null
  if (!data) return <section className="card"><div className="empty">Menghitung prediksi…</div></section>

  // Skala dipilih dari nilai terbesar supaya penanda target selalu masuk layar.
  const scale = Math.max(data.range.high, data.target) * 1.05
  const at = (value: number) => `${Math.min(100, (value / scale) * 100)}%`

  return (
    <section className="card">
      <div className="card-head">
        <h2 className="card-title">Prediksi penutupan {data.period}</h2>
        <p className="card-note">{data.days_left} hari tersisa · dihitung dari omzet tercatat, pipeline, dan prospek terbuka</p>
      </div>

      <div className="card-body">
        <div className="forecast-figure">
          <span className="forecast-likely tnum">{money(data.range.likely)}</span>
          <span className={`pill ${data.will_hit_target ? 'ok' : 'alert'}`}>
            {data.will_hit_target ? 'Target tercapai' : `Kurang ${money(data.gap_to_target)}`}
          </span>
        </div>

        <div className="forecast-track">
          <div className="forecast-range" style={{ left: at(data.range.low), width: `calc(${at(data.range.high)} - ${at(data.range.low)})` }} />
          <div className="forecast-booked" style={{ width: at(data.booked) }} />
          <div className="forecast-point" style={{ left: at(data.range.likely) }} />
          {data.target > 0 && <div className="forecast-target" style={{ left: at(data.target) }} title={`Target ${money(data.target)}`} />}
        </div>

        <div className="forecast-legend">
          <span className="legend-item"><span className="legend-swatch sw-booked" />Sudah tercatat {money(data.booked)}</span>
          <span className="legend-item"><span className="legend-swatch sw-range" />Rentang {money(data.range.low)}–{money(data.range.high)}</span>
          <span className="legend-item"><span className="legend-dot" />Paling mungkin</span>
          {data.target > 0 && <span className="legend-item"><span className="legend-line" />Target {money(data.target)}</span>}
        </div>

        <p className="insight-narrative">{data.narrative}</p>

        <div className="forecast-parts">
          {Object.entries(data.components).map(([key, part]) => (
            <div className="forecast-part" key={key}>
              <div className="forecast-part-top">
                <span>{part.label}</span>
                <span className="tnum"><b>{money(part.amount)}</b></span>
              </div>
              <div className="card-note">{part.basis}</div>
            </div>
          ))}
        </div>

        <details className="forecast-detail">
          <summary>Win rate nyata per tahap yang dipakai menimbang pipeline</summary>
          <div className="table-wrap" style={{ marginTop: 8 }}>
            <table>
              <thead><tr><th>Tahap</th><th className="num">Pernah dicapai</th><th className="num">Menang</th><th className="num">Win rate</th></tr></thead>
              <tbody>
                {Object.entries(data.stage_win_rates).map(([stage, r]) => (
                  <tr key={stage}>
                    <td>{STAGE_LABELS[stage] ?? stage}</td>
                    <td className="num">{r.reached}</td>
                    <td className="num">{r.won}</td>
                    <td className="num">
                      {pct(r.rate * 100, 0)}
                      {!r.is_measured && <span className="card-note"> (bawaan tahap)</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </section>
  )
}

const STAGE_LABELS: Record<string, string> = {
  prospecting: 'Prospek',
  qualification: 'Kualifikasi',
  proposal: 'Penawaran',
  negotiation: 'Negosiasi',
}
