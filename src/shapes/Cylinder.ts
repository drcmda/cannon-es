import { ConvexPolyhedron } from '../shapes/ConvexPolyhedron'
import { Vec3 } from '../math/Vec3'

/**
 * Factory function which creates a new Vec3 object
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 * @return {Vec3}
 */
type Vec3Factory = (x: number, y: number, z: number) => Vec3

/**
 * Orientation axis for cylinder creation
 * @enum {number}
 */
export enum Axis {
  X = 0,
  Y = 1,
  Z = 2,
}

/**
 * @class Cylinder
 * @constructor
 * @extends ConvexPolyhedron
 * @author schteppe / https://github.com/schteppe (original author)
 * @author ianpurvis / https://github.com/ianpurvis
 * @param {Number} radiusTop
 * @param {Number} radiusBottom
 * @param {Number} height
 * @param {Number} numSegments The number of segments to build the cylinder out of
 * @param {Axis} [primaryAxis=Z]
 */
export class Cylinder extends ConvexPolyhedron {
  static vectorFactories: Array<Vec3Factory>

  constructor(
    radiusTop: number,
    radiusBottom: number,
    height: number,
    numSegments: number,
    primaryAxis: Axis = Axis.Z
  ) {
    const N = numSegments
    const vertices = []
    const axes = []
    const faces = []
    const bottomface = []
    const topface = []
    const cos = Math.cos
    const sin = Math.sin
    const makeVec3 = Cylinder.vectorFactories[primaryAxis]

    // First bottom point
    vertices.push(makeVec3(radiusBottom * cos(0), radiusBottom * sin(0), -height * 0.5))
    bottomface.push(0)

    // First top point
    vertices.push(makeVec3(radiusTop * cos(0), radiusTop * sin(0), height * 0.5))
    topface.push(1)

    for (let i = 0; i < N; i++) {
      const theta = ((2 * Math.PI) / N) * (i + 1)
      const thetaN = ((2 * Math.PI) / N) * (i + 0.5)
      if (i < N - 1) {
        // Bottom
        vertices.push(makeVec3(radiusBottom * cos(theta), radiusBottom * sin(theta), -height * 0.5))
        bottomface.push(2 * i + 2)
        // Top
        vertices.push(makeVec3(radiusTop * cos(theta), radiusTop * sin(theta), height * 0.5))
        topface.push(2 * i + 3)

        // Face
        faces.push([2 * i + 2, 2 * i + 3, 2 * i + 1, 2 * i])
      } else {
        faces.push([0, 1, 2 * i + 1, 2 * i]) // Connect
      }

      // Axis: we can cut off half of them if we have even number of segments
      if (N % 2 === 1 || i < N / 2) {
        axes.push(makeVec3(cos(thetaN), sin(thetaN), 0))
      }
    }
    faces.push(topface)
    axes.push(makeVec3(0, 0, 1))

    // Reorder bottom face
    const temp = []
    for (let i = 0; i < bottomface.length; i++) {
      temp.push(bottomface[bottomface.length - i - 1])
    }
    faces.push(temp)

    super({ vertices, faces, axes })
  }
}

/**
 * Vector factories for creating axis-oriented cylinders
 * @const vectorFactories
 */
Cylinder.vectorFactories = [
  (x, y, z) => new Vec3(z, y, -x), // Rotate 90deg CCW on y-axis
  (x, y, z) => new Vec3(x, z, -y), // Rotate 90deg CCW on x-axis
  (x, y, z) => new Vec3(x, y, z), // Default, no rotation
]
