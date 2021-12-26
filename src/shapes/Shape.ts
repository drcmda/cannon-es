import type { Vec3 } from '../math/Vec3'
import type { Quaternion } from '../math/Quaternion'
import type { Body } from '../objects/Body'
import type { Material } from '../material/Material'

/**
 * The available shape types.
 */
export const SHAPE_TYPES = {
  SPHERE: 1,
  PLANE: 2,
  BOX: 4,
  COMPOUND: 8,
  CONVEXPOLYHEDRON: 16,
  HEIGHTFIELD: 32,
  PARTICLE: 64,
  CYLINDER: 128,
  TRIMESH: 256,
} as const

export type ShapeType = typeof SHAPE_TYPES[keyof typeof SHAPE_TYPES]

export type ShapeOptions = {
  /**
   * The type of this shape.
   */
  type: ShapeType
  /**
   * Whether to produce contact forces when in contact with other bodies.
   * @default true
   */
  collisionResponse?: boolean
  /**
   * @default 1
   */
  collisionFilterGroup?: number
  /**
   * @default -1
   */
  collisionFilterMask?: number
  /**
   * Optional material of the shape that regulates contact properties.
   * @default null
   * @todo check this, the material is passed to the body, right?
   */
  material?: Material | null
}

/**
 * Base class for shapes
 */
export abstract class Shape {
  /**
   * Identifier of the Shape.
   */
  id: number

  /**
   * The type of this shape. Must be set to an int > 0 by subclasses.
   */
  type: ShapeType

  /**
   * The local bounding sphere radius of this shape.
   */
  boundingSphereRadius: number

  /**
   * Whether to produce contact forces when in contact with other bodies. Note that contacts will be generated, but they will be disabled.
   * @default true
   */
  collisionResponse: boolean

  /**
   * @default 1
   */
  collisionFilterGroup: number

  /**
   * @default -1
   */
  collisionFilterMask: number

  /**
   * Optional material of the shape that regulates contact properties.
   */
  material: Material | null

  /**
   * The body to which the shape is added to.
   */
  body: Body | null

  static idCounter = 0

  /**
   * All the Shape types.
   */
  static types = SHAPE_TYPES

  constructor({
    collisionResponse = true,
    collisionFilterGroup = 1,
    collisionFilterMask = -1,
    material = null,
    type,
  }: ShapeOptions) {
    this.id = Shape.idCounter++
    this.type = type
    this.boundingSphereRadius = 0
    this.collisionResponse = collisionResponse
    this.collisionFilterGroup = collisionFilterGroup
    this.collisionFilterMask = collisionFilterMask
    this.material = material
    this.body = null
  }

  /**
   * Computes the bounding sphere radius.
   * The result is stored in the property `.boundingSphereRadius`
   */
  abstract updateBoundingSphereRadius(): void

  /**
   * Get the volume of this shape
   */
  abstract volume(): number

  /**
   * Calculates the inertia in the local frame for this shape.
   * @see http://en.wikipedia.org/wiki/List_of_moments_of_inertia
   */
  abstract calculateLocalInertia(mass: number, target: Vec3): void

  abstract calculateWorldAABB(pos: Vec3, quat: Quaternion, min: Vec3, max: Vec3): void
}
