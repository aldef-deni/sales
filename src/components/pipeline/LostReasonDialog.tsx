import { useEffect, useRef, useState } from 'react'
import type { DealRow } from '../../lib/types'

/**
 * Alasan kalah diminta di sini, bukan dijadikan isian opsional belakangan.
 *
 * Alasan kalah yang menumpuk di satu sebab (harga, kompetitor, timing) adalah
 * sinyal masalah proses, bukan performa individu — dan itu hanya terbaca kalau
 * datanya benar-benar terkumpul saat deal ditutup.
 */
const PRESETS = [
  'Harga terlalu tinggi',
  'Pilih kompetitor',
  'Budget ditunda',
  'Tidak ada respon',
  'Kebutuhan tidak cocok',
  'Proyek dibatalkan',
]

interface Props {
  deal: DealRow
  onConfirm: (reason: string) => void
  onCancel: () => void
}

export function LostReasonDialog({ deal, onConfirm, onCancel }: Props) {
  const [reason, setReason] = useState('')
  const [custom, setCustom] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', onKey)
    dialogRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  const finalReason = reason === '__custom' ? custom.trim() : reason

  return (
    <div className="modal-plane" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="card modal" role="dialog" aria-modal="true" aria-label="Alasan deal kalah" ref={dialogRef} tabIndex={-1}>
        <div className="card-head">
          <h2 className="card-title">Kenapa deal ini kalah?</h2>
          <p className="card-note">{deal.title}{deal.customer ? ` · ${deal.customer}` : ''}</p>
        </div>

        <div className="card-body">
          <div className="reason-list">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className={`chip${reason === preset ? ' active' : ''}`}
                onClick={() => setReason(preset)}
              >
                {preset}
              </button>
            ))}
            <button
              type="button"
              className={`chip${reason === '__custom' ? ' active' : ''}`}
              onClick={() => setReason('__custom')}
            >
              Alasan lain…
            </button>
          </div>

          {reason === '__custom' && (
            <div className="field" style={{ marginTop: 12, marginBottom: 0 }}>
              <label htmlFor="custom-reason">Tulis alasannya</label>
              <input
                id="custom-reason"
                value={custom}
                maxLength={255}
                onChange={(e) => setCustom(e.target.value)}
                autoFocus
              />
            </div>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onCancel}>Batal</button>
          <button className="btn btn-danger" disabled={!finalReason} onClick={() => onConfirm(finalReason)}>
            Tandai kalah
          </button>
        </div>
      </div>
    </div>
  )
}
