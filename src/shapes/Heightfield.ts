import { Shape } from '../shapes/Shape'
import { ConvexPolyhedron } from '../shapes/ConvexPolyhedron'
import { Vec3 } from '../math/Vec3'
import { Utils } from '../utils/Utils'
import type { AABB } from '../collision/AABB'
import type { Quaternion } from '../math/Quaternion'

export type HeightfieldOptions = {
  maxValue?: number | null
  minValue?: number | null
  elementSize?: number
}

type HeightfieldPillar = {
  convex: any
  offset: any
}

/**
 * Heightfield shape class. Height data is given as an array. These data points are spread out evenly with a given distance.
 * @class Heightfield
 * @extends Shape
 * @constructor
 * @param {Array} data An array of Y values that will be used to construct the terrain.
 * @param {object} options
 * @param {Number} [options.minValue] Minimum value of the data points in the data array. Will be computed automatically if not given.
 * @param {Number} [options.maxValue] Maximum value.
 * @param {Number} [options.elementSize=0.1] World spacing between the data points in X direction.
 * @todo Should be possible to use along all axes, not just y
 * @todo should be possible to scale along all axes
 * @todo Refactor elementSize to elementSizeX and elementSizeY
 *
 * @example
 *     // Generate some height data (y-values).
 *     const data = [];
 *     for(let i = 0; i < 1000; i++){
 *         const y = 0.5 * Math.cos(0.2 * i);
 *         data.push(y);
 *     }
 *
 *     // Create the heightfield shape
 *     const heightfieldShape = new Heightfield(data, {
 *         elementSize: 1 // Distance between the data points in X and Y directions
 *     });
 *     const heightfieldBody = new Body();
 *     heightfieldBody.addShape(heightfieldShape);
 *     world.addBody(heightfieldBody);
 */
export class Heightfield extends Shape {
  data: number[][] // An array of numbers, or height values, that are spread out along the x axis.
  maxValue: number | null // Max value of the data.
  minValue: number | null // Max value of the data.
  elementSize: number // The width of each element. To do: elementSizeX and Y
  cacheEnabled: boolean
  pillarConvex: ConvexPolyhedron
  pillarOffset: Vec3

  private _cachedPillars: { [key: string]: HeightfieldPillar }

  constructor(data: number[][], options: HeightfieldOptions = {}) {
    options = Utils.defaults(options, {
      maxValue: null,
      minValue: null,
      elementSize: 1,
    })

    super({ type: Shape.types.HEIGHTFIELD })

    this.data = data
    this.maxValue = options.maxValue!
    this.minValue = options.minValue!
    this.elementSize = options.elementSize!

    if (options.minValue === null) {
      this.updateMinValue()
    }

    if (options.maxValue === null) {
      this.updateMaxValue()
    }

    this.cacheEnabled = true

    this.pillarConvex = new ConvexPolyhedron()
    this.pillarOffset = new Vec3()

    this.updateBoundingSphereRadius()

    // "i_j_isUpper" => { convex: ..., offset: ... }
    // for example:
    // _cachedPillars["0_2_1"]
    this._cachedPillars = {}
  }

  /**
   * Call whenever you change the data array.
   * @method update
   */
  update(): void {
    this._cachedPillars = {}
  }

  /**
   * Update the .minValue property
   * @method updateMinValue
   */
  updateMinValue(): void {
    const data = this.data
    let minValue = data[0][0]
    for (let i = 0; i !== data.length; i++) {
      for (let j = 0; j !== data[i].length; j++) {
        const v = data[i][j]
        if (v < minValue) {
          minValue = v
        }
      }
    }
    this.minValue = minValue
  }

  /**
   * Update the .maxValue property
   * @method updateMaxValue
   */
  updateMaxValue(): void {
    const data = this.data
    let maxValue = data[0][0]
    for (let i = 0; i !== data.length; i++) {
      for (let j = 0; j !== data[i].length; j++) {
        const v = data[i][j]
        if (v > maxValue) {
          maxValue = v
        }
      }
    }
    this.maxValue = maxValue
  }

