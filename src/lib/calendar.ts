import {
  emptyBoard,
  isEventStatus,
  isFormat,
  isInfluencerStatus,
  isKind,
  isOverlayStyle,
  migrateContentStatus,
  isStatus,
  type BoardState,
  type CalendarFile,
  type CalendarItem,
  type ContentItem,
  type EmailItem,
  type EventItem,
  type InfluencerItem,
  type ItemPatch,
  type TextOverlay,
} from '../types/calendar'
import { itemTouchesDate, itemTouchesMonth } from './dates'
import { hookFromRecord, mergedHook, shotListText } from './packFields'

export function applyBoard(items: CalendarItem[], board: BoardState): CalendarItem[] {
  const removed = new Set(board.removed)
  const patched = items
    .filter((item) => !removed.has(item.id))
    .map((item) => applyPatch(item, board.patches[item.id]))
  const extras = board.extras
    .filter((item) => !removed.has(item.id))
    .map((item) => applyPatch(item, board.patches[item.id]))
  return [...patched, ...extras]
}

export function itemSpan(item: CalendarItem): { start: string; end?: string } {
  if (item.kind === 'event') {
    const start = item.startDate || item.date
    const end = item.endDate && item.endDate >= start ? item.endDate : start
    return { start, end }
  }
  if (item.kind === 'influencer') {
    return { start: item.date, end: item.endDate }
  }
  return { start: item.date }
}

export function itemsForDate(items: CalendarItem[], iso: string): CalendarItem[] {
  return items.filter((item) => {
    const span = itemSpan(item)
    return itemTouchesDate(span.start, span.end, iso)
  })
}

export function itemsForMonth(items: CalendarItem[], year: number, month: number): CalendarItem[] {
  return items.filter((item) => {
    const span = itemSpan(item)
    return itemTouchesMonth(span.start, span.end, year, month)
  })
}

function applyPatch(item: CalendarItem, patch?: ItemPatch): CalendarItem {
  if (!patch) return item
  if (item.kind === 'content') return applyContentPatch(item, patch)
  const next = { ...item, ...patch, id: item.id, kind: item.kind }
  return next as CalendarItem
}

function applyContentPatch(item: ContentItem, patch: ItemPatch): ContentItem {
  const legacy = patch as ItemPatch & { hookA?: unknown; hookB?: unknown; shotList?: unknown }
  const next: ContentItem = {
    ...item,
    id: item.id,
    kind: 'content',
    hook: mergedHook(item.hook, legacy),
    shotList: legacy.shotList !== undefined ? shotListText(legacy.shotList) : item.shotList,
  }
  if (typeof patch.title === 'string') next.title = patch.title
  if (typeof patch.date === 'string') next.date = patch.date
  if (typeof patch.format === 'string' && isFormat(patch.format)) next.format = patch.format
  if (typeof patch.status === 'string') next.status = migrateContentStatus(patch.status)
  if (typeof patch.concept === 'string') next.concept = patch.concept
  if (typeof patch.caption === 'string') next.caption = patch.caption
  if (typeof patch.length === 'string') next.length = patch.length
  if (Array.isArray(patch.textOverlays)) next.textOverlays = patch.textOverlays
  return next
}

export async function loadCalendarFile(): Promise<CalendarFile> {
  const response = await fetch('/data/calendar.json', { cache: 'no-store' })
  if (!response.ok) {
    throw new Error('Could not load calendar.json')
  }
  const raw = (await response.json()) as CalendarFile & { slots?: unknown[] }
  if (!raw.brand) {
    throw new Error('calendar.json is missing brand')
  }
  const source = Array.isArray(raw.items) ? raw.items : Array.isArray(raw.slots) ? raw.slots : []
  return {
    ...raw,
    items: source.map(normalizeItem).filter((item): item is CalendarItem => item !== null),
  }
}

