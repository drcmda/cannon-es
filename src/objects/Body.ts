import { EventTarget } from '../utils/EventTarget'
import { Vec3 } from '../math/Vec3'
import { Mat3 } from '../math/Mat3'
import { Quaternion } from '../math/Quaternion'
import { AABB } from '../collision/AABB'
import { Box } from '../shapes/Box'
import type { Shape } from '../shapes/Shape'
import type { Material } from '../material/Material'
import type { World } from '../world/World'

/**
 * BODY_TYPES
 */
export const BODY_TYPES = {
  /** DYNAMIC */
  DYNAMIC: 1,
  /** STATIC */
  STATIC: 2,
  /** KINEMATIC */
  KINEMATIC: 4,
} as const

/**
 * BodyType
 */
export type BodyType = typeof BODY_TYPES[keyof typeof BODY_TYPES]

/**
 * BODY_SLEEP_STATES
 */
export const BODY_SLEEP_STATES = {
  /** AWAKE */
  AWAKE: 0,
  /** SLEEPY */
  SLEEPY: 1,
  /** SLEEPING */
  SLEEPING: 2,
} as const

/**
 * BodySleepState
 */
export type BodySleepState = typeof BODY_SLEEP_STATES[keyof typeof BODY_SLEEP_STATES]

export type BodyOptions = ConstructorParameters<typeof Body>[0]

/**
 * Base class for all body types.
 * @example
 *     const shape = new CANNON.Sphere(1)
 *     const body = new CANNON.Body({
 *       mass: 1,
 *       shape,
 *     })
 *     world.addBody(body)
 */
export class Body extends EventTarget {
  static idCounter = 0

  /**
   * Dispatched after two bodies collide. This event is dispatched on each
   * of the two bodies involved in the collision.
   * @event collide
   * @param body The body that was involved in the collision.
   * @param contact The details of the collision.
   */
  static COLLIDE_EVENT_NAME = 'collide'

  /**
   * A dynamic body is fully simulated. Can be moved manually by the user, but normally they move according to forces. A dynamic body can collide with all body types. A dynamic body always has finite, non-zero mass.
   */
  static DYNAMIC = BODY_TYPES.DYNAMIC

  /**
   * A static body does not move during simulation and behaves as if it has infinite mass. Static bodies can be moved manually by setting the position of the body. The velocity of a static body is always zero. Static bodies do not collide with other static or kinematic bodies.
   */
  static STATIC = BODY_TYPES.STATIC

  /**
   * A kinematic body moves under simulation according to its velocity. They do not respond to forces. They can be moved manually, but normally a kinematic body is moved by setting its velocity. A kinematic body behaves as if it has infinite mass. Kinematic bodies do not collide with other static or kinematic bodies.
   */
  static KINEMATIC = BODY_TYPES.KINEMATIC

  /**
   * AWAKE
   */
  static AWAKE = BODY_SLEEP_STATES.AWAKE
  /**
   * SLEEPY
   */
  static SLEEPY = BODY_SLEEP_STATES.SLEEPY
  /**
   * SLEEPING
   */
  static SLEEPING = BODY_SLEEP_STATES.SLEEPING

  /**
   * Dispatched after a sleeping body has woken up.
   * @event wakeup
   */
  static wakeupEvent = { type: 'wakeup' }

  /**
   * Dispatched after a body has gone in to the sleepy state.
   * @event sleepy
   */
  static sleepyEvent = { type: 'sleepy' }

  /**
   * Dispatched after a body has fallen asleep.
   * @event sleep
   */
  static sleepEvent = { type: 'sleep' }

  /**
   * Identifier of the body.
   */
  id: number

  /**
   * Position of body in World.bodies. Updated by World and used in ArrayCollisionMatrix.
   */
  index: number

  /**
   * Reference to the world the body is living in.
   */
  world: World | null

  vlambda: Vec3

  /**
   * The collision group the body belongs to.
   * @default 1
   */
  collisionFilterGroup: number

  /**
   * The collision group the body can collide with.
   * @default -1
   */
  collisionFilterMask: number

  /**
   * Whether to produce contact forces when in contact with other bodies. Note that contacts will be generated, but they will be disabled - i.e. "collide" events will be raised, but forces will not be altered.
   */
  collisionResponse: boolean

