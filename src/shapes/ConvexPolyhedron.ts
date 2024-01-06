import { Shape } from '../shapes/Shape'
import { Vec3 } from '../math/Vec3'
import { Transform } from '../math/Transform'
import type { Quaternion } from '../math/Quaternion'

/** ConvexPolyhedronContactPoint */
export type ConvexPolyhedronContactPoint = {
  point: Vec3
  normal: Vec3
  depth: number
}

/**
 * A set of polygons describing a convex shape.
 *
 * The shape MUST be convex for the code to work properly. No polygons may be coplanar (contained
 * in the same 3D plane), instead these should be merged into one polygon.
 *
 * @author qiao / https://github.com/qiao (original author, see https://github.com/qiao/three.js/commit/85026f0c769e4000148a67d45a9e9b9c5108836f)
 * @author schteppe / https://github.com/schteppe
 * @see https://www.altdevblogaday.com/2011/05/13/contact-generation-between-3d-convex-meshes/
 *
 * @todo Move the clipping functions to ContactGenerator?
 * @todo Automatically merge coplanar polygons in constructor.
 * @example
 *     const convexShape = new CANNON.ConvexPolyhedron({ vertices, faces })
 *     const convexBody = new CANNON.Body({ mass: 1, shape: convexShape })
 *     world.addBody(convexBody)
 */

export class ConvexPolyhedron extends Shape {
  /** vertices */
  vertices: Vec3[]
  /**
   * Array of integer arrays, indicating which vertices each face consists of
   */
  faces: number[][]
  /** faceNormals */
  faceNormals: Vec3[]
  /** worldVertices */
  worldVertices: Vec3[]
  /** worldVerticesNeedsUpdate */
  worldVerticesNeedsUpdate: boolean
  /** worldFaceNormals */
  worldFaceNormals: Vec3[]
  /** worldFaceNormalsNeedsUpdate */
  worldFaceNormalsNeedsUpdate: boolean
  /**
   * If given, these locally defined, normalized axes are the only ones being checked when doing separating axis check.
   */
  uniqueAxes: Vec3[] | null
  /** uniqueEdges */
  uniqueEdges: Vec3[]

  /**
   * @param vertices An array of Vec3's
   * @param faces Array of integer arrays, describing which vertices that is included in each face.
   */
  constructor(
    props: {
      /** An array of Vec3's */
      vertices?: Vec3[]
      /** Array of integer arrays, describing which vertices that is included in each face. */
      faces?: number[][]
      /** normals */
      normals?: Vec3[]
      /** axes */
      axes?: Vec3[]
      /** boundingSphereRadius */
      boundingSphereRadius?: number
    } = {}
  ) {
    const { vertices = [], faces = [], normals = [], axes, boundingSphereRadius } = props

    super({ type: Shape.types.CONVEXPOLYHEDRON })

    this.vertices = vertices
    this.faces = faces
    this.faceNormals = normals

    if (this.faceNormals.length === 0) {
      this.computeNormals()
    }

    if (!boundingSphereRadius) {
      this.updateBoundingSphereRadius()
    } else {
      this.boundingSphereRadius = boundingSphereRadius
    }

    this.worldVertices = [] // World transformed version of .vertices
    this.worldVerticesNeedsUpdate = true
    this.worldFaceNormals = [] // World transformed version of .faceNormals
    this.worldFaceNormalsNeedsUpdate = true
    this.uniqueAxes = axes ? axes.slice() : null
    this.uniqueEdges = []
    this.computeEdges()
  }

  /**
   * Computes uniqueEdges
   */
  computeEdges(): void {
    const faces = this.faces
    const vertices = this.vertices
    const edges = this.uniqueEdges

    edges.length = 0

    const edge = new Vec3()

    for (let i = 0; i !== faces.length; i++) {
      const face = faces[i]
      const numVertices = face.length
      for (let j = 0; j !== numVertices; j++) {
        const k = (j + 1) % numVertices
        vertices[face[j]].vsub(vertices[face[k]], edge)
        edge.normalize()
        let found = false
        for (let p = 0; p !== edges.length; p++) {
          if (edges[p].almostEquals(edge) || edges[p].almostEquals(edge)) {
            found = true
            break
          }
        }

        if (!found) {
          edges.push(edge.clone())
        }
      }
    }
  }

