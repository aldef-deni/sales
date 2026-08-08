import { useCallback, useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { money, num } from '../../lib/format'
import type { LeadDetail as LeadDetailData, LeadDetailResponse } from '../../lib/types'

interface Props {
  leadId: number
  onClose: () => void
  onChanged: () => void
}

type Panel = 'none' | 'followup' | 'close' | 'convert'

export function LeadDetail({ leadId, onClose, onChanged }: Props) {
  const [data, setData] = useState<LeadDetailResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [panel, setPanel] = useState<Panel>('none')
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState<string | null>(null)

  const load = useCallback(
    () => api<LeadDetailResponse>(`/leads/${leadId}`).then(setData).catch((e) => setError(e.message)),
    [leadId],
  )

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function act(path: string, body: Record<string, unknown>, successMessage: string) {
    setBusy(true)
    setError(null)
    try {
      const res = await api<{ message?: string; lead?: LeadDetailData }>(`/leads/${leadId}/${path}`, {
        method: 'POST',
        body: JSON.stringify(body),
      })

      setFlash(res.message ?? successMessage)
      setPanel('none')

      // Server sudah mengembalikan bentuk lead terbaru, jadi dipakai langsung —
      // angka di layar berubah seketika, tanpa menunggu putaran pengambilan
      // ulang. Pemuatan ulang tetap dijalankan untuk riwayat dan daftar duplikat.
      if (res.lead) {
        setData((prev) => (prev ? { ...prev, lead: res.lead as LeadDetailData } : prev))
      }

      await load()
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan.')
    } finally {
      setBusy(false)
    }
  }

  if (error && !data) {
    return <Drawer onClose={onClose}><div className="empty">{error}</div></Drawer>
  }
  if (!data) {
    return <Drawer onClose={onClose}><div className="empty">Memuat…</div></Drawer>
  }

  const lead = data.lead
  const isOpen = !['converted', 'lost', 'unqualified'].includes(lead.status)

  return (
    <Drawer onClose={onClose}>
      <header className="drawer-head">
        <div>
          <div className="drawer-eyebrow">
            <span className={`pri pri-${lead.priority}`}>{lead.priority_label}</span>
            <span className="pill">{lead.status_label}</span>
            <span className="pill">{lead.source_label}</span>
          </div>
          <h2 className="drawer-title">{lead.name}</h2>
          <p className="card-note">{lead.company ?? 'Tanpa perusahaan'}{lead.city ? ` · ${lead.city}` : ''}</p>
        </div>
        <button className="btn btn-ghost" onClick={onClose}>Tutup</button>
      </header>

      {flash && <div className="flash">{flash}</div>}
      {error && <div className="form-error">{error}</div>}

      <div className="drawer-body">
        <section className="score-box">
          <div className="score-ring" style={{ ['--v' as string]: `${lead.score}` }}>
            <span className="score-num">{lead.score}</span>
            <span className="score-cap">skor</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 className="card-title">Kenapa skornya segini</h3>
            <ul className="score-list">
              {lead.score_reasons.length === 0 && <li className="card-note">Belum ada faktor yang terhitung.</li>}
              {lead.score_reasons.map((reason, i) => (
                <li key={i}>
                  <span className={`score-impact ${reason.impact >= 0 ? 'up' : 'down'}`}>
                    {reason.impact >= 0 ? '+' : ''}{reason.impact}
                  </span>
                  <span>
                    <b>{reason.factor}</b>
                    {reason.detail && <em className="score-detail">{reason.detail}</em>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="fact-grid">
          <Fact label="Nilai estimasi" value={money(lead.estimated_value)} />
          <Fact label="Ditugaskan" value={lead.assignee ?? '—'} />
          <Fact label="Umur lead" value={`${num(lead.age_days)} hari`} />
          <Fact label="Kontak pertama" value={lead.response_hours !== null ? `${lead.response_hours} jam` : 'Belum'} />
          <Fact label="Jumlah follow-up" value={num(lead.follow_up_count)} />
          <Fact
            label="Follow-up berikutnya"
            value={lead.next_follow_up_at ? formatDate(lead.next_follow_up_at) : '—'}
            alert={lead.follow_up_due}
          />
          <Fact label="Telepon" value={lead.phone ?? '—'} />
          <Fact label="Email" value={lead.email ?? '—'} />
        </div>

        {lead.lost_reason && (
          <div className="form-error" style={{ marginBottom: 14 }}>
            <b>Gagal:</b> {lead.lost_reason}
          </div>
        )}

        {data.possible_duplicates.length > 0 && (
          <section className="card" style={{ marginBottom: 14 }}>
            <div className="card-head">
              <h3 className="card-title">Kemungkinan lead ganda</h3>
              <p className="card-note">Mirip tapi belum pasti sama, jadi tidak digabung otomatis.</p>
            </div>
            <div className="card-body">
              {data.possible_duplicates.map((dup) => (
                <div key={dup.id} className="dup-row">
                  <span>
                    <b>{dup.name}</b>{dup.company ? ` · ${dup.company}` : ''}
                    <span className="card-note"> {dup.phone ?? dup.email ?? ''}</span>
                  </span>
                  <button
                    className="btn btn-ghost"
                    disabled={busy}
                    onClick={() => act('merge', { primary_id: dup.id }, 'Digabungkan.')}
                  >
                    Gabungkan ke sini
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {isOpen && (
          <div className="toolbar">
            <button className="btn" onClick={() => setPanel(panel === 'followup' ? 'none' : 'followup')}>Catat follow-up</button>
            <button className="btn btn-ghost" onClick={() => setPanel(panel === 'convert' ? 'none' : 'convert')}>Konversi</button>
            <button className="btn btn-ghost" onClick={() => setPanel(panel === 'close' ? 'none' : 'close')}>Tandai gagal</button>
          </div>
        )}

        {panel === 'followup' && <FollowUpForm busy={busy} onSubmit={(body) => act('follow-up', body, 'Follow-up tercatat.')} />}
        {panel === 'close' && <CloseForm busy={busy} categories={data.loss_categories} onSubmit={(body) => act('close', body, 'Lead ditutup.')} />}
        {panel === 'convert' && <ConvertForm busy={busy} defaultValue={lead.estimated_value} onSubmit={(body) => act('convert', body, 'Lead dikonversi.')} />}

        <section className="card">
          <div className="card-head"><h3 className="card-title">Riwayat</h3></div>
          <div className="card-body">
            {data.timeline.length === 0 && <p className="card-note">Belum ada aktivitas.</p>}
            <ol className="timeline">
              {data.timeline.map((entry, i) => (
                <li key={i}>
                  <div className="timeline-dot" />
                  <div>
                    <div className="timeline-title">{entry.title}</div>
                    <div className="card-note">
                      {formatDate(entry.at)}{entry.by ? ` · ${entry.by}` : ''}
                    </div>
                    {entry.note && <div className="timeline-note">{entry.note}</div>}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>
    </Drawer>
  )
}

// ------------------------------------------------------------------ bagian

function Drawer({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="drawer-plane" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <aside className="drawer" role="dialog" aria-modal="true">{children}</aside>
    </div>
  )
}

function Fact({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="fact">
      <div className="fact-label">{label}</div>
      <div className={`fact-value${alert ? ' is-alert' : ''}`}>{value}</div>
    </div>
  )
}

function FollowUpForm({ busy, onSubmit }: { busy: boolean; onSubmit: (b: Record<string, unknown>) => void }) {
  const [type, setType] = useState('whatsapp')
  const [notes, setNotes] = useState('')
  const [gotResponse, setGotResponse] = useState(false)
  const [nextDays, setNextDays] = useState(3)

  return (
    <section className="card action-panel">
      <div className="card-body">
        <div className="field">
          <label>Cara menghubungi</label>
          <div className="reason-list">
            {['whatsapp', 'call', 'email', 'meeting', 'note'].map((t) => (
              <button key={t} type="button" className={`chip${type === t ? ' active' : ''}`} onClick={() => setType(t)}>
                {{ whatsapp: 'WhatsApp', call: 'Telepon', email: 'Email', meeting: 'Meeting', note: 'Catatan' }[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="fu-notes">Catatan</label>
          <input id="fu-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Hasil pembicaraan…" />
        </div>

        <label className="check">
          <input type="checkbox" checked={gotResponse} onChange={(e) => setGotResponse(e.target.checked)} />
          Dia merespons
        </label>

        <div className="field">
          <label htmlFor="fu-next">Follow-up berikutnya</label>
          <div className="reason-list">
            {[1, 3, 7, 14].map((d) => (
              <button key={d} type="button" className={`chip${nextDays === d ? ' active' : ''}`} onClick={() => setNextDays(d)}>
                {d} hari lagi
              </button>
            ))}
          </div>
        </div>

        <button
          className="btn"
          disabled={busy}
          onClick={() => onSubmit({
            type,
            notes: notes || null,
            got_response: gotResponse,
            next_follow_up_at: new Date(Date.now() + nextDays * 864e5).toISOString(),
          })}
        >
          Simpan follow-up
        </button>
      </div>
    </section>
  )
}

function CloseForm({ busy, categories, onSubmit }: {
  busy: boolean
  categories: { value: string; label: string }[]
  onSubmit: (b: Record<string, unknown>) => void
}) {
  const [status, setStatus] = useState('lost')
  const [category, setCategory] = useState('')
  const [reason, setReason] = useState('')

  return (
    <section className="card action-panel">
      <div className="card-body">
        <div className="field">
          <label>Jenis kegagalan</label>
          <div className="reason-list">
            <button type="button" className={`chip${status === 'lost' ? ' active' : ''}`} onClick={() => setStatus('lost')}>
              Kalah — cocok tapi tidak jadi
            </button>
            <button type="button" className={`chip${status === 'unqualified' ? ' active' : ''}`} onClick={() => setStatus('unqualified')}>
              Tidak layak — memang tidak cocok
            </button>
          </div>
        </div>

        <div className="field">
          <label>Sebabnya</label>
          <div className="reason-list">
            {categories.map((c) => (
              <button key={c.value} type="button" className={`chip${category === c.value ? ' active' : ''}`} onClick={() => setCategory(c.value)}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="close-reason">Penjelasan singkat</label>
          <input id="close-reason" value={reason} maxLength={255} onChange={(e) => setReason(e.target.value)} placeholder="Contoh: harga 30% di atas anggaran mereka" />
        </div>

        <button className="btn btn-danger" disabled={busy || !category || !reason.trim()} onClick={() => onSubmit({ status, category, reason: reason.trim() })}>
          Tutup lead ini
        </button>
      </div>
    </section>
  )
}

function ConvertForm({ busy, defaultValue, onSubmit }: {
  busy: boolean
  defaultValue: number
  onSubmit: (b: Record<string, unknown>) => void
}) {
  const [value, setValue] = useState(String(Math.round(defaultValue)))

  return (
    <section className="card action-panel">
      <div className="card-body">
        <p className="card-note" style={{ marginBottom: 10 }}>
          Lead menjadi pelanggan, dan satu deal baru masuk pipeline di tahap Kualifikasi.
        </p>
        <div className="field">
          <label htmlFor="cv-value">Nilai deal (Rp)</label>
          <input id="cv-value" inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))} />
        </div>
        <button className="btn" disabled={busy} onClick={() => onSubmit({ deal_value: Number(value) || 0 })}>
          Konversi jadi pelanggan
        </button>
      </div>
    </section>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}