  /**
   * World space position of the body.
   */
  position: Vec3

  previousPosition: Vec3

  /**
   * Interpolated position of the body.
   */
  interpolatedPosition: Vec3

  /**
   * Initial position of the body.
   */
  initPosition: Vec3

  /**
   * World space velocity of the body.
   */
  velocity: Vec3

  /**
   * Initial velocity of the body.
   */
  initVelocity: Vec3

  /**
   * Linear force on the body in world space.
   */
  force: Vec3

  /**
   * The mass of the body.
   * @default 0
   */
  mass: number

  invMass: number

  /**
   * The physics material of the body. It defines the body interaction with other bodies.
   */
  material: Material | null

  /**
   * How much to damp the body velocity each step. It can go from 0 to 1.
   * @default 0.01
   */
  linearDamping: number

  /**
   * One of: `Body.DYNAMIC`, `Body.STATIC` and `Body.KINEMATIC`.
   */
  type: BodyType

  /**
   * If true, the body will automatically fall to sleep.
   * @default true
   */
  allowSleep: boolean

  /**
   * Current sleep state.
   */
  sleepState: BodySleepState

  /**
   * If the speed (the norm of the velocity) is smaller than this value, the body is considered sleepy.
   * @default 0.1
   */
  sleepSpeedLimit: number

  /**
   * If the body has been sleepy for this sleepTimeLimit seconds, it is considered sleeping.
   * @default 1
   */
  sleepTimeLimit: number

  timeLastSleepy: number

  wakeUpAfterNarrowphase: boolean

  /**
   * World space rotational force on the body, around center of mass.
   */
  torque: Vec3

  /**
   * World space orientation of the body.
   */
  quaternion: Quaternion

  /**
   * Initial quaternion of the body.
   */
  initQuaternion: Quaternion

  previousQuaternion: Quaternion

  /**
   * Interpolated orientation of the body.
   */
  interpolatedQuaternion: Quaternion

  /**
   * Angular velocity of the body, in world space. Think of the angular velocity as a vector, which the body rotates around. The length of this vector determines how fast (in radians per second) the body rotates.
   */
  angularVelocity: Vec3

  /**
   * Initial angular velocity of the body.
   */
  initAngularVelocity: Vec3

  /**
   * List of Shapes that have been added to the body.
   */
  shapes: Shape[]

  /**
   * Position of each Shape in the body, given in local Body space.
   */
  shapeOffsets: Vec3[]

  /**
   * Orientation of each Shape, given in local Body space.
   */
  shapeOrientations: Quaternion[]

  /**
   * The inertia of the body.
   */
  inertia: Vec3

  invInertia: Vec3
  invInertiaWorld: Mat3
  invMassSolve: number
  invInertiaSolve: Vec3
  invInertiaWorldSolve: Mat3

  /**
   * Set to true if you don't want the body to rotate. Make sure to run .updateMassProperties() if you change this after the body creation.
   * @default false
   */
  fixedRotation: boolean

  /**
   * How much to damp the body angular velocity each step. It can go from 0 to 1.
   * @default 0.01
   */
  angularDamping: number

  /**
   * Use this property to limit the motion along any world axis. (1,1,1) will allow motion along all axes while (0,0,0) allows none.
   */
  linearFactor: Vec3

  /**
   * Use this property to limit the rotational motion along any world axis. (1,1,1) will allow rotation along all axes while (0,0,0) allows none.
   */
  angularFactor: Vec3

  /**
   * World space bounding box of the body and its shapes.
   */
  aabb: AABB

  /**
   * Indicates if the AABB needs to be updated before use.
   */
  aabbNeedsUpdate: boolean

  /**
   * Total bounding radius of the Body including its shapes, relative to body.position.
   */
  boundingRadius: number
  wlambda: Vec3
  /**
   * When true the body behaves like a trigger. It does not collide
   * with other bodies but collision events are still triggered.
   * @default false
   */
  isTrigger: boolean