  /**
   * Set the height value at an index. Don't forget to update maxValue and minValue after you're done.
   * @method setHeightValueAtIndex
   * @param {integer} xi
   * @param {integer} yi
   * @param {number} value
   */
  setHeightValueAtIndex(xi: number, yi: number, value: number): void {
    const data = this.data
    data[xi][yi] = value

    // Invalidate cache
    this.clearCachedConvexTrianglePillar(xi, yi, false)
    if (xi > 0) {
      this.clearCachedConvexTrianglePillar(xi - 1, yi, true)
      this.clearCachedConvexTrianglePillar(xi - 1, yi, false)
    }
    if (yi > 0) {
      this.clearCachedConvexTrianglePillar(xi, yi - 1, true)
      this.clearCachedConvexTrianglePillar(xi, yi - 1, false)
    }
    if (yi > 0 && xi > 0) {
      this.clearCachedConvexTrianglePillar(xi - 1, yi - 1, true)
    }
  }

  /**
   * Get max/min in a rectangle in the matrix data
   * @method getRectMinMax
   * @param  {integer} iMinX
   * @param  {integer} iMinY
   * @param  {integer} iMaxX
   * @param  {integer} iMaxY
   * @param  {array} [result] An array to store the results in.
   * @return {array} The result array, if it was passed in. Minimum will be at position 0 and max at 1.
   */
  getRectMinMax(iMinX: number, iMinY: number, iMaxX: number, iMaxY: number, result: number[] = []): void {
    // Get max and min of the data
    const data = this.data // Set first value

    let max = this.minValue!
    for (let i = iMinX; i <= iMaxX; i++) {
      for (let j = iMinY; j <= iMaxY; j++) {
        const height = data[i][j]
        if (height > max) {
          max = height
        }
      }
    }

    result[0] = this.minValue!
    result[1] = max
  }

  /**
   * Get the index of a local position on the heightfield. The indexes indicate the rectangles, so if your terrain is made of N x N height data points, you will have rectangle indexes ranging from 0 to N-1.
   * @method getIndexOfPosition
   * @param  {number} x
   * @param  {number} y
   * @param  {array} result Two-element array
   * @param  {boolean} clamp If the position should be clamped to the heightfield edge.
   * @return {boolean}
   */
  getIndexOfPosition(x: number, y: number, result: number[], clamp: boolean): boolean {
    // Get the index of the data points to test against
    const w = this.elementSize
    const data = this.data
    let xi = Math.floor(x / w)
    let yi = Math.floor(y / w)

    result[0] = xi
    result[1] = yi

    if (clamp) {
      // Clamp index to edges
      if (xi < 0) {
        xi = 0
      }
      if (yi < 0) {
        yi = 0
      }
      if (xi >= data.length - 1) {
        xi = data.length - 1
      }
      if (yi >= data[0].length - 1) {
        yi = data[0].length - 1
      }
    }

    // Bail out if we are out of the terrain
    if (xi < 0 || yi < 0 || xi >= data.length - 1 || yi >= data[0].length - 1) {
      return false
    }

    return true
  }

  getTriangleAt(x: number, y: number, edgeClamp: boolean, a: Vec3, b: Vec3, c: Vec3): boolean {
    const idx = getHeightAt_idx
    this.getIndexOfPosition(x, y, idx, edgeClamp)
    let xi = idx[0]
    let yi = idx[1]

    const data = this.data
    if (edgeClamp) {
      xi = Math.min(data.length - 2, Math.max(0, xi))
      yi = Math.min(data[0].length - 2, Math.max(0, yi))
    }

    const elementSize = this.elementSize
    const lowerDist2 = (x / elementSize - xi) ** 2 + (y / elementSize - yi) ** 2
    const upperDist2 = (x / elementSize - (xi + 1)) ** 2 + (y / elementSize - (yi + 1)) ** 2
    const upper = lowerDist2 > upperDist2
    this.getTriangle(xi, yi, upper, a, b, c)
    return upper
  }

