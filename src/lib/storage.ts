import { applyBoard, parseBoard } from './calendar'
import { emptyBoard, type BoardState, type CalendarItem, type ItemPatch } from '../types/calendar'

const STORAGE_KEY = 'zwb-calendar-board'

function readLocal(): BoardState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyBoard()
    return parseBoard(JSON.parse(raw) as unknown)
  } catch {
    return emptyBoard()
  }
}

function writeLocal(board: BoardState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(board))
}

export type PersistSource = 'studio' | 'device'

export async function loadBoard(): Promise<{ board: BoardState; source: PersistSource }> {
  try {
    const response = await fetch('/api/overrides')
    if (response.ok) {
      const board = parseBoard(await response.json())
      writeLocal(board)
      return { board, source: 'studio' }
    }
  } catch {
    // Device cache.
  }

  return { board: readLocal(), source: 'device' }
}

async function persistBoard(board: BoardState): Promise<{ board: BoardState; source: PersistSource }> {
  writeLocal(board)
  try {
    const response = await fetch('/api/overrides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(board),
    })
    if (response.ok) {
      const data = (await response.json()) as { board?: unknown }
      if (data.board) {
        const clean = parseBoard(data.board)
        writeLocal(clean)
        return { board: clean, source: 'studio' }
      }
      return { board, source: 'studio' }
    }
  } catch {
    // Device cache already written.
  }
  return { board, source: 'device' }
}

export async function saveAddedItem(
  item: CalendarItem,
): Promise<{ board: BoardState; source: PersistSource }> {
  const current = readLocal()
  const extras = [...current.extras.filter((row) => row.id !== item.id), item]
  return persistBoard({ ...current, extras })
}

export async function saveItemPatch(
  id: string,
  patch: ItemPatch,
  extrasHint?: CalendarItem[],
): Promise<{ board: BoardState; source: PersistSource }> {
  const current = readLocal()
  const extras = extrasHint ?? current.extras
  const inExtras = extras.some((item) => item.id === id)
  if (inExtras) {
    const nextExtras = extras.map((item) =>
      item.id === id ? ({ ...item, ...patch, kind: item.kind, id: item.id } as CalendarItem) : item,
    )
    return persistBoard({ ...current, extras: nextExtras })
  }
  return persistBoard({
    ...current,
    patches: { ...current.patches, [id]: { ...current.patches[id], ...patch } },
  })
}

export async function removeItem(id: string): Promise<{ board: BoardState; source: PersistSource }> {
  const current = readLocal()
  const extras = current.extras.filter((item) => item.id !== id)
  const removed = current.removed.includes(id) ? current.removed : [...current.removed, id]
  const patches = { ...current.patches }
  delete patches[id]
  return persistBoard({ extras, patches, removed })
}

export function mergeItems(seed: CalendarItem[], board: BoardState): CalendarItem[] {
  return applyBoard(seed, board)
}