  constructor(
    options: {
      /**
       * The collision group the body belongs to.
       * @default 1
       */
      collisionFilterGroup?: number
      /**
       * The collision group the body can collide with.
       * @default -1
       */
      collisionFilterMask?: number

      /**
       * Whether to produce contact forces when in contact with other bodies. Note that contacts will be generated, but they will be disabled - i.e. "collide" events will be raised, but forces will not be altered.
       */
      collisionResponse?: boolean
      /**
       * World space position of the body.
       */
      position?: Vec3
      /**
       * World space velocity of the body.
       */
      velocity?: Vec3
      /**
       * The mass of the body.
       * @default 0
       */
      mass?: number
      /**
       * The physics material of the body. It defines the body interaction with other bodies.
       */
      material?: Material
      /**
       * How much to damp the body velocity each step. It can go from 0 to 1.
       * @default 0.01
       */
      linearDamping?: number
      /**
       * One of: `Body.DYNAMIC`, `Body.STATIC` and `Body.KINEMATIC`.
       */
      type?: BodyType
      /**
       * If true, the body will automatically fall to sleep.
       * @default true
       */
      allowSleep?: boolean
      /**
       * If the speed (the norm of the velocity) is smaller than this value, the body is considered sleepy.
       * @default 0.1
       */
      sleepSpeedLimit?: number
      /**
       * If the body has been sleepy for this sleepTimeLimit seconds, it is considered sleeping.
       * @default 1
       */
      sleepTimeLimit?: number
      /**
       * World space orientation of the body.
       */
      quaternion?: Quaternion
      /**
       * Angular velocity of the body, in world space. Think of the angular velocity as a vector, which the body rotates around. The length of this vector determines how fast (in radians per second) the body rotates.
       */
      angularVelocity?: Vec3
      /**
       * Set to true if you don't want the body to rotate. Make sure to run .updateMassProperties() if you change this after the body creation.
       * @default false
       */
      fixedRotation?: boolean
      /**
       * How much to damp the body angular velocity each step. It can go from 0 to 1.
       * @default 0.01
       */
      angularDamping?: number
      /**
       * Use this property to limit the motion along any world axis. (1,1,1) will allow motion along all axes while (0,0,0) allows none.
       */
      linearFactor?: Vec3
      /**
       * Use this property to limit the rotational motion along any world axis. (1,1,1) will allow rotation along all axes while (0,0,0) allows none.
       */
      angularFactor?: Vec3
      /**
       * Add a Shape to the body.
       */
      shape?: Shape
      /**
       * When true the body behaves like a trigger. It does not collide
       * with other bodies but collision events are still triggered.
       * @default false
       */
      isTrigger?: boolean
    } = {}
  ) {
    super()

    this.id = Body.idCounter++
    this.index = -1
    this.world = null
    this.vlambda = new Vec3()

    this.collisionFilterGroup = typeof options.collisionFilterGroup === 'number' ? options.collisionFilterGroup : 1
    this.collisionFilterMask = typeof options.collisionFilterMask === 'number' ? options.collisionFilterMask : -1
    this.collisionResponse = typeof options.collisionResponse === 'boolean' ? options.collisionResponse : true
    this.position = new Vec3()
    this.previousPosition = new Vec3()
    this.interpolatedPosition = new Vec3()
    this.initPosition = new Vec3()

    if (options.position) {
      this.position.copy(options.position)
      this.previousPosition.copy(options.position)
      this.interpolatedPosition.copy(options.position)
      this.initPosition.copy(options.position)
    }

    this.velocity = new Vec3()

    if (options.velocity) {
      this.velocity.copy(options.velocity)
    }

    this.initVelocity = new Vec3()
    this.force = new Vec3()
    const mass = typeof options.mass === 'number' ? options.mass : 0
    this.mass = mass
    this.invMass = mass > 0 ? 1.0 / mass : 0
    this.material = options.material || null
    this.linearDamping = typeof options.linearDamping === 'number' ? options.linearDamping : 0.01

    this.type = mass <= 0.0 ? Body.STATIC : Body.DYNAMIC

    if (typeof options.type === typeof Body.STATIC) {
      this.type = options.type!
    }

    this.allowSleep = typeof options.allowSleep !== 'undefined' ? options.allowSleep : true
    this.sleepState = Body.AWAKE
    this.sleepSpeedLimit = typeof options.sleepSpeedLimit !== 'undefined' ? options.sleepSpeedLimit : 0.1
    this.sleepTimeLimit = typeof options.sleepTimeLimit !== 'undefined' ? options.sleepTimeLimit : 1
    this.timeLastSleepy = 0
    this.wakeUpAfterNarrowphase = false

    this.torque = new Vec3()
    this.quaternion = new Quaternion()
    this.initQuaternion = new Quaternion()
    this.previousQuaternion = new Quaternion()
    this.interpolatedQuaternion = new Quaternion()

    if (options.quaternion) {
      this.quaternion.copy(options.quaternion)
      this.initQuaternion.copy(options.quaternion)
      this.previousQuaternion.copy(options.quaternion)
      this.interpolatedQuaternion.copy(options.quaternion)
    }

    this.angularVelocity = new Vec3()

    if (options.angularVelocity) {
      this.angularVelocity.copy(options.angularVelocity)
    }

    this.initAngularVelocity = new Vec3()

    this.shapes = []
    this.shapeOffsets = []
    this.shapeOrientations = []

    this.inertia = new Vec3()
    this.invInertia = new Vec3()
    this.invInertiaWorld = new Mat3()
    this.invMassSolve = 0
    this.invInertiaSolve = new Vec3()
    this.invInertiaWorldSolve = new Mat3()

    this.fixedRotation = typeof options.fixedRotation !== 'undefined' ? options.fixedRotation : false
    this.angularDamping = typeof options.angularDamping !== 'undefined' ? options.angularDamping : 0.01

    this.linearFactor = new Vec3(1, 1, 1)

    if (options.linearFactor) {
      this.linearFactor.copy(options.linearFactor)
    }

    this.angularFactor = new Vec3(1, 1, 1)

    if (options.angularFactor) {
      this.angularFactor.copy(options.angularFactor)
    }

    this.aabb = new AABB()
    this.aabbNeedsUpdate = true
    this.boundingRadius = 0
    this.wlambda = new Vec3()
    this.isTrigger = Boolean(options.isTrigger)

    if (options.shape) {
      this.addShape(options.shape)
    }

    this.updateMassProperties()
  }

