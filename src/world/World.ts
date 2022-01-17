import { EventTarget } from '../utils/EventTarget'
import { GSSolver } from '../solver/GSSolver'
import { NaiveBroadphase } from '../collision/NaiveBroadphase'
import { Narrowphase } from '../world/Narrowphase'
import { Vec3 } from '../math/Vec3'
import { Material } from '../material/Material'
import { ContactMaterial } from '../material/ContactMaterial'
import { ArrayCollisionMatrix } from '../collision/ArrayCollisionMatrix'
import { OverlapKeeper } from '../collision/OverlapKeeper'
import { TupleDictionary } from '../utils/TupleDictionary'
import { RaycastResult } from '../collision/RaycastResult'
import { Ray } from '../collision/Ray'
import { AABB } from '../collision/AABB'
import { Body } from '../objects/Body'
import type { Broadphase } from '../collision/Broadphase'
import type { Solver } from '../solver/Solver'
import type { ContactEquation } from '../equations/ContactEquation'
import type { FrictionEquation } from '../equations/FrictionEquation'
import type { RayOptions, RaycastCallback } from '../collision/Ray'
import type { Constraint } from '../constraints/Constraint'
import type { Shape } from '../shapes/Shape'

export type WorldOptions = ConstructorParameters<typeof World>[0]

/**
 * The physics world
 */
export class World extends EventTarget {
  /**
   * Currently / last used timestep. Is set to -1 if not available. This value is updated before each internal step, which means that it is "fresh" inside event callbacks.
   */
  dt: number

  /**
   * Makes bodies go to sleep when they've been inactive.
   * @default false
   */
  allowSleep: boolean

  /**
   * All the current contacts (instances of ContactEquation) in the world.
   */
  contacts: ContactEquation[]

  frictionEquations: FrictionEquation[]

  /**
   * How often to normalize quaternions. Set to 0 for every step, 1 for every second etc.. A larger value increases performance. If bodies tend to explode, set to a smaller value (zero to be sure nothing can go wrong).
   * @default 0
   */
  quatNormalizeSkip: number

  /**
   * Set to true to use fast quaternion normalization. It is often enough accurate to use.
   * If bodies tend to explode, set to false.
   * @default false
   */
  quatNormalizeFast: boolean

  /**
   * The wall-clock time since simulation start.
   */
  time: number

  /**
   * Number of timesteps taken since start.
   */
  stepnumber: number

  /**
   * Default and last timestep sizes.
   */
  default_dt: number

  nextId: number

  /**
   * The gravity of the world.
   */
  gravity: Vec3

  /**
   * The broadphase algorithm to use.
   * @default NaiveBroadphase
   */
  broadphase: Broadphase

  /**
   * All bodies in this world
   */
  bodies: Body[]

  /**
   * True if any bodies are not sleeping, false if every body is sleeping.
   */
  hasActiveBodies: boolean

  /**
   * The solver algorithm to use.
   * @default GSSolver
   */
  solver: Solver
  constraints: Constraint[]
  narrowphase: Narrowphase

  /**
   * collisionMatrix
   */
  collisionMatrix: ArrayCollisionMatrix

  /**
   * CollisionMatrix from the previous step.
   */
  collisionMatrixPrevious: ArrayCollisionMatrix
  bodyOverlapKeeper: OverlapKeeper
  shapeOverlapKeeper: OverlapKeeper

  /**
   * All added materials.
   * @deprecated
   * @todo Remove
   */
  materials: Material[]
  /**
   * All added contactmaterials.
   */
  contactmaterials: ContactMaterial[]

  /**
   * Used to look up a ContactMaterial given two instances of Material.
   */
  contactMaterialTable: TupleDictionary
  /**
   * The default material of the bodies.
   */
  defaultMaterial: Material

  /**
   * This contact material is used if no suitable contactmaterial is found for a contact.
   */
  defaultContactMaterial: ContactMaterial
  doProfiling: boolean
  profile: {
    solve: number
    makeContactConstraints: number
    broadphase: number
    integrate: number
    narrowphase: number
  }

