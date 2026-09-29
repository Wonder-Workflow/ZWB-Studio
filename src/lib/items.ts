import type {
  CalendarItem,
  ContentItem,
  EmailItem,
  EventItem,
  InfluencerItem,
  ItemKind,
} from '../types/calendar'

function uid(kind: ItemKind): string {
  const stamp = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 8)
  return `zwb-${kind}-${stamp}-${rand}`
}

export function createItem(kind: ItemKind, date: string): CalendarItem {
  if (kind === 'event') return createEvent(date)
  if (kind === 'influencer') return createInfluencer(date)
  if (kind === 'email') return createEmail(date)
  return createContent(date)
}

export function createContent(date: string): ContentItem {
  return {
    kind: 'content',
    id: uid('content'),
    date,
    title: 'Untitled content',
    format: 'Reel',
    status: 'idea',
    concept: '',
    hook: '',
    shotList: '',
    caption: '',
    length: '',
    textOverlays: [],
  }
}

export function createEvent(date: string): EventItem {
  return {
    kind: 'event',
    id: uid('event'),
    date,
    title: 'Untitled event',
    startDate: date,
    endDate: date,
    startTime: '',
    endTime: '',
    location: '',
    status: 'planned',
    notes: '',
  }
}

export function createInfluencer(date: string): InfluencerItem {
  return {
    kind: 'influencer',
    id: uid('influencer'),
    date,
    title: 'Creator visit',
    name: '',
    handle: '',
    endDate: '',
    platform: 'Instagram',
    deliverables: '',
    status: 'hold',
    notes: '',
  }
}

export function createEmail(date: string): EmailItem {
  return {
    kind: 'email',
    id: uid('email'),
    date,
    title: 'Friday email',
    subject: '',
    body: '',
    from: '',
    notes: '',
  }
}

export function chipLabel(item: CalendarItem): string {
  if (item.kind === 'influencer') {
    return item.name || item.handle || item.title || 'Creator visit'
  }
  if (item.kind === 'email') {
    return item.subject || item.title || 'Friday email'
  }
  return item.title || 'Untitled'
}

export function chipMeta(item: CalendarItem): string {
  if (item.kind === 'content') return item.format
  if (item.kind === 'event') {
    if (item.startTime && item.endTime) return `Event · ${item.startTime}–${item.endTime}`
    if (item.startTime) return `Event · ${item.startTime}`
    return 'Event'
  }
  if (item.kind === 'email') return 'Email'
  return item.platform || 'Creator'
}