  /**
   * Compute the normals of the faces.
   * Will reuse existing Vec3 objects in the `faceNormals` array if they exist.
   */
  computeNormals(): void {
    this.faceNormals.length = this.faces.length

    // Generate normals
    for (let i = 0; i < this.faces.length; i++) {
      // Check so all vertices exists for this face
      for (let j = 0; j < this.faces[i].length; j++) {
        if (!this.vertices[this.faces[i][j]]) {
          throw new Error(`Vertex ${this.faces[i][j]} not found!`)
        }
      }

      const n = this.faceNormals[i] || new Vec3()
      this.getFaceNormal(i, n)
      n.negate(n)
      this.faceNormals[i] = n
      const vertex = this.vertices[this.faces[i][0]]
      if (n.dot(vertex) < 0) {
        console.error(
          `.faceNormals[${i}] = Vec3(${n.toString()}) looks like it points into the shape? The vertices follow. Make sure they are ordered CCW around the normal, using the right hand rule.`
        )
        for (let j = 0; j < this.faces[i].length; j++) {
          console.warn(`.vertices[${this.faces[i][j]}] = Vec3(${this.vertices[this.faces[i][j]].toString()})`)
        }
      }
    }
  }

  /**
   * Compute the normal of a face from its vertices
   */
  getFaceNormal(i: number, target: Vec3): void {
    const f = this.faces[i]
    const va = this.vertices[f[0]]
    const vb = this.vertices[f[1]]
    const vc = this.vertices[f[2]]
    ConvexPolyhedron.computeNormal(va, vb, vc, target)
  }

  /**
   * Get face normal given 3 vertices
   */
  static computeNormal(va: Vec3, vb: Vec3, vc: Vec3, target: Vec3): void {
    const cb = new Vec3()
    const ab = new Vec3()
    vb.vsub(va, ab)
    vc.vsub(vb, cb)
    cb.cross(ab, target)
    if (!target.isZero()) {
      target.normalize()
    }
  }

  /**
   * @param minDist Clamp distance
   * @param result The an array of contact point objects, see clipFaceAgainstHull
   */
  clipAgainstHull(
    posA: Vec3,
    quatA: Quaternion,
    hullB: ConvexPolyhedron,
    posB: Vec3,
    quatB: Quaternion,
    separatingNormal: Vec3,
    minDist: number,
    maxDist: number,
    result: ConvexPolyhedronContactPoint[]
  ): void {
    const WorldNormal = new Vec3()
    let closestFaceB = -1
    let dmax = -Number.MAX_VALUE

    for (let face = 0; face < hullB.faces.length; face++) {
      WorldNormal.copy(hullB.faceNormals[face])
      quatB.vmult(WorldNormal, WorldNormal)
      const d = WorldNormal.dot(separatingNormal)
      if (d > dmax) {
        dmax = d
        closestFaceB = face
      }
    }

    const worldVertsB1 = []

    for (let i = 0; i < hullB.faces[closestFaceB].length; i++) {
      const b = hullB.vertices[hullB.faces[closestFaceB][i]]
      const worldb = new Vec3()
      worldb.copy(b)
      quatB.vmult(worldb, worldb)
      posB.vadd(worldb, worldb)
      worldVertsB1.push(worldb)
    }

    if (closestFaceB >= 0) {
      this.clipFaceAgainstHull(separatingNormal, posA, quatA, worldVertsB1, minDist, maxDist, result)
    }
  }

