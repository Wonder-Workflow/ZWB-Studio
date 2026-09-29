import assert from 'node:assert/strict'
import { build } from 'vite'
import { pathToFileURL } from 'node:url'

const outDir = '/tmp/zwb-pack-check'

await build({
  configFile: false,
  logLevel: 'silent',
  build: {
    ssr: new URL('./pack-check-entry.ts', import.meta.url).pathname,
    outDir,
    emptyOutDir: true,
  },
})

const mod = await import(pathToFileURL(`${outDir}/pack-check-entry.js`).href)

const old = {
  kind: 'content',
  id: 'pack-1',
  date: '2026-10-05',
  title: 'The Return',
  format: 'Reel',
  status: 'in-creation',
  concept: 'Come home after Zion.',
  hookA: 'Boots off. Stars on.',
  hookB: 'This is the part after Zion.',
  notes: 'Night shoot preferred.',
  shotList: {
    setup: 'Tipi hot tub at blue hour.',
    aRoll: 'Feet kicking off boots.',
    bRoll: 'Steam against red rock.',
    textCards: 'SHOULD NOT APPEAR',
    endCard: 'END SHOULD NOT APPEAR',
  },
  caption: 'The park takes your day.',
  length: '15–25s',
  textOverlays: [],
}

const seedBoard = mod.parseBoard({ extras: [old], patches: {}, removed: [] })
const [seed] = seedBoard.extras
assert.equal(seed.hook, 'Boots off. Stars on.')
assert.equal(seed.shotList, 'Tipi hot tub at blue hour.\n\nFeet kicking off boots.\n\nSteam against red rock.')
assert.equal(seed.notes, undefined)
assert.equal('hookA' in seed, false)
assert.equal('hookB' in seed, false)
assert.equal(seed.status, 'in-creation')

const patched = mod.applyBoard(
  seedBoard.extras,
  mod.parseBoard({
    extras: [],
    patches: {
      'pack-1': {
        hookA: 'Edited hook',
        hookB: 'Second bubble',
        notes: 'secret',
        status: 'ready',
        shotList: {
          setup: 'New setup',
          aRoll: 'New a',
          bRoll: '   ',
          textCards: 'SHOULD NOT APPEAR',
          endCard: 'END SHOULD NOT APPEAR',
        },
      },
    },
    removed: [],
  }),
)
assert.equal(patched[0].hook, 'Edited hook')
assert.equal(patched[0].shotList, 'New setup\n\nNew a')
assert.equal(patched[0].status, 'ready')
assert.equal(patched[0].notes, undefined)
assert.equal(patched[0].shotList.includes('SHOULD NOT'), false)

const explicit = mod.applyBoard(
  seedBoard.extras,
  mod.parseBoard({
    extras: [],
    patches: { 'pack-1': { hook: 'Single hook', hookA: 'old', hookB: 'nope' } },
    removed: [],
  }),
)
assert.equal(explicit[0].hook, 'Single hook')

const onlyB = mod.applyBoard(
  seedBoard.extras,
  mod.parseBoard({
    extras: [],
    patches: { 'pack-1': { hookB: 'only b', notes: 'hidden' } },
    removed: [],
  }),
)
assert.equal(onlyB[0].hook, 'Boots off. Stars on.')

const fallback = mod.parseBoard({
  extras: [{ ...old, hookA: '  ', hookB: 'Fallback hook' }],
  patches: {},
  removed: [],
})
assert.equal(fallback.extras[0].hook, 'Fallback hook')

assert.equal(mod.hookFromRecord({ hook: '', hookA: 'ignored' }), '')
assert.equal(mod.mergedHook('Keep A', { hookB: 'only b' }), 'Keep A')
assert.equal(mod.shotListText({ setup: '', aRoll: '', bRoll: '', textCards: 'card', endCard: 'end' }), '')

const created = mod.createContent('2026-10-06')
assert.equal(created.kind, 'content')
assert.equal(created.hook, '')
assert.equal(created.shotList, '')
assert.equal(created.status, 'idea')
assert.equal(created.notes, undefined)
assert.equal(created.hookA, undefined)
assert.equal(created.hookB, undefined)

const eventBoard = mod.parseBoard({
  extras: [
    {
      kind: 'event',
      id: 'e1',
      date: '2026-10-12',
      title: 'Lawn hour',
      notes: 'Bring chairs',
      startDate: '2026-10-12',
      endDate: '2026-10-12',
    },
  ],
  patches: {},
  removed: [],
})
assert.equal(eventBoard.extras[0].notes, 'Bring chairs')

const rows = mod.inCreationInRange([seed], '2026-10-01', '2026-10-31')
const sheet = mod.buildCallSheet(rows, '2026-10-01', '2026-10-31')
const csv = mod.shotListCsv(sheet, {})
const header = csv.split('\n')[0].replace(/^\uFEFF/, '')
assert.equal(
  header,
  'Done,Setup block,Shared-asset group,Date,Title,Format,Location,Unit,Talent,Capture,Daypart,Hook,Shot list and angles,Caption,ID',
)
assert.equal(csv.includes('Hook A/B'), false)
assert.equal(csv.includes('A-roll'), false)
assert.equal(csv.includes('B-roll'), false)
assert.equal(csv.includes('Text/overlays'), false)
assert.equal(csv.includes(',Notes'), false)
assert.equal(csv.includes('SHOULD NOT APPEAR'), false)
assert.equal(csv.includes('END SHOULD NOT APPEAR'), false)
assert.equal(csv.includes('Night shoot preferred'), false)
assert.equal(csv.includes('Boots off. Stars on.'), true)
assert.equal(csv.includes('Tipi hot tub at blue hour.'), true)
assert.equal(csv.includes('This is the part after Zion.'), false)

console.log('content pack checks passed')
