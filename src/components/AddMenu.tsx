import { useEffect, useRef, useState } from 'react'
import { KINDS, KIND_LABELS, type ItemKind } from '../types/calendar'

type Props = {
  onAdd: (kind: ItemKind) => void
}

export function AddMenu({ onAdd }: Props) {
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div className="add-wrap" ref={wrap}>
      <button className="today-btn add-btn" type="button" onClick={() => setOpen((value) => !value)}>
        Add
      </button>
      {open ? (
        <div className="add-menu" role="menu">
          {KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              className={`add-option kind-${kind}`}
              role="menuitem"
              onClick={() => {
                setOpen(false)
                onAdd(kind)
              }}
            >
              <span className="kind-mark">{kind === 'email' ? '✉' : ''}</span>
              {KIND_LABELS[kind]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
