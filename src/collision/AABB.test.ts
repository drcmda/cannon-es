import { AABB } from './AABB'
import { Quaternion } from '../math/Quaternion'
import { Transform } from '../math/Transform'
import { Vec3 } from '../math/Vec3'

describe('AABB', () => {
  test('construct', () => {
    const a = new AABB()
    expect(a).toBeDefined()
  })

  test('setFromPoints', () => {
    const a = new AABB()
    const points = [
      new Vec3(7, 0, 1),
      new Vec3(2, -1, 5),
      new Vec3(-1, -7, 0),
      new Vec3(4, 5, -9),
      new Vec3(-5, 8, 2),
      new Vec3(-3, -2, -1),
      new Vec3(5, 3, 6),
    ]

    expect(a.setFromPoints(points)).toBe(a)
    expect(a).toMatchObject(
      new AABB({
        lowerBound: new Vec3(-5, -7, -9),
        upperBound: new Vec3(7, 8, 6),
      })
    )

    const position = new Vec3(1, 2, 3)
    a.setFromPoints(points, position)
    expect(a).toMatchObject(
      new AABB({
        lowerBound: new Vec3(-4, -5, -6),
        upperBound: new Vec3(8, 10, 9),
      })
    )

    const quaternion = new Quaternion().setFromAxisAngle(new Vec3(1, 0, 0), Math.PI)
    a.setFromPoints(points, position, quaternion)
    expect(a).toMatchObject(
      new AABB({
        lowerBound: new Vec3(-4, -6, -3),
        upperBound: new Vec3(8, 9, 12),
      })
    )

    const skinSize = 1
    a.setFromPoints(points, position, quaternion, skinSize)
    expect(a).toMatchObject(
      new AABB({
        lowerBound: new Vec3(-5, -7, -4),
        upperBound: new Vec3(9, 10, 13),
      })
    )
  })

  test('copy', () => {
    const a = new AABB()
    const b = new AABB()
    a.upperBound.set(1, 2, 3)
    a.lowerBound.set(4, 5, 6)
    expect(b.copy(a)).toBe(b)
    expect(b).toMatchObject(a)
    expect(b).not.toBe(a)
  })

  test('clone', () => {
    const a = new AABB({
      lowerBound: new Vec3(-1, -2, -3),
      upperBound: new Vec3(1, 2, 3),
    })
    const b = a.clone()
    expect(a).not.toBe(b)
    expect(b).toMatchObject(a)
  })

  test('extend', () => {
    const a = new AABB({
      lowerBound: new Vec3(-1, -1, -1),
      upperBound: new Vec3(1, 1, 1),
    })
    const b = new AABB({
      lowerBound: new Vec3(-2, -2, -2),
      upperBound: new Vec3(2, 2, 2),
    })
    a.extend(b)
    expect(a).toMatchObject(b)

    const c = new AABB({
      lowerBound: new Vec3(-1, -1, -1),
      upperBound: new Vec3(1, 1, 1),
    })
    const d = new AABB({
      lowerBound: new Vec3(-2, -2, -2),
      upperBound: new Vec3(2, 2, 2),
    })
    d.extend(c)
    expect(d.lowerBound).toMatchObject(new Vec3(-2, -2, -2))
    expect(d.upperBound).toMatchObject(new Vec3(2, 2, 2))

    const e = new AABB({
      lowerBound: new Vec3(-2, -1, -1),
      upperBound: new Vec3(2, 1, 1),
    })
    const f = new AABB({
      lowerBound: new Vec3(-1, -1, -1),
      upperBound: new Vec3(1, 1, 1),
    })
    f.extend(e)
    expect(e.lowerBound).toMatchObject(new Vec3(-2, -1, -1))
    expect(e.upperBound).toMatchObject(new Vec3(2, 1, 1))

    const g = new AABB({
      lowerBound: new Vec3(-5, -3, -2),
      upperBound: new Vec3(-3, -1, -1),
    })
    const h = new AABB({
      lowerBound: new Vec3(-2, -5, -1.5),
      upperBound: new Vec3(2, -2, 5),
    })
    g.extend(h)
    expect(g.lowerBound).toMatchObject(new Vec3(-5, -5, -2))
    expect(g.upperBound).toMatchObject(new Vec3(2, -1, 5))
  })

  test('overlaps', () => {
    const a = new AABB()
    const b = new AABB()

    //Same aabb
    a.lowerBound.set(-1, -1, 0)
    a.upperBound.set(1, 1, 0)
    b.lowerBound.set(-1, -1, 0)
    b.upperBound.set(1, 1, 0)
    expect(a.overlaps(b)).toBe(true)

    //Corner overlaps
    b.lowerBound.set(1, 1, 0)
    b.upperBound.set(2, 2, 0)
    expect(a.overlaps(b)).toBe(true)

    //Separate
    b.lowerBound.set(1.1, 1.1, 0)
    expect(a.overlaps(b)).toBe(false)

    //fully inside
    b.lowerBound.set(-0.5, -0.5, 0)
    b.upperBound.set(0.5, 0.5, 0)
    expect(a.overlaps(b)).toBe(true)
    b.lowerBound.set(-1.5, -1.5, 0)
    b.upperBound.set(1.5, 1.5, 0)
    expect(a.overlaps(b)).toBe(true)

    //Translated
    b.lowerBound.set(-3, -0.5, 0)
    b.upperBound.set(-2, 0.5, 0)
    expect(a.overlaps(b)).toBe(false)
  })

  test('volume', () => {
    const a = new AABB({
      lowerBound: new Vec3(-1, -2, -3),
      upperBound: new Vec3(1, 2, 3),
    })
    expect(a.volume()).toBe(2 * 4 * 6)
  })

  test('contains', () => {
    const a = new AABB()
    const b = new AABB()

    a.lowerBound.set(-1, -1, -1)
    a.upperBound.set(1, 1, 1)
    b.lowerBound.set(-1, -1, -1)
    b.upperBound.set(1, 1, 1)

    expect(a.contains(b)).toBe(true)

    a.lowerBound.set(-2, -2, -2)
    a.upperBound.set(2, 2, 2)

    expect(a.contains(b)).toBe(true)

    b.lowerBound.set(-3, -3, -3)
    b.upperBound.set(3, 3, 3)

    expect(a.contains(b)).toBe(false)

    a.lowerBound.set(0, 0, 0)
    a.upperBound.set(2, 2, 2)
    b.lowerBound.set(-1, -1, -1)
    b.upperBound.set(1, 1, 1)

    expect(a.contains(b)).toBe(false)
  })

  test('toLocalFrame', () => {
    const worldAABB = new AABB()
    const localAABB = new AABB()
    const frame = new Transform()

    worldAABB.lowerBound.set(-1, -1, -1)
    worldAABB.upperBound.set(1, 1, 1)

    //No transform - should stay the same
    worldAABB.toLocalFrame(frame, localAABB)
    expect(localAABB).toMatchObject(worldAABB)

    //Some translation
    frame.position.set(-1, 0, 0)
    worldAABB.toLocalFrame(frame, localAABB)
    expect(localAABB).toMatchObject(
      new AABB({
        lowerBound: new Vec3(0, -1, -1),
        upperBound: new Vec3(2, 1, 1),
      })
    )
  })

  test('toWorldFrame', () => {
    const localAABB = new AABB()
    const worldAABB = new AABB()
    const frame = new Transform()

    localAABB.lowerBound.set(-1, -1, -1)
    localAABB.upperBound.set(1, 1, 1)

    //No transform - should stay the same
    localAABB.toLocalFrame(frame, worldAABB)
    expect(localAABB).toMatchObject(worldAABB)

    //Some translation on the frame
    frame.position.set(1, 0, 0)
    localAABB.toWorldFrame(frame, worldAABB)
    expect(worldAABB).toMatchObject(
      new AABB({
        lowerBound: new Vec3(0, -1, -1),
        upperBound: new Vec3(2, 1, 1),
      })
    )
  })
})