  /**
   * Wake the body up.
   */
  wakeUp(): void {
    const prevState = this.sleepState
    this.sleepState = Body.AWAKE
    this.wakeUpAfterNarrowphase = false
    if (prevState === Body.SLEEPING) {
      this.dispatchEvent(Body.wakeupEvent)
    }
  }

  /**
   * Force body sleep
   */
  sleep(): void {
    this.sleepState = Body.SLEEPING
    this.velocity.set(0, 0, 0)
    this.angularVelocity.set(0, 0, 0)
    this.wakeUpAfterNarrowphase = false
  }

  /**
   * Called every timestep to update internal sleep timer and change sleep state if needed.
   * @param time The world time in seconds
   */
  sleepTick(time: number): void {
    if (this.allowSleep) {
      const sleepState = this.sleepState
      const speedSquared = this.velocity.lengthSquared() + this.angularVelocity.lengthSquared()
      const speedLimitSquared = this.sleepSpeedLimit ** 2
      if (sleepState === Body.AWAKE && speedSquared < speedLimitSquared) {
        this.sleepState = Body.SLEEPY // Sleepy
        this.timeLastSleepy = time
        this.dispatchEvent(Body.sleepyEvent)
      } else if (sleepState === Body.SLEEPY && speedSquared > speedLimitSquared) {
        this.wakeUp() // Wake up
      } else if (sleepState === Body.SLEEPY && time - this.timeLastSleepy > this.sleepTimeLimit) {
        this.sleep() // Sleeping
        this.dispatchEvent(Body.sleepEvent)
      }
    }
  }

  /**
   * If the body is sleeping, it should be immovable / have infinite mass during solve. We solve it by having a separate "solve mass".
   */
  updateSolveMassProperties(): void {
    if (this.sleepState === Body.SLEEPING || this.type === Body.KINEMATIC) {
      this.invMassSolve = 0
      this.invInertiaSolve.setZero()
      this.invInertiaWorldSolve.setZero()
    } else {
      this.invMassSolve = this.invMass
      this.invInertiaSolve.copy(this.invInertia)
      this.invInertiaWorldSolve.copy(this.invInertiaWorld)
    }
  }

