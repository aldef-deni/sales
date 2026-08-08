import { useState } from 'react'
import { num } from '../../lib/format'
import { tokenStore } from '../../lib/api'

interface Preview {
  headers: string[]
  mapped: Record<string, string>
  unmapped: string[]
  total_rows: number
  sample: Record<string, unknown>[]
  has_contact_column: boolean
}

interface ImportResult {
  summary: { created: number; merged: number; flagged: number; rejected: number }
  rejected_rows: { row: number; name: string | null; reason: string | null }[]
  message: string
}

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api'

const FIELD_LABELS: Record<string, string> = {
  name: 'Nama', company: 'Perusahaan', email: 'Email',
  phone: 'Telepon', city: 'Kota', estimated_value: 'Estimasi nilai', notes: 'Catatan',
}

export function ImportDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  /** Upload memakai FormData, jadi tidak lewat helper api() yang mengirim JSON. */
  async function post<T>(path: string, selected: File): Promise<T> {
    const body = new FormData()
    body.append('file', selected)

    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { Accept: 'application/json', Authorization: `Bearer ${tokenStore.get()}` },
      body,
    })
    const payload = await res.json().catch(() => null)
    if (!res.ok) throw new Error(payload?.message ?? 'Gagal memproses berkas.')
    return payload as T
  }

  async function choose(selected: File) {
    setFile(selected)
    setPreview(null)
    setResult(null)
    setError(null)
    setBusy(true)
    try {
      setPreview(await post<Preview>('/leads/import/preview', selected))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal membaca berkas.')
    } finally {
      setBusy(false)
    }
  }

  async function run() {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      setResult(await post<ImportResult>('/leads/import', file))
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import gagal.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-plane" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="card modal modal-wide">
        <div className="card-head">
          <h2 className="card-title">Import lead dari Excel</h2>
          <p className="card-note">
            Format .xlsx, .xls, atau .csv. Kolom dikenali otomatis dari judulnya — Nama, Perusahaan,
            Email, Telepon/WhatsApp, Kota, Nilai, Catatan.
          </p>
        </div>

        <div className="card-body">
          {error && <div className="form-error">{error}</div>}

          {!result && (
            <div className="field">
              <label htmlFor="imp-file">Pilih berkas</label>
              <input
                id="imp-file"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => e.target.files?.[0] && choose(e.target.files[0])}
              />
            </div>
          )}

          {busy && !result && <p className="card-note">Memproses…</p>}

          {preview && !result && (
            <>
              <div className="fact-grid" style={{ marginBottom: 12 }}>
                <div className="fact">
                  <div className="fact-label">Baris terbaca</div>
                  <div className="fact-value">{num(preview.total_rows)}</div>
                </div>
                <div className="fact">
                  <div className="fact-label">Kolom dikenali</div>
                  <div className="fact-value">{Object.keys(preview.mapped).length}</div>
                </div>
              </div>

              <h4 className="card-title" style={{ fontSize: 13 }}>Pemetaan kolom</h4>
              <div className="table-wrap" style={{ marginTop: 6, marginBottom: 12 }}>
                <table>
                  <thead><tr><th>Kolom di berkas</th><th>Dipetakan ke</th></tr></thead>
                  <tbody>
                    {Object.entries(preview.mapped).map(([header, field]) => (
                      <tr key={header}>
                        <td>{header}</td>
                        <td><span className="pill">{FIELD_LABELS[field] ?? field}</span></td>
                      </tr>
                    ))}
                    {preview.unmapped.map((header) => (
                      <tr key={header}>
                        <td>{header}</td>
                        <td className="card-note">diabaikan</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!preview.has_contact_column && (
                <div className="form-error">
                  Berkas ini tidak punya kolom email maupun telepon. Tanpa itu lead tidak bisa dihubungi
                  dan tidak bisa dicek gandanya, jadi import tidak bisa dijalankan.
                </div>
              )}
            </>
          )}

          {result && (
            <>
              <div className="fact-grid" style={{ marginBottom: 12 }}>
                <div className="fact"><div className="fact-label">Lead baru</div><div className="fact-value">{num(result.summary.created)}</div></div>
                <div className="fact"><div className="fact-label">Digabung</div><div className="fact-value">{num(result.summary.merged)}</div></div>
                <div className="fact"><div className="fact-label">Ditandai mirip</div><div className="fact-value">{num(result.summary.flagged)}</div></div>
                <div className="fact"><div className="fact-label">Ditolak</div><div className={`fact-value${result.summary.rejected ? ' is-alert' : ''}`}>{num(result.summary.rejected)}</div></div>
              </div>

              <p className="card-note">
                Baris yang kontaknya sudah ada tidak dibuat ulang — datanya digabungkan ke lead yang sudah ada,
                sehingga angka konversi tidak terdilusi lead kembar.
              </p>

              {result.rejected_rows.length > 0 && (
                <div className="table-wrap" style={{ marginTop: 12 }}>
                  <table>
                    <thead><tr><th className="num">Baris</th><th>Nama</th><th>Alasan ditolak</th></tr></thead>
                    <tbody>
                      {result.rejected_rows.map((row) => (
                        <tr key={row.row}>
                          <td className="num">{row.row}</td>
                          <td>{row.name ?? '—'}</td>
                          <td>{row.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>{result ? 'Tutup' : 'Batal'}</button>
          {!result && (
            <button className="btn" disabled={busy || !preview || !preview.has_contact_column} onClick={run}>
              {busy ? 'Mengimpor…' : `Import ${preview ? num(preview.total_rows) : ''} baris`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
