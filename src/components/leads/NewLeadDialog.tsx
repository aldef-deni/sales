import { useState, type FormEvent } from 'react'
import { ApiError, api } from '../../lib/api'
import type { ChannelOption } from '../../lib/types'

interface Props {
  channels: ChannelOption[]
  onClose: () => void
  onCreated: (message: string) => void
}

export function NewLeadDialog({ channels, onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    name: '', company: '', email: '', phone: '', city: '',
    source: 'manual', estimated_value: '', notes: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value })

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)

    try {
      const res = await api<{ message: string }>('/leads', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          company: form.company || null,
          email: form.email || null,
          phone: form.phone || null,
          city: form.city || null,
          notes: form.notes || null,
          estimated_value: Number(form.estimated_value) || 0,
        }),
      })
      onCreated(res.message)
    } catch (err) {
      setError(err instanceof ApiError
        ? (Object.values(err.errors)[0]?.[0] ?? err.message)
        : 'Gagal menyimpan lead.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-plane" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <form className="card modal" onSubmit={submit}>
        <div className="card-head">
          <h2 className="card-title">Tambah lead</h2>
          <p className="card-note">Lead manual tetap melewati pengecekan ganda dan scoring yang sama dengan lead dari iklan.</p>
        </div>

        <div className="card-body">
          {error && <div className="form-error">{error}</div>}

          <div className="field">
            <label htmlFor="nl-name">Nama <span className="req">wajib</span></label>
            <input id="nl-name" value={form.name} onChange={set('name')} required maxLength={120} />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="nl-phone">Nomor telepon</label>
              <input id="nl-phone" value={form.phone} onChange={set('phone')} placeholder="0812…" />
            </div>
            <div className="field">
              <label htmlFor="nl-email">Email</label>
              <input id="nl-email" type="email" value={form.email} onChange={set('email')} />
            </div>
          </div>
          <p className="card-note" style={{ marginTop: -6, marginBottom: 12 }}>Isi minimal salah satu — tanpa kontak, lead tidak bisa ditindaklanjuti.</p>

          <div className="field-row">
            <div className="field">
              <label htmlFor="nl-company">Perusahaan</label>
              <input id="nl-company" value={form.company} onChange={set('company')} />
            </div>
            <div className="field">
              <label htmlFor="nl-city">Kota</label>
              <input id="nl-city" value={form.city} onChange={set('city')} />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="nl-source">Kanal asal</label>
              <select id="nl-source" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                {channels.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="nl-value">Estimasi nilai (Rp)</label>
              <input id="nl-value" inputMode="numeric" value={form.estimated_value}
                onChange={(e) => setForm({ ...form, estimated_value: e.target.value.replace(/\D/g, '') })} />
            </div>
          </div>

          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="nl-notes">Catatan</label>
            <input id="nl-notes" value={form.notes} onChange={set('notes')} />
          </div>
        </div>

        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Batal</button>
          <button className="btn" disabled={busy || !form.name.trim()}>{busy ? 'Menyimpan…' : 'Simpan lead'}</button>
        </div>
      </form>
    </div>
  )
}