function normalizeItem(value: unknown): CalendarItem | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const id = typeof raw.id === 'string' ? raw.id : ''
  const date =
    typeof raw.date === 'string' && raw.date
      ? raw.date
      : typeof raw.startDate === 'string'
        ? raw.startDate
        : ''
  if (!id || !date) return null

  const kind = typeof raw.kind === 'string' && isKind(raw.kind) ? raw.kind : 'content'
  const title = typeof raw.title === 'string' ? raw.title : ''
  const notes = typeof raw.notes === 'string' ? raw.notes : ''

  if (kind === 'event') {
    const startDate = typeof raw.startDate === 'string' && raw.startDate ? raw.startDate : date
    const endDate =
      typeof raw.endDate === 'string' && raw.endDate >= startDate ? raw.endDate : startDate
    const item: EventItem = {
      kind,
      id,
      date: startDate,
      title,
      notes,
      startDate,
      endDate,
      startTime: typeof raw.startTime === 'string' ? raw.startTime : typeof raw.time === 'string' ? raw.time : '',
      endTime: typeof raw.endTime === 'string' ? raw.endTime : '',
      location: typeof raw.location === 'string' ? raw.location : '',
    }
    if (typeof raw.status === 'string' && isEventStatus(raw.status)) item.status = raw.status
    return item
  }

  if (kind === 'email') {
    const subject = typeof raw.subject === 'string' ? raw.subject : title
    const item: EmailItem = {
      kind,
      id,
      date,
      title: title || subject || 'Friday email',
      notes,
      subject,
      body: typeof raw.body === 'string' ? raw.body : typeof raw.description === 'string' ? raw.description : '',
      from: typeof raw.from === 'string' ? raw.from : '',
    }
    return item
  }

  if (kind === 'influencer') {
    const status =
      typeof raw.status === 'string' && isInfluencerStatus(raw.status) ? raw.status : 'hold'
    const item: InfluencerItem = {
      kind,
      id,
      date,
      title: title || (typeof raw.name === 'string' ? raw.name : 'Creator visit'),
      notes,
      name: typeof raw.name === 'string' ? raw.name : title,
      handle: typeof raw.handle === 'string' ? raw.handle : '',
      endDate: typeof raw.endDate === 'string' ? raw.endDate : '',
      platform: typeof raw.platform === 'string' ? raw.platform : '',
      deliverables: typeof raw.deliverables === 'string' ? raw.deliverables : '',
      status,
    }
    return item
  }

  const format = typeof raw.format === 'string' && isFormat(raw.format) ? raw.format : 'Reel'
  const status = typeof raw.status === 'string' ? migrateContentStatus(raw.status) : 'idea'
  const item: ContentItem = {
    kind: 'content',
    id,
    date,
    title,
    format,
    status,
    concept: typeof raw.concept === 'string' ? raw.concept : '',
    hook: hookFromRecord(raw),
    shotList: shotListText(raw.shotList),
    caption: typeof raw.caption === 'string' ? raw.caption : '',
    length: typeof raw.length === 'string' ? raw.length : '',
    textOverlays: normalizeOverlays(raw.textOverlays),
  }
  return item
}

function normalizeOverlays(value: unknown): TextOverlay[] {
  if (!Array.isArray(value)) return []
  const rows: TextOverlay[] = []
  value.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') return
    const raw = entry as Record<string, unknown>
    const text = typeof raw.text === 'string' ? raw.text : ''
    if (!text && typeof raw.id !== 'string') return
    const overlay: TextOverlay = {
      id: typeof raw.id === 'string' ? raw.id : `overlay-${index + 1}`,
      text,
    }
    if (typeof raw.timing === 'string') overlay.timing = raw.timing
    if (typeof raw.style === 'string' && isOverlayStyle(raw.style)) overlay.style = raw.style
    rows.push(overlay)
  })
  return rows
}

export function parseBoard(value: unknown): BoardState {
  if (!value || typeof value !== 'object') return emptyBoard()
  const raw = value as Record<string, unknown>
  if (Array.isArray(raw.extras) || raw.patches || raw.removed) {
    const extras = Array.isArray(raw.extras)
      ? raw.extras.map(normalizeItem).filter((item): item is CalendarItem => item !== null)
      : []
    const patches =
      raw.patches && typeof raw.patches === 'object' && !Array.isArray(raw.patches)
        ? (raw.patches as BoardState['patches'])
        : {}
    const removed = Array.isArray(raw.removed)
      ? raw.removed.filter((id): id is string => typeof id === 'string')
      : []
    return { extras, patches, removed }
  }

  const patches: BoardState['patches'] = {}
  for (const [id, entry] of Object.entries(raw)) {
    if (!entry || typeof entry !== 'object') continue
    const row = entry as Record<string, unknown>
    const patch: ItemPatch = {}
    if (typeof row.status === 'string' && isStatus(row.status)) patch.status = row.status
    else if (typeof row.status === 'string') patch.status = migrateContentStatus(row.status)
    if (typeof row.notes === 'string') patch.notes = row.notes
    if (Object.keys(patch).length) patches[id] = patch
  }
  return { extras: [], patches, removed: [] }
}
