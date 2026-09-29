import { formatDateRange } from './dates'
import type { ContentItem } from '../types/calendar'

export const LOCATIONS = ['Resort', 'ZNP', 'Both', 'Unknown'] as const
export type ShotLocation = (typeof LOCATIONS)[number]

export const UNITS = ['Teepee', 'Cliff', 'Wagon', 'RV', 'Amenity', 'Other'] as const
export type ShotUnit = (typeof UNITS)[number]

export const TALENTS = ['None', 'On-cam', 'VO', 'Guest UGC'] as const
export type ShotTalent = (typeof TALENTS)[number]

export const CAPTURES = ['Ground', 'Drone', 'Both'] as const
export type ShotCapture = (typeof CAPTURES)[number]

export const DAYPARTS = ['Golden', 'Blue', 'Day', 'Night', 'Flexible'] as const
export type ShotDaypart = (typeof DAYPARTS)[number]

export type ShotTags = {
  location: ShotLocation
  unit: ShotUnit
  talent: ShotTalent
  capture: ShotCapture
  daypart: ShotDaypart
  assets: string[]
  setups: string[]
}

export type ShotRow = ContentItem & { tags: ShotTags }

export type SharedAssetBlock = {
  id: string
  title: string
  summary: string
  items: ShotRow[]
}

export type SetupBlock = {
  id: string
  title: string
  location: ShotLocation
  zone: string
  daypart: ShotDaypart
  items: ShotRow[]
}

export type CallSheet = {
  start: string
  end: string
  rangeLabel: string
  packCount: number
  drone: boolean
  talent: boolean
  talentCounts: { onCam: number; vo: number; ugc: number }
  sharedAssets: SharedAssetBlock[]
  talentRows: ShotRow[]
  droneRows: ShotRow[]
  setupBlocks: SetupBlock[]
}

type SetupDef = {
  id: string
  title: string
  location: ShotLocation
  order: number
}

type AssetDef = {
  id: string
  title: string
  summary: string
  match: (item: ContentItem, text: string, tags: Pick<ShotTags, 'capture' | 'daypart' | 'unit'>) => boolean
  always?: boolean
}

const LOCATION_ORDER: ShotLocation[] = ['Resort', 'Both', 'Unknown', 'ZNP']

const DAYPART_LABEL: Record<ShotDaypart, string> = {
  Golden: 'golden hour',
  Blue: 'blue hour',
  Day: 'day',
  Night: 'night',
  Flexible: 'flexible light',
}

const UNIT_FALLBACK: Record<ShotUnit, string> = {
  Teepee: 'Tipi exterior',
  Cliff: 'Cliff dwelling exterior',
  Wagon: 'Covered wagon exterior',
  RV: 'RV site',
  Amenity: 'Amenity loop',
  Other: 'Property',
}

const ASSET_DEFS: AssetDef[] = [
  {
    id: 'bison-long-lens',
    title: 'Bison long-lens',
    summary: 'One distant bison plate set. Reuse across every pack that needs sanctuary footage.',
    always: true,
    match: (item) => needsBisonPlates(item),
  },
  {
    id: 'drone-pass',
    title: 'Drone pass',
    summary: 'One property / approach aerial pass. Reuse on every pack that calls for drone.',
    always: true,
    match: (_item, _text, tags) => tags.capture === 'Drone' || tags.capture === 'Both',
  },
  {
    id: 'night-sky',
    title: 'Night sky plates',
    summary: 'Wide stars over lodging. Reuse on night and hot-tub packs.',
    match: (_item, text, tags) => tags.daypart === 'Night' || /night sky|\bstars\b|milky|stargaz/.test(text),
  },
  {
    id: 'shuttle',
    title: 'Shuttle / corridor',
    summary: 'Van, load-in, and Springdale corridor texture. Reuse on perk and access packs.',
    match: (_item, text) => /shuttle|park & ride|park and ride|springdale|corridor/.test(text),
  },
  {
    id: 'amenity-plates',
    title: 'Amenity plates',
    summary: 'Pool, pond, pickleball, mercantile, and trail texture captured once.',
    match: (_item, text) => /pool|pond|pickleball|mercantile|fishing/.test(text),
  },
  {
    id: 'firepit-night',
    title: 'Firepit night plates',
    summary: 'Embers, chairs, and lodging glow. Reuse on return and personality packs.',
    match: (_item, text) => /firepit|firelight|embers|s'more|smore/.test(text),
  },
  {
    id: 'hot-tub-steam',
    title: 'Hot tub steam plates',
    summary: 'Steam, robe, and deck detail. Reuse on return and hot-tub season packs.',
    match: (_item, text) => /hot tub|steam/.test(text),
  },
]

