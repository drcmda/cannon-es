import type { Shape } from '../shapes/Shape'
import { Vec3 } from '../math/Vec3'
import { Box } from '../shapes/Box'
import { Sphere } from '../shapes/Sphere'
import { Body } from '../objects/Body'
import { World } from '../world/World'
import { ArrayCollisionMatrix } from '../collision/ArrayCollisionMatrix'
import { ObjectCollisionMatrix } from '../collision/ObjectCollisionMatrix'
import { RaycastResult } from '../collision/RaycastResult'
import { testCollisionMatrix } from '../../test/helpers'
import { Material } from '../material/Material'
import { ContactMaterial } from '../material/ContactMaterial'

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

  test('rayTestBox', () => {
    const world = new World()

    const body = new Body()
    body.addShape(new Box(new Vec3(1, 1, 1)))
    world.addBody(body)

    const from = new Vec3(-10, 0, 0)
    const to = new Vec3(10, 0, 0)

    const result = new RaycastResult()
    world.rayTest(from, to, result)

    expect(result.hasHit).toBe(true)
  })

  test('rayTestSphere', () => {
    const world = new World()

    const body = new Body()
    body.addShape(new Sphere(1))
    world.addBody(body)

    const from = new Vec3(-10, 0, 0)
    const to = new Vec3(10, 0, 0)

    const result = new RaycastResult()
    world.rayTest(from, to, result)

    expect(result.hasHit).toBe(true)
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

  test('getContactMaterial: empty', () => {
    const world = new World()
    const m1 = new Material('m1')
    const m2 = new Material('m2')

    expect(world.getContactMaterial(m1, m2)).toBe(undefined)
  })

  test('addContactMaterial & getContactMaterial', () => {
    const world = new World()
    const m1 = new Material('m1')
    const m2 = new Material('m2')
    const m3 = new Material('m3')
    const cmat1 = new ContactMaterial(m1, m2, { friction: 0.5 })
    const cmat2 = new ContactMaterial(m1, m3, { friction: 0.9 })

    world.addContactMaterial(cmat1)
    world.addContactMaterial(cmat2)

    expect(world.getContactMaterial(m1, m2)).toBe(cmat1)
    expect(world.getContactMaterial(m1, m3)).toBe(cmat2)
  })

  test('removeContactMaterial', () => {
    const world = new World()
    const m1 = new Material('m1')
    const m2 = new Material('m2')
    const m3 = new Material('m3')
    const cmat1 = new ContactMaterial(m1, m2, { friction: 0.5 })

    world.addContactMaterial(cmat1)
    world.removeContactMaterial(cmat1)

    expect(world.getContactMaterial(m1, m2)).toBe(undefined)
  })

  test('using ArrayCollisionMatrix', () => {
    testCollisionMatrix(ArrayCollisionMatrix)
  })

  test('using ObjectCollisionMatrix', () => {
    testCollisionMatrix(ObjectCollisionMatrix)
  })

  test('frictionGravity: should be undefined by default', () => {
    const gravity = new Vec3(0, -9.81, 0)
    const world = new World({ gravity })

    expect(world.gravity).toEqual(gravity)
    expect(world.frictionGravity).toBeUndefined()
  })

  test('frictionGravity: should be configurable', () => {
    const gravity = new Vec3(0, 0, 0)
    const frictionGravity = new Vec3(0, -9.81, 0)
    const world = new World({ gravity, frictionGravity })

    expect(world.gravity).toEqual(gravity)
    expect(world.frictionGravity).toEqual(frictionGravity)
  })

  test('step: should interpolate correctly', () => {
    // In case of interpolation, we need to ensure the world
    // has simulated enough steps to cover the entire time that
    // has passed, even when the timeSinceLastCalled + accumulator
    // falls somewhere inbetween steps

    const gravity = new Vec3(0, -1, 0) // Simplifies the calculation
    const world = new World({ gravity })
    const body = new Body({ type: Body.DYNAMIC, mass: 1 })
    body.linearDamping = 0
    body.angularDamping = 0

    const deltaTime = 1
    const timeSinceLastCalled = 2.7
    world.addBody(body)
    world.step(deltaTime, timeSinceLastCalled, 10)

    // v = a * t
    expect(body.velocity.y).toEqual(-3)

    const currentY = -1 - 2 - 3
    expect(body.position.y).toEqual(currentY)

    const previousY = -1 - 2
    expect(body.previousPosition.y).toEqual(previousY)

    expect(world.stepnumber).toEqual(3)
    expect(world.time).toEqual(3)

    const interpolationTime = (timeSinceLastCalled - world.time) / deltaTime + 1
    expect(body.interpolatedPosition.y).toEqual(interpolationTime * (currentY - previousY) + previousY)
  })
})
