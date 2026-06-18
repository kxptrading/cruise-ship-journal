import { describe, it, expect } from 'vitest'
import { CURRENT_PAYLOAD_VERSION, migrateQueuePayload, runLadder } from './payloadMigrations'

// ── Registry-backed behaviour (current, empty ladder = baseline v1) ────────────

describe('migrateQueuePayload', () => {
  it('passes a current-version payload through unchanged', () => {
    const payload = { foo: 'bar', nums: [1, 2, 3] }
    const res = migrateQueuePayload('notes', CURRENT_PAYLOAD_VERSION, payload)
    expect(res).toEqual({ ok: true, payload })
  })

  it('treats a missing version as v1 (items queued before versioning shipped)', () => {
    const payload = [{ id: '1', content: 'hi' }]
    const res = migrateQueuePayload('notes', undefined, payload)
    expect(res.ok).toBe(true)
    expect(res.payload).toBe(payload)
  })

  it('rejects a payload from a newer client than we understand', () => {
    const res = migrateQueuePayload('dailyLogs', CURRENT_PAYLOAD_VERSION + 1, { x: 1 })
    expect(res.ok).toBe(false)
  })

  it('rejects an unknown entity type', () => {
    const res = migrateQueuePayload('not_a_real_entity', 1, {})
    expect(res.ok).toBe(false)
  })
})

// ── Ladder mechanism (synthetic steps, independent of the real registry) ───────

describe('runLadder', () => {
  it('is a no-op when already at the target version', () => {
    const payload = { a: 1 }
    expect(runLadder([], 1, 1, payload)).toEqual({ ok: true, payload })
  })

  it('applies registered steps across a multi-version jump in order', () => {
    // v1 -> v2 adds b; v2 -> v3 adds c. Proves stepwise transformation v1 -> v3.
    const steps = [
      (p) => ({ ...p, b: 2 }),
      (p) => ({ ...p, c: 3 }),
    ]
    const res = runLadder(steps, 1, 3, { a: 1 })
    expect(res).toEqual({ ok: true, payload: { a: 1, b: 2, c: 3 } })
  })

  it('starts from the payload\'s own version, skipping already-applied steps', () => {
    const steps = [
      () => { throw new Error('v1->v2 should not run for a v2 payload') },
      (p) => ({ ...p, c: 3 }),
    ]
    const res = runLadder(steps, 2, 3, { a: 1, b: 2 })
    expect(res).toEqual({ ok: true, payload: { a: 1, b: 2, c: 3 } })
  })

  it('fails when a needed step is missing', () => {
    const res = runLadder([], 1, 2, { a: 1 }) // need v1->v2 but no step registered
    expect(res.ok).toBe(false)
  })

  it('fails when the payload version is newer than the target', () => {
    const res = runLadder([], 3, 1, { a: 1 })
    expect(res.ok).toBe(false)
  })
})