  getNormalAt(x: number, y: number, edgeClamp: boolean, result: Vec3): void {
    const a = getNormalAt_a
    const b = getNormalAt_b
    const c = getNormalAt_c
    const e0 = getNormalAt_e0
    const e1 = getNormalAt_e1
    this.getTriangleAt(x, y, edgeClamp, a, b, c)
    b.vsub(a, e0)
    c.vsub(a, e1)
    e0.cross(e1, result)
    result.normalize()
  }

  /**
   * Get an AABB of a square in the heightfield
   * @param  {number} xi
   * @param  {number} yi
   * @param  {AABB} result
   */
  getAabbAtIndex(xi: number, yi: number, { lowerBound, upperBound }: AABB): void {
    const data = this.data
    const elementSize = this.elementSize

    lowerBound.set(xi * elementSize, yi * elementSize, data[xi][yi])
    upperBound.set((xi + 1) * elementSize, (yi + 1) * elementSize, data[xi + 1][yi + 1])
  }

  /**
   * Get the height in the heightfield at a given position
   * @param  {number} x
   * @param  {number} y
   * @param  {boolean} edgeClamp
   * @return {number}
   */
  getHeightAt(x: number, y: number, edgeClamp: boolean): number {
    const data = this.data
    const a = getHeightAt_a
    const b = getHeightAt_b
    const c = getHeightAt_c
    const idx = getHeightAt_idx

    this.getIndexOfPosition(x, y, idx, edgeClamp)
    let xi = idx[0]
    let yi = idx[1]
    if (edgeClamp) {
      xi = Math.min(data.length - 2, Math.max(0, xi))
      yi = Math.min(data[0].length - 2, Math.max(0, yi))
    }
    const upper = this.getTriangleAt(x, y, edgeClamp, a, b, c)
    barycentricWeights(x, y, a.x, a.y, b.x, b.y, c.x, c.y, getHeightAt_weights)

    const w = getHeightAt_weights

    if (upper) {
      // Top triangle verts
      return data[xi + 1][yi + 1] * w.x + data[xi][yi + 1] * w.y + data[xi + 1][yi] * w.z
    } else {
      // Top triangle verts
      return data[xi][yi] * w.x + data[xi + 1][yi] * w.y + data[xi][yi + 1] * w.z
    }
  }

  static getCacheConvexTrianglePillarKey(xi: number, yi: number, getUpperTriangle: boolean): string {
    return `${xi}_${yi}_${getUpperTriangle ? 1 : 0}`
  }

  getCachedConvexTrianglePillar(xi: number, yi: number, getUpperTriangle: boolean): HeightfieldPillar {
    return this._cachedPillars[Heightfield.getCacheConvexTrianglePillarKey(xi, yi, getUpperTriangle)]
  }

  setCachedConvexTrianglePillar(
    xi: number,
    yi: number,
    getUpperTriangle: boolean,
    convex: ConvexPolyhedron,
    offset: Vec3
  ): void {
    this._cachedPillars[Heightfield.getCacheConvexTrianglePillarKey(xi, yi, getUpperTriangle)] = {
      convex,
      offset,
    }
  }

  clearCachedConvexTrianglePillar(xi: number, yi: number, getUpperTriangle: boolean): void {
    delete this._cachedPillars[Heightfield.getCacheConvexTrianglePillarKey(xi, yi, getUpperTriangle)]
  }

  /**
   * Get a triangle from the heightfield
   * @param  {number} xi
   * @param  {number} yi
   * @param  {boolean} upper
   * @param  {Vec3} a
   * @param  {Vec3} b
   * @param  {Vec3} c
   */
  getTriangle(xi: number, yi: number, upper: boolean, a: Vec3, b: Vec3, c: Vec3): void {
    const data = this.data
    const elementSize = this.elementSize

    if (upper) {
      // Top triangle verts
      a.set((xi + 1) * elementSize, (yi + 1) * elementSize, data[xi + 1][yi + 1])
      b.set(xi * elementSize, (yi + 1) * elementSize, data[xi][yi + 1])
      c.set((xi + 1) * elementSize, yi * elementSize, data[xi + 1][yi])
    } else {
      // Top triangle verts
      a.set(xi * elementSize, yi * elementSize, data[xi][yi])
      b.set((xi + 1) * elementSize, yi * elementSize, data[xi + 1][yi])
      c.set(xi * elementSize, (yi + 1) * elementSize, data[xi][yi + 1])
    }
  }