  /**
   * Find the separating axis between this hull and another
   * @param target The target vector to save the axis in
   * @return Returns false if a separation is found, else true
   */
  findSeparatingAxis(
    hullB: ConvexPolyhedron,
    posA: Vec3,
    quatA: Quaternion,
    posB: Vec3,
    quatB: Quaternion,
    target: Vec3,
    faceListA?: number[] | null,
    faceListB?: number[] | null
  ): boolean {
    const faceANormalWS3 = new Vec3()
    const Worldnormal1 = new Vec3()
    const deltaC = new Vec3()
    const worldEdge0 = new Vec3()
    const worldEdge1 = new Vec3()
    const Cross = new Vec3()

    let dmin = Number.MAX_VALUE
    const hullA = this
    let curPlaneTests = 0

    if (!hullA.uniqueAxes) {
      const numFacesA = faceListA ? faceListA.length : hullA.faces.length

      // Test face normals from hullA
      for (let i = 0; i < numFacesA; i++) {
        const fi = faceListA ? faceListA[i] : i

        // Get world face normal
        faceANormalWS3.copy(hullA.faceNormals[fi])
        quatA.vmult(faceANormalWS3, faceANormalWS3)

        const d = hullA.testSepAxis(faceANormalWS3, hullB, posA, quatA, posB, quatB)
        if (d === false) {
          return false
        }

        if (d < dmin) {
          dmin = d
          target.copy(faceANormalWS3)
        }
      }
    } else {
      // Test unique axes
      for (let i = 0; i !== hullA.uniqueAxes.length; i++) {
        // Get world axis
        quatA.vmult(hullA.uniqueAxes[i], faceANormalWS3)

        const d = hullA.testSepAxis(faceANormalWS3, hullB, posA, quatA, posB, quatB)
        if (d === false) {
          return false
        }

        if (d < dmin) {
          dmin = d
          target.copy(faceANormalWS3)
        }
      }
    }

    if (!hullB.uniqueAxes) {
      // Test face normals from hullB
      const numFacesB = faceListB ? faceListB.length : hullB.faces.length
      for (let i = 0; i < numFacesB; i++) {
        const fi = faceListB ? faceListB[i] : i

        Worldnormal1.copy(hullB.faceNormals[fi])
        quatB.vmult(Worldnormal1, Worldnormal1)
        curPlaneTests++
        const d = hullA.testSepAxis(Worldnormal1, hullB, posA, quatA, posB, quatB)
        if (d === false) {
          return false
        }

        if (d < dmin) {
          dmin = d
          target.copy(Worldnormal1)
        }
      }
    } else {
      // Test unique axes in B
      for (let i = 0; i !== hullB.uniqueAxes.length; i++) {
        quatB.vmult(hullB.uniqueAxes[i], Worldnormal1)

        curPlaneTests++
        const d = hullA.testSepAxis(Worldnormal1, hullB, posA, quatA, posB, quatB)
        if (d === false) {
          return false
        }

        if (d < dmin) {
          dmin = d
          target.copy(Worldnormal1)
        }
      }
    }

    // Test edges
    for (let e0 = 0; e0 !== hullA.uniqueEdges.length; e0++) {
      // Get world edge
      quatA.vmult(hullA.uniqueEdges[e0], worldEdge0)

      for (let e1 = 0; e1 !== hullB.uniqueEdges.length; e1++) {
        // Get world edge 2
        quatB.vmult(hullB.uniqueEdges[e1], worldEdge1)
        worldEdge0.cross(worldEdge1, Cross)

        if (!Cross.almostZero()) {
          Cross.normalize()
          const dist = hullA.testSepAxis(Cross, hullB, posA, quatA, posB, quatB)
          if (dist === false) {
            return false
          }
          if (dist < dmin) {
            dmin = dist
            target.copy(Cross)
          }
        }
      }
    }

    posB.vsub(posA, deltaC)
    if (deltaC.dot(target) > 0.0) {
      target.negate(target)
    }

    return true
  }

