import { Broadphase } from '../collision/Broadphase'
import type { AABB } from '../collision/AABB'
import type { Body } from '../objects/Body'
import type { World } from '../world/World'

/**
 * Naive broadphase implementation, used in lack of better ones.
 * @class NaiveBroadphase
 * @constructor
 * @description The naive broadphase looks at all possible pairs without restriction, therefore it has complexity N^2 (which is bad)
 * @extends Broadphase
 */
export class NaiveBroadphase extends Broadphase {
  constructor() {
    super()
  }

  /**
   * Get all the collision pairs in the physics world
   * @method collisionPairs
   * @param {World} world
   * @param {Array} pairs1
   * @param {Array} pairs2
   */
  collisionPairs(world: World, pairs1: Body[], pairs2: Body[]): void {
    const bodies = world.bodies
    const n = bodies.length
    let bi
    let bj

    // Naive N^2 ftw!
    for (let i = 0; i !== n; i++) {
      for (let j = 0; j !== i; j++) {
        bi = bodies[i]
        bj = bodies[j]

        if (!Broadphase.needBroadphaseCollision(bi, bj)) {
          continue
        }

        this.intersectionTest(bi, bj, pairs1, pairs2)
      }
    }
  }

  /**
   * Returns all the bodies within an AABB.
   * @method aabbQuery
   * @param  {World} world
   * @param  {AABB} aabb
   * @param {array} result An array to store resulting bodies in.
   * @return {array}
   */
  aabbQuery(world: World, aabb: AABB, result: Body[] = []): Body[] {
    for (let i = 0; i < world.bodies.length; i++) {
      const b = world.bodies[i]

      if (b.aabbNeedsUpdate) {
        b.computeAABB()
      }

      // Ugly hack until Body gets aabb
      if (b.aabb.overlaps(aabb)) {
        result.push(b)
      }
    }

    return result
  }
}