  /**
   * Get a triangle in the terrain in the form of a triangular convex shape.
   * @method getConvexTrianglePillar
   * @param  {integer} i
   * @param  {integer} j
   * @param  {boolean} getUpperTriangle
   */
  getConvexTrianglePillar(xi: number, yi: number, getUpperTriangle: boolean): void {
    let result = this.pillarConvex
    let offsetResult = this.pillarOffset

    if (this.cacheEnabled) {
      const data = this.getCachedConvexTrianglePillar(xi, yi, getUpperTriangle)
      if (data) {
        this.pillarConvex = data.convex
        this.pillarOffset = data.offset
        return
      }

      result = new ConvexPolyhedron()
      offsetResult = new Vec3()

      this.pillarConvex = result
      this.pillarOffset = offsetResult
    }

    const data = this.data
    const elementSize = this.elementSize
    const faces = result.faces

    // Reuse verts if possible
    result.vertices.length = 6
    for (let i = 0; i < 6; i++) {
      if (!result.vertices[i]) {
        result.vertices[i] = new Vec3()
      }
    }

    // Reuse faces if possible
    faces.length = 5
    for (let i = 0; i < 5; i++) {
      if (!faces[i]) {
        faces[i] = []
      }
    }

    const verts = result.vertices

    const h =
      (Math.min(data[xi][yi], data[xi + 1][yi], data[xi][yi + 1], data[xi + 1][yi + 1]) - this.minValue!) / 2 +
      this.minValue!

    if (!getUpperTriangle) {
      // Center of the triangle pillar - all polygons are given relative to this one
      offsetResult.set(
        (xi + 0.25) * elementSize, // sort of center of a triangle
        (yi + 0.25) * elementSize,
        h // vertical center
      )

      // Top triangle verts
      verts[0].set(-0.25 * elementSize, -0.25 * elementSize, data[xi][yi] - h)
      verts[1].set(0.75 * elementSize, -0.25 * elementSize, data[xi + 1][yi] - h)
      verts[2].set(-0.25 * elementSize, 0.75 * elementSize, data[xi][yi + 1] - h)

      // bottom triangle verts
      verts[3].set(-0.25 * elementSize, -0.25 * elementSize, -Math.abs(h) - 1)
      verts[4].set(0.75 * elementSize, -0.25 * elementSize, -Math.abs(h) - 1)
      verts[5].set(-0.25 * elementSize, 0.75 * elementSize, -Math.abs(h) - 1)

      // top triangle
      faces[0][0] = 0
      faces[0][1] = 1
      faces[0][2] = 2

      // bottom triangle
      faces[1][0] = 5
      faces[1][1] = 4
      faces[1][2] = 3

      // -x facing quad
      faces[2][0] = 0
      faces[2][1] = 2
      faces[2][2] = 5
      faces[2][3] = 3

      // -y facing quad
      faces[3][0] = 1
      faces[3][1] = 0
      faces[3][2] = 3
      faces[3][3] = 4

      // +xy facing quad
      faces[4][0] = 4
      faces[4][1] = 5
      faces[4][2] = 2
      faces[4][3] = 1
    } else {
      // Center of the triangle pillar - all polygons are given relative to this one
      offsetResult.set(
        (xi + 0.75) * elementSize, // sort of center of a triangle
        (yi + 0.75) * elementSize,
        h // vertical center
      )

      // Top triangle verts
      verts[0].set(0.25 * elementSize, 0.25 * elementSize, data[xi + 1][yi + 1] - h)
      verts[1].set(-0.75 * elementSize, 0.25 * elementSize, data[xi][yi + 1] - h)
      verts[2].set(0.25 * elementSize, -0.75 * elementSize, data[xi + 1][yi] - h)

      // bottom triangle verts
      verts[3].set(0.25 * elementSize, 0.25 * elementSize, -Math.abs(h) - 1)
      verts[4].set(-0.75 * elementSize, 0.25 * elementSize, -Math.abs(h) - 1)
      verts[5].set(0.25 * elementSize, -0.75 * elementSize, -Math.abs(h) - 1)

      // Top triangle
      faces[0][0] = 0
      faces[0][1] = 1
      faces[0][2] = 2

      // bottom triangle
      faces[1][0] = 5
      faces[1][1] = 4
      faces[1][2] = 3

      // +x facing quad
      faces[2][0] = 2
      faces[2][1] = 5
      faces[2][2] = 3
      faces[2][3] = 0

      // +y facing quad
      faces[3][0] = 3
      faces[3][1] = 4
      faces[3][2] = 1
      faces[3][3] = 0

      // -xy facing quad
      faces[4][0] = 1
      faces[4][1] = 4
      faces[4][2] = 5
      faces[4][3] = 2
    }

    result.computeNormals()
    result.computeEdges()
    result.updateBoundingSphereRadius()

    this.setCachedConvexTrianglePillar(xi, yi, getUpperTriangle, result, offsetResult)
  }