  /**
   * Test separating axis against two hulls. Both hulls are projected onto the axis and the overlap size is returned if there is one.
   * @return The overlap depth, or FALSE if no penetration.
   */
  testSepAxis(
    axis: Vec3,
    hullB: ConvexPolyhedron,
    posA: Vec3,
    quatA: Quaternion,
    posB: Vec3,
    quatB: Quaternion
  ): number | false {
    const hullA = this
    ConvexPolyhedron.project(hullA, axis, posA, quatA, maxminA)
    ConvexPolyhedron.project(hullB, axis, posB, quatB, maxminB)
    const maxA = maxminA[0]
    const minA = maxminA[1]
    const maxB = maxminB[0]
    const minB = maxminB[1]
    if (maxA < minB || maxB < minA) {
      return false // Separated
    }
    const d0 = maxA - minB
    const d1 = maxB - minA
    const depth = d0 < d1 ? d0 : d1
    return depth
  }

  /**
   * calculateLocalInertia
   */
  calculateLocalInertia(mass: number, target: Vec3): void {
    // Approximate with box inertia
    // Exact inertia calculation is overkill, but see http://geometrictools.com/Documentation/PolyhedralMassProperties.pdf for the correct way to do it
    const aabbmax = new Vec3()
    const aabbmin = new Vec3()
    this.computeLocalAABB(aabbmin, aabbmax)
    const x = aabbmax.x - aabbmin.x
    const y = aabbmax.y - aabbmin.y
    const z = aabbmax.z - aabbmin.z
    target.x = (1.0 / 12.0) * mass * (2 * y * 2 * y + 2 * z * 2 * z)
    target.y = (1.0 / 12.0) * mass * (2 * x * 2 * x + 2 * z * 2 * z)
    target.z = (1.0 / 12.0) * mass * (2 * y * 2 * y + 2 * x * 2 * x)
  }

  /**
   * @param face_i Index of the face
   */
  getPlaneConstantOfFace(face_i: number): number {
    const f = this.faces[face_i]
    const n = this.faceNormals[face_i]
    const v = this.vertices[f[0]]
    const c = -n.dot(v)
    return c
  }