  /**
   * Convert a world point to local body frame.
   */
  pointToLocalFrame(worldPoint: Vec3, result = new Vec3()): Vec3 {
    worldPoint.vsub(this.position, result)
    this.quaternion.conjugate().vmult(result, result)
    return result
  }

  /**
   * Convert a world vector to local body frame.
   */
  vectorToLocalFrame(worldVector: Vec3, result = new Vec3()): Vec3 {
    this.quaternion.conjugate().vmult(worldVector, result)
    return result
  }

  /**
   * Convert a local body point to world frame.
   */
  pointToWorldFrame(localPoint: Vec3, result = new Vec3()): Vec3 {
    this.quaternion.vmult(localPoint, result)
    result.vadd(this.position, result)
    return result
  }

  /**
   * Convert a local body point to world frame.
   */
  vectorToWorldFrame(localVector: Vec3, result = new Vec3()): Vec3 {
    this.quaternion.vmult(localVector, result)
    return result
  }

  /**
   * Add a shape to the body with a local offset and orientation.
   * @return The body object, for chainability.
   */
  addShape(shape: Shape, _offset?: Vec3, _orientation?: Quaternion): Body {
    const offset = new Vec3()
    const orientation = new Quaternion()

    if (_offset) {
      offset.copy(_offset)
    }
    if (_orientation) {
      orientation.copy(_orientation)
    }

    this.shapes.push(shape)
    this.shapeOffsets.push(offset)
    this.shapeOrientations.push(orientation)
    this.updateMassProperties()
    this.updateBoundingRadius()

    this.aabbNeedsUpdate = true

    shape.body = this

    return this
  }

  /**
   * Remove a shape from the body.
   * @return The body object, for chainability.
   */
  removeShape(shape: Shape): Body {
    const index = this.shapes.indexOf(shape)

    if (index === -1) {
      console.warn('Shape does not belong to the body')
      return this
    }

    this.shapes.splice(index, 1)
    this.shapeOffsets.splice(index, 1)
    this.shapeOrientations.splice(index, 1)
    this.updateMassProperties()
    this.updateBoundingRadius()

    this.aabbNeedsUpdate = true

    shape.body = null

    return this
  }

  /**
   * Update the bounding radius of the body. Should be done if any of the shapes are changed.
   */
  updateBoundingRadius(): void {
    const shapes = this.shapes
    const shapeOffsets = this.shapeOffsets
    const N = shapes.length
    let radius = 0

    for (let i = 0; i !== N; i++) {
      const shape = shapes[i]
      shape.updateBoundingSphereRadius()
      const offset = shapeOffsets[i].length()
      const r = shape.boundingSphereRadius
      if (offset + r > radius) {
        radius = offset + r
      }
    }

    this.boundingRadius = radius
  }

  /**
   * Updates the .aabb
   */
  updateAABB(): void {
    const shapes = this.shapes
    const shapeOffsets = this.shapeOffsets
    const shapeOrientations = this.shapeOrientations
    const N = shapes.length
    const offset = tmpVec
    const orientation = tmpQuat
    const bodyQuat = this.quaternion
    const aabb = this.aabb
    const shapeAABB = updateAABB_shapeAABB

    for (let i = 0; i !== N; i++) {
      const shape = shapes[i]

      // Get shape world position
      bodyQuat.vmult(shapeOffsets[i], offset)
      offset.vadd(this.position, offset)

      // Get shape world quaternion
      bodyQuat.mult(shapeOrientations[i], orientation)

      // Get shape AABB
      shape.calculateWorldAABB(offset, orientation, shapeAABB.lowerBound, shapeAABB.upperBound)

      if (i === 0) {
        aabb.copy(shapeAABB)
      } else {
        aabb.extend(shapeAABB)
      }
    }

    this.aabbNeedsUpdate = false
  }

  /**
   * Update `.inertiaWorld` and `.invInertiaWorld`
   */
  updateInertiaWorld(force?: boolean): void {
    const I = this.invInertia
    if (I.x === I.y && I.y === I.z && !force) {
      // If inertia M = s*I, where I is identity and s a scalar, then
      //    R*M*R' = R*(s*I)*R' = s*R*I*R' = s*R*R' = s*I = M
      // where R is the rotation matrix.
      // In other words, we don't have to transform the inertia if all
      // inertia diagonal entries are equal.
    } else {
      const m1 = uiw_m1
      const m2 = uiw_m2
      const m3 = uiw_m3
      m1.setRotationFromQuaternion(this.quaternion)
      m1.transpose(m2)
      m1.scale(I, m1)
      m1.mmult(m2, this.invInertiaWorld)
    }
  }

