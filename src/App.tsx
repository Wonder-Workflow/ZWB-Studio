import { useEffect, useMemo, useState } from 'react'
import { BrandStrip } from './components/BrandStrip'
import { Header } from './components/Header'
import { ItemDrawer } from './components/ItemDrawer'
import { MonthCalendar } from './components/MonthCalendar'
import { ShotListPanel } from './components/ShotListPanel'
import { PasswordGate } from './components/PasswordGate'
import { applyBoard, loadCalendarFile } from './lib/calendar'
import { hasSession, setSession } from './lib/auth'
import { defaultDateForMonth, fridayInMonth, toISODate } from './lib/dates'
import { createItem } from './lib/items'
import { loadBoard, saveAddedItem, type PersistSource } from './lib/storage'
import {
  emptyBoard,
  STUDIO_MONTH,
  type BoardState,
  type CalendarFile,
  type ItemKind,
} from './types/calendar'

export default function App() {
  const [authed, setAuthed] = useState(() => hasSession())

  if (!authed) {
    return (
      <PasswordGate
        onSuccess={() => {
          setSession(true)
          setAuthed(true)
        }}
      />
    )
  }

  return (
    <Studio
      onSignOut={() => {
        setSession(false)
        setAuthed(false)
      }}
    />
  )
}

function Studio({ onSignOut }: { onSignOut: () => void }) {
  const [year, setYear] = useState(STUDIO_MONTH.year)
  const [month, setMonth] = useState(STUDIO_MONTH.month)
  const [file, setFile] = useState<CalendarFile | null>(null)
  const [board, setBoard] = useState<BoardState>(emptyBoard)
  const [source, setSource] = useState<PersistSource>('device')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)
  const [shotListOpen, setShotListOpen] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [calendar, saved] = await Promise.all([loadCalendarFile(), loadBoard()])
        if (cancelled) return
        setFile(calendar)
        setBoard(saved.board)
        setSource(saved.source)
        if (calendar.defaultMonth) {
          const [y, m] = calendar.defaultMonth.split('-').map(Number)
          if (y && m) {
            setYear(y)
            setMonth(m - 1)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load the calendar.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const items = useMemo(
    () => (file ? applyBoard(file.items, board) : []),
    [file, board],
  )
  const openItem = items.find((item) => item.id === openId) ?? null

  function shiftMonth(delta: number) {
    const next = new Date(year, month + delta, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth())
  }

  async function onAdd(kind: ItemKind) {
    const date = kind === 'email' ? fridayInMonth(year, month) : defaultDateForMonth(year, month)
    const created = createItem(kind, date)
    const result = await saveAddedItem(created)
    setBoard(result.board)
    setSource(result.source)
    setOpenId(created.id)
  }

  return (
    <div className="app-shell">
      <Header onSignOut={onSignOut} />
      {file ? <BrandStrip brand={file.brand} /> : null}

      <main className="studio">
        {loading ? (
          <div className="state-card">
            <p className="eyebrow">Calendar</p>
            <h2>Loading the month…</h2>
            <p>Pulling Zion White Bison items from calendar.json.</p>
          </div>
        ) : null}

        {error ? (
          <div className="state-card">
            <p className="eyebrow">Could not load</p>
            <h2>{error}</h2>
            <p>Confirm public/data/calendar.json is present, then refresh.</p>
          </div>
        ) : null}

        {file && !loading && !error ? (
          <MonthCalendar
            year={year}
            month={month}
            items={items}
            onPrev={() => shiftMonth(-1)}
            onNext={() => shiftMonth(1)}
            onStudioMonth={() => {
              setYear(STUDIO_MONTH.year)
              setMonth(STUDIO_MONTH.month)
            }}
            onToday={() => {
              const today = new Date()
              setYear(today.getFullYear())
              setMonth(today.getMonth())
            }}
            onOpen={(item) => setOpenId(item.id)}
            onAdd={(kind) => void onAdd(kind)}
            onShotList={() => setShotListOpen(true)}
          />
        ) : null}

        {file && !loading && !error ? (
          <p className="cal-empty">
            Source of truth: calendar.json · New items, status, and field edits persist{' '}
            {source === 'studio' ? 'in Netlify Blobs' : 'on this device'}.
          </p>
        ) : null}
      </main>

      {shotListOpen ? (
        <ShotListPanel
          items={items}
          defaultStart={toISODate(new Date(year, month, 1))}
          defaultEnd={toISODate(new Date(year, month + 1, 0))}
          onClose={() => setShotListOpen(false)}
        />
      ) : null}

      {openItem ? (
        <ItemDrawer
          item={openItem}
          onClose={() => setOpenId(null)}
          onBoard={(next, nextSource) => {
            setBoard(next)
            setSource(nextSource)
          }}
        />
      ) : null}
    </div>
  )
}
