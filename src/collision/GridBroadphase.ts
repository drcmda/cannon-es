import type { AABB } from './AABB'
import { Broadphase } from '../collision/Broadphase'
import { Vec3 } from '../math/Vec3'
import { Shape } from '../shapes/Shape'

import type { Body } from '../objects/Body'
import type { Sphere } from '../shapes/Sphere'
import type { Plane } from '../shapes/Plane'
import type { World } from '../world/World'

/**
 * Axis aligned uniform grid broadphase.
 * @todo Needs support for more than just planes and spheres.
 */
export class GridBroadphase extends Broadphase {
  /**
   * Number of boxes along x
   */
  nx: number

  /**
   * Number of boxes along y
   */
  ny: number

  /**
   * Number of boxes along z
   */
  nz: number

  /**
   * aabbMin
   */
  aabbMin: Vec3

  /**
   * aabbMax
   */
  aabbMax: Vec3

  /**
   * bins
   */
  bins: Body[][]

  /**
   * binLengths
   */
  binLengths: number[]

  /**
   * @param nx Number of boxes along x.
   * @param ny Number of boxes along y.
   * @param nz Number of boxes along z.
   */
  constructor(aabbMin = new Vec3(100, 100, 100), aabbMax = new Vec3(-100, -100, -100), nx = 10, ny = 10, nz = 10) {
    super()

    this.nx = nx
    this.ny = ny
    this.nz = nz
    this.aabbMin = aabbMin
    this.aabbMax = aabbMax
    const nbins = this.nx * this.ny * this.nz
    if (nbins <= 0) {
      throw "GridBroadphase: Each dimension's n must be >0"
    }
    this.bins = []
    this.binLengths = [] // Rather than continually resizing arrays (thrashing the memory), just record length and allow them to grow
    this.bins.length = nbins
    this.binLengths.length = nbins
    for (let i = 0; i < nbins; i++) {
      this.bins[i] = []
      this.binLengths[i] = 0
    }
  }

