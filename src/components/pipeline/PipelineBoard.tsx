import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor,
  useDroppable, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core'
import { useCallback, useMemo, useState } from 'react'
import { api } from '../../lib/api'
import { money, num } from '../../lib/format'
import type { Board, BoardColumn, DealRow } from '../../lib/types'
import { DealCard, DealCardBody } from './DealCard'
import { LostReasonDialog } from './LostReasonDialog'

interface Props {
  board: Board
  currentUserId: number
  onBoardChange: (board: Board) => void
}

export function PipelineBoard({ board, currentUserId, onBoardChange }: Props) {
  const [dragging, setDragging] = useState<DealRow | null>(null)
  const [pendingLoss, setPendingLoss] = useState<{ deal: DealRow; from: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Jarak aktivasi kecil supaya klik biasa pada kartu tidak langsung
  // ditafsirkan sebagai awal drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  )

  const canMove = useCallback(
    (deal: DealRow) => board.can_move_others || deal.owner_id === currentUserId,
    [board.can_move_others, currentUserId],
  )

  /** Memindahkan kartu antar kolom di state, sekaligus menghitung ulang total kolom. */
  const relocate = useCallback((source: Board, deal: DealRow, from: string, to: string): Board => {
    const probability = source.columns.find((c) => c.stage === to)?.probability ?? deal.probability
    const moved: DealRow = {
      ...deal,
      stage: to,
      probability,
      weighted_value: deal.value * (probability / 100),
      days_in_stage: 0,
      // Status "mandek"/"lewat tanggal" hanya berlaku untuk deal terbuka, dan
      // hitungan diamnya baru saja direset oleh perpindahan ini.
      is_stalled: false,
      is_overdue: to === 'won' || to === 'lost' ? false : deal.is_overdue,
      stage_label: source.columns.find((c) => c.stage === to)?.label ?? deal.stage_label,
    }

    return {
      ...source,
      columns: source.columns.map((column) => {
        if (column.stage !== from && column.stage !== to) return column

        const deals =
          column.stage === from
            ? column.deals.filter((d) => d.id !== deal.id)
            : [moved, ...column.deals].sort((a, b) => b.value - a.value)

        return {
          ...column,
          deals,
          deal_count: deals.length,
          total_value: deals.reduce((sum, d) => sum + d.value, 0),
          weighted_value: deals.reduce((sum, d) => sum + d.weighted_value, 0),
        }
      }),
    }
  }, [])

  /**
   * Kartu dipindahkan lebih dulu di layar, baru dikonfirmasi ke server.
   * Kalau server menolak, papan dikembalikan ke bentuk sebelum perpindahan —
   * bukan sekadar dipindah balik — supaya total kolom ikut pulih dengan benar.
   */
  const commitMove = useCallback(
    async (deal: DealRow, from: string, to: string, lostReason?: string) => {
      const snapshot = board
      setError(null)
      onBoardChange(relocate(board, deal, from, to))

      try {
        const res = await api<{ deal: DealRow }>(`/deals/${deal.id}/stage`, {
          method: 'PATCH',
          body: JSON.stringify({ stage: to, ...(lostReason ? { lost_reason: lostReason } : {}) }),
        })
        // Server adalah sumber kebenaran untuk probabilitas, alasan kalah,
        // dan penanda mandek — pakai bentuk kiriman balik, bukan tebakan lokal.
        onBoardChange(replaceDeal(relocate(snapshot, deal, from, to), res.deal))
      } catch (err) {
        onBoardChange(snapshot)
        setError(err instanceof Error ? err.message : 'Gagal memindahkan deal.')
      }
    },
    [board, onBoardChange, relocate],
  )

  function onDragStart(event: DragStartEvent) {
    setDragging((event.active.data.current?.deal as DealRow) ?? null)
  }

  function onDragEnd(event: DragEndEvent) {
    const deal = event.active.data.current?.deal as DealRow | undefined
    const to = event.over?.id as string | undefined
    setDragging(null)

    if (!deal || !to || to === deal.stage) return

    if (to === 'lost') {
      // Alasan kalah wajib, jadi perpindahannya ditahan sampai dialog dijawab.
      setPendingLoss({ deal, from: deal.stage })
      return
    }

    void commitMove(deal, deal.stage, to)
  }

  const totals = useMemo(() => {
    const open = board.columns.filter((c) => !c.is_closed)
    return {
      count: open.reduce((s, c) => s + c.deal_count, 0),
      value: open.reduce((s, c) => s + c.total_value, 0),
      weighted: open.reduce((s, c) => s + c.weighted_value, 0),
    }
  }, [board])

  return (
    <>
      {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}

      <p className="page-sub" style={{ marginTop: -8, marginBottom: 14 }}>
        {num(totals.count)} deal terbuka · {money(totals.value)} nilai kotor · {money(totals.weighted)} tertimbang ·
        kolom Menang/Kalah menampilkan {board.closed_window_days} hari terakhir
      </p>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="board">
          {board.columns.map((column) => (
            <Column
              key={column.stage}
              column={column}
              showOwner={board.can_move_others}
              draggingId={dragging?.id ?? null}
              canMove={canMove}
            />
          ))}
        </div>

        {/* Kartu yang mengikuti kursor; kartu aslinya tetap di tempat sebagai bayangan. */}
        <DragOverlay dropAnimation={null}>
          {dragging && (
            <article className="deal-card is-overlay">
              <DealCardBody deal={dragging} showOwner={board.can_move_others} />
            </article>
          )}
        </DragOverlay>
      </DndContext>

      {pendingLoss && (
        <LostReasonDialog
          deal={pendingLoss.deal}
          onCancel={() => setPendingLoss(null)}
          onConfirm={(reason) => {
            const { deal, from } = pendingLoss
            setPendingLoss(null)
            void commitMove(deal, from, 'lost', reason)
          }}
        />
      )}
    </>
  )
}

interface ColumnProps {
  column: BoardColumn
  showOwner: boolean
  draggingId: number | null
  canMove: (deal: DealRow) => boolean
}

function Column({ column, showOwner, draggingId, canMove }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.stage })

  return (
    <section className={`board-col${isOver ? ' is-over' : ''}`} ref={setNodeRef}>
      <header className={`board-col-head stage-${column.stage}`}>
        <div className="board-col-title">
          {column.label}
          <span className="board-col-count">{num(column.deal_count)}</span>
        </div>
        <div className="board-col-value tnum">{money(column.total_value)}</div>
        {!column.is_closed && (
          <div className="board-col-weighted tnum">tertimbang {money(column.weighted_value)}</div>
        )}
      </header>

      <div className="board-col-body">
        {column.deals.length === 0 && <div className="board-col-empty">Tarik deal ke sini</div>}
        {column.deals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            showOwner={showOwner}
            draggable={canMove(deal)}
            hidden={draggingId === deal.id}
          />
        ))}
      </div>
    </section>
  )
}

function replaceDeal(board: Board, updated: DealRow): Board {
  return {
    ...board,
    columns: board.columns.map((column) => {
      if (!column.deals.some((d) => d.id === updated.id)) return column
      const deals = column.deals.map((d) => (d.id === updated.id ? updated : d))
      return {
        ...column,
        deals,
        weighted_value: deals.reduce((sum, d) => sum + d.weighted_value, 0),
      }
    }),
  }
}
