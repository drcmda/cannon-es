import { Mat3 } from '../math/Mat3'

/**
 * 3-dimensional vector
 * @class Vec3
 * @constructor
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 * @author schteppe
 * @example
 *     const v = new Vec3(1, 2, 3);
 *     console.log('x=' + v.x); // x=1
 */
export class Vec3 {
  x: number
  y: number
  z: number

  static ZERO: Vec3
  static UNIT_X: Vec3
  static UNIT_Y: Vec3
  static UNIT_Z: Vec3

  constructor(x = 0.0, y = 0.0, z = 0.0) {
    this.x = x
    this.y = y
    this.z = z
  }

  /**
   * Vector cross product
   * @method cross
   * @param {Vec3} vector
   * @param {Vec3} target Optional. Target to save in.
   * @return {Vec3}
   */
  cross(vector: Vec3, target = new Vec3()): Vec3 {
    const vx = vector.x
    const vy = vector.y
    const vz = vector.z
    const x = this.x
    const y = this.y
    const z = this.z

    target.x = y * vz - z * vy
    target.y = z * vx - x * vz
    target.z = x * vy - y * vx

    return target
  }

  /**
   * Set the vectors' 3 elements
   * @method set
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @return Vec3
   */
  set(x: number, y: number, z: number): Vec3 {
    this.x = x
    this.y = y
    this.z = z
    return this
  }

  /**
   * Set all components of the vector to zero.
   * @method setZero
   */
  setZero(): void {
    this.x = this.y = this.z = 0
  }

  /**
   * Vector addition
   * @method vadd
   * @param {Vec3} vector
   * @param {Vec3} target Optional.
   * @return {Vec3}
   */
  vadd(vector: Vec3): Vec3
  vadd(vector: Vec3, target: Vec3): void
  vadd(vector: Vec3, target?: Vec3): Vec3 | void {
    if (target) {
      target.x = vector.x + this.x
      target.y = vector.y + this.y
      target.z = vector.z + this.z
    } else {
      return new Vec3(this.x + vector.x, this.y + vector.y, this.z + vector.z)
    }
  }

  /**
   * Vector subtraction
   * @method vsub
   * @param {Vec3} vector
   * @param {Vec3} target Optional. Target to save in.
   * @return {Vec3}
   */
  vsub(vector: Vec3): Vec3
  vsub(vector: Vec3, target: Vec3): void
  vsub(vector: Vec3, target?: Vec3): Vec3 | void {
    if (target) {
      target.x = this.x - vector.x
      target.y = this.y - vector.y
      target.z = this.z - vector.z
    } else {
      return new Vec3(this.x - vector.x, this.y - vector.y, this.z - vector.z)
    }
  }

  /**
   * Get the cross product matrix a_cross from a vector, such that a x b = a_cross * b = c
   * @method crossmat
   * @see http://www8.cs.umu.se/kurser/TDBD24/VT06/lectures/Lecture6.pdf
   * @return {Mat3}
   */
  crossmat(): Mat3 {
    return new Mat3([0, -this.z, this.y, this.z, 0, -this.x, -this.y, this.x, 0])
  }

  /**
   * Normalize the vector. Note that this changes the values in the vector.
   * @method normalize
   * @return {Number} Returns the norm of the vector
   */
  normalize(): number {
    const x = this.x
    const y = this.y
    const z = this.z
    const n = Math.sqrt(x * x + y * y + z * z)
    if (n > 0.0) {
      const invN = 1 / n
      this.x *= invN
      this.y *= invN
      this.z *= invN
    } else {
      // Make something up
      this.x = 0
      this.y = 0
      this.z = 0
    }
    return n
  }

  /**
   * Get the version of this vector that is of length 1.
   * @method unit
   * @param {Vec3} target Optional target to save in
   * @return {Vec3} Returns the unit vector
   */
  unit(target = new Vec3()): Vec3 {
    const x = this.x
    const y = this.y
    const z = this.z
    let ninv = Math.sqrt(x * x + y * y + z * z)
    if (ninv > 0.0) {
      ninv = 1.0 / ninv
      target.x = x * ninv
      target.y = y * ninv
      target.z = z * ninv
    } else {
      target.x = 1
      target.y = 0
      target.z = 0
    }
    return target
  }

  /**
   * Get the length of the vector
   * @method length
   * @return {Number}
   */
  length(): number {
    const x = this.x
    const y = this.y
    const z = this.z
    return Math.sqrt(x * x + y * y + z * z)
  }

  /**
   * Get the squared length of the vector.
   * @method lengthSquared
   * @return {Number}
   */
  lengthSquared(): number {
    return this.dot(this)
  }

  /**
   * Get distance from this point to another point
   * @method distanceTo
   * @param  {Vec3} p
   * @return {Number}
   */
  distanceTo(p: Vec3): number {
    const x = this.x
    const y = this.y
    const z = this.z
    const px = p.x
    const py = p.y
    const pz = p.z
    return Math.sqrt((px - x) * (px - x) + (py - y) * (py - y) + (pz - z) * (pz - z))
  }

  /**
   * Get squared distance from this point to another point
   * @method distanceSquared
   * @param  {Vec3} p
   * @return {Number}
   */
  distanceSquared(p: Vec3): number {
    const x = this.x
    const y = this.y
    const z = this.z
    const px = p.x
    const py = p.y
    const pz = p.z
    return (px - x) * (px - x) + (py - y) * (py - y) + (pz - z) * (pz - z)
  }

  /**
   * Multiply all the components of the vector with a scalar.
   * @method scale
   * @param {Number} scalar
   * @param {Vec3} target The vector to save the result in.
   * @return {Vec3}
   */
  scale(scalar: number, target = new Vec3()): Vec3 {
    const x = this.x
    const y = this.y
    const z = this.z
    target.x = scalar * x
    target.y = scalar * y
    target.z = scalar * z
    return target
  }