  /**
   * Get all the collision pairs in the physics world
   */
  collisionPairs(world: World, pairs1: Body[], pairs2: Body[]): void {
    const max = this.aabbMax
    const min = this.aabbMin
    const nx = this.nx
    const ny = this.ny
    const nz = this.nz

    const xstep = ny * nz
    const ystep = nz
    const zstep = 1

    const xmax = max.x
    const ymax = max.y
    const zmax = max.z
    const xmin = min.x
    const ymin = min.y
    const zmin = min.z
    const xmult = nx / (xmax - xmin)
    const ymult = ny / (ymax - ymin)
    const zmult = nz / (zmax - zmin)
    const binsizeX = (xmax - xmin) / nx
    const binsizeY = (ymax - ymin) / ny
    const binsizeZ = (zmax - zmin) / nz

    const binRadius = Math.sqrt(binsizeX * binsizeX + binsizeY * binsizeY + binsizeZ * binsizeZ) * 0.5

    const SPHERE = Shape.types.SPHERE
    const PLANE = Shape.types.PLANE
    const bins = this.bins
    const binLengths = this.binLengths
    const Nbins = this.bins.length

    // Reset bins
    for (let i = 0; i !== Nbins; i++) {
      binLengths[i] = 0
    }

    const ceil = Math.ceil

    function addBoxToBins(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, bi: Body): void {
      let xoff0 = ((x0 - xmin) * xmult) | 0
      let yoff0 = ((y0 - ymin) * ymult) | 0
      let zoff0 = ((z0 - zmin) * zmult) | 0
      let xoff1 = ceil((x1 - xmin) * xmult)
      let yoff1 = ceil((y1 - ymin) * ymult)
      let zoff1 = ceil((z1 - zmin) * zmult)

      if (xoff0 < 0) {
        xoff0 = 0
      } else if (xoff0 >= nx) {
        xoff0 = nx - 1
      }
      if (yoff0 < 0) {
        yoff0 = 0
      } else if (yoff0 >= ny) {
        yoff0 = ny - 1
      }
      if (zoff0 < 0) {
        zoff0 = 0
      } else if (zoff0 >= nz) {
        zoff0 = nz - 1
      }
      if (xoff1 < 0) {
        xoff1 = 0
      } else if (xoff1 >= nx) {
        xoff1 = nx - 1
      }
      if (yoff1 < 0) {
        yoff1 = 0
      } else if (yoff1 >= ny) {
        yoff1 = ny - 1
      }
      if (zoff1 < 0) {
        zoff1 = 0
      } else if (zoff1 >= nz) {
        zoff1 = nz - 1
      }

      xoff0 *= xstep
      yoff0 *= ystep
      zoff0 *= zstep
      xoff1 *= xstep
      yoff1 *= ystep
      zoff1 *= zstep

      for (let xoff = xoff0; xoff <= xoff1; xoff += xstep) {
        for (let yoff = yoff0; yoff <= yoff1; yoff += ystep) {
          for (let zoff = zoff0; zoff <= zoff1; zoff += zstep) {
            const idx = xoff + yoff + zoff
            bins[idx][binLengths[idx]++] = bi
          }
        }
      }
    }

    // Put all bodies into the bins
    for (let i = 0; i !== world.bodies.length; i++) {
      const bi = world.bodies[i]
      const si = bi.shapes[0]

      switch (si.type) {
        case SPHERE: {
          const shape = si as Sphere
          // Put in bin
          // check if overlap with other bins
          const x = bi.position.x
          const y = bi.position.y
          const z = bi.position.z
          const r = shape.radius

          addBoxToBins(x - r, y - r, z - r, x + r, y + r, z + r, bi)
          break
        }
        case PLANE: {
          const shape = si as Plane

          if (shape.worldNormalNeedsUpdate) {
            shape.computeWorldNormal(bi.quaternion)
          }
          const planeNormal = shape.worldNormal

          //Relative position from origin of plane object to the first bin
          //Incremented as we iterate through the bins
          const xreset = xmin + binsizeX * 0.5 - bi.position.x

          const yreset = ymin + binsizeY * 0.5 - bi.position.y
          const zreset = zmin + binsizeZ * 0.5 - bi.position.z

          const d = GridBroadphase_collisionPairs_d
          d.set(xreset, yreset, zreset)

          for (let xi = 0, xoff = 0; xi !== nx; xi++, xoff += xstep, d.y = yreset, d.x += binsizeX) {
            for (let yi = 0, yoff = 0; yi !== ny; yi++, yoff += ystep, d.z = zreset, d.y += binsizeY) {
              for (let zi = 0, zoff = 0; zi !== nz; zi++, zoff += zstep, d.z += binsizeZ) {
                if (d.dot(planeNormal) < binRadius) {
                  const idx = xoff + yoff + zoff
                  bins[idx][binLengths[idx]++] = bi
                }
              }
            }
          }
          break
        }
        default: {
          if (bi.aabbNeedsUpdate) {
            bi.updateAABB()
          }

          addBoxToBins(
            bi.aabb.lowerBound.x,
            bi.aabb.lowerBound.y,
            bi.aabb.lowerBound.z,
            bi.aabb.upperBound.x,
            bi.aabb.upperBound.y,
            bi.aabb.upperBound.z,
            bi
          )
          break
        }
      }
    }

    // Check each bin
    for (let i = 0; i !== Nbins; i++) {
      const binLength = binLengths[i]
      //Skip bins with no potential collisions
      if (binLength > 1) {
        const bin = bins[i]

        // Do N^2 broadphase inside
        for (let xi = 0; xi !== binLength; xi++) {
          const bi = bin[xi]
          for (let yi = 0; yi !== xi; yi++) {
            const bj = bin[yi]
            if (this.needBroadphaseCollision(bi, bj)) {
              this.intersectionTest(bi, bj, pairs1, pairs2)
            }
          }
        }
      }
    }

    this.makePairsUnique(pairs1, pairs2)
  }

  aabbQuery(world: World, aabb: AABB, result: Body[] = []): Body[] {
    return result
  }
  setWorld() {
    /**/
  }
}

const GridBroadphase_collisionPairs_d = new Vec3()
