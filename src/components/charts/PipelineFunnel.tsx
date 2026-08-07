import { money, num } from '../../lib/format'
import type { PipelineStage } from '../../lib/types'

/**
 * Corong pipeline sebagai daftar batang horizontal.
 *
 * Sengaja HTML biasa, bukan komponen grafik: tiap tahap butuh tiga angka
 * (jumlah deal, nilai kotor, nilai tertimbang) berdampingan dengan namanya,
 * dan tabel-batang membacanya jauh lebih baik daripada grafik yang
 * menyembunyikan dua di antaranya ke dalam tooltip.
 *
 * Warna memakai ramp satu-hue terurut (terang → gelap) mengikuti urutan tahap,
 * bukan warna kategorikal — tahapan itu berjenjang, bukan sekadar berbeda.
 */
const RAMP = ['#86b6ef', '#5598e7', '#2a78d6', '#1c5cab']

export function PipelineFunnel({ data }: { data: PipelineStage[] }) {
  const max = Math.max(...data.map((s) => s.total_value), 1)
  const totalDeals = data.reduce((sum, s) => sum + s.deal_count, 0)

  if (totalDeals === 0) return <div className="empty">Belum ada deal terbuka.</div>

  return (
    <div>
      {data.map((stage, index) => (
        <div className="funnel-row" key={stage.stage}>
          <div className="funnel-top">
            <span className="funnel-stage">{stage.label}</span>
            <span className="tnum">{money(stage.total_value)}</span>
          </div>
          <div className="funnel-bar-track">
            <div
              className="funnel-bar"
              style={{
                width: `${Math.max(2, (stage.total_value / max) * 100)}%`,
                background: RAMP[index] ?? RAMP[RAMP.length - 1],
              }}
              title={`${stage.label}: ${stage.deal_count} deal, ${money(stage.total_value)}`}
            />
          </div>
          <div className="funnel-weighted">
            <span className="funnel-count">{num(stage.deal_count)} deal</span>
            {' · tertimbang probabilitas '}
            <span className="tnum">{money(stage.weighted_value)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