  /**
   * Time accumulator for interpolation.
   * @see https://gafferongames.com/game-physics/fix-your-timestep/
   */
  accumulator: number

  subsystems: any[]

  /**
   * Dispatched after a body has been added to the world.
   */
  addBodyEvent: { type: 'addBody'; body: Body | null }

  /**
   * Dispatched after a body has been removed from the world.
   */
  removeBodyEvent: { type: 'removeBody'; body: Body | null }

  idToBodyMap: { [id: number]: Body }

  lastCallTime?: number

  constructor(
    options: {
      /**
       * The gravity of the world.
       */
      gravity?: Vec3
      /**
       * Makes bodies go to sleep when they've been inactive.
       * @default false
       */
      allowSleep?: boolean
      /**
       * The broadphase algorithm to use.
       * @default NaiveBroadphase
       */
      broadphase?: Broadphase
      /**
       * The solver algorithm to use.
       * @default GSSolver
       */
      solver?: Solver
      /**
       * Set to true to use fast quaternion normalization. It is often enough accurate to use.
       * If bodies tend to explode, set to false.
       * @default false
       */
      quatNormalizeFast?: boolean
      /**
       * How often to normalize quaternions. Set to 0 for every step, 1 for every second etc.. A larger value increases performance. If bodies tend to explode, set to a smaller value (zero to be sure nothing can go wrong).
       * @default 0
       */
      quatNormalizeSkip?: number
    } = {}
  ) {
    super()

    this.dt = -1
    this.allowSleep = !!options.allowSleep
    this.contacts = []
    this.frictionEquations = []
    this.quatNormalizeSkip = options.quatNormalizeSkip !== undefined ? options.quatNormalizeSkip : 0
    this.quatNormalizeFast = options.quatNormalizeFast !== undefined ? options.quatNormalizeFast : false
    this.time = 0.0
    this.stepnumber = 0
    this.default_dt = 1 / 60
    this.nextId = 0
    this.gravity = new Vec3()

    if (options.gravity) {
      this.gravity.copy(options.gravity)
    }

    this.broadphase = options.broadphase !== undefined ? options.broadphase : new NaiveBroadphase()
    this.bodies = []
    this.hasActiveBodies = false
    this.solver = options.solver !== undefined ? options.solver : new GSSolver()
    this.constraints = []
    this.narrowphase = new Narrowphase(this)
    this.collisionMatrix = new ArrayCollisionMatrix()
    this.collisionMatrixPrevious = new ArrayCollisionMatrix()
    this.bodyOverlapKeeper = new OverlapKeeper()
    this.shapeOverlapKeeper = new OverlapKeeper()
    this.materials = []
    this.contactmaterials = []
    this.contactMaterialTable = new TupleDictionary()
    this.defaultMaterial = new Material('default')
    this.defaultContactMaterial = new ContactMaterial(this.defaultMaterial, this.defaultMaterial, {
      friction: 0.3,
      restitution: 0.0,
    })
    this.doProfiling = false
    this.profile = {
      solve: 0,
      makeContactConstraints: 0,
      broadphase: 0,
      integrate: 0,
      narrowphase: 0,
    }

    this.accumulator = 0
    this.subsystems = []
    this.addBodyEvent = { type: 'addBody', body: null }
    this.removeBodyEvent = { type: 'removeBody', body: null }
    this.idToBodyMap = {}
    this.broadphase.setWorld(this)
  }

  /**
   * Get the contact material between materials m1 and m2
   * @return The contact material if it was found.
   */
  getContactMaterial(m1: Material, m2: Material): ContactMaterial {
    return this.contactMaterialTable.get(m1.id, m2.id)
  }

  /**
   * Get number of objects in the world.
   * @deprecated
   */
  numObjects(): number {
    return this.bodies.length
  }

