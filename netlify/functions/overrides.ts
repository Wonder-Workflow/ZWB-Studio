import { getStore } from '@netlify/blobs'

type BoardState = {
  extras: unknown[]
  patches: Record<string, unknown>
  removed: string[]
}

const json = (body: unknown, status = 200) => Response.json(body, { status })

function isBoard(value: unknown): value is BoardState {
  return Boolean(value && typeof value === 'object' && ('extras' in value || 'patches' in value || 'removed' in value))
}

function asBoard(value: unknown): BoardState {
  if (isBoard(value)) {
    const raw = value as BoardState
    return {
      extras: Array.isArray(raw.extras) ? raw.extras : [],
      patches: raw.patches && typeof raw.patches === 'object' ? raw.patches : {},
      removed: Array.isArray(raw.removed) ? raw.removed : [],
    }
  }
  if (value && typeof value === 'object') {
    return { extras: [], patches: value as Record<string, unknown>, removed: [] }
  }
  return { extras: [], patches: {}, removed: [] }
}

export default async (req: Request) => {
  if (req.method === 'GET') {
    try {
      const store = getStore('zwb-calendar')
      const data = await store.get('overrides', { type: 'json' })
      return json(asBoard(data))
    } catch {
      return json({ error: 'blobs unavailable' }, 503)
    }
  }

  if (req.method === 'POST') {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return json({ error: 'invalid json' }, 400)
    }

    try {
      const store = getStore('zwb-calendar')
      const current = asBoard(await store.get('overrides', { type: 'json' }))
      const incoming = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}

      if (typeof incoming.id === 'string' && !Array.isArray(incoming.extras)) {
        const prev = (current.patches[incoming.id] as Record<string, unknown> | undefined) ?? {}
        const next = { ...prev }
        if (typeof incoming.status === 'string') next.status = incoming.status
        if (typeof incoming.notes === 'string') next.notes = incoming.notes
        current.patches[incoming.id] = next
        await store.setJSON('overrides', current)
        return json({ ok: true, board: current })
      }

      const board = asBoard({
        extras: incoming.extras ?? current.extras,
        patches: incoming.patches ?? current.patches,
        removed: incoming.removed ?? current.removed,
      })
      await store.setJSON('overrides', board)
      return json({ ok: true, board })
    } catch {
      return json({ error: 'blobs unavailable' }, 503)
    }
  }

  return json({ error: 'method not allowed' }, 405)
}
