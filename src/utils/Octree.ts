import { AABB } from '../collision/AABB'
import { Vec3 } from '../math/Vec3'

import type { Transform } from '../math/Transform'
import type { Ray } from '../collision/Ray'

type OctreeNodeOptions = {
  aabb?: AABB
  root?: Octree | null
}

/**
 * OctreeNode
 */
class OctreeNode {
  /** Boundary of this node */
  aabb: AABB
  /** Children to this node */
  children: OctreeNode[]
  /** Contained data at the current node level */
  data: number[]
  /** The root node */
  root: OctreeNode | null

  constructor({ aabb, root = null }: OctreeNodeOptions) {
    this.aabb = aabb ? aabb.clone() : new AABB()
    this.children = []
    this.data = []
    this.root = root
  }

  /**
   * reset
   */
  reset(): void {
    this.children.length = this.data.length = 0
  }

  /**
   * Insert data into this node
   * @return True if successful, otherwise false
   */
  insert(aabb: AABB, elementData: number, level = 0): boolean {
    const nodeData = this.data

    // Ignore objects that do not belong in this node
    if (!this.aabb.contains(aabb)) {
      return false // object cannot be added
    }

    const children = this.children
    const maxDepth = (this as any).maxDepth || (this.root! as any).maxDepth

    if (level < maxDepth) {
      // Subdivide if there are no children yet
      let subdivided = false
      if (!children.length) {
        this.subdivide()
        subdivided = true
      }

      // add to whichever node will accept it
      for (let i = 0; i !== 8; i++) {
        if (children[i].insert(aabb, elementData, level + 1)) {
          return true
        }
      }

      if (subdivided) {
        // No children accepted! Might as well just remove em since they contain none
        children.length = 0
      }
    }

    // Too deep, or children didnt want it. add it in current node
    nodeData.push(elementData)

    return true
  }

  /**
   * Create 8 equally sized children nodes and put them in the `children` array.
   */
  subdivide(): void {
    const aabb = this.aabb
    const l = aabb.lowerBound
    const u = aabb.upperBound

    const children = this.children

    children.push(
      new OctreeNode({ aabb: new AABB({ lowerBound: new Vec3(0, 0, 0) }) }),
      new OctreeNode({ aabb: new AABB({ lowerBound: new Vec3(1, 0, 0) }) }),
      new OctreeNode({ aabb: new AABB({ lowerBound: new Vec3(1, 1, 0) }) }),
      new OctreeNode({ aabb: new AABB({ lowerBound: new Vec3(1, 1, 1) }) }),
      new OctreeNode({ aabb: new AABB({ lowerBound: new Vec3(0, 1, 1) }) }),
      new OctreeNode({ aabb: new AABB({ lowerBound: new Vec3(0, 0, 1) }) }),
      new OctreeNode({ aabb: new AABB({ lowerBound: new Vec3(1, 0, 1) }) }),
      new OctreeNode({ aabb: new AABB({ lowerBound: new Vec3(0, 1, 0) }) })
    )

    u.vsub(l, halfDiagonal)
    halfDiagonal.scale(0.5, halfDiagonal)

    const root = this.root || this

    for (let i = 0; i !== 8; i++) {
      const child = children[i]

      // Set current node as root
      child.root = root

      // Compute bounds
      const lowerBound = child.aabb.lowerBound
      lowerBound.x *= halfDiagonal.x
      lowerBound.y *= halfDiagonal.y
      lowerBound.z *= halfDiagonal.z

      lowerBound.vadd(l, lowerBound)

      // Upper bound is always lower bound + halfDiagonal
      lowerBound.vadd(halfDiagonal, child.aabb.upperBound)
    }
  }

  /**
   * Get all data, potentially within an AABB
   * @return The "result" object
   */
  aabbQuery(aabb: AABB, result: number[]): number[] {
    const queue = [this]
    while (queue.length) {
      const node = queue.pop()!
      if (node.aabb.overlaps(aabb)) {
        Array.prototype.push.apply(result, node.data)
      }
      Array.prototype.push.apply(queue, node.children)
    }

    return result
  }

  /**
   * Get all data, potentially intersected by a ray.
   * @return The "result" object
   */
  rayQuery(ray: Ray, treeTransform: Transform, result: number[]): number[] {
    // Use aabb query for now.
    /** @todo implement real ray query which needs less lookups */
    ray.getAABB(tmpAABB)
    tmpAABB.toLocalFrame(treeTransform, tmpAABB)
    this.aabbQuery(tmpAABB, result)

    return result
  }

  /**
   * removeEmptyNodes
   */
  removeEmptyNodes(): void {
    for (let i = this.children.length - 1; i >= 0; i--) {
      this.children[i].removeEmptyNodes()
      if (!this.children[i].children.length && !this.children[i].data.length) {
        this.children.splice(i, 1)
      }
    }
  }
}

export type OctreeOptions = {
  maxDepth?: number
}

/**
 * Octree
 */
export class Octree extends OctreeNode {
  /**
   * Maximum subdivision depth
   * @default 8
   */
  maxDepth = 8

  /**
   * @param aabb The total AABB of the tree
   */
  constructor(aabb?: AABB, { maxDepth = 8 }: OctreeOptions = {}) {
    super({ root: null, aabb })

    this.maxDepth = maxDepth
  }
}

const halfDiagonal = new Vec3()

const tmpAABB = new AABB()