  /**
   * Apply force to a point of the body. This could for example be a point on the Body surface.
   * Applying force this way will add to Body.force and Body.torque.
   * @param force The amount of force to add.
   * @param relativePoint A point relative to the center of mass to apply the force on.
   */
  applyForce(force: Vec3, relativePoint: Vec3 = new Vec3()): void {
    // Needed?
    if (this.type !== Body.DYNAMIC) {
      return
    }

    if (this.sleepState === Body.SLEEPING) {
      this.wakeUp()
    }

    // Compute produced rotational force
    const rotForce = Body_applyForce_rotForce
    relativePoint.cross(force, rotForce)

    // Add linear force
    this.force.vadd(force, this.force)

    // Add rotational force
    this.torque.vadd(rotForce, this.torque)
  }

  /**
   * Apply force to a local point in the body.
   * @param force The force vector to apply, defined locally in the body frame.
   * @param localPoint A local point in the body to apply the force on.
   */
  applyLocalForce(localForce: Vec3, localPoint: Vec3 = new Vec3()): void {
    if (this.type !== Body.DYNAMIC) {
      return
    }

    const worldForce = Body_applyLocalForce_worldForce
    const relativePointWorld = Body_applyLocalForce_relativePointWorld

    // Transform the force vector to world space
    this.vectorToWorldFrame(localForce, worldForce)
    this.vectorToWorldFrame(localPoint, relativePointWorld)

    this.applyForce(worldForce, relativePointWorld)
  }

  /**
   * Apply torque to the body.
   * @param torque The amount of torque to add.
   */
  applyTorque(torque: Vec3): void {
    if (this.type !== Body.DYNAMIC) {
      return
    }

    if (this.sleepState === Body.SLEEPING) {
      this.wakeUp()
    }

    // Add rotational force
    this.torque.vadd(torque, this.torque)
  }

  /**
   * Apply impulse to a point of the body. This could for example be a point on the Body surface.
   * An impulse is a force added to a body during a short period of time (impulse = force * time).
   * Impulses will be added to Body.velocity and Body.angularVelocity.
   * @param impulse The amount of impulse to add.
   * @param relativePoint A point relative to the center of mass to apply the force on.
   */
  applyImpulse(impulse: Vec3, relativePoint: Vec3 = new Vec3()): void {
    if (this.type !== Body.DYNAMIC) {
      return
    }

    if (this.sleepState === Body.SLEEPING) {
      this.wakeUp()
    }

    // Compute point position relative to the body center
    const r = relativePoint

    // Compute produced central impulse velocity
    const velo = Body_applyImpulse_velo
    velo.copy(impulse)
    velo.scale(this.invMass, velo)

    // Add linear impulse
    this.velocity.vadd(velo, this.velocity)

    // Compute produced rotational impulse velocity
    const rotVelo = Body_applyImpulse_rotVelo
    r.cross(impulse, rotVelo)

    /*
     rotVelo.x *= this.invInertia.x;
     rotVelo.y *= this.invInertia.y;
     rotVelo.z *= this.invInertia.z;
     */
    this.invInertiaWorld.vmult(rotVelo, rotVelo)

    // Add rotational Impulse
    this.angularVelocity.vadd(rotVelo, this.angularVelocity)
  }

  /**
   * Apply locally-defined impulse to a local point in the body.
   * @param force The force vector to apply, defined locally in the body frame.
   * @param localPoint A local point in the body to apply the force on.
   */
  applyLocalImpulse(localImpulse: Vec3, localPoint: Vec3 = new Vec3()): void {
    if (this.type !== Body.DYNAMIC) {
      return
    }

    const worldImpulse = Body_applyLocalImpulse_worldImpulse
    const relativePointWorld = Body_applyLocalImpulse_relativePoint

    // Transform the force vector to world space
    this.vectorToWorldFrame(localImpulse, worldImpulse)
    this.vectorToWorldFrame(localPoint, relativePointWorld)

    this.applyImpulse(worldImpulse, relativePointWorld)
  }

