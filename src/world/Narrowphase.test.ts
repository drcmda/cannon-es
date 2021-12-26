import { Vec3 } from '../math/Vec3'
import { Quaternion } from '../math/Quaternion'
import { Heightfield } from '../shapes/Heightfield'
import { Narrowphase } from './Narrowphase'
import { Sphere } from '../shapes/Sphere'
import { Body } from '../objects/Body'
import { World } from '../world/World'

import type { ContactEquation } from '../equations/ContactEquation'

describe('Narrowphase', () => {
  test('sphere + sphere contact', () => {
    const world = new World()
    const narrowPhase = new Narrowphase(world)
    const result: ContactEquation[] = []
    const sphereShape = new Sphere(1)

    const bodyA = new Body({ mass: 1 })
    const bodyB = new Body({ mass: 1 })
    bodyA.addShape(sphereShape)
    bodyB.addShape(sphereShape)

    // Assumption: using World.defaultContactMaterial will be the same
    // as using `new ContactMaterial()` for narrowPhase.currentContactMaterial.

    narrowPhase.result = result
    narrowPhase.sphereSphere(
      sphereShape,
      sphereShape,
      new Vec3(0.5, 0, 0),
      new Vec3(-0.5, 0, 0),
      new Quaternion(),
      new Quaternion(),
      bodyA,
      bodyB
    )

    expect(result.length).toBe(1)
  })

  test('sphere + heightfield contact', () => {
    const world = new World()
    const narrowPhase = new Narrowphase(world)
    const result: ContactEquation[] = []
    const hfShape = createHeightfield()
    const sphereShape = new Sphere(0.1)

    const bodyA = new Body({ mass: 1 })
    const bodyB = new Body({ mass: 1 })
    bodyA.addShape(hfShape)
    bodyB.addShape(sphereShape)

    narrowPhase.result = result
    narrowPhase.sphereHeightfield(
      sphereShape,
      hfShape,
      new Vec3(0.25, 0.25, 0.05), // hit the first triangle in the field
      new Vec3(0, 0, 0),
      new Quaternion(),
      new Quaternion(),
      bodyA,
      bodyB
    )

    expect(result.length).toBe(1)
  })
})

function createHeightfield() {
  const matrix: number[][] = []
  const size = 20
  for (let i = 0; i < size; i++) {
    matrix.push([])
    for (let j = 0; j < size; j++) {
      matrix[i].push(0)
    }
  }
  const hfShape = new Heightfield(matrix, {
    elementSize: 1,
  })

  return hfShape
}
