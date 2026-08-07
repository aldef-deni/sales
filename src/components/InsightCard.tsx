import { useState } from 'react'
import { money, num } from '../lib/format'
import type { Insight, Severity } from '../lib/types'

/**
 * Tiap tingkat dibawa oleh ikon DAN label teks, tidak pernah warna saja —
 * supaya tetap terbaca oleh pengguna buta warna dan saat dicetak hitam-putih.
 */
const SEVERITY: Record<Severity, { icon: string; label: string }> = {
  critical: { icon: '!', label: 'Perlu tindakan' },
  warning: { icon: '▲', label: 'Perhatian' },
  opportunity: { icon: '↗', label: 'Peluang' },
  positive: { icon: '✓', label: 'Sehat' },
}

export function InsightCard({ insight }: { insight: Insight }) {
  const [open, setOpen] = useState(false)
  const meta = SEVERITY[insight.severity]
  const evidence = insight.evidence ?? []

  return (
    <article className={`insight sev-${insight.severity}`}>
      <div className="insight-icon" aria-hidden="true">{meta.icon}</div>

      <div className="insight-body">
        <div className="insight-top">
          <h3 className="insight-title">{insight.title}</h3>
          <span className="sev-tag">{meta.label}</span>
        </div>

        <p className="insight-narrative">{insight.narrative}</p>

        <div className="insight-action">
          <b>Tindakan:</b> {insight.action}
        </div>

        {evidence.length > 0 && (
          <>
            <button className="insight-toggle" onClick={() => setOpen(!open)}>
              {open ? 'Sembunyikan rincian' : `Lihat ${evidence.length} contoh`}
            </button>
            {open && <EvidenceTable rows={evidence} />}
          </>
        )}
      </div>
    </article>
  )
}

/** Kolom dirakit dari kunci yang benar-benar ada, supaya satu tabel melayani semua jenis bukti. */
const COLUMNS: { key: string; label: string; kind?: 'money' | 'num' }[] = [
  { key: 'title', label: 'Deal' },
  { key: 'name', label: 'Nama' },
  { key: 'company', label: 'Perusahaan' },
  { key: 'customer', label: 'Pelanggan' },
  { key: 'owner', label: 'Pemilik' },
  { key: 'assignee', label: 'Ditugaskan' },
  { key: 'source', label: 'Sumber' },
  { key: 'stage', label: 'Tahap' },
  { key: 'score', label: 'Skor', kind: 'num' },
  { key: 'value', label: 'Nilai', kind: 'money' },
  { key: 'estimated_value', label: 'Estimasi', kind: 'money' },
  { key: 'days_in_stage', label: 'Hari diam', kind: 'num' },
  { key: 'normal_days', label: 'Normalnya', kind: 'num' },
  { key: 'age_days', label: 'Umur (hari)', kind: 'num' },
  { key: 'days_overdue', label: 'Lewat (hari)', kind: 'num' },
  { key: 'days_since_order', label: 'Sejak order', kind: 'num' },
  { key: 'expected_close_date', label: 'Perkiraan tutup' },
]

function EvidenceTable({ rows }: { rows: Record<string, unknown>[] }) {
  const columns = COLUMNS.filter((col) =>
    rows.some((row) => row[col.key] !== undefined && row[col.key] !== null),
  )

  return (
    <div className="table-wrap" style={{ marginTop: 10 }}>
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.kind ? 'num' : undefined}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={(row.id as number) ?? index}>
              {columns.map((col) => (
                <td key={col.key} className={col.kind ? 'num' : undefined}>
                  {format(row[col.key], col.kind)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function format(value: unknown, kind?: 'money' | 'num'): string {
  if (value === null || value === undefined) return '—'
  if (kind === 'money') return money(Number(value))
  if (kind === 'num') return num(Number(value))
  return String(value)
}
