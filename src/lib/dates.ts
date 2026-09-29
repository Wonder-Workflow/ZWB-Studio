const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

export function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseISODate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1)
}

export function monthLabel(year: number, month: number): string {
  return `${MONTHS[month] ?? ''} ${year}`
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function weekdayLabels(): string[] {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
}

export type CalendarCell = {
  date: Date | null
  iso: string | null
}

export function buildMonthGrid(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month, 1)
  const startPad = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: CalendarCell[] = []

  for (let i = 0; i < startPad; i += 1) {
    cells.push({ date: null, iso: null })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day)
    cells.push({ date, iso: toISODate(date) })
  }

  while (cells.length % 7 !== 0) {
    cells.push({ date: null, iso: null })
  }

  return cells
}

export function formatLongDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateRange(start: string, end?: string): string {
  if (!end || end === start) return formatLongDate(start)
  return `${formatLongDate(start)} – ${formatLongDate(end)}`
}

export function defaultDateForMonth(year: number, month: number): string {
  const today = new Date()
  if (today.getFullYear() === year && today.getMonth() === month) {
    return toISODate(today)
  }
  return toISODate(new Date(year, month, 1))
}

export function fridayInMonth(year: number, month: number): string {
  const today = new Date()
  if (today.getFullYear() === year && today.getMonth() === month) {
    if (today.getDay() === 5) return toISODate(today)
    const next = new Date(today)
    const add = (5 - today.getDay() + 7) % 7 || 7
    next.setDate(today.getDate() + add)
    if (next.getMonth() === month) return toISODate(next)
  }
  const first = new Date(year, month, 1)
  first.setDate(1 + ((5 - first.getDay() + 7) % 7))
  return toISODate(first)
}

export function itemTouchesDate(date: string, endDate: string | undefined, iso: string): boolean {
  if (!endDate || endDate < date) return date === iso
  return iso >= date && iso <= endDate
}

export function itemTouchesMonth(
  date: string,
  endDate: string | undefined,
  year: number,
  month: number,
): boolean {
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const end = toISODate(new Date(year, month + 1, 0))
  const from = date
  const to = endDate && endDate >= date ? endDate : date
  return from <= end && to >= start
}
