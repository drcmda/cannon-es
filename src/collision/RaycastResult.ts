import { Vec3 } from '../math/Vec3'
import type { Body } from '../objects/Body'
import type { Shape } from '../shapes/Shape'

/**
 * Storage for Ray casting data
 */
export class RaycastResult {
  /**
   * rayFromWorld
   */
  rayFromWorld: Vec3
  /**
   * rayToWorld
   */
  rayToWorld: Vec3
  /**
   * hitNormalWorld
   */
  hitNormalWorld: Vec3
  /**
   * hitPointWorld
   */
  hitPointWorld: Vec3
  /**
   * hasHit
   */
  hasHit: boolean
  /**
   * shape
   */
  shape: Shape | null
  /**
   * body
   */
  body: Body | null
  /**
   * The index of the hit triangle, if the hit shape was a trimesh
   */
  hitFaceIndex: number
  /**
   * Distance to the hit. Will be set to -1 if there was no hit
   */
  distance: number
  /**
   * If the ray should stop traversing the bodies
   */
  shouldStop: boolean

  constructor() {
    this.rayFromWorld = new Vec3()
    this.rayToWorld = new Vec3()
    this.hitNormalWorld = new Vec3()
    this.hitPointWorld = new Vec3()
    this.hasHit = false
    this.shape = null
    this.body = null
    this.hitFaceIndex = -1
    this.distance = -1
    this.shouldStop = false
  }

  /**
   * Reset all result data.
   */
  reset(): void {
    this.rayFromWorld.setZero()
    this.rayToWorld.setZero()
    this.hitNormalWorld.setZero()
    this.hitPointWorld.setZero()
    this.hasHit = false
    this.shape = null
    this.body = null
    this.hitFaceIndex = -1
    this.distance = -1
    this.shouldStop = false
  }

  /**
   * abort
   */
  abort(): void {
    this.shouldStop = true
  }

  /**
   * Set result data.
   */
  set(
    rayFromWorld: Vec3,
    rayToWorld: Vec3,
    hitNormalWorld: Vec3,
    hitPointWorld: Vec3,
    shape: Shape,
    body: Body,
    distance: number,
    hitFaceIndex: number
  ): void {
    this.rayFromWorld.copy(rayFromWorld)
    this.rayToWorld.copy(rayToWorld)
    this.hitNormalWorld.copy(hitNormalWorld)
    this.hitPointWorld.copy(hitPointWorld)
    this.shape = shape
    this.body = body
    this.distance = distance
    this.hitFaceIndex = hitFaceIndex
  }
}