  /**
   * Store old collision state info
   */
  collisionMatrixTick(): void {
    const temp = this.collisionMatrixPrevious
    this.collisionMatrixPrevious = this.collisionMatrix
    this.collisionMatrix = temp
    this.collisionMatrix.reset()

    this.bodyOverlapKeeper.tick()
    this.shapeOverlapKeeper.tick()
  }

  /**
   * Add a constraint to the simulation.
   */
  addConstraint(c: Constraint): void {
    this.constraints.push(c)
  }

  /**
   * Removes a constraint
   */
  removeConstraint(c: Constraint): void {
    const idx = this.constraints.indexOf(c)
    if (idx !== -1) {
      this.constraints.splice(idx, 1)
    }
  }

  /**
   * Raycast test
   * @deprecated Use .raycastAll, .raycastClosest or .raycastAny instead.
   */
  rayTest(from: Vec3, to: Vec3, result: RaycastResult | RaycastCallback): void {
    if (result instanceof RaycastResult) {
      // Do raycastClosest
      this.raycastClosest(from, to, { skipBackfaces: true }, result)
    } else {
      // Do raycastAll
      this.raycastAll(from, to, { skipBackfaces: true }, result)
    }
  }

  /**
   * Ray cast against all bodies. The provided callback will be executed for each hit with a RaycastResult as single argument.
   * @return True if any body was hit.
   */
  raycastAll(from?: Vec3, to?: Vec3, options: RayOptions = {}, callback?: RaycastCallback): boolean {
    options.mode = Ray.ALL
    options.from = from
    options.to = to
    options.callback = callback
    return tmpRay.intersectWorld(this, options)
  }

  /**
   * Ray cast, and stop at the first result. Note that the order is random - but the method is fast.
   * @return True if any body was hit.
   */
  raycastAny(from?: Vec3, to?: Vec3, options: RayOptions = {}, result?: RaycastResult): boolean {
    options.mode = Ray.ANY
    options.from = from
    options.to = to
    options.result = result
    return tmpRay.intersectWorld(this, options)
  }

  /**
   * Ray cast, and return information of the closest hit.
   * @return True if any body was hit.
   */
  raycastClosest(from?: Vec3, to?: Vec3, options: RayOptions = {}, result?: RaycastResult): boolean {
    options.mode = Ray.CLOSEST
    options.from = from
    options.to = to
    options.result = result
    return tmpRay.intersectWorld(this, options)
  }

  /**
   * Add a rigid body to the simulation.
   * @todo If the simulation has not yet started, why recrete and copy arrays for each body? Accumulate in dynamic arrays in this case.
   * @todo Adding an array of bodies should be possible. This would save some loops too
   */
  addBody(body: Body): void {
    if (this.bodies.includes(body)) {
      return
    }
    body.index = this.bodies.length
    this.bodies.push(body)
    body.world = this
    body.initPosition.copy(body.position)
    body.initVelocity.copy(body.velocity)
    body.timeLastSleepy = this.time
    if (body instanceof Body) {
      body.initAngularVelocity.copy(body.angularVelocity)
      body.initQuaternion.copy(body.quaternion)
    }
    this.collisionMatrix.setNumObjects(this.bodies.length)
    this.addBodyEvent.body = body
    this.idToBodyMap[body.id] = body
    this.dispatchEvent(this.addBodyEvent)
  }

  /**
   * Remove a rigid body from the simulation.
   */
  removeBody(body: Body): void {
    body.world = null
    const n = this.bodies.length - 1
    const bodies = this.bodies
    const idx = bodies.indexOf(body)
    if (idx !== -1) {
      bodies.splice(idx, 1) // Todo: should use a garbage free method

      // Recompute index
      for (let i = 0; i !== bodies.length; i++) {
        bodies[i].index = i
      }

      this.collisionMatrix.setNumObjects(n)
      this.removeBodyEvent.body = body
      delete this.idToBodyMap[body.id]
      this.dispatchEvent(this.removeBodyEvent)
    }
  }

  getBodyById(id: number): Body {
    return this.idToBodyMap[id]
  }