  /**
   * Clip a face against a hull.
   * @param worldVertsB1 An array of Vec3 with vertices in the world frame.
   * @param minDist Distance clamping
   * @param Array result Array to store resulting contact points in. Will be objects with properties: point, depth, normal. These are represented in world coordinates.
   */
  clipFaceAgainstHull(
    separatingNormal: Vec3,
    posA: Vec3,
    quatA: Quaternion,
    worldVertsB1: Vec3[],
    minDist: number,
    maxDist: number,
    result: ConvexPolyhedronContactPoint[]
  ): void {
    const faceANormalWS = new Vec3()
    const edge0 = new Vec3()
    const WorldEdge0 = new Vec3()
    const worldPlaneAnormal1 = new Vec3()
    const planeNormalWS1 = new Vec3()
    const worldA1 = new Vec3()
    const localPlaneNormal = new Vec3()
    const planeNormalWS = new Vec3()
    const hullA = this
    const worldVertsB2: Vec3[] = []
    const pVtxIn = worldVertsB1
    const pVtxOut = worldVertsB2

    let closestFaceA = -1
    let dmin = Number.MAX_VALUE

    // Find the face with normal closest to the separating axis
    for (let face = 0; face < hullA.faces.length; face++) {
      faceANormalWS.copy(hullA.faceNormals[face])
      quatA.vmult(faceANormalWS, faceANormalWS)
      const d = faceANormalWS.dot(separatingNormal)
      if (d < dmin) {
        dmin = d
        closestFaceA = face
      }
    }
    if (closestFaceA < 0) {
      return
    }

    // Get the face and construct connected faces
    const polyA = hullA.faces[closestFaceA] as number[] & { connectedFaces: number[] }
    polyA.connectedFaces = []
    for (let i = 0; i < hullA.faces.length; i++) {
      for (let j = 0; j < hullA.faces[i].length; j++) {
        if (
          /* Sharing a vertex*/
          polyA.indexOf(hullA.faces[i][j]) !== -1 &&
          /* Not the one we are looking for connections from */
          i !== closestFaceA &&
          /* Not already added */
          polyA.connectedFaces.indexOf(i) === -1
        ) {
          polyA.connectedFaces.push(i)
        }
      }
    }

    // Clip the polygon to the back of the planes of all faces of hull A,
    // that are adjacent to the witness face
    const numVerticesA = polyA.length
    for (let i = 0; i < numVerticesA; i++) {
      const a = hullA.vertices[polyA[i]]
      const b = hullA.vertices[polyA[(i + 1) % numVerticesA]]
      a.vsub(b, edge0)
      WorldEdge0.copy(edge0)
      quatA.vmult(WorldEdge0, WorldEdge0)
      posA.vadd(WorldEdge0, WorldEdge0)
      worldPlaneAnormal1.copy(this.faceNormals[closestFaceA])
      quatA.vmult(worldPlaneAnormal1, worldPlaneAnormal1)
      posA.vadd(worldPlaneAnormal1, worldPlaneAnormal1)
      WorldEdge0.cross(worldPlaneAnormal1, planeNormalWS1)
      planeNormalWS1.negate(planeNormalWS1)
      worldA1.copy(a)
      quatA.vmult(worldA1, worldA1)
      posA.vadd(worldA1, worldA1)

      const otherFace = polyA.connectedFaces[i]
      localPlaneNormal.copy(this.faceNormals[otherFace])
      const localPlaneEq = this.getPlaneConstantOfFace(otherFace)
      planeNormalWS.copy(localPlaneNormal)
      quatA.vmult(planeNormalWS, planeNormalWS)
      const planeEqWS = localPlaneEq - planeNormalWS.dot(posA)

      // Clip face against our constructed plane
      this.clipFaceAgainstPlane(pVtxIn, pVtxOut, planeNormalWS, planeEqWS)

      // Throw away all clipped points, but save the remaining until next clip
      while (pVtxIn.length) {
        pVtxIn.shift()
      }
      while (pVtxOut.length) {
        pVtxIn.push(pVtxOut.shift()!)
      }
    }

    // only keep contact points that are behind the witness face
    localPlaneNormal.copy(this.faceNormals[closestFaceA])

    const localPlaneEq = this.getPlaneConstantOfFace(closestFaceA)
    planeNormalWS.copy(localPlaneNormal)
    quatA.vmult(planeNormalWS, planeNormalWS)

    const planeEqWS = localPlaneEq - planeNormalWS.dot(posA)
    for (let i = 0; i < pVtxIn.length; i++) {
      let depth = planeNormalWS.dot(pVtxIn[i]) + planeEqWS // ???

      if (depth <= minDist) {
        // console.log(`clamped: depth=${depth} to minDist=${minDist}`)
        depth = minDist
      }

      if (depth <= maxDist) {
        const point = pVtxIn[i]
        if (depth <= 1e-6) {
          const p = {
            point,
            normal: planeNormalWS,
            depth,
          }
          result.push(p)
        }
      }
    }
  }

  /**
   * Clip a face in a hull against the back of a plane.
   * @param planeConstant The constant in the mathematical plane equation
   */
  clipFaceAgainstPlane(inVertices: Vec3[], outVertices: Vec3[], planeNormal: Vec3, planeConstant: number): Vec3[] {
    let n_dot_first
    let n_dot_last
    const numVerts = inVertices.length

    if (numVerts < 2) {
      return outVertices
    }

    let firstVertex = inVertices[inVertices.length - 1]
    let lastVertex = inVertices[0]

    n_dot_first = planeNormal.dot(firstVertex) + planeConstant

    for (let vi = 0; vi < numVerts; vi++) {
      lastVertex = inVertices[vi]
      n_dot_last = planeNormal.dot(lastVertex) + planeConstant
      if (n_dot_first < 0) {
        if (n_dot_last < 0) {
          // Start < 0, end < 0, so output lastVertex
          const newv = new Vec3()
          newv.copy(lastVertex)
          outVertices.push(newv)
        } else {
          // Start < 0, end >= 0, so output intersection
          const newv = new Vec3()
          firstVertex.lerp(lastVertex, n_dot_first / (n_dot_first - n_dot_last), newv)
          outVertices.push(newv)
        }
      } else {
        if (n_dot_last < 0) {
          // Start >= 0, end < 0 so output intersection and end
          const newv = new Vec3()
          firstVertex.lerp(lastVertex, n_dot_first / (n_dot_first - n_dot_last), newv)
          outVertices.push(newv)
          outVertices.push(lastVertex)
        }
      }
      firstVertex = lastVertex
      n_dot_first = n_dot_last
    }
    return outVertices
  }

