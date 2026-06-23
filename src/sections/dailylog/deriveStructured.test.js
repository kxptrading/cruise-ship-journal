import { describe, it, expect } from 'vitest'
import { deriveStructured } from './deriveStructured'

const note = (text, field) => ({ id: Math.random().toString(), type: 'note', xPct: 0, y: 0, text, field })

describe('deriveStructured', () => {
  it('folds untagged notes into highlights so the day registers downstream', () => {
    const out = deriveStructured([note('Sailed past the bay at dawn'), note('Long slow lunch')])
    expect(out.highlights).toBe('Sailed past the bay at dawn\n\nLong slow lunch')
    expect(out.bestMoment).toBe('')
  })

  it('routes field-tagged notes to their column', () => {
    const out = deriveStructured([
      note('Pizza at Da Michele', 'lunch'),
      note('The fireworks', 'bestMoment'),
      note('A freeform thought'),
    ])
    expect(out.lunch).toBe('Pizza at Da Michele')
    expect(out.bestMoment).toBe('The fireworks')
    expect(out.highlights).toBe('A freeform thought')
  })

  it('joins multiple notes targeting the same field', () => {
    const out = deriveStructured([note('a', 'highlights'), note('b', 'highlights')])
    expect(out.highlights).toBe('a\n\nb')
  })

  it('ignores photo items and blank notes', () => {
    const out = deriveStructured([
      { id: '1', type: 'photo', xPct: 0.2, y: 40, storagePath: 'x/y.jpg' },
      note('   '),
      note('real'),
    ])
    expect(out.highlights).toBe('real')
  })

  it('returns empty strings for a blank canvas', () => {
    const out = deriveStructured([])
    expect(out.highlights).toBe('')
    expect(out.dinner).toBe('')
  })
})
