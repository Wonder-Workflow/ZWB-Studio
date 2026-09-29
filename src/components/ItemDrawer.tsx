import { useEffect, useRef, useState, type ReactNode } from 'react'
import { itemSpan } from '../lib/calendar'
import { formatDateRange } from '../lib/dates'
import { removeItem, saveItemPatch, type PersistSource } from '../lib/storage'
import {
  EVENT_STATUS_LABELS,
  EVENT_STATUSES,
  FORMATS,
  INFLUENCER_STATUS_LABELS,
  INFLUENCER_STATUSES,
  KIND_LABELS,
  OVERLAY_STYLE_LABELS,
  OVERLAY_STYLES,
  STATUS_LABELS,
  STATUSES,
  type BoardState,
  type CalendarItem,
  type ContentItem,
  type EmailItem,
  type EventItem,
  type EventStatus,
  type Format,
  type InfluencerItem,
  type InfluencerStatus,
  type ItemPatch,
  type OverlayStyle,
  type Status,
  type TextOverlay,
} from '../types/calendar'

type Props = {
  item: CalendarItem
  onClose: () => void
  onBoard: (board: BoardState, source: PersistSource) => void
}

export function ItemDrawer({ item, onClose, onBoard }: Props) {
  const [draft, setDraft] = useState<CalendarItem>(item)
  const [saveState, setSaveState] = useState(
    'Edits save to the studio when Netlify Blobs are on, or to this device.',
  )

  useEffect(() => {
    setDraft(item)
  }, [item])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function persist(patch: ItemPatch) {
    setSaveState('Saving…')
    const result = await saveItemPatch(item.id, patch)
    onBoard(result.board, result.source)
    setSaveState(result.source === 'studio' ? 'Saved to studio.' : 'Saved on this device.')
  }

  function update<T extends CalendarItem>(next: T) {
    setDraft(next)
  }

  async function onRemove() {
    const result = await removeItem(item.id)
    onBoard(result.board, result.source)
    onClose()
  }

  return (
    <>
      <button className="drawer-backdrop" type="button" aria-label="Close drawer" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-labelledby="item-title">
        <div className="drawer-head">
          <div>
            <p className="eyebrow">
              {KIND_LABELS[draft.kind]} · {formatDateRange(itemSpan(draft).start, itemSpan(draft).end)}
            </p>
            <h2 id="item-title">
              {draft.kind === 'influencer'
                ? draft.name || draft.title
                : draft.kind === 'email'
                  ? draft.subject || draft.title
                  : draft.title}
            </h2>
          </div>
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="drawer-body">
          {draft.kind === 'content' ? (
            <ContentFields item={draft} onChange={update} onPersist={persist} />
          ) : null}
          {draft.kind === 'event' ? (
            <EventFields item={draft} onChange={update} onPersist={persist} />
          ) : null}
          {draft.kind === 'influencer' ? (
            <InfluencerFields item={draft} onChange={update} onPersist={persist} />
          ) : null}
          {draft.kind === 'email' ? (
            <EmailFields item={draft} onChange={update} onPersist={persist} />
          ) : null}
          <p className={`save-line${saveState.startsWith('Saved') ? ' ok' : ''}`}>{saveState}</p>
          <button className="btn btn-ghost danger" type="button" onClick={() => void onRemove()}>
            Remove from calendar
          </button>
        </div>
      </aside>
    </>
  )
}