  /**
   * @todo Make a faster map
   */
  getShapeById(id: number): Shape | null {
    const bodies = this.bodies
    for (let i = 0; i < bodies.length; i++) {
      const shapes = bodies[i].shapes
      for (let j = 0; j < shapes.length; j++) {
        const shape = shapes[j]
        if (shape.id === id) {
          return shape
        }
      }
    }

    return null
  }

  /**
   * Adds a material to the World.
   * @deprecated
   * @todo Remove
   */
  addMaterial(m: Material): void {
    this.materials.push(m)
  }

  /**
   * Adds a contact material to the World
   */
  addContactMaterial(cmat: ContactMaterial): void {
    // Add contact material
    this.contactmaterials.push(cmat)

    // Add current contact material to the material table
    this.contactMaterialTable.set(cmat.materials[0].id, cmat.materials[1].id, cmat)
  }

  /**
   * Step the simulation forward keeping track of last called time
   * to be able to step the world at a fixed rate, independently of framerate.
   *
   * @param dt The fixed time step size to use (default: 1 / 60).
   * @param maxSubSteps Maximum number of fixed steps to take per function call (default: 10).
   * @see https://gafferongames.com/post/fix_your_timestep/
   * @example
   *     // Run the simulation independently of framerate every 1 / 60 ms
   *     world.fixedStep()
   */
  fixedStep(dt = 1 / 60, maxSubSteps = 10): void {
    const time = performance.now() / 1000 // seconds
    if (!this.lastCallTime) {
      this.step(dt, undefined, maxSubSteps)
    } else {
      const timeSinceLastCalled = time - this.lastCallTime
      this.step(dt, timeSinceLastCalled, maxSubSteps)
    }
    this.lastCallTime = time
  }

  /**
   * Step the physics world forward in time.
   *
   * There are two modes. The simple mode is fixed timestepping without interpolation. In this case you only use the first argument. The second case uses interpolation. In that you also provide the time since the function was last used, as well as the maximum fixed timesteps to take.
   *
   * @param dt The fixed time step size to use.
   * @param timeSinceLastCalled The time elapsed since the function was last called.
   * @param maxSubSteps Maximum number of fixed steps to take per function call (default: 10).
   * @see https://web.archive.org/web/20180426154531/http://bulletphysics.org/mediawiki-1.5.8/index.php/Stepping_The_World#What_do_the_parameters_to_btDynamicsWorld::stepSimulation_mean.3F
   * @example
   *     // fixed timestepping without interpolation
   *     world.step(1 / 60)
   */
  step(dt: number, timeSinceLastCalled?: number, maxSubSteps = 10): void {
    if (timeSinceLastCalled === undefined) {
      // Fixed, simple stepping

      this.internalStep(dt)

      // Increment time
      this.time += dt
    } else {
      this.accumulator += timeSinceLastCalled

      const t0 = performance.now()
      let substeps = 0
      while (this.accumulator >= dt && substeps < maxSubSteps) {
        // Do fixed steps to catch up
        this.internalStep(dt)
        this.accumulator -= dt
        substeps++
        if (performance.now() - t0 > dt * 1000) {
          // The framerate is not interactive anymore.
          // We are below the target framerate.
          // Better bail out.
          break
        }
      }

      // Remove the excess accumulator, since we may not
      // have had enough substeps available to catch up
      this.accumulator = this.accumulator % dt

      const t = this.accumulator / dt
      for (let j = 0; j !== this.bodies.length; j++) {
        const b = this.bodies[j]
        b.previousPosition.lerp(b.position, t, b.interpolatedPosition)
        b.previousQuaternion.slerp(b.quaternion, t, b.interpolatedQuaternion)
        b.previousQuaternion.normalize()
      }
      this.time += timeSinceLastCalled
    }
  }

