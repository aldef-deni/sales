import {
  Bar, BarChart, CartesianGrid, Cell, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { money, moneyFull } from '../../lib/format'
import type { TrendPoint } from '../../lib/types'

const FULL = '#2a78d6'
const PARTIAL = '#86b6ef'

/**
 * Omzet per bulan terhadap target.
 *
 * Target digambar sebagai garis acuan putus-putus, bukan seri kedua — ia
 * satuan yang sama dengan batangnya, jadi tidak butuh sumbu sendiri. Bulan
 * berjalan diberi warna lebih muda karena datanya belum lengkap; menyamakan
 * tampilannya dengan bulan penuh akan terbaca seolah omzet anjlok.
 */
export function RevenueTrend({ data }: { data: TrendPoint[] }) {
  const target = data.at(-1)?.target ?? 0

  return (
    <>
      <div style={{ width: '100%', height: 240 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 4 }} barCategoryGap="24%">
            <CartesianGrid stroke="#e1e0d9" strokeWidth={1} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#898781', fontSize: 11 }}
              axisLine={{ stroke: '#c3c2b7' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v: number) => money(v)}
              tick={{ fill: '#898781', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={68}
            />
            {target > 0 && (
              <ReferenceLine
                y={target}
                stroke="#52514e"
                strokeWidth={2}
                strokeDasharray="5 4"
                label={{
                  value: `Target ${money(target)}`,
                  position: 'insideTopRight',
                  fill: '#52514e',
                  fontSize: 11,
                }}
              />
            )}
            <Tooltip cursor={{ fill: 'rgba(11,11,11,0.04)' }} content={<TrendTip />} />
            {/* Sudut atas dibulatkan 4px, dasar menempel baseline. */}
            <Bar dataKey="revenue" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {data.map((point) => (
                <Cell key={point.period} fill={point.is_partial ? PARTIAL : FULL} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="legend">
        <span className="legend-item">
          <span className="legend-swatch" style={{ background: FULL }} />Bulan penuh
        </span>
        <span className="legend-item">
          <span className="legend-swatch" style={{ background: PARTIAL }} />Bulan berjalan (belum lengkap)
        </span>
        <span className="legend-item">
          <span className="legend-line" />Target bulanan
        </span>
      </div>
    </>
  )
}

interface TipProps {
  active?: boolean
  payload?: { payload: TrendPoint }[]
}

function TrendTip({ active, payload }: TipProps) {
  const point = payload?.[0]?.payload
  if (!active || !point) return null

  const gap = point.revenue - point.target
  return (
    <div className="chart-tip">
      <div className="chart-tip-label">
        {point.label}
        {point.is_partial ? ' (sedang berjalan)' : ''}
      </div>
      <div className="chart-tip-row">Realisasi: {moneyFull(point.revenue)}</div>
      <div className="chart-tip-row">Target: {moneyFull(point.target)}</div>
      {point.target > 0 && (
        <div className="chart-tip-row" style={{ color: gap >= 0 ? '#006300' : '#8f1f1f' }}>
          {gap >= 0 ? 'Lebih ' : 'Kurang '}
          {moneyFull(Math.abs(gap))}
        </div>
      )}
    </div>
  )
}