  /**
   * Updates `.worldVertices` and sets `.worldVerticesNeedsUpdate` to false.
   */
  computeWorldVertices(position: Vec3, quat: Quaternion): void {
    while (this.worldVertices.length < this.vertices.length) {
      this.worldVertices.push(new Vec3())
    }

    const verts = this.vertices
    const worldVerts = this.worldVertices
    for (let i = 0; i !== this.vertices.length; i++) {
      quat.vmult(verts[i], worldVerts[i])
      position.vadd(worldVerts[i], worldVerts[i])
    }

    this.worldVerticesNeedsUpdate = false
  }

  computeLocalAABB(aabbmin: Vec3, aabbmax: Vec3): void {
    const vertices = this.vertices

    aabbmin.set(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE)
    aabbmax.set(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE)

    for (let i = 0; i < this.vertices.length; i++) {
      const v = vertices[i]
      if (v.x < aabbmin.x) {
        aabbmin.x = v.x
      } else if (v.x > aabbmax.x) {
        aabbmax.x = v.x
      }
      if (v.y < aabbmin.y) {
        aabbmin.y = v.y
      } else if (v.y > aabbmax.y) {
        aabbmax.y = v.y
      }
      if (v.z < aabbmin.z) {
        aabbmin.z = v.z
      } else if (v.z > aabbmax.z) {
        aabbmax.z = v.z
      }
    }
  }

  /**
   * Updates `worldVertices` and sets `worldVerticesNeedsUpdate` to false.
   */
  computeWorldFaceNormals(quat: Quaternion): void {
    const N = this.faceNormals.length
    while (this.worldFaceNormals.length < N) {
      this.worldFaceNormals.push(new Vec3())
    }

    const normals = this.faceNormals
    const worldNormals = this.worldFaceNormals
    for (let i = 0; i !== N; i++) {
      quat.vmult(normals[i], worldNormals[i])
    }

    this.worldFaceNormalsNeedsUpdate = false
  }

  /**
   * updateBoundingSphereRadius
   */
  updateBoundingSphereRadius(): void {
    // Assume points are distributed with local (0,0,0) as center
    let max2 = 0
    const verts = this.vertices
    for (let i = 0; i !== verts.length; i++) {
      const norm2 = verts[i].lengthSquared()
      if (norm2 > max2) {
        max2 = norm2
      }
    }
    this.boundingSphereRadius = Math.sqrt(max2)
  }

  /**
   * calculateWorldAABB
   */
  calculateWorldAABB(pos: Vec3, quat: Quaternion, min: Vec3, max: Vec3): void {
    const verts = this.vertices
    let minx: number | undefined
    let miny: number | undefined
    let minz: number | undefined
    let maxx: number | undefined
    let maxy: number | undefined
    let maxz: number | undefined
    let tempWorldVertex = new Vec3()
    for (let i = 0; i < verts.length; i++) {
      tempWorldVertex.copy(verts[i])
      quat.vmult(tempWorldVertex, tempWorldVertex)
      pos.vadd(tempWorldVertex, tempWorldVertex)
      const v = tempWorldVertex
      if (minx === undefined || v.x < minx) {
        minx = v.x
      }

      if (maxx === undefined || v.x > maxx) {
        maxx = v.x
      }

      if (miny === undefined || v.y < miny) {
        miny = v.y
      }

      if (maxy === undefined || v.y > maxy) {
        maxy = v.y
      }

      if (minz === undefined || v.z < minz) {
        minz = v.z
      }

      if (maxz === undefined || v.z > maxz) {
        maxz = v.z
      }
    }
    min.set(minx!, miny!, minz!)
    max.set(maxx!, maxy!, maxz!)
  }

