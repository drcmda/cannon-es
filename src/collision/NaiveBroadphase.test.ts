import { NaiveBroadphase } from './NaiveBroadphase'

describe('NaiveBroadphase', () => {
  test('construct', () => {
    const nb = new NaiveBroadphase()
    expect(nb).toBeDefined()
    expect(nb.dirty).toBe(true)
    expect(nb.useBoundingBoxes).toBe(false)
    expect(nb.world).toBe(null)
  })
})