  /**
   * Should be called whenever you change the body shape or mass.
   */
  updateMassProperties(): void {
    const halfExtents = Body_updateMassProperties_halfExtents

    this.invMass = this.mass > 0 ? 1.0 / this.mass : 0
    const I = this.inertia
    const fixed = this.fixedRotation

    // Approximate with AABB box
    this.updateAABB()
    halfExtents.set(
      (this.aabb.upperBound.x - this.aabb.lowerBound.x) / 2,
      (this.aabb.upperBound.y - this.aabb.lowerBound.y) / 2,
      (this.aabb.upperBound.z - this.aabb.lowerBound.z) / 2
    )
    Box.calculateInertia(halfExtents, this.mass, I)

    this.invInertia.set(
      I.x > 0 && !fixed ? 1.0 / I.x : 0,
      I.y > 0 && !fixed ? 1.0 / I.y : 0,
      I.z > 0 && !fixed ? 1.0 / I.z : 0
    )
    this.updateInertiaWorld(true)
  }

  /**
   * Get world velocity of a point in the body.
   * @param worldPoint
   * @param result
   * @return The result vector.
   */
  getVelocityAtWorldPoint(worldPoint: Vec3, result: Vec3): Vec3 {
    const r = new Vec3()
    worldPoint.vsub(this.position, r)
    this.angularVelocity.cross(r, result)
    this.velocity.vadd(result, result)
    return result
  }

  /**
   * Move the body forward in time.
   * @param dt Time step
   * @param quatNormalize Set to true to normalize the body quaternion
   * @param quatNormalizeFast If the quaternion should be normalized using "fast" quaternion normalization
   */
  integrate(dt: number, quatNormalize: boolean, quatNormalizeFast: boolean): void {
    // Save previous position
    this.previousPosition.copy(this.position)
    this.previousQuaternion.copy(this.quaternion)

    if (!(this.type === Body.DYNAMIC || this.type === Body.KINEMATIC) || this.sleepState === Body.SLEEPING) {
      // Only for dynamic
      return
    }

    const velo = this.velocity
    const angularVelo = this.angularVelocity
    const pos = this.position
    const force = this.force
    const torque = this.torque
    const quat = this.quaternion
    const invMass = this.invMass
    const invInertia = this.invInertiaWorld
    const linearFactor = this.linearFactor

    const iMdt = invMass * dt
    velo.x += force.x * iMdt * linearFactor.x
    velo.y += force.y * iMdt * linearFactor.y
    velo.z += force.z * iMdt * linearFactor.z

    const e = invInertia.elements
    const angularFactor = this.angularFactor
    const tx = torque.x * angularFactor.x
    const ty = torque.y * angularFactor.y
    const tz = torque.z * angularFactor.z
    angularVelo.x += dt * (e[0] * tx + e[1] * ty + e[2] * tz)
    angularVelo.y += dt * (e[3] * tx + e[4] * ty + e[5] * tz)
    angularVelo.z += dt * (e[6] * tx + e[7] * ty + e[8] * tz)

    // Use new velocity  - leap frog
    pos.x += velo.x * dt
    pos.y += velo.y * dt
    pos.z += velo.z * dt

    quat.integrate(this.angularVelocity, dt, this.angularFactor, quat)

    if (quatNormalize) {
      if (quatNormalizeFast) {
        quat.normalizeFast()
      } else {
        quat.normalize()
      }
    }

    this.aabbNeedsUpdate = true

    // Update world inertia
    this.updateInertiaWorld()
  }
}

const tmpVec = new Vec3()
const tmpQuat = new Quaternion()

const updateAABB_shapeAABB = new AABB()

const uiw_m1 = new Mat3()
const uiw_m2 = new Mat3()
const uiw_m3 = new Mat3()

const Body_applyForce_rotForce = new Vec3()

const Body_applyLocalForce_worldForce = new Vec3()
const Body_applyLocalForce_relativePointWorld = new Vec3()

const Body_applyImpulse_velo = new Vec3()
const Body_applyImpulse_rotVelo = new Vec3()

const Body_applyLocalImpulse_worldImpulse = new Vec3()
const Body_applyLocalImpulse_relativePoint = new Vec3()

const Body_updateMassProperties_halfExtents = new Vec3()
