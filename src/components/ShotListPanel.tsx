import { useMemo, useState } from 'react'
import {
  buildCallSheet,
  downloadCsv,
  inCreationInRange,
  loadShotChecks,
  saveShotChecks,
  shotListCsv,
  type SetupBlock,
  type SharedAssetBlock,
  type ShotRow,
} from '../lib/shotlist'
import type { CalendarItem, ContentItem } from '../types/calendar'

type Props = {
  items: CalendarItem[]
  defaultStart: string
  defaultEnd: string
  onClose: () => void
}

export function ShotListPanel({ items, defaultStart, defaultEnd, onClose }: Props) {
  const [start, setStart] = useState(defaultStart)
  const [end, setEnd] = useState(defaultEnd)
  const [ran, setRan] = useState(false)
  const [range, setRange] = useState({ start: defaultStart, end: defaultEnd })
  const [checks, setChecks] = useState<Record<string, boolean>>(() => loadShotChecks())

  const content = useMemo(
    () => items.filter((item): item is ContentItem => item.kind === 'content'),
    [items],
  )
  const rows = useMemo(
    () => (ran ? inCreationInRange(content, range.start, range.end) : []),
    [ran, content, range],
  )
  const sheet = useMemo(() => (ran ? buildCallSheet(rows, range.start, range.end) : null), [ran, rows, range])

  function generate() {
    setRange({ start, end })
    setRan(true)
  }

  function toggle(key: string) {
    setChecks((current) => {
      const next = { ...current, [key]: !current[key] }
      saveShotChecks(next)
      return next
    })
  }

  return (
    <>
      <button className="drawer-backdrop" type="button" aria-label="Close shot list" onClick={onClose} />
      <section className="shotlist-panel" role="dialog" aria-labelledby="shotlist-title">
        <div className="shotlist-toolbar no-print">
          <div>
            <p className="eyebrow">Call sheet</p>
            <h2 id="shotlist-title">Shot list</h2>
          </div>
          <div className="shotlist-actions">
            <label className="field">
              <span>Start</span>
              <input type="date" value={start} onChange={(event) => setStart(event.target.value)} />
            </label>
            <label className="field">
              <span>End</span>
              <input type="date" value={end} onChange={(event) => setEnd(event.target.value)} />
            </label>
            <button className="today-btn add-btn" type="button" onClick={generate}>
              Generate
            </button>
            <button
              className="today-btn"
              type="button"
              disabled={!sheet || !sheet.packCount}
              onClick={() =>
                sheet
                  ? downloadCsv(`zwb-callsheet-${range.start}-to-${range.end}.csv`, shotListCsv(sheet, checks))
                  : undefined
              }
            >
              Download CSV
            </button>
            <button
              className="today-btn"
              type="button"
              disabled={!sheet || !sheet.packCount}
              onClick={() => window.print()}
            >
              Print / PDF
            </button>
            <button className="btn btn-ghost" type="button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        <div className="shotlist-body">
          {!ran ? (
            <div className="state-card">
              <p className="eyebrow">Range</p>
              <h2>Pick dates, then generate</h2>
              <p>
                Only In-creation packs in that range. Output is a call sheet: shared assets first, then talent and
                drone, then setups in move order — Resort, then Zion if needed.
              </p>
            </div>
          ) : null}

          {ran && sheet && sheet.packCount === 0 ? (
            <div className="state-card">
              <p className="eyebrow">Empty range</p>
              <h2>No In-creation content in this range</h2>
              <p>Set a content card to In-creation when it is ready to shoot, then generate again.</p>
            </div>
          ) : null}

          {ran && sheet && sheet.packCount > 0 ? (
            <div className="call-sheet">
              <header className="call-head">
                <p className="eyebrow">Zion White Bison · Obsession Marketing</p>
                <h2>Call sheet · {sheet.rangeLabel}</h2>
                <p className="helper">
                  {sheet.packCount} In-creation pack{sheet.packCount === 1 ? '' : 's'} · Drone {sheet.drone ? 'yes' : 'no'}{' '}
                  · Talent {sheet.talent ? 'yes' : 'no'}
                  {sheet.talent
                    ? ` (${[
                        sheet.talentCounts.onCam ? `${sheet.talentCounts.onCam} on-cam` : '',
                        sheet.talentCounts.vo ? `${sheet.talentCounts.vo} VO` : '',
                        sheet.talentCounts.ugc ? `${sheet.talentCounts.ugc} guest UGC` : '',
                      ]
                        .filter(Boolean)
                        .join(', ')})`
                    : ''}
                </p>
                <p className="helper call-move">
                  Move order: resort zones batched, then Zion National Park only if a pack needs it. Tick boxes persist
                  on this device.
                </p>
              </header>

              {sheet.sharedAssets.length ? (
                <section className="call-section">
                  <p className="eyebrow">1 · Shared assets</p>
                  <h3>Capture once, reuse by ID</h3>
                  {sheet.sharedAssets.map((block) => (
                    <SharedBlock key={block.id} block={block} checked={!!checks[`asset:${block.id}`]} onToggle={toggle} />
                  ))}
                </section>
              ) : null}

              <section className="call-section">
                <p className="eyebrow">2 · Talent</p>
                <h3>Talent</h3>
                {sheet.talentRows.length === 0 ? (
                  <p className="helper">No on-cam, VO, or guest UGC in this range.</p>
                ) : (
                  <ul className="tick-list">
                    {sheet.talentRows.map((row) => (
                      <LineItem
                        key={row.id}
                        checkKey={`talent:${row.id}`}
                        checked={!!checks[`talent:${row.id}`]}
                        onToggle={toggle}
                        row={row}
                        meta={row.tags.talent}
                      />
                    ))}
                  </ul>
                )}
              </section>

              <section className="call-section">
                <p className="eyebrow">3 · Drone</p>
                <h3>Drone</h3>
                {sheet.droneRows.length === 0 ? (
                  <p className="helper">No drone pass in this range.</p>
                ) : (
                  <ul className="tick-list">
                    {sheet.droneRows.map((row) => (
                      <LineItem
                        key={row.id}
                        checkKey={`drone:${row.id}`}
                        checked={!!checks[`drone:${row.id}`]}
                        onToggle={toggle}
                        row={row}
                        meta={row.tags.capture}
                      />
                    ))}
                  </ul>
                )}
              </section>

              <section className="call-section">
                <p className="eyebrow">4 · Setups · move order</p>
                <h3>Physical setups</h3>
                <p className="helper">
                  Batched across publish dates. Resort first
                  {sheet.setupBlocks.some((block) => block.location === 'ZNP') ? ', then ZNP' : ''}.
                </p>
                {sheet.setupBlocks.map((block) => (
                  <SetupBlockView key={block.id} block={block} checks={checks} onToggle={toggle} />
                ))}
              </section>
            </div>
          ) : null}
        </div>
      </section>
    </>
  )
}

