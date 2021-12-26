import { Body } from '../src/objects/Body'
import { NaiveBroadphase } from '../src/collision/NaiveBroadphase'
import { Sphere } from '../src/shapes/Sphere'
import { World } from '../src/world/World'

import type { CollisionMatrixClass } from '../src/collision/CollisionMatrix'

export type TestConfig = {
  positions: Array<[number, number, number]>
  colliding: {
    [tupleKey: string]: boolean
  }
}

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeColliding(testConfig: TestConfig): R
    }
  }
}

const collisionMatrixConfigs: TestConfig[] = [
  {
    positions: [
      [0, 0, 0],
      [2, 0, 0],
      [0, 4, 0],
      [2, 4, 0],
      [0, 8, 0],
      [2, 8, 0],
    ],
    colliding: {
      '0-1': true,
      '2-3': true,
      '4-5': true,
    },
  },
  {
    positions: [
      [0, 0, 0],
      [0, 4, 0],
      [0, 8, 0],
      [2, 0, 0],
      [2, 4, 0],
      [2, 8, 0],
    ],
    colliding: {
      '0-3': true,
      '1-4': true,
      '2-5': true,
    },
  },
  {
    positions: [
      [0, 0, 0],
      [0, 1, 0],
      [0, 10, 0],
      [0, 20, 0],
      [0, 30, 0],
      [0, 40, 0],
      [0, 50, 0],
      [0, 51, 0],
    ],
    colliding: {
      '0-1': true,
      '6-7': true,
    },
  },
]

export function testCollisionMatrix(CM: CollisionMatrixClass) {
  for (let config_idx = 0; config_idx < collisionMatrixConfigs.length; config_idx++) {
    const test_config = collisionMatrixConfigs[config_idx]

    const world = new World()
    world.broadphase = new NaiveBroadphase()
    world.collisionMatrix = new CM()
    world.collisionMatrixPrevious = new CM()

    for (let position_idx = 0; position_idx < test_config.positions.length; position_idx++) {
      const body = new Body({ mass: 1 })
      body.addShape(new Sphere(1.1))
      body.position.set(...test_config.positions[position_idx])
      world.addBody(body)
    }

    for (let step_idx = 0; step_idx < 2; step_idx++) {
      world.step(0.1)
      const is_first_step = step_idx === 0

      for (let coll_i = 0; coll_i < world.bodies.length; coll_i++) {
        for (let coll_j = coll_i + 1; coll_j < world.bodies.length; coll_j++) {
          expect([world, coll_i, coll_j, is_first_step]).toBeColliding(test_config)
        }
      }
    }
  }
}