function shootText(item: ContentItem): string {
  return [item.title, item.concept, item.hook, item.shotList].join(' ').toLowerCase()
}

function needsBisonPlates(item: ContentItem): boolean {
  const text = shootText(item)
  if (/white bison program|actual bison/.test(text)) return true
  const stripped = text
    .replace(/zion white bison/g, ' ')
    .replace(/choose your white bison/g, ' ')
    .replace(/which white bison/g, ' ')
    .replace(/white bison stay/g, ' ')
  return /bison|sanctuary/.test(stripped)
}

function productionText(item: ContentItem): string {
  return [item.title, item.concept, item.hook, item.shotList].join(' ').toLowerCase()
}

function has(text: string, pattern: RegExp): boolean {
  return pattern.test(text)
}

export function inferTags(item: ContentItem): ShotTags {
  const text = productionText(item)

  const resort = has(
    text,
    /property|resort|glamping|tipi|teepee|cliff dwelling|covered wagon|\brv\b|mercantile|pickleball|hot tub|sanctuary|on[- ]site|full-hookup/,
  )
  const park = has(
    text,
    /zion national|\bznp\b|the park|park corridor|in the park|inside the park|nps |angels landing|watchman/,
  )
  const location: ShotLocation = resort && park ? 'Both' : park ? 'ZNP' : resort ? 'Resort' : 'Unknown'

  const unitHits: ShotUnit[] = []
  if (has(text, /tipi|teepee|tee pee/)) unitHits.push('Teepee')
  if (has(text, /cliff dwelling|cliff stay|\bkiva\b/)) unitHits.push('Cliff')
  if (has(text, /covered wagon|\bwagon\b/)) unitHits.push('Wagon')
  if (has(text, /\brv\b|full-hookup|hookup|snowbird/)) unitHits.push('RV')
  if (has(text, /pool|pickleball|hot tub|mercantile|pond|trail|firepit|amenity/)) unitHits.push('Amenity')
  const lodging = unitHits.filter((unit) => unit !== 'Amenity')
  const unit: ShotUnit = lodging[0] ?? unitHits[0] ?? 'Other'

  let talent: ShotTalent = 'None'
  if (has(text, /ugc|guest[- ](shot|clip|reel|created|quote)|guest ugc/)) talent = 'Guest UGC'
  else if (has(text, /on[- ]?cam|on camera|to camera|standup|host line|talking-head|dan on-cam|must have dan/)) {
    talent = 'On-cam'
  } else if (has(text, /\bvo\b|voice[- ]?over/)) talent = 'VO'
  else if (has(text, /b-roll-heavy|no talent|optional talent|hands only|feet only|crew legs/)) talent = 'None'

  const drone = has(text, /drone|aerial|fpv/)
  const ground = has(text, /ground|handheld|24mm|35mm|tripod|gimbal/)
  const capture: ShotCapture = drone && ground ? 'Both' : drone ? 'Drone' : 'Ground'

  const dayHits: ShotDaypart[] = []
  if (has(text, /golden hour|sunset|last light|magic hour/)) dayHits.push('Golden')
  if (has(text, /blue hour|twilight|dusk/)) dayHits.push('Blue')
  if (has(text, /night sky|night shoot|after dark|\bstars\b|milky|night:/)) dayHits.push('Night')
  if (has(text, /midday|morning|afternoon|daylight|day shoot|daytime/)) dayHits.push('Day')
  const daypart: ShotDaypart = dayHits.length === 1 ? dayHits[0] : 'Flexible'

  const tags = { location, unit, talent, capture, daypart, assets: [] as string[], setups: [] as string[] }
  tags.assets = ASSET_DEFS.filter((def) => def.match(item, text, tags)).map((def) => def.id)
  tags.setups = inferSetupDefs(item, tags).map((def) => setupBlockId(def, daypart))
  return tags
}

