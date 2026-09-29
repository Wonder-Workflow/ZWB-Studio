export const KINDS = ['content', 'event', 'influencer', 'email'] as const
export type ItemKind = (typeof KINDS)[number]

export const KIND_LABELS: Record<ItemKind, string> = {
  content: 'Content',
  event: 'Event',
  influencer: 'Influencer',
  email: 'Email',
}

export const FORMATS = ['Reel', 'Static', 'Carousel', 'Story'] as const
export type Format = (typeof FORMATS)[number]

export const STATUSES = ['idea', 'in-creation', 'ready', 'published'] as const
export type Status = (typeof STATUSES)[number]

export const STATUS_LABELS: Record<Status, string> = {
  idea: 'Idea',
  'in-creation': 'In-creation',
  ready: 'Ready',
  published: 'Published',
}

export function migrateContentStatus(value: string): Status {
  const raw = value.trim().toLowerCase()
  if (raw === 'idea' || raw === 'draft') return 'idea'
  if (raw === 'ready' || raw === 'ready-to-post' || raw === 'ready to post') return 'ready'
  if (raw === 'published' || raw === 'posted') return 'published'
  if (
    raw === 'in-creation' ||
    raw === 'briefed' ||
    raw === 'approved' ||
    raw === 'ready-to-shoot' ||
    raw === 'ready to shoot' ||
    raw === 'shooting' ||
    raw === 'editing' ||
    raw === 'edit'
  ) {
    return 'in-creation'
  }
  return isStatus(raw) ? raw : 'in-creation'
}

export const EVENT_STATUSES = ['planned', 'confirmed', 'done', 'canceled'] as const
export type EventStatus = (typeof EVENT_STATUSES)[number]

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  planned: 'Planned',
  confirmed: 'Confirmed',
  done: 'Done',
  canceled: 'Canceled',
}

export const INFLUENCER_STATUSES = ['hold', 'booked', 'on-property', 'wrapped', 'canceled'] as const
export type InfluencerStatus = (typeof INFLUENCER_STATUSES)[number]

export const INFLUENCER_STATUS_LABELS: Record<InfluencerStatus, string> = {
  hold: 'Hold',
  booked: 'Booked',
  'on-property': 'On property',
  wrapped: 'Wrapped',
  canceled: 'Canceled',
}

export const OVERLAY_STYLES = ['subtitle', 'overlay', 'lower-third'] as const
export type OverlayStyle = (typeof OVERLAY_STYLES)[number]

export const OVERLAY_STYLE_LABELS: Record<OverlayStyle, string> = {
  subtitle: 'Subtitle',
  overlay: 'Overlay',
  'lower-third': 'Lower third',
}

export type TextOverlay = {
  id: string
  timing?: string
  text: string
  style?: OverlayStyle
}

export type BrandCard = {
  name: string
  positioning: string
  audience: string[]
  offers: string[]
  voice: string
  captionFormula: string
  use: string[]
  avoid: string[]
  visual: string
}

type BaseItem = {
  id: string
  date: string
  title: string
}

export type ContentItem = BaseItem & {
  kind: 'content'
  format: Format
  status: Status
  concept: string
  hook: string
  shotList: string
  caption: string
  length: string
  textOverlays: TextOverlay[]
}

export type EventItem = BaseItem & {
  kind: 'event'
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  location?: string
  status?: EventStatus
  notes: string
}

export type InfluencerItem = BaseItem & {
  kind: 'influencer'
  name: string
  handle?: string
  endDate?: string
  platform: string
  deliverables: string
  status: InfluencerStatus
  notes: string
}

export type EmailItem = BaseItem & {
  kind: 'email'
  subject: string
  body: string
  from?: string
  notes: string
}

export type CalendarItem = ContentItem | EventItem | InfluencerItem | EmailItem

export type CalendarFile = {
  client: string
  timezone: string
  updatedAt: string
  defaultMonth?: string
  brand: BrandCard
  items: CalendarItem[]
}

export type ItemPatch = {
  title?: string
  date?: string
  startDate?: string
  endDate?: string
  startTime?: string
  endTime?: string
  notes?: string
  format?: Format
  status?: Status | EventStatus | InfluencerStatus
  concept?: string
  hook?: string
  shotList?: string
  caption?: string
  length?: string
  textOverlays?: TextOverlay[]
  time?: string
  location?: string
  name?: string
  handle?: string
  platform?: string
  deliverables?: string
  subject?: string
  body?: string
  from?: string
}

export type BoardState = {
  extras: CalendarItem[]
  patches: Record<string, ItemPatch>
  removed: string[]
}

export function emptyBoard(): BoardState {
  return { extras: [], patches: {}, removed: [] }
}

export function isStatus(value: string): value is Status {
  return (STATUSES as readonly string[]).includes(value)
}

export function isFormat(value: string): value is Format {
  return (FORMATS as readonly string[]).includes(value)
}

export function isKind(value: string): value is ItemKind {
  return (KINDS as readonly string[]).includes(value)
}

export function isEventStatus(value: string): value is EventStatus {
  return (EVENT_STATUSES as readonly string[]).includes(value)
}

export function isInfluencerStatus(value: string): value is InfluencerStatus {
  return (INFLUENCER_STATUSES as readonly string[]).includes(value)
}

export function isOverlayStyle(value: string): value is OverlayStyle {
  return (OVERLAY_STYLES as readonly string[]).includes(value)
}

export const STUDIO_MONTH: { year: number; month: number } = { year: 2026, month: 9 }
