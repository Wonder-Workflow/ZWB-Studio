import {
  buildMonthGrid,
  isSameDay,
  monthLabel,
  weekdayLabels,
} from '../lib/dates'
import { itemsForDate, itemsForMonth } from '../lib/calendar'
import { chipLabel, chipMeta } from '../lib/items'
import { AddMenu } from './AddMenu'
import { KIND_LABELS, KINDS, STATUS_LABELS, STATUSES, type CalendarItem, type ItemKind } from '../types/calendar'

type Props = {
  year: number
  month: number
  items: CalendarItem[]
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onStudioMonth: () => void
  onOpen: (item: CalendarItem) => void
  onAdd: (kind: ItemKind) => void
  onShotList: () => void
}

export function MonthCalendar({
  year,
  month,
  items,
  onPrev,
  onNext,
  onToday,
  onStudioMonth,
  onOpen,
  onAdd,
  onShotList,
}: Props) {
  const cells = buildMonthGrid(year, month)
  const today = new Date()
  const monthItems = itemsForMonth(items, year, month)

  return (
    <section>
      <div className="cal-head">
        <div>
          <p className="eyebrow">Production month</p>
          <h1>{monthLabel(year, month)}</h1>
        </div>
        <div className="cal-nav">
          <button className="today-btn add-btn" type="button" onClick={onShotList}>
            Shot list
          </button>
          <AddMenu onAdd={onAdd} />
          <button className="nav-btn" type="button" onClick={onPrev} aria-label="Previous month">
            ‹
          </button>
          <button className="today-btn" type="button" onClick={onStudioMonth}>
            October
          </button>
          <button className="today-btn" type="button" onClick={onToday}>
            Today
          </button>
          <button className="nav-btn" type="button" onClick={onNext} aria-label="Next month">
            ›
          </button>
        </div>
      </div>

      <div className="legend">
        {KINDS.map((kind) => (
          <span className={`legend-item kind-${kind}`} key={kind}>
            <span className="kind-mark">{kind === 'email' ? '✉' : ''}</span>
            {KIND_LABELS[kind]}
          </span>
        ))}
        {STATUSES.map((status) => (
          <span className={`legend-item status-${status}`} key={status}>
            <span className="swatch" />
            {STATUS_LABELS[status]}
          </span>
        ))}
      </div>

      <div className="cal-grid">
        {weekdayLabels().map((label) => (
          <div className="dow" key={label}>
            {label}
          </div>
        ))}
        {cells.map((cell, index) => {
          if (!cell.date || !cell.iso) {
            return <div className="day empty" key={`empty-${index}`} />
          }

          const dayItems = itemsForDate(items, cell.iso)
          const todayClass = isSameDay(cell.date, today) ? ' today' : ''

          return (
            <div className={`day${todayClass}`} key={cell.iso}>
              <div className="day-num">{cell.date.getDate()}</div>
              {dayItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`slot-chip kind-${item.kind}${item.kind === 'content' ? ` status-${item.status}` : ''}`}
                  onClick={() => onOpen(item)}
                >
                  <span className={item.kind === 'content' ? 'slot-dot' : 'kind-mark'}>
                    {item.kind === 'email' ? '✉' : ''}
                  </span>
                  <span className="slot-meta">
                    <div className="slot-format">{chipMeta(item)}</div>
                    <div className="slot-title">{chipLabel(item)}</div>
                  </span>
                </button>
              ))}
            </div>
          )
        })}
      </div>

      {monthItems.length === 0 ? (
        <p className="cal-empty">
          No items this month. Use <strong>Add</strong> for content, an event, an influencer visit, or a Friday email.
        </p>
      ) : null}
    </section>
  )
}
