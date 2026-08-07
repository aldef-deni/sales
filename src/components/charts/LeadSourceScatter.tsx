import {
  CartesianGrid, LabelList, ReferenceLine, ResponsiveContainer,
  Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis,
} from 'recharts'
import { num, pct } from '../../lib/format'
import type { LeadSource } from '../../lib/types'

/**
 * Volume lead (x) terhadap tingkat konversinya (y).
 *
 * Dua ukuran ini berbeda satuan, jadi tidak boleh ditumpuk sebagai dua sumbu-y
 * pada satu grafik batang. Sebagai sebaran, hubungan yang dicari justru langsung
 * terlihat: titik di kanan-bawah berarti usaha terbesar mengalir ke saluran
 * yang paling jarang menghasilkan.
 *
 * Semua titik sewarna dan diberi label langsung — identitas dibawa teks,
 * bukan warna, sehingga tidak ada batas jumlah kategori yang aman.
 */
export function LeadSourceScatter({ data }: { data: LeadSource[] }) {
  if (data.length === 0) return <div className="empty">Belum ada data lead.</div>

  const avgConversion =
    data.reduce((sum, s) => sum + s.conversion_rate * s.total, 0) /
    Math.max(1, data.reduce((sum, s) => sum + s.total, 0))

  return (
    <>
      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer>
          {/* Ruang atas untuk label titik tertinggi, ruang kanan untuk label
              garis rata-rata — keduanya sempat terpotong tepi plot. */}
          <ScatterChart margin={{ top: 30, right: 92, bottom: 26, left: 4 }}>
            <CartesianGrid stroke="#e1e0d9" strokeWidth={1} />
            <XAxis
              type="number"
              dataKey="total"
              name="Jumlah lead"
              tick={{ fill: '#898781', fontSize: 11 }}
              axisLine={{ stroke: '#c3c2b7' }}
              tickLine={false}
              label={{ value: 'Jumlah lead masuk', position: 'insideBottom', offset: -14, fill: '#52514e', fontSize: 11.5 }}
            />
            <YAxis
              type="number"
              dataKey="conversion_rate"
              name="Konversi"
              unit="%"
              tick={{ fill: '#898781', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={48}
              label={{ value: 'Konversi', angle: -90, position: 'insideLeft', fill: '#52514e', fontSize: 11.5 }}
            />
            <ZAxis range={[110, 110]} />
            <ReferenceLine
              y={avgConversion}
              stroke="#52514e"
              strokeWidth={2}
              strokeDasharray="5 4"
              label={{ value: `Rata-rata ${pct(Math.round(avgConversion * 10) / 10)}`, position: 'right', fill: '#52514e', fontSize: 10.5 }}
            />
            <Tooltip cursor={{ strokeDasharray: '4 4', stroke: '#c3c2b7' }} content={<SourceTip />} />
            <Scatter data={data} fill="#2a78d6" isAnimationActive={false}>
              {/* Label di samping kanan, bukan di atas: titik-titik di sini
                  berdekatan secara horizontal, jadi label atas saling menimpa. */}
              <LabelList dataKey="label" position="right" offset={9} style={{ fill: '#52514e', fontSize: 11, fontWeight: 600 }} />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <p className="card-note" style={{ marginTop: 4 }}>
        Titik di kanan-bawah = banyak lead, sedikit hasil. Titik di kiri-atas = sedikit lead, hasil bagus — kandidat untuk diperbesar.
      </p>
    </>
  )
}

interface TipProps {
  active?: boolean
  payload?: { payload: LeadSource }[]
}

function SourceTip({ active, payload }: TipProps) {
  const source = payload?.[0]?.payload
  if (!active || !source) return null

  return (
    <div className="chart-tip">
      <div className="chart-tip-label">{source.label}</div>
      <div className="chart-tip-row">{num(source.total)} lead masuk</div>
      <div className="chart-tip-row">{num(source.converted)} jadi pelanggan ({pct(source.conversion_rate)})</div>
      <div className="chart-tip-row">{num(source.qualified)} terkualifikasi</div>
    </div>
  )
}