  internalStep(dt: number): void {
    this.dt = dt

    const world = this
    const that = this
    const contacts = this.contacts
    const p1 = World_step_p1
    const p2 = World_step_p2
    const N = this.numObjects()
    const bodies = this.bodies
    const solver = this.solver
    const gravity = this.gravity
    const doProfiling = this.doProfiling
    const profile = this.profile
    const DYNAMIC = Body.DYNAMIC
    let profilingStart = -Infinity
    const constraints = this.constraints
    const frictionEquationPool = World_step_frictionEquationPool
    const gnorm = gravity.length()
    const gx = gravity.x
    const gy = gravity.y
    const gz = gravity.z
    let i = 0

    if (doProfiling) {
      profilingStart = performance.now()
    }

    // Add gravity to all objects
    for (i = 0; i !== N; i++) {
      const bi = bodies[i]
      if (bi.type === DYNAMIC) {
        // Only for dynamic bodies
        const f = bi.force

        const m = bi.mass
        f.x += m * gx
        f.y += m * gy
        f.z += m * gz
      }
    }

    // Update subsystems
    for (let i = 0, Nsubsystems = this.subsystems.length; i !== Nsubsystems; i++) {
      this.subsystems[i].update()
    }

    // Collision detection
    if (doProfiling) {
      profilingStart = performance.now()
    }
    p1.length = 0 // Clean up pair arrays from last step
    p2.length = 0
    this.broadphase.collisionPairs(this, p1, p2)
    if (doProfiling) {
      profile.broadphase = performance.now() - profilingStart
    }

    // Remove constrained pairs with collideConnected == false
    let Nconstraints = constraints.length
    for (i = 0; i !== Nconstraints; i++) {
      const c = constraints[i]
      if (!c.collideConnected) {
        for (let j = p1.length - 1; j >= 0; j -= 1) {
          if ((c.bodyA === p1[j] && c.bodyB === p2[j]) || (c.bodyB === p1[j] && c.bodyA === p2[j])) {
            p1.splice(j, 1)
            p2.splice(j, 1)
          }
        }
      }
    }

    this.collisionMatrixTick()

    // Generate contacts
    if (doProfiling) {
      profilingStart = performance.now()
    }
    const oldcontacts = World_step_oldContacts
    const NoldContacts = contacts.length

    for (i = 0; i !== NoldContacts; i++) {
      oldcontacts.push(contacts[i])
    }
    contacts.length = 0

    // Transfer FrictionEquation from current list to the pool for reuse
    const NoldFrictionEquations = this.frictionEquations.length
    for (i = 0; i !== NoldFrictionEquations; i++) {
      frictionEquationPool.push(this.frictionEquations[i])
    }
    this.frictionEquations.length = 0

    this.narrowphase.getContacts(
      p1,
      p2,
      this,
      contacts,
      oldcontacts, // To be reused
      this.frictionEquations,
      frictionEquationPool
    )

    if (doProfiling) {
      profile.narrowphase = performance.now() - profilingStart
    }

    // Loop over all collisions
    if (doProfiling) {
      profilingStart = performance.now()
    }

    // Add all friction eqs
    for (i = 0; i < this.frictionEquations.length; i++) {
      solver.addEquation(this.frictionEquations[i])
    }

    const ncontacts = contacts.length
    for (let k = 0; k !== ncontacts; k++) {
      // Current contact
      const c = contacts[k]

      // Get current collision indeces
      const bi = c.bi

      const bj = c.bj
      const si = c.si
      const sj = c.sj

      // Get collision properties
      let cm
      if (bi.material && bj.material) {
        cm = this.getContactMaterial(bi.material, bj.material) || this.defaultContactMaterial
      } else {
        cm = this.defaultContactMaterial
      }

      // c.enabled = bi.collisionResponse && bj.collisionResponse && si.collisionResponse && sj.collisionResponse;

      let mu = cm.friction
      // c.restitution = cm.restitution;

      // If friction or restitution were specified in the material, use them
      if (bi.material && bj.material) {
        if (bi.material.friction >= 0 && bj.material.friction >= 0) {
          mu = bi.material.friction * bj.material.friction
        }

        if (bi.material.restitution >= 0 && bj.material.restitution >= 0) {
          c.restitution = bi.material.restitution * bj.material.restitution
        }
      }

      // c.setSpookParams(
      //           cm.contactEquationStiffness,
      //           cm.contactEquationRelaxation,
      //           dt
      //       );

      solver.addEquation(c)

      // // Add friction constraint equation
      // if(mu > 0){

      // 	// Create 2 tangent equations
      // 	const mug = mu * gnorm;
      // 	const reducedMass = (bi.invMass + bj.invMass);
      // 	if(reducedMass > 0){
      // 		reducedMass = 1/reducedMass;
      // 	}
      // 	const pool = frictionEquationPool;
      // 	const c1 = pool.length ? pool.pop() : new FrictionEquation(bi,bj,mug*reducedMass);
      // 	const c2 = pool.length ? pool.pop() : new FrictionEquation(bi,bj,mug*reducedMass);
      // 	this.frictionEquations.push(c1, c2);

      // 	c1.bi = c2.bi = bi;
      // 	c1.bj = c2.bj = bj;
      // 	c1.minForce = c2.minForce = -mug*reducedMass;
      // 	c1.maxForce = c2.maxForce = mug*reducedMass;

      // 	// Copy over the relative vectors
      // 	c1.ri.copy(c.ri);
      // 	c1.rj.copy(c.rj);
      // 	c2.ri.copy(c.ri);
      // 	c2.rj.copy(c.rj);

      // 	// Construct tangents
      // 	c.ni.tangents(c1.t, c2.t);

      //           // Set spook params
      //           c1.setSpookParams(cm.frictionEquationStiffness, cm.frictionEquationRelaxation, dt);
      //           c2.setSpookParams(cm.frictionEquationStiffness, cm.frictionEquationRelaxation, dt);

      //           c1.enabled = c2.enabled = c.enabled;

      // 	// Add equations to solver
      // 	solver.addEquation(c1);
      // 	solver.addEquation(c2);
      // }

      if (
        bi.allowSleep &&
        bi.type === Body.DYNAMIC &&
        bi.sleepState === Body.SLEEPING &&
        bj.sleepState === Body.AWAKE &&
        bj.type !== Body.STATIC
      ) {
        const speedSquaredB = bj.velocity.lengthSquared() + bj.angularVelocity.lengthSquared()
        const speedLimitSquaredB = bj.sleepSpeedLimit ** 2
        if (speedSquaredB >= speedLimitSquaredB * 2) {
          bi.wakeUpAfterNarrowphase = true
        }
      }

      if (
        bj.allowSleep &&
        bj.type === Body.DYNAMIC &&
        bj.sleepState === Body.SLEEPING &&
        bi.sleepState === Body.AWAKE &&
        bi.type !== Body.STATIC
      ) {
        const speedSquaredA = bi.velocity.lengthSquared() + bi.angularVelocity.lengthSquared()
        const speedLimitSquaredA = bi.sleepSpeedLimit ** 2
        if (speedSquaredA >= speedLimitSquaredA * 2) {
          bj.wakeUpAfterNarrowphase = true
        }
      }

      // Now we know that i and j are in contact. Set collision matrix state
      this.collisionMatrix.set(bi, bj, true)

      if (!this.collisionMatrixPrevious.get(bi, bj)) {
        // First contact!
        // We reuse the collideEvent object, otherwise we will end up creating new objects for each new contact, even if there's no event listener attached.
        World_step_collideEvent.body = bj
        World_step_collideEvent.contact = c
        bi.dispatchEvent(World_step_collideEvent)

        World_step_collideEvent.body = bi
        bj.dispatchEvent(World_step_collideEvent)
      }

      this.bodyOverlapKeeper.set(bi.id, bj.id)
      this.shapeOverlapKeeper.set(si.id, sj.id)
    }

    this.emitContactEvents()

    if (doProfiling) {
      profile.makeContactConstraints = performance.now() - profilingStart
      profilingStart = performance.now()
    }

    // Wake up bodies
    for (i = 0; i !== N; i++) {
      const bi = bodies[i]
      if (bi.wakeUpAfterNarrowphase) {
        bi.wakeUp()
        bi.wakeUpAfterNarrowphase = false
      }
    }

    // Add user-added constraints
    Nconstraints = constraints.length
    for (i = 0; i !== Nconstraints; i++) {
      const c = constraints[i]
      c.update()
      for (let j = 0, Neq = c.equations.length; j !== Neq; j++) {
        const eq = c.equations[j]
        solver.addEquation(eq)
      }
    }

    // Solve the constrained system
    solver.solve(dt, this)

    if (doProfiling) {
      profile.solve = performance.now() - profilingStart
    }

    // Remove all contacts from solver
    solver.removeAllEquations()

    // Apply damping, see http://code.google.com/p/bullet/issues/detail?id=74 for details
    const pow = Math.pow
    for (i = 0; i !== N; i++) {
      const bi = bodies[i]
      if (bi.type & DYNAMIC) {
        // Only for dynamic bodies
        const ld = pow(1.0 - bi.linearDamping, dt)
        const v = bi.velocity
        v.scale(ld, v)
        const av = bi.angularVelocity
        if (av) {
          const ad = pow(1.0 - bi.angularDamping, dt)
          av.scale(ad, av)
        }
      }
    }

    this.dispatchEvent(World_step_preStepEvent)

    // Leap frog
    // vnew = v + h*f/m
    // xnew = x + h*vnew
    if (doProfiling) {
      profilingStart = performance.now()
    }
    const stepnumber = this.stepnumber
    const quatNormalize = stepnumber % (this.quatNormalizeSkip + 1) === 0
    const quatNormalizeFast = this.quatNormalizeFast

    for (i = 0; i !== N; i++) {
      bodies[i].integrate(dt, quatNormalize, quatNormalizeFast)
    }
    this.clearForces()

    this.broadphase.dirty = true

    if (doProfiling) {
      profile.integrate = performance.now() - profilingStart
    }

    // Update step number
    this.stepnumber += 1

    this.dispatchEvent(World_step_postStepEvent)

    // Sleeping update
    let hasActiveBodies = true
    if (this.allowSleep) {
      hasActiveBodies = false
      for (i = 0; i !== N; i++) {
        const bi = bodies[i]
        bi.sleepTick(this.time)

        if (bi.sleepState !== Body.SLEEPING) {
          hasActiveBodies = true
        }
      }
    }
    this.hasActiveBodies = hasActiveBodies
  }