  /**
   * Multiply the vector with an other vector, component-wise.
   * @method vmult
   * @param {Number} vector
   * @param {Vec3} target The vector to save the result in.
   * @return {Vec3}
   */
  vmul(vector: Vec3, target = new Vec3()): Vec3 {
    target.x = vector.x * this.x
    target.y = vector.y * this.y
    target.z = vector.z * this.z
    return target
  }

  /**
   * Scale a vector and add it to this vector. Save the result in "target". (target = this + vector * scalar)
   * @method addScaledVector
   * @param {Number} scalar
   * @param {Vec3} vector
   * @param {Vec3} target The vector to save the result in.
   * @return {Vec3}
   */
  addScaledVector(scalar: number, vector: Vec3, target = new Vec3()): Vec3 {
    target.x = this.x + scalar * vector.x
    target.y = this.y + scalar * vector.y
    target.z = this.z + scalar * vector.z
    return target
  }

  /**
   * Calculate dot product
   * @method dot
   * @param {Vec3} v
   * @return {Number}
   */
  dot(vector: Vec3): number {
    return this.x * vector.x + this.y * vector.y + this.z * vector.z
  }

  /**
   * @method isZero
   * @return bool
   */
  isZero(): boolean {
    return this.x === 0 && this.y === 0 && this.z === 0
  }

  /**
   * Make the vector point in the opposite direction.
   * @method negate
   * @param {Vec3} target Optional target to save in
   * @return {Vec3}
   */
  negate(target = new Vec3()): Vec3 {
    target.x = -this.x
    target.y = -this.y
    target.z = -this.z
    return target
  }

  /**
   * Compute two artificial tangents to the vector
   * @method tangents
   * @param {Vec3} t1 Vector object to save the first tangent in
   * @param {Vec3} t2 Vector object to save the second tangent in
   */
  tangents(t1: Vec3, t2: Vec3): void {
    const norm = this.length()
    if (norm > 0.0) {
      const n = Vec3_tangents_n
      const inorm = 1 / norm
      n.set(this.x * inorm, this.y * inorm, this.z * inorm)
      const randVec = Vec3_tangents_randVec
      if (Math.abs(n.x) < 0.9) {
        randVec.set(1, 0, 0)
        n.cross(randVec, t1)
      } else {
        randVec.set(0, 1, 0)
        n.cross(randVec, t1)
      }
      n.cross(t1, t2)
    } else {
      // The normal length is zero, make something up
      t1.set(1, 0, 0)
      t2.set(0, 1, 0)
    }
  }

  /**
   * Converts to a more readable format
   * @method toString
   * @return string
   */
  toString(): string {
    return `${this.x},${this.y},${this.z}`
  }

  /**
   * Converts to an array
   * @method toArray
   * @return Array
   */
  toArray(): [number, number, number] {
    return [this.x, this.y, this.z]
  }

  /**
   * Copies value of source to this vector.
   * @method copy
   * @param {Vec3} source
   * @return {Vec3} this
   */
  copy(vector: Vec3): Vec3 {
    this.x = vector.x
    this.y = vector.y
    this.z = vector.z
    return this
  }

  /**
   * Do a linear interpolation between two vectors
   * @method lerp
   * @param {Vec3} v
   * @param {Number} t A number between 0 and 1. 0 will make this function return u, and 1 will make it return v. Numbers in between will generate a vector in between them.
   * @param {Vec3} target
   */
  lerp(vector: Vec3, t: number, target: Vec3): void {
    const x = this.x
    const y = this.y
    const z = this.z
    target.x = x + (vector.x - x) * t
    target.y = y + (vector.y - y) * t
    target.z = z + (vector.z - z) * t
  }

  /**
   * Check if a vector equals is almost equal to another one.
   * @method almostEquals
   * @param {Vec3} v
   * @param {Number} precision
   * @return bool
   */
  almostEquals(vector: Vec3, precision = 1e-6): boolean {
    if (
      Math.abs(this.x - vector.x) > precision ||
      Math.abs(this.y - vector.y) > precision ||
      Math.abs(this.z - vector.z) > precision
    ) {
      return false
    }
    return true
  }

  /**
   * Check if a vector is almost zero
   * @method almostZero
   * @param {Number} precision
   */
  almostZero(precision = 1e-6): boolean {
    if (Math.abs(this.x) > precision || Math.abs(this.y) > precision || Math.abs(this.z) > precision) {
      return false
    }
    return true
  }

  /**
   * Check if the vector is anti-parallel to another vector.
   * @method isAntiparallelTo
   * @param  {Vec3}  v
   * @param  {Number}  precision Set to zero for exact comparisons
   * @return {Boolean}
   */
  isAntiparallelTo(vector: Vec3, precision?: number): boolean {
    this.negate(antip_neg)
    return antip_neg.almostEquals(vector, precision)
  }

  /**
   * Clone the vector
   * @method clone
   * @return {Vec3}
   */
  clone(): Vec3 {
    return new Vec3(this.x, this.y, this.z)
  }
}

Vec3.ZERO = new Vec3(0, 0, 0)
Vec3.UNIT_X = new Vec3(1, 0, 0)
Vec3.UNIT_Y = new Vec3(0, 1, 0)
Vec3.UNIT_Z = new Vec3(0, 0, 1)

/**
 * Compute two artificial tangents to the vector
 * @method tangents
 * @param {Vec3} t1 Vector object to save the first tangent in
 * @param {Vec3} t2 Vector object to save the second tangent in
 */
const Vec3_tangents_n = new Vec3()
const Vec3_tangents_randVec = new Vec3()

const antip_neg = new Vec3()
