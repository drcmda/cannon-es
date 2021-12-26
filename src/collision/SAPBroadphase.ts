import { Broadphase } from '../collision/Broadphase'

import type { AABB } from '../collision/AABB'
import type { Body } from '../objects/Body'
import type { World } from '../world/World'

type AxisIndex = 0 | 1 | 2

/**
 * Sweep and prune broadphase along one axis.
 */
export class SAPBroadphase extends Broadphase {
  /**
   * List of bodies currently in the broadphase.
   */
  axisList: Body[]

  /**
   * The world to search in.
   */
  world: World | null

  /**
   * Axis to sort the bodies along.
   * Set to 0 for x axis, and 1 for y axis.
   * For best performance, pick the axis where bodies are most distributed.
   */
  axisIndex: AxisIndex

  private _addBodyHandler: (event: { body: Body }) => void
  private _removeBodyHandler: (event: { body: Body }) => void

  /**
   * Check if the bounds of two bodies overlap, along the given SAP axis.
   */
  static checkBounds(bi: Body, bj: Body, axisIndex: AxisIndex): boolean {
    let biPos: number
    let bjPos: number

    if (axisIndex === 0) {
      biPos = bi.position.x
      bjPos = bj.position.x
    } else if (axisIndex === 1) {
      biPos = bi.position.y
      bjPos = bj.position.y
    } else if (axisIndex === 2) {
      biPos = bi.position.z
      bjPos = bj.position.z
    }

    const ri = bi.boundingRadius,
      rj = bj.boundingRadius,
      boundA2 = biPos! + ri,
      boundB1 = bjPos! - rj

    return boundB1 < boundA2
  }

  // Note: these are identical, save for x/y/z lowerbound
  /**
   * insertionSortX
   */
  static insertionSortX(a: Body[]): Body[] {
    for (let i = 1, l = a.length; i < l; i++) {
      const v = a[i]
      let j: number
      for (j = i - 1; j >= 0; j--) {
        if (a[j].aabb.lowerBound.x <= v.aabb.lowerBound.x) {
          break
        }
        a[j + 1] = a[j]
      }
      a[j + 1] = v
    }
    return a
  }

  /**
   * insertionSortY
   */
  static insertionSortY(a: Body[]): Body[] {
    for (let i = 1, l = a.length; i < l; i++) {
      const v = a[i]
      let j: number
      for (j = i - 1; j >= 0; j--) {
        if (a[j].aabb.lowerBound.y <= v.aabb.lowerBound.y) {
          break
        }
        a[j + 1] = a[j]
      }
      a[j + 1] = v
    }
    return a
  }

  /**
   * insertionSortZ
   */
  static insertionSortZ(a: Body[]): Body[] {
    for (let i = 1, l = a.length; i < l; i++) {
      const v = a[i]
      let j: number
      for (j = i - 1; j >= 0; j--) {
        if (a[j].aabb.lowerBound.z <= v.aabb.lowerBound.z) {
          break
        }
        a[j + 1] = a[j]
      }
      a[j + 1] = v
    }
    return a
  }

  constructor(world: World) {
    super()

    this.axisList = []
    this.world = null
    this.axisIndex = 0

    const axisList = this.axisList

    this._addBodyHandler = (event: { body: Body }) => {
      axisList.push(event.body)
    }

    this._removeBodyHandler = (event: { body: Body }) => {
      const idx = axisList.indexOf(event.body)
      if (idx !== -1) {
        axisList.splice(idx, 1)
      }
    }

    if (world) {
      this.setWorld(world)
    }
  }

  /**
   * Change the world
   */
  setWorld(world: World): void {
    // Clear the old axis array
    this.axisList.length = 0

    // Add all bodies from the new world
    for (let i = 0; i < world.bodies.length; i++) {
      this.axisList.push(world.bodies[i])
    }

    // Remove old handlers, if any
    world.removeEventListener('addBody', this._addBodyHandler)
    world.removeEventListener('removeBody', this._removeBodyHandler)

    // Add handlers to update the list of bodies.
    world.addEventListener('addBody', this._addBodyHandler)
    world.addEventListener('removeBody', this._removeBodyHandler)

    this.world = world
    this.dirty = true
  }

  /**
   * Collect all collision pairs
   */
  collisionPairs(world: World, p1: Body[], p2: Body[]): void {
    const bodies = this.axisList
    const N = bodies.length
    const axisIndex = this.axisIndex

    if (this.dirty) {
      this.sortList()
      this.dirty = false
    }

    // Look through the list
    for (let i = 0; i !== N; i++) {
      const bi = bodies[i]

      for (let j = i + 1; j < N; j++) {
        const bj = bodies[j]

        if (!this.needBroadphaseCollision(bi, bj)) {
          continue
        }

        if (!SAPBroadphase.checkBounds(bi, bj, axisIndex)) {
          break
        }

        this.intersectionTest(bi, bj, p1, p2)
      }
    }
  }

  sortList(): void {
    const axisList = this.axisList
    const axisIndex = this.axisIndex
    const N = axisList.length

    // Update AABBs
    for (let i = 0; i !== N; i++) {
      const bi = axisList[i]
      if (bi.aabbNeedsUpdate) {
        bi.updateAABB()
      }
    }

    // Sort the list
    if (axisIndex === 0) {
      SAPBroadphase.insertionSortX(axisList)
    } else if (axisIndex === 1) {
      SAPBroadphase.insertionSortY(axisList)
    } else if (axisIndex === 2) {
      SAPBroadphase.insertionSortZ(axisList)
    }
  }

  /**
   * Computes the variance of the body positions and estimates the best axis to use.
   * Will automatically set property `axisIndex`.
   */
  autoDetectAxis(): void {
    let sumX = 0
    let sumX2 = 0
    let sumY = 0
    let sumY2 = 0
    let sumZ = 0
    let sumZ2 = 0
    const bodies = this.axisList
    const N = bodies.length
    const invN = 1 / N

    for (let i = 0; i !== N; i++) {
      const b = bodies[i]

      const centerX = b.position.x
      sumX += centerX
      sumX2 += centerX * centerX

      const centerY = b.position.y
      sumY += centerY
      sumY2 += centerY * centerY

      const centerZ = b.position.z
      sumZ += centerZ
      sumZ2 += centerZ * centerZ
    }

    const varianceX = sumX2 - sumX * sumX * invN
    const varianceY = sumY2 - sumY * sumY * invN
    const varianceZ = sumZ2 - sumZ * sumZ * invN

    if (varianceX > varianceY) {
      if (varianceX > varianceZ) {
        this.axisIndex = 0
      } else {
        this.axisIndex = 2
      }
    } else if (varianceY > varianceZ) {
      this.axisIndex = 1
    } else {
      this.axisIndex = 2
    }
  }

  /**
   * Returns all the bodies within an AABB.
   * @param result An array to store resulting bodies in.
   */
  aabbQuery(world: World, aabb: AABB, result: Body[] = []): Body[] {
    if (this.dirty) {
      this.sortList()
      this.dirty = false
    }

    const axisList = this.axisList

    for (let i = 0; i < axisList.length; i++) {
      const b = axisList[i]
      if (b.aabbNeedsUpdate) b.updateAABB()
      if (b.aabb.overlaps(aabb)) result.push(b)
    }

    return result
  }
}