function SharedBlock({
  block,
  checked,
  onToggle,
}: {
  block: SharedAssetBlock
  checked: boolean
  onToggle: (key: string) => void
}) {
  return (
    <article className="setup-block shared-block">
      <Tick
        checkKey={`asset:${block.id}`}
        checked={checked}
        onToggle={onToggle}
        label={`Capture ${block.title.toLowerCase()}`}
      />
      <p className="helper">{block.summary}</p>
      <p className="asset-ids">
        {block.items.length} pack{block.items.length === 1 ? '' : 's'}:{' '}
        {block.items.map((item) => `${item.id}`).join(' · ')}
      </p>
    </article>
  )
}

function SetupBlockView({
  block,
  checks,
  onToggle,
}: {
  block: SetupBlock
  checks: Record<string, boolean>
  onToggle: (key: string) => void
}) {
  return (
    <article className="setup-block">
      <header className="setup-head">
        <p className="eyebrow">
          {block.location}
          {block.location === 'ZNP' ? ' · after resort' : ''}
        </p>
        <h4>{block.title}</h4>
        <p className="helper">
          {block.items.length} shot{block.items.length === 1 ? '' : 's'}
        </p>
      </header>
      <ul className="tick-list">
        {block.items.map((row) => (
          <li key={row.id} className="tick-row">
            <Tick
              checkKey={`setup:${block.id}:${row.id}`}
              checked={!!checks[`setup:${block.id}:${row.id}`]}
              onToggle={onToggle}
              label={`${row.date} · ${row.title}`}
            />
            <div className="tick-copy">
              <p className="helper">
                {row.format} · {row.id}
              </p>
              {row.hook ? (
                <p>
                  <strong>Hook.</strong> {row.hook}
                </p>
              ) : null}
              {row.shotList ? (
                <p className="shot-lines">
                  <strong>Shot list and angles.</strong> {row.shotList}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </article>
  )
}

function LineItem({
  checkKey,
  checked,
  onToggle,
  row,
  meta,
}: {
  checkKey: string
  checked: boolean
  onToggle: (key: string) => void
  row: ShotRow
  meta: string
}) {
  return (
    <li className="tick-row compact">
      <Tick checkKey={checkKey} checked={checked} onToggle={onToggle} label={`${row.date} · ${row.title}`} />
      <p className="helper">
        {meta} · {row.format} · {row.id}
        {firstShotLine(row.shotList) ? ` · ${firstShotLine(row.shotList)}` : ''}
      </p>
    </li>
  )
}

function firstShotLine(text: string): string {
  return text.split('\n').map((line) => line.trim()).find(Boolean) ?? ''
}

function Tick({
  checkKey,
  checked,
  onToggle,
  label,
}: {
  checkKey: string
  checked: boolean
  onToggle: (key: string) => void
  label: string
}) {
  return (
    <label className="tick">
      <input type="checkbox" checked={checked} onChange={() => onToggle(checkKey)} />
      <span className="tick-box" aria-hidden="true">
        {checked ? '☑' : '☐'}
      </span>
      <span className="tick-label">{label}</span>
    </label>
  )
}