  emitContactEvents(): void {
    const hasBeginContact = this.hasAnyEventListener('beginContact')
    const hasEndContact = this.hasAnyEventListener('endContact')

    if (hasBeginContact || hasEndContact) {
      this.bodyOverlapKeeper.getDiff(additions, removals)
    }

    if (hasBeginContact) {
      for (let i = 0, l = additions.length; i < l; i += 2) {
        beginContactEvent.bodyA = this.getBodyById(additions[i])
        beginContactEvent.bodyB = this.getBodyById(additions[i + 1])
        this.dispatchEvent(beginContactEvent)
      }
      beginContactEvent.bodyA = beginContactEvent.bodyB = null
    }

    if (hasEndContact) {
      for (let i = 0, l = removals.length; i < l; i += 2) {
        endContactEvent.bodyA = this.getBodyById(removals[i])
        endContactEvent.bodyB = this.getBodyById(removals[i + 1])
        this.dispatchEvent(endContactEvent)
      }
      endContactEvent.bodyA = endContactEvent.bodyB = null
    }

    additions.length = removals.length = 0

    const hasBeginShapeContact = this.hasAnyEventListener('beginShapeContact')
    const hasEndShapeContact = this.hasAnyEventListener('endShapeContact')

    if (hasBeginShapeContact || hasEndShapeContact) {
      this.shapeOverlapKeeper.getDiff(additions, removals)
    }

    if (hasBeginShapeContact) {
      for (let i = 0, l = additions.length; i < l; i += 2) {
        const shapeA = this.getShapeById(additions[i])
        const shapeB = this.getShapeById(additions[i + 1])
        beginShapeContactEvent.shapeA = shapeA
        beginShapeContactEvent.shapeB = shapeB
        if (shapeA) beginShapeContactEvent.bodyA = shapeA.body
        if (shapeB) beginShapeContactEvent.bodyB = shapeB.body
        this.dispatchEvent(beginShapeContactEvent)
      }
      beginShapeContactEvent.bodyA =
        beginShapeContactEvent.bodyB =
        beginShapeContactEvent.shapeA =
        beginShapeContactEvent.shapeB =
          null
    }

    if (hasEndShapeContact) {
      for (let i = 0, l = removals.length; i < l; i += 2) {
        const shapeA = this.getShapeById(removals[i])
        const shapeB = this.getShapeById(removals[i + 1])
        endShapeContactEvent.shapeA = shapeA
        endShapeContactEvent.shapeB = shapeB
        if (shapeA) endShapeContactEvent.bodyA = shapeA.body
        if (shapeB) endShapeContactEvent.bodyB = shapeB.body
        this.dispatchEvent(endShapeContactEvent)
      }
      endShapeContactEvent.bodyA =
        endShapeContactEvent.bodyB =
        endShapeContactEvent.shapeA =
        endShapeContactEvent.shapeB =
          null
    }
  }

