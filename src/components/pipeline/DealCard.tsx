import { useDraggable } from '@dnd-kit/core'
import { money } from '../../lib/format'
import type { DealRow } from '../../lib/types'

interface Props {
  deal: DealRow
  showOwner: boolean
  draggable: boolean
  /** Deal yang sedang diangkat disembunyikan dari kolomnya; DragOverlay yang menggambarnya. */
  hidden?: boolean
}

export function DealCard({ deal, showOwner, draggable, hidden }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: deal.id,
    disabled: !draggable,
    data: { deal },
  })

  return (
    <article
      ref={setNodeRef}
      className={`deal-card${draggable ? ' is-draggable' : ''}${isDragging || hidden ? ' is-ghost' : ''}`}
      {...listeners}
      {...attributes}
    >
      <DealCardBody deal={deal} showOwner={showOwner} />
    </article>
  )
}

/** Tampilan kartu tanpa perilaku drag — dipakai ulang oleh DragOverlay. */
export function DealCardBody({ deal, showOwner }: { deal: DealRow; showOwner: boolean }) {
  return (
    <>
      <div className="deal-card-title">{deal.title}</div>
      {deal.customer && <div className="deal-card-customer">{deal.customer}</div>}

      <div className="deal-card-value tnum">{money(deal.value)}</div>

      <div className="deal-card-foot">
        {showOwner && deal.owner && <span className="deal-card-owner">{deal.owner}</span>}
        <span className="deal-card-days tnum" title={`Biasanya tahap ini selesai dalam ${deal.normal_days_in_stage} hari`}>
          {deal.days_in_stage} hr
        </span>
      </div>

      {(deal.is_stalled || deal.is_overdue) && (
        <div className="deal-card-flags">
          {deal.is_stalled && <span className="pill alert">mengendap</span>}
          {deal.is_overdue && <span className="pill warn">lewat tanggal</span>}
        </div>
      )}

      {deal.lost_reason && <div className="deal-card-reason">Alasan: {deal.lost_reason}</div>}
    </>
  )
}
