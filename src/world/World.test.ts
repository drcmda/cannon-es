import { Vec3 } from '../math/Vec3'
import { Sphere } from '../shapes/Sphere'
import { Body } from '../objects/Body'
import { World } from '../world/World'
import { ArrayCollisionMatrix, ObjectCollisionMatrix } from '../collision/CollisionMatrix'
import { RaycastResult } from '../collision/RaycastResult'
import { testCollisionMatrix } from '../../test/helpers'

describe('World', () => {
  test('clearForces', () => {
    const world = new World()
    const body = new Body()
    world.addBody(body)
    body.force.set(1, 2, 3)
    body.torque.set(4, 5, 6)

    world.clearForces()

    expect(body.force.almostEquals(new Vec3(0, 0, 0))).toBe(true)
    expect(body.torque.almostEquals(new Vec3(0, 0, 0))).toBe(true)
  })

  test('raycastClosest: single', () => {
    const world = new World()
    const body = new Body({
      shape: new Sphere(1),
    })
    world.addBody(body)

    const from = new Vec3(-10, 0, 0)
    const to = new Vec3(10, 0, 0)

    const result = new RaycastResult()
    world.raycastClosest(from, to, {}, result)

    expect(result.hasHit).toBe(true)
    expect(result.body).toEqual(body)
    expect(result.shape).toBe(body.shapes[0])
  })

  test('raycastClosest: order', () => {
    const world = new World()
    const bodyA = new Body({ shape: new Sphere(1), position: new Vec3(-1, 0, 0) })
    const bodyB = new Body({ shape: new Sphere(1), position: new Vec3(1, 0, 0) })
    world.addBody(bodyA)
    world.addBody(bodyB)

    const from = new Vec3(-10, 0, 0)
    const to = new Vec3(10, 0, 0)

    let result = new RaycastResult()
    world.raycastClosest(from, to, {}, result)

    expect(result.hasHit).toBe(true)
    expect(result.body).toBe(bodyA)
    expect(result.shape).toBe(bodyA.shapes[0])

    from.set(10, 0, 0)
    to.set(-10, 0, 0)

    result = new RaycastResult()
    world.raycastClosest(from, to, {}, result)

    expect(result.hasHit).toBe(true)
    expect(result.body).toBe(bodyB)
    expect(result.shape).toBe(bodyB.shapes[0])
  })

  test('raycastAll: simple', () => {
    const world = new World()
    const body = new Body({ shape: new Sphere(1) })
    world.addBody(body)

    const from = new Vec3(-10, 0, 0)
    const to = new Vec3(10, 0, 0)

    let numResults = 0
    const returnVal = world.raycastAll(from, to, {}, function (result) {
      expect(result.hasHit).toBe(true)
      expect(result.body).toBe(body)
      expect(result.shape).toBe(result.body?.shapes[0])
      numResults++
    })
    expect(numResults).toBe(2)
    expect(returnVal).toBe(true)
  })

  test('raycastAll: two spheres', () => {
    const world = new World()
    const body = new Body({ shape: new Sphere(1) })
    world.addBody(body)

    const body2 = new Body({ shape: new Sphere(1) })
    world.addBody(body2)

    const from = new Vec3(-10, 0, 0)
    const to = new Vec3(10, 0, 0)

    let hasHit = false
    let numResults = 0

    world.raycastAll(from, to, {}, function (result) {
      hasHit = result.hasHit
      numResults++
    })

    expect(hasHit).toBe(true)
    expect(numResults).toBe(4)
  })

  test('raycastAll: skipBackfaces', () => {
    const world = new World()
    const body = new Body({ shape: new Sphere(1) })
    world.addBody(body)

    let numResults = 0
    world.raycastAll(new Vec3(-10, 0, 0), new Vec3(10, 0, 0), { skipBackfaces: true }, function (result) {
      expect(result.hasHit).toBe(true)
      expect(result.body).toBe(body)
      expect(result.shape).toBe(result.body?.shapes[0])
      numResults++
    })

    expect(numResults).toBe(1)
  })

  test('raycastAll: collisionFilters', () => {
    const world = new World()
    const body = new Body({
      shape: new Sphere(1),
    })
    world.addBody(body)
    body.collisionFilterGroup = 2
    body.collisionFilterMask = 2

    let numResults = 0

    world.raycastAll(
      new Vec3(-10, 0, 0),
      new Vec3(10, 0, 0),
      {
        collisionFilterGroup: 2,
        collisionFilterMask: 2,
      },
      function () {
        numResults++
      }
    )

    expect(numResults).toBe(2)

    numResults = 0

    world.raycastAll(
      new Vec3(-10, 0, 0),
      new Vec3(10, 0, 0),
      {
        collisionFilterGroup: 1,
        collisionFilterMask: 1,
      },
      function () {
        numResults++
      }
    )

    expect(numResults).toBe(0) // should use collision groups!
  })

  test('raycastAny', () => {
    const world = new World()
    world.addBody(new Body({ shape: new Sphere(1) }))

    const from = new Vec3(-10, 0, 0)
    const to = new Vec3(10, 0, 0)

    const result = new RaycastResult()
    world.raycastAny(from, to, {}, result)

    expect(result.hasHit).toBe(true)
  })

  test('using ArrayCollisionMatrix', () => {
    testCollisionMatrix(ArrayCollisionMatrix)
  })

  test('using ObjectCollisionMatrix', () => {
    testCollisionMatrix(ObjectCollisionMatrix)
  })
})