  /**
   * Sets all body forces in the world to zero.
   */
  clearForces(): void {
    const bodies = this.bodies
    const N = bodies.length
    for (let i = 0; i !== N; i++) {
      const b = bodies[i]
      const force = b.force
      const tau = b.torque

      b.force.set(0, 0, 0)
      b.torque.set(0, 0, 0)
    }
  }
}

// Temp stuff
const tmpAABB1 = new AABB()
const tmpArray1 = []
const tmpRay = new Ray()

// performance.now() fallback on Date.now()
const performance = (globalThis.performance || {}) as Performance

if (!performance.now) {
  let nowOffset = Date.now()
  if (performance.timing && performance.timing.navigationStart) {
    nowOffset = performance.timing.navigationStart
  }
  performance.now = () => Date.now() - nowOffset
}

const step_tmp1 = new Vec3()

// Dispatched after the world has stepped forward in time.
// Reusable event objects to save memory.
const World_step_postStepEvent = { type: 'postStep' }

// Dispatched before the world steps forward in time.
const World_step_preStepEvent = { type: 'preStep' }

const World_step_collideEvent: {
  type: typeof Body.COLLIDE_EVENT_NAME
  body: Body | null
  contact: ContactEquation | null
} = { type: Body.COLLIDE_EVENT_NAME, body: null, contact: null }

// Pools for unused objects
const World_step_oldContacts: ContactEquation[] = []
const World_step_frictionEquationPool: FrictionEquation[] = []

// Reusable arrays for collision pairs
const World_step_p1: Body[] = []
const World_step_p2: Body[] = []

// Stuff for emitContactEvents
const additions: number[] = []
const removals: number[] = []
type ContactEvent = {
  type: string
  bodyA: Body | null
  bodyB: Body | null
}
const beginContactEvent: ContactEvent = {
  type: 'beginContact',
  bodyA: null,
  bodyB: null,
}
const endContactEvent: ContactEvent = {
  type: 'endContact',
  bodyA: null,
  bodyB: null,
}
type ShapeContactEvent = {
  type: string
  bodyA: Body | null
  bodyB: Body | null
  shapeA: Shape | null
  shapeB: Shape | null
}
const beginShapeContactEvent: ShapeContactEvent = {
  type: 'beginShapeContact',
  bodyA: null,
  bodyB: null,
  shapeA: null,
  shapeB: null,
}
const endShapeContactEvent: ShapeContactEvent = {
  type: 'endShapeContact',
  bodyA: null,
  bodyB: null,
  shapeA: null,
  shapeB: null,
}