function ContentFields({
  item,
  onChange,
  onPersist,
}: {
  item: ContentItem
  onChange: (item: ContentItem) => void
  onPersist: (patch: ItemPatch) => Promise<void>
}) {
  return (
    <>
      <div className="meta-row">
        <span className="pill kind-content">Content</span>
        <span className="pill">{item.format}</span>
        <span className={`pill status-${item.status}`}>
          <span className="swatch" /> {STATUS_LABELS[item.status]}
        </span>
      </div>

      <div className="edit-panel">
        <Field label="Title" htmlFor="c-title">
          <input
            id="c-title"
            value={item.title}
            onChange={(event) => onChange({ ...item, title: event.target.value })}
            onBlur={() => void onPersist({ title: item.title })}
          />
        </Field>
        <div className="field-row">
          <Field label="Date" htmlFor="c-date">
            <input
              id="c-date"
              type="date"
              value={item.date}
              onChange={(event) => {
                const date = event.target.value
                onChange({ ...item, date })
                void onPersist({ date })
              }}
            />
          </Field>
          <Field label="Format" htmlFor="c-format">
            <select
              id="c-format"
              value={item.format}
              onChange={(event) => {
                const format = event.target.value as Format
                onChange({ ...item, format })
                void onPersist({ format })
              }}
            >
              {FORMATS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="field-row">
          <Field label="Status" htmlFor="c-status">
            <select
              id="c-status"
              value={item.status}
              onChange={(event) => {
                const status = event.target.value as Status
                onChange({ ...item, status })
                void onPersist({ status })
              }}
            >
              {STATUSES.map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Length" htmlFor="c-length">
            <input
              id="c-length"
              value={item.length}
              onChange={(event) => onChange({ ...item, length: event.target.value })}
              onBlur={() => void onPersist({ length: item.length })}
            />
          </Field>
        </div>
      </div>

      <Field label="Concept" htmlFor="c-concept">
        <textarea
          id="c-concept"
          value={item.concept}
          onChange={(event) => onChange({ ...item, concept: event.target.value })}
          onBlur={() => void onPersist({ concept: item.concept })}
        />
      </Field>
      <Field label="Hook" htmlFor="c-hook">
        <textarea
          id="c-hook"
          value={item.hook}
          onChange={(event) => onChange({ ...item, hook: event.target.value })}
          onBlur={() => void onPersist({ hook: item.hook })}
        />
      </Field>
      <Field label="Shot list and angles" htmlFor="c-shots">
        <textarea
          id="c-shots"
          className="shot-list-field"
          value={item.shotList}
          onChange={(event) => onChange({ ...item, shotList: event.target.value })}
          onBlur={() => void onPersist({ shotList: item.shotList })}
        />
      </Field>

      <OverlayEditor
        overlays={item.textOverlays}
        onChange={(textOverlays) => onChange({ ...item, textOverlays })}
        onCommit={(textOverlays) => void onPersist({ textOverlays })}
      />

      <Field label="Caption" htmlFor="c-caption">
        <textarea
          id="c-caption"
          value={item.caption}
          onChange={(event) => onChange({ ...item, caption: event.target.value })}
          onBlur={() => void onPersist({ caption: item.caption })}
        />
      </Field>
    </>
  )
}

function EventFields({
  item,
  onChange,
  onPersist,
}: {
  item: EventItem
  onChange: (item: EventItem) => void
  onPersist: (patch: ItemPatch) => Promise<void>
}) {
  return (
    <div className="edit-panel">
      <span className="pill kind-event">Event</span>
      <Field label="Title" htmlFor="e-title">
        <input
          id="e-title"
          value={item.title}
          onChange={(event) => onChange({ ...item, title: event.target.value })}
          onBlur={() => void onPersist({ title: item.title })}
        />
      </Field>
      <div className="field-row">
        <Field label="Start date" htmlFor="e-start-date">
          <input
            id="e-start-date"
            type="date"
            value={item.startDate}
            onChange={(event) => {
              const startDate = event.target.value
              const endDate = item.endDate && item.endDate >= startDate ? item.endDate : startDate
              onChange({ ...item, startDate, endDate, date: startDate })
              void onPersist({ startDate, endDate, date: startDate })
            }}
          />
        </Field>
        <Field label="End date" htmlFor="e-end-date">
          <input
            id="e-end-date"
            type="date"
            value={item.endDate}
            onChange={(event) => {
              const next = event.target.value
              const endDate = next && next >= item.startDate ? next : item.startDate
              onChange({ ...item, endDate })
              void onPersist({ endDate })
            }}
          />
        </Field>
      </div>
      <div className="field-row">
        <Field label="Start time" htmlFor="e-start-time">
          <input
            id="e-start-time"
            type="time"
            value={item.startTime}
            onChange={(event) => onChange({ ...item, startTime: event.target.value })}
            onBlur={() => void onPersist({ startTime: item.startTime })}
          />
        </Field>
        <Field label="End time" htmlFor="e-end-time">
          <input
            id="e-end-time"
            type="time"
            value={item.endTime}
            onChange={(event) => onChange({ ...item, endTime: event.target.value })}
            onBlur={() => void onPersist({ endTime: item.endTime })}
          />
        </Field>
      </div>
      <Field label="Location" htmlFor="e-location">
        <input
          id="e-location"
          value={item.location ?? ''}
          onChange={(event) => onChange({ ...item, location: event.target.value })}
          onBlur={() => void onPersist({ location: item.location })}
        />
      </Field>
      <Field label="Status (optional)" htmlFor="e-status">
        <select
          id="e-status"
          value={item.status ?? 'planned'}
          onChange={(event) => {
            const status = event.target.value as EventStatus
            onChange({ ...item, status })
            void onPersist({ status })
          }}
        >
          {EVENT_STATUSES.map((value) => (
            <option key={value} value={value}>
              {EVENT_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Notes" htmlFor="e-notes">
        <textarea
          id="e-notes"
          value={item.notes}
          onChange={(event) => onChange({ ...item, notes: event.target.value })}
          onBlur={() => void onPersist({ notes: item.notes })}
        />
      </Field>
    </div>
  )
}

function EmailFields({
  item,
  onChange,
  onPersist,
}: {
  item: EmailItem
  onChange: (item: EmailItem) => void
  onPersist: (patch: ItemPatch) => Promise<void>
}) {
  return (
    <div className="email-compose">
      <div className="email-compose-bar">
        <span className="pill kind-email">✉ Email</span>
        <p className="helper">Friday campaign. Another department writes the send — capture subject and body here.</p>
      </div>
      <Field label="From (optional)" htmlFor="m-from">
        <input
          id="m-from"
          value={item.from ?? ''}
          placeholder="Zion White Bison"
          onChange={(event) => onChange({ ...item, from: event.target.value })}
          onBlur={() => void onPersist({ from: item.from })}
        />
      </Field>
      <Field label="Subject" htmlFor="m-subject">
        <input
          id="m-subject"
          required
          value={item.subject}
          placeholder="Subject line"
          onChange={(event) =>
            onChange({ ...item, subject: event.target.value, title: event.target.value || 'Friday email' })
          }
          onBlur={() => void onPersist({ subject: item.subject, title: item.subject || 'Friday email' })}
        />
      </Field>
      <Field label="Description / body" htmlFor="m-body">
        <textarea
          id="m-body"
          className="email-body"
          value={item.body}
          placeholder="Campaign body or brief for the email team…"
          onChange={(event) => onChange({ ...item, body: event.target.value })}
          onBlur={() => void onPersist({ body: item.body })}
        />
      </Field>
      <Field label="Send date" htmlFor="m-date">
        <input
          id="m-date"
          type="date"
          value={item.date}
          onChange={(event) => {
            const date = event.target.value
            onChange({ ...item, date })
            void onPersist({ date })
          }}
        />
      </Field>
      <Field label="Notes (optional)" htmlFor="m-notes">
        <textarea
          id="m-notes"
          value={item.notes}
          onChange={(event) => onChange({ ...item, notes: event.target.value })}
          onBlur={() => void onPersist({ notes: item.notes })}
        />
      </Field>
    </div>
  )
}

function InfluencerFields({
  item,
  onChange,
  onPersist,
}: {
  item: InfluencerItem
  onChange: (item: InfluencerItem) => void
  onPersist: (patch: ItemPatch) => Promise<void>
}) {
  return (
    <div className="edit-panel">
      <span className="pill kind-influencer">Influencer</span>
      <Field label="Name" htmlFor="i-name">
        <input
          id="i-name"
          value={item.name}
          onChange={(event) => onChange({ ...item, name: event.target.value, title: event.target.value })}
          onBlur={() => void onPersist({ name: item.name, title: item.name })}
        />
      </Field>
      <Field label="Handle" htmlFor="i-handle">
        <input
          id="i-handle"
          value={item.handle ?? ''}
          placeholder="@studio"
          onChange={(event) => onChange({ ...item, handle: event.target.value })}
          onBlur={() => void onPersist({ handle: item.handle })}
        />
      </Field>
      <div className="field-row">
        <Field label="Arrive" htmlFor="i-date">
          <input
            id="i-date"
            type="date"
            value={item.date}
            onChange={(event) => {
              const date = event.target.value
              onChange({ ...item, date })
              void onPersist({ date })
            }}
          />
        </Field>
        <Field label="Depart (optional)" htmlFor="i-end">
          <input
            id="i-end"
            type="date"
            value={item.endDate ?? ''}
            onChange={(event) => {
              const endDate = event.target.value
              onChange({ ...item, endDate })
              void onPersist({ endDate })
            }}
          />
        </Field>
      </div>
      <div className="field-row">
        <Field label="Platform" htmlFor="i-platform">
          <input
            id="i-platform"
            value={item.platform}
            onChange={(event) => onChange({ ...item, platform: event.target.value })}
            onBlur={() => void onPersist({ platform: item.platform })}
          />
        </Field>
        <Field label="Status" htmlFor="i-status">
          <select
            id="i-status"
            value={item.status}
            onChange={(event) => {
              const status = event.target.value as InfluencerStatus
              onChange({ ...item, status })
              void onPersist({ status })
            }}
          >
            {INFLUENCER_STATUSES.map((value) => (
              <option key={value} value={value}>
                {INFLUENCER_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Deliverables" htmlFor="i-deliverables">
        <textarea
          id="i-deliverables"
          value={item.deliverables}
          onChange={(event) => onChange({ ...item, deliverables: event.target.value })}
          onBlur={() => void onPersist({ deliverables: item.deliverables })}
        />
      </Field>
      <Field label="Notes" htmlFor="i-notes">
        <textarea
          id="i-notes"
          value={item.notes}
          onChange={(event) => onChange({ ...item, notes: event.target.value })}
          onBlur={() => void onPersist({ notes: item.notes })}
        />
      </Field>
    </div>
  )
}

function OverlayEditor({
  overlays,
  onChange,
  onCommit,
}: {
  overlays: TextOverlay[]
  onChange: (overlays: TextOverlay[]) => void
  onCommit: (overlays: TextOverlay[]) => void
}) {
  const latest = useRef(overlays)
  latest.current = overlays

  function addRow() {
    const next = [
      ...overlays,
      {
        id: `overlay-${Date.now().toString(36)}`,
        timing: '',
        text: '',
        style: 'overlay' as const,
      },
    ]
    onChange(next)
    onCommit(next)
  }

  function replace(id: string, patch: Partial<TextOverlay>, commit = false) {
    const next = overlays.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry))
    latest.current = next
    onChange(next)
    if (commit) onCommit(next)
  }

  function remove(id: string) {
    const next = overlays.filter((entry) => entry.id !== id)
    onChange(next)
    onCommit(next)
  }

  return (
    <div className="overlay-block">
      <h3>On-screen text</h3>
      <p className="helper">Use for subtitles or silent-video overlays. Timing is optional.</p>
      {overlays.length === 0 ? <p className="helper">No overlays yet.</p> : null}
      {overlays.map((row, index) => (
        <div className="overlay-row" key={row.id}>
          <input
            aria-label={`Overlay ${index + 1} timing`}
            placeholder="0:00–0:03"
            value={row.timing ?? ''}
            onChange={(event) => replace(row.id, { timing: event.target.value })}
            onBlur={() => onCommit(latest.current)}
          />
          <select
            aria-label={`Overlay ${index + 1} style`}
            value={row.style ?? 'overlay'}
            onChange={(event) => replace(row.id, { style: event.target.value as OverlayStyle }, true)}
          >
            {OVERLAY_STYLES.map((style) => (
              <option key={style} value={style}>
                {OVERLAY_STYLE_LABELS[style]}
              </option>
            ))}
          </select>
          <input
            aria-label={`Overlay ${index + 1} text`}
            placeholder="On-screen line"
            value={row.text}
            onChange={(event) => replace(row.id, { text: event.target.value })}
            onBlur={() => onCommit(latest.current)}
          />
          <button className="btn btn-ghost" type="button" onClick={() => remove(row.id)}>
            Remove
          </button>
        </div>
      ))}
      <button className="today-btn" type="button" onClick={addRow}>
        Add overlay
      </button>
    </div>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: ReactNode
}) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  )
}