  /**
   * Get approximate convex volume
   */
  volume(): number {
    return (4.0 * Math.PI * this.boundingSphereRadius) / 3.0
  }

  /**
   * Get an average of all the vertices positions
   */
  getAveragePointLocal(target = new Vec3()): Vec3 {
    const verts = this.vertices
    for (let i = 0; i < verts.length; i++) {
      target.vadd(verts[i], target)
    }
    target.scale(1 / verts.length, target)
    return target
  }

  /**
   * Transform all local points. Will change the .vertices
   */
  transformAllPoints(offset: Vec3, quat: Quaternion): void {
    const n = this.vertices.length
    const verts = this.vertices

    // Apply rotation
    if (quat) {
      // Rotate vertices
      for (let i = 0; i < n; i++) {
        const v = verts[i]
        quat.vmult(v, v)
      }
      // Rotate face normals
      for (let i = 0; i < this.faceNormals.length; i++) {
        const v = this.faceNormals[i]
        quat.vmult(v, v)
      }
      /*
            // Rotate edges
            for(let i=0; i<this.uniqueEdges.length; i++){
                const v = this.uniqueEdges[i];
                quat.vmult(v,v);
            }*/
    }

    // Apply offset
    if (offset) {
      for (let i = 0; i < n; i++) {
        const v = verts[i]
        v.vadd(offset, v)
      }
    }
  }

  /**
   * Checks whether p is inside the polyhedra. Must be in local coords.
   * The point lies outside of the convex hull of the other points if and only if the direction
   * of all the vectors from it to those other points are on less than one half of a sphere around it.
   * @param p A point given in local coordinates
   */
  pointIsInside(p: Vec3): 1 | -1 | false {
    const verts = this.vertices
    const faces = this.faces
    const normals = this.faceNormals
    const positiveResult = null
    const pointInside = new Vec3()
    this.getAveragePointLocal(pointInside)

    for (let i = 0; i < this.faces.length; i++) {
      let n = normals[i]
      const v = verts[faces[i][0]] // We only need one point in the face

      // This dot product determines which side of the edge the point is
      const vToP = new Vec3()
      p.vsub(v, vToP)
      const r1 = n.dot(vToP)

      const vToPointInside = new Vec3()
      pointInside.vsub(v, vToPointInside)
      const r2 = n.dot(vToPointInside)

      if ((r1 < 0 && r2 > 0) || (r1 > 0 && r2 < 0)) {
        return false // Encountered some other sign. Exit.
      }
    }

    // If we got here, all dot products were of the same sign.
    return positiveResult ? 1 : -1
  }

  /**
   * Get max and min dot product of a convex hull at position (pos,quat) projected onto an axis.
   * Results are saved in the array maxmin.
   * @param result result[0] and result[1] will be set to maximum and minimum, respectively.
   */
  static project(shape: ConvexPolyhedron, axis: Vec3, pos: Vec3, quat: Quaternion, result: number[]): void {
    const n = shape.vertices.length
    const worldVertex = project_worldVertex
    const localAxis = project_localAxis
    let max = 0
    let min = 0
    const localOrigin = project_localOrigin
    const vs = shape.vertices

    localOrigin.setZero()

    // Transform the axis to local
    Transform.vectorToLocalFrame(pos, quat, axis, localAxis)
    Transform.pointToLocalFrame(pos, quat, localOrigin, localOrigin)
    const add = localOrigin.dot(localAxis)

    min = max = vs[0].dot(localAxis)

    for (let i = 1; i < n; i++) {
      const val = vs[i].dot(localAxis)

      if (val > max) {
        max = val
      }

      if (val < min) {
        min = val
      }
    }

    min -= add
    max -= add

    if (min > max) {
      // Inconsistent - swap
      const temp = min
      min = max
      max = temp
    }
    // Output
    result[0] = max
    result[1] = min
  }
}

const maxminA: number[] = []
const maxminB: number[] = []

const project_worldVertex = new Vec3()
const project_localAxis = new Vec3()
const project_localOrigin = new Vec3()