function inferSetupDefs(item: ContentItem, tags: ShotTags): SetupDef[] {
  const text = productionText(item)
  const found: SetupDef[] = []

  function add(id: string, title: string, location: ShotLocation, order: number) {
    if (found.some((entry) => entry.id === id)) return
    found.push({ id, title, location, order })
  }

  const fourStay = has(
    text,
    /hero still of each stay|four (stay|quick|strong|location)|same four stay|choose your white bison|wagon \/ tipi \/ kiva|next: wagon|each stay type/,
  )

  if (fourStay) {
    add('stay-heroes', 'Stay-type hero plates', 'Resort', 22)
  }

  if (has(text, /mercantile/)) add('mercantile', 'Mercantile', 'Resort', 10)
  if (has(text, /pond|fishing/)) add('pond', 'Pond', 'Resort', 16)
  if (!fourStay && has(text, /tipi|teepee/) && !has(text, /hot tub/)) {
    add('tipi-exterior', 'Tipi exterior', 'Resort', 24)
  }
  if (!fourStay && has(text, /covered wagon|\bwagon\b/) && !has(text, /hot tub/)) {
    add('wagon-exterior', 'Covered wagon exterior', 'Resort', 26)
  }
  if (!fourStay && has(text, /cliff dwelling|\bkiva\b|rooftop/) && !has(text, /hot tub/)) {
    add('cliff-exterior', 'Cliff dwelling exterior', 'Resort', 28)
  }
  if (has(text, /hot tub/)) {
    if (has(text, /tipi|teepee|cliff|kiva/)) add('lodging-hot-tub', 'Tipi / cliff hot tub', 'Resort', 32)
    else add('hot-tub', 'Private hot tub', 'Resort', 34)
  }
  if (!fourStay && has(text, /\brv\b|full-hookup/)) add('rv-site', 'RV site', 'Resort', 36)
  if (has(text, /pool/)) add('pool', 'Pool deck', 'Resort', 40)
  if (has(text, /pickleball/)) add('pickleball', 'Pickleball', 'Resort', 42)
  if (has(text, /river trail|water edge|river/)) add('river', 'River trail / water edge', 'Resort', 44)
  if (has(text, /\btrails\b|property path|quiet walk|walking (pov|feet|path)/) && !has(text, /river/)) {
    add('trails', 'Property paths', 'Resort', 46)
  }
  if (has(text, /firepit|firelight|embers|s'more|smore/)) add('firepit', 'Firepit', 'Resort', 50)
  if (needsBisonPlates(item)) add('bison-viewing', 'Bison viewing', 'Resort', 55)
  if (has(text, /shuttle|springdale|corridor/)) {
    add('shuttle', 'Shuttle / corridor', tags.location === 'ZNP' ? 'Both' : 'Resort', 60)
  }
  if (has(text, /feelove|zion adventures|freewheels|brew pub|e-bike|e-bikes/)) {
    add('perk-partners', 'Perk-partner beats', 'Resort', 62)
  }
  if (has(text, /zion national|\bznp\b|in the park|angels landing|watchman/)) {
    add('znp', 'Zion National Park', 'ZNP', 90)
  }
  if (
    found.length === 0 &&
    (item.format === 'Static' || item.format === 'Carousel') &&
    has(text, /graphic|n\/a|typography|clean brand type|photo\+type|static/)
  ) {
    add('desk', 'Graphic / stills desk', 'Resort', 95)
  }

  if (found.length === 0) {
    add(
      `unit-${tags.unit.toLowerCase()}`,
      UNIT_FALLBACK[tags.unit],
      tags.location === 'Unknown' ? 'Resort' : tags.location,
      70,
    )
  }

  return found
}

function setupBlockId(def: SetupDef, daypart: ShotDaypart): string {
  return `${def.id}|${daypart}`
}

export function inCreationInRange(items: ContentItem[], start: string, end: string): ShotRow[] {
  const from = start <= end ? start : end
  const to = start <= end ? end : start
  return items
    .filter((item) => item.status === 'in-creation' && item.date >= from && item.date <= to)
    .map((item) => ({ ...item, tags: inferTags(item) }))
}

export function buildCallSheet(rows: ShotRow[], start: string, end: string): CallSheet {
  const sharedAssets = ASSET_DEFS.map((def) => ({
    id: def.id,
    title: def.title,
    summary: def.summary,
    items: rows.filter((row) => row.tags.assets.includes(def.id)).sort(sortRows),
  })).filter((block) => block.items.length >= (ASSET_DEFS.find((def) => def.id === block.id)?.always ? 1 : 2))

  const talentRows = rows.filter((row) => row.tags.talent !== 'None').sort(sortRows)
  const droneRows = rows
    .filter((row) => row.tags.capture === 'Drone' || row.tags.capture === 'Both')
    .sort(sortRows)

  const setupIndex = new Map<string, SetupBlock>()
  for (const row of rows) {
    const defs = inferSetupDefs(row, row.tags)
    for (const def of defs) {
      const id = setupBlockId(def, row.tags.daypart)
      const existing = setupIndex.get(id)
      if (existing) {
        existing.items.push(row)
        continue
      }
      setupIndex.set(id, {
        id,
        title: `${def.title} · ${DAYPART_LABEL[row.tags.daypart]}`,
        location: def.location,
        zone: def.id,
        daypart: row.tags.daypart,
        items: [row],
      })
    }
  }

  const setupBlocks = [...setupIndex.values()]
    .map((block) => ({ ...block, items: [...block.items].sort(sortRows) }))
    .sort((a, b) => {
      const loc = LOCATION_ORDER.indexOf(a.location) - LOCATION_ORDER.indexOf(b.location)
      if (loc) return loc
      const zone = setupOrder(a.zone) - setupOrder(b.zone)
      if (zone) return zone
      return DAYPARTS.indexOf(a.daypart) - DAYPARTS.indexOf(b.daypart)
    })

  return {
    start,
    end,
    rangeLabel: formatDateRange(start, end),
    packCount: rows.length,
    drone: droneRows.length > 0,
    talent: talentRows.length > 0,
    talentCounts: {
      onCam: talentRows.filter((row) => row.tags.talent === 'On-cam').length,
      vo: talentRows.filter((row) => row.tags.talent === 'VO').length,
      ugc: talentRows.filter((row) => row.tags.talent === 'Guest UGC').length,
    },
    sharedAssets,
    talentRows,
    droneRows,
    setupBlocks,
  }
}

function setupOrder(zone: string): number {
  const hit = [
    'mercantile',
    'pond',
    'stay-heroes',
    'tipi-exterior',
    'wagon-exterior',
    'cliff-exterior',
    'lodging-hot-tub',
    'hot-tub',
    'rv-site',
    'pool',
    'pickleball',
    'river',
    'trails',
    'firepit',
    'bison-viewing',
    'shuttle',
    'perk-partners',
    'desk',
    'znp',
  ]
  const index = hit.indexOf(zone)
  return index === -1 ? 70 : index
}

function sortRows(a: ShotRow, b: ShotRow): number {
  return a.date.localeCompare(b.date) || a.title.localeCompare(b.title)
}

function csvCell(value: string): string {
  const text = value.replace(/\r\n/g, '\n')
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

export function assetTitlesFor(row: ShotRow, sheet: CallSheet): string {
  return sheet.sharedAssets
    .filter((block) => block.items.some((item) => item.id === row.id))
    .map((block) => block.title)
    .join(' | ')
}

export function shotListCsv(sheet: CallSheet, done: Record<string, boolean>): string {
  const header = [
    'Done',
    'Setup block',
    'Shared-asset group',
    'Date',
    'Title',
    'Format',
    'Location',
    'Unit',
    'Talent',
    'Capture',
    'Daypart',
    'Hook',
    'Shot list and angles',
    'Caption',
    'ID',
  ]

  const lines = sheet.setupBlocks.flatMap((block) =>
    block.items.map((row) => {
      return [
        done[`setup:${block.id}:${row.id}`] ? 'TRUE' : 'FALSE',
        block.title,
        assetTitlesFor(row, sheet),
        row.date,
        row.title,
        row.format,
        row.tags.location,
        row.tags.unit,
        row.tags.talent,
        row.tags.capture,
        row.tags.daypart,
        row.hook,
        row.shotList,
        row.caption,
        row.id,
      ]
        .map((cell) => csvCell(cell))
        .join(',')
    }),
  )

  return `\uFEFF${[header.join(','), ...lines].join('\n')}`
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

const CHECKS_KEY = 'zwb-callsheet-checks'

export function loadShotChecks(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(CHECKS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean'),
    )
  } catch {
    return {}
  }
}

export function saveShotChecks(checks: Record<string, boolean>): void {
  localStorage.setItem(CHECKS_KEY, JSON.stringify(checks))
}
