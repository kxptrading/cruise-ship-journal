import { describe, it, expect } from 'vitest'
import { removedRowIds, mergeDeletedIds } from './rowDiff'

describe('removedRowIds', () => {
  it('returns ids present in prev but not in next', () => {
    const prev = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    const next = [{ id: 'a' }, { id: 'c' }]
    expect(removedRowIds(prev, next)).toEqual(['b'])
  })

  it('returns nothing when only additions happen (co-author safety)', () => {
    const prev = [{ id: 'a' }]
    const next = [{ id: 'a' }, { id: 'b' }] // b added by someone else
    expect(removedRowIds(prev, next)).toEqual([])
  })

  it('handles empty/undefined inputs', () => {
    expect(removedRowIds(undefined, undefined)).toEqual([])
    expect(removedRowIds([{ id: 'a' }], [])).toEqual(['a'])
    expect(removedRowIds([], [{ id: 'a' }])).toEqual([])
  })
})

describe('mergeDeletedIds', () => {
  it('unions existing pending deletes with newly removed ids', () => {
    expect(mergeDeletedIds(['a'], ['b'], []).sort()).toEqual(['a', 'b'])
  })

  it('drops ids that are present again in the latest payload (re-add cancels delete)', () => {
    // 'a' was pending delete, but it's back in the surviving payload → not deleted.
    expect(mergeDeletedIds(['a', 'b'], ['c'], ['a'])).toEqual(['b', 'c'])
  })

  it('dedupes', () => {
    expect(mergeDeletedIds(['a'], ['a'], [])).toEqual(['a'])
  })

  it('handles empty inputs', () => {
    expect(mergeDeletedIds()).toEqual([])
    expect(mergeDeletedIds([], ['x'], ['x'])).toEqual([]) // removed but also surviving
  })
})