  calculateLocalInertia(mass: number, target = new Vec3()): Vec3 {
    target.set(0, 0, 0)
    return target
  }

  volume(): number {
    return (
      // The terrain is infinite
      Number.MAX_VALUE
    )
  }

  calculateWorldAABB(pos: Vec3, quat: Quaternion, min: Vec3, max: Vec3): void {
    // TODO: do it properly
    min.set(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE)
    max.set(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE)
  }

  updateBoundingSphereRadius(): void {
    // Use the bounding box of the min/max values
    const data = this.data

    const s = this.elementSize
    this.boundingSphereRadius = new Vec3(
      data.length * s,
      data[0].length * s,
      Math.max(Math.abs(this.maxValue!), Math.abs(this.minValue!))
    ).length()
  }

  /**
   * Sets the height values from an image. Currently only supported in browser.
   * @method setHeightsFromImage
   * @param {Image} image
   * @param {Vec3} scale
   */
  setHeightsFromImage(image: HTMLImageElement, scale: Vec3): void {
    const { x, z, y } = scale
    const canvas = document.createElement('canvas')
    canvas.width = image.width
    canvas.height = image.height
    const context = canvas.getContext('2d')!
    context.drawImage(image, 0, 0)
    const imageData = context.getImageData(0, 0, image.width, image.height)

    const matrix = this.data
    matrix.length = 0
    this.elementSize = Math.abs(x) / imageData.width
    for (let i = 0; i < imageData.height; i++) {
      const row = []
      for (let j = 0; j < imageData.width; j++) {
        const a = imageData.data[(i * imageData.height + j) * 4]
        const b = imageData.data[(i * imageData.height + j) * 4 + 1]
        const c = imageData.data[(i * imageData.height + j) * 4 + 2]
        const height = ((a + b + c) / 4 / 255) * z
        if (x < 0) {
          row.push(height)
        } else {
          row.unshift(height)
        }
      }
      if (y < 0) {
        matrix.unshift(row)
      } else {
        matrix.push(row)
      }
    }
    this.updateMaxValue()
    this.updateMinValue()
    this.update()
  }
}

const getHeightAt_idx: number[] = []
const getHeightAt_weights = new Vec3()
const getHeightAt_a = new Vec3()
const getHeightAt_b = new Vec3()
const getHeightAt_c = new Vec3()

const getNormalAt_a = new Vec3()
const getNormalAt_b = new Vec3()
const getNormalAt_c = new Vec3()
const getNormalAt_e0 = new Vec3()
const getNormalAt_e1 = new Vec3()

// from https://en.wikipedia.org/wiki/Barycentric_coordinate_system
function barycentricWeights(
  x: number,
  y: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  result: Vec3
): void {
  result.x = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / ((by - cy) * (ax - cx) + (cx - bx) * (ay - cy))
  result.y = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / ((by - cy) * (ax - cx) + (cx - bx) * (ay - cy))
  result.z = 1 - result.x - result.y
}
