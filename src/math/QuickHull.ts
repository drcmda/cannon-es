export type Triple<T> = [T, T, T];
export type Vec3Tuple = Triple<number>;
export type VertexTriple = Triple<Vertex>;

interface Vector3 {
    x:number;
    y:number;
    z:number;
}

function dot(a: Vec3Tuple, b: Vec3Tuple): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function pointLineDistance(p: Vec3Tuple, l1: Vec3Tuple, l2: Vec3Tuple): number {
    //https://mathworld.wolfram.com/Point-LineDistance3-Dimensional.html
    let x10:Vec3Tuple = [0, 0, 0];
    let x21:Vec3Tuple = [0, 0, 0];
    let c:Vec3Tuple = [0, 0, 0];

    subtract(x10, l1, p);
    subtract(x21, l2, l1);
    cross(c, x21, x10);

    let len = length(c) / length(x21);

    if (isNaN(len)) return 0;

    return len;
}


function getPlaneNormal(t: Vec3Tuple, a: Vec3Tuple, b: Vec3Tuple, c: Vec3Tuple): Vec3Tuple {
    let v1:Vec3Tuple = [0, 0, 0];
    let v2:Vec3Tuple = [0, 0, 0];
    subtract(v1, b, a);
    subtract(v2, b, c);
    cross(t, v2, v1);
    return t;
}

function add(t: Vec3Tuple, v1: Vec3Tuple, v2: Vec3Tuple): Vec3Tuple {
    t[0] = v1[0] + v2[0];
    t[1] = v1[1] + v2[1];
    t[2] = v1[2] + v2[2];
    return t;
}

function subtract(t: Vec3Tuple, v1: Vec3Tuple, v2: Vec3Tuple): Vec3Tuple {
    t[0] = v1[0] - v2[0];
    t[1] = v1[1] - v2[1];
    t[2] = v1[2] - v2[2];
    return t;
}

function cross(t: Vec3Tuple, v1: Vec3Tuple, v2: Vec3Tuple) {
    t[0] = v1[1] * v2[2] - v1[2] * v2[1];
    t[1] = v1[2] * v2[0] - v1[0] * v2[2];
    t[2] = v1[0] * v2[1] - v1[1] * v2[0];
    return t;
}

function copy(t: Vec3Tuple, f: Vec3Tuple): Vec3Tuple {
    t[0] = f[0];
    t[1] = f[1];
    t[2] = f[2];
    return t;
}

function length(v: Vec3Tuple): number {
    return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}

function scale(t: Vec3Tuple, v: Vec3Tuple, l: number): Vec3Tuple {
    t[0] = v[0] * l;
    t[1] = v[1] * l;
    t[2] = v[2] * l;
    return t;
}

function scaleAndAdd(t: Vec3Tuple, v1: Vec3Tuple, v2: Vec3Tuple, s: number): Vec3Tuple {
    t[0] = v1[0] + v2[0] * s;
    t[1] = v1[1] + v2[1] * s;
    t[2] = v1[2] + v2[2] * s;
    return t;
}

function normalize(t: Vec3Tuple, v: Vec3Tuple): Vec3Tuple {
    let len = length(v);
    if (len === 0) {
        t[0] = 0;
        t[1] = 0;
        t[2] = 0;
    } else {
        len = 1 / len;
        t[0] = v[0] * len;
        t[1] = v[1] * len;
        t[2] = v[2] * len;
    }
    return t;
}

function distance(v1: Vec3Tuple, v2: Vec3Tuple): number {
    return Math.sqrt(squaredDistance(v1, v2));
}
function squaredDistance(v1: Vec3Tuple, v2: Vec3Tuple): number {
    return (v1[0] - v2[0]) ** 2 + (v1[1] - v2[1]) ** 2 + (v1[2] - v2[2]) ** 2;
}

class VertexList {

    public head: Vertex;
    public tail: Vertex;

    constructor() {
        this.head = null;
        this.tail = null;
    }

    clear() {
        this.head = this.tail = null;
    }

    /**
     * Inserts a `node` before `target`, it's assumed that
     * `target` belongs to this doubly linked list
     */
    insertBefore(target: Vertex, node: Vertex) {
        node.prev = target.prev;
        node.next = target;
        if (!node.prev) {
            this.head = node;
        } else {
            node.prev.next = node;
        }
        target.prev = node;
    }

    /**
     * Inserts a `node` after `target`, it's assumed that
     * `target` belongs to this doubly linked list
     */
    insertAfter(target: Vertex, node: Vertex) {
        node.prev = target;
        node.next = target.next;
        if (!node.next) {
            this.tail = node;
        } else {
            node.next.prev = node;
        }
        target.next = node;
    }

    /**
     * Appends a `node` to the end of this doubly linked list
     * Note: `node.next` will be unlinked from `node`
     * Note: if `node` is part of another linked list call `addAll` instead
     */
    add(node: Vertex) {
        if (!this.head) {
            this.head = node;
        } else if(this.tail) {
            this.tail.next = node;
        }
        node.prev = this.tail;
        // since node is the new end it doesn't have a next node
        node.next = null;
        this.tail = node;
    }

    /**
     * Appends a chain of nodes where `node` is the head,
     * the difference with `add` is that it correctly sets the position
     * of the node list `tail` property
     */
    addAll(node: Vertex) {
        if (!this.head) {
            this.head = node;
        } else if(this.tail) {
            this.tail.next = node;
        }
        node.prev = this.tail;

        // find the end of the list
        while (node.next) {
            node = node.next;
        }
        this.tail = node;
    }

    /**
     * Deletes a `node` from this linked list, it's assumed that `node` is a
     * member of this linked list
     */
    remove(node: Vertex) {
        if (!node.prev) {
            this.head = node.next;
        } else {
            node.prev.next = node.next;
        }

        if (!node.next) {
            this.tail = node.prev;
        } else {
            node.next.prev = node.prev;
        }
    }

    /**
     * Removes a chain of nodes whose head is `a` and whose tail is `b`,
     * it's assumed that `a` and `b` belong to this list and also that `a`
     * comes before `b` in the linked list
     */
    removeChain(a: Vertex, b: Vertex) {
        if (!a.prev) {
            this.head = b.next;
        } else {
            a.prev.next = b.next;
        }

        if (!b.next) {
            this.tail = a.prev;
        } else {
            b.next.prev = a.prev;
        }
    }

    first() {
        return this.head;
    }

    isEmpty() {
        return !this.head;
    }
}
class Vertex {

    public point:Vec3Tuple;
    public index:number;
    public next:Vertex;
    public prev:Vertex;
    public face:Face;

    constructor(point:Vec3Tuple, index:number) {
        this.point = point;
        // index in the input array
        this.index = index;
        // vertex is a double linked list node
        this.next = null;
        this.prev = null;
        // the face that is able to see this point
        this.face = null;
    }
}

class HalfEdge {

    public vertex:Vertex;
    public face:Face;
    public next:HalfEdge;
    public prev:HalfEdge;
    public opposite:HalfEdge;

    constructor(vertex:Vertex, face:Face) {
        this.vertex = vertex;
        this.face = face;
        this.next = null;
        this.prev = null;
        this.opposite = null;
    }

    head() {
        return this.vertex;
    }

    tail() {
        return this.prev
            ? this.prev.vertex
            : null;
    }

    length() {
        if (this.tail()) {
            return distance(
                (this.tail() as Vertex).point,
                this.head().point
            );
        }
        return -1;
    }

    lengthSquared() {
        if (this.tail()) {
            return squaredDistance(
                (this.tail() as Vertex).point,
                this.head().point
            );
        }
        return -1;
    }

    setOpposite(edge:HalfEdge) {
        this.opposite = edge;
        edge.opposite = this;
    }
}

enum FaceMark {
    VISIBLE,
    NON_CONVEX,
    DELETED
};

class Face {

    public normal:Vec3Tuple;
    public centroid:Vec3Tuple;
    public offset:number;
    public outside:Vertex;
    public mark:FaceMark;
    public edge:HalfEdge;
    public nVertices:number;
    public area:number = 0;

    constructor() {
        this.normal = [0, 0, 0];
        this.centroid = [0, 0, 0];
        // signed distance from face to the origin
        this.offset = 0;
        // pointer to the a vertex in a double linked list this face can see
        this.outside = null;
        this.mark = FaceMark.VISIBLE;
        this.edge = null
        this.nVertices = 0
    }

    getEdge(i:number) {
        let it = this.edge
        while (i > 0) {
            it = it.next;
            i -= 1
        }
        while (i < 0) {
            it = it.prev;
            i += 1
        }
        return it;
    }

    computeNormal() {
        let e0 = this.edge;
        let e1 = e0.next;
        let e2 = e1.next;
        let v2 = subtract([0, 0, 0], e1.head().point, e0.head().point);
        let t:Vec3Tuple = [0, 0, 0];
        let v1:Vec3Tuple = [0, 0, 0];

        this.nVertices = 2;
        this.normal = [0, 0, 0];
        while (e2 !== e0) {
            copy(v1, v2);
            subtract(v2, e2.head().point, e0.head().point);
            add(this.normal, this.normal, cross(t, v1, v2));
            e2 = e2.next;
            this.nVertices += 1;
        }
        this.area = length(this.normal);
        // normalize the vector, since we've already calculated the area
        // it's cheaper to scale the vector using this quantity instead of
        // doing the same operation again
        this.normal = scale(this.normal, this.normal, 1 / this.area);
    }

    computeNormalMinArea(minArea:number) {
        this.computeNormal();
        if (this.area < minArea) {
            // compute the normal without the longest edge
            let maxEdge!:HalfEdge;
            let maxSquaredLength = 0;
            let edge = this.edge;

            // find the longest edge (in length) in the chain of edges
            do {
                let lengthSquared = edge.lengthSquared()
                if (lengthSquared > maxSquaredLength) {
                    maxEdge = edge;
                    maxSquaredLength = lengthSquared;
                }
                edge = edge.next;
            } while (edge !== this.edge)

            let p1 = maxEdge.tail().point;
            let p2 = maxEdge.head().point;
            let maxVector = subtract([0, 0, 0], p2, p1);
            let maxLength = Math.sqrt(maxSquaredLength);
            // maxVector is normalized after this operation
            scale(maxVector, maxVector, 1 / maxLength);
            // compute the projection of maxVector over this face normal
            let maxProjection = dot(this.normal, maxVector);
            // subtract the quantity maxEdge adds on the normal
            scaleAndAdd(this.normal, this.normal, maxVector, -maxProjection);
            // renormalize `this.normal`
            normalize(this.normal, this.normal);
        }
    }

    computeCentroid() {
        this.centroid = [0, 0, 0];
        let edge = this.edge;
        do {
            add(this.centroid, this.centroid, edge.head().point);
            edge = edge.next;
        } while (edge !== this.edge)
        scale(this.centroid, this.centroid, 1 / this.nVertices);
    }

    computeNormalAndCentroid(minArea?:number) {
        if (typeof minArea !== 'undefined') {
            this.computeNormalMinArea(minArea);
        } else {
            this.computeNormal();
        }
        this.computeCentroid();
        this.offset = dot(this.normal, this.centroid);
    }

    distanceToPlane(point:Vec3Tuple) {
        return dot(this.normal, point) - this.offset;
    }

    /**
     * @private
     *
     * Connects two edges assuming that prev.head().point === next.tail().point
     *
     * @param {HalfEdge} prev
     * @param {HalfEdge} next
     */
    connectHalfEdges(prev: HalfEdge, next: HalfEdge) {
        let discardedFace
        if (prev.opposite.face === next.opposite.face) {
            // `prev` is remove a redundant edge
            let oppositeFace = next.opposite.face;
            let oppositeEdge:HalfEdge;
            if (prev === this.edge) {
                this.edge = next;
            }
            if (oppositeFace.nVertices === 3) {
                // case:
                // remove the face on the right
                //
                //       /|\
                //      / | \ the face on the right
                //     /  |  \ --> opposite edge
                //    / a |   \
                //   *----*----*
                //  /     b  |  \
                //           ▾
                //      redundant edge
                //
                // Note: the opposite edge is actually in the face to the right
                // of the face to be destroyed
                oppositeEdge = next.opposite.prev.opposite;
                oppositeFace.mark = FaceMark.DELETED;
                discardedFace = oppositeFace;
            } else {
                // case:
                //          t
                //        *----
                //       /| <- right face's redundant edge
                //      / | opposite edge
                //     /  |  ▴   /
                //    / a |  |  /
                //   *----*----*
                //  /     b  |  \
                //           ▾
                //      redundant edge
                oppositeEdge = next.opposite.next
                // make sure that the link `oppositeFace.edge` points correctly even
                // after the right face redundant edge is removed
                if (oppositeFace.edge === oppositeEdge.prev) {
                    oppositeFace.edge = oppositeEdge
                }

                //       /|   /
                //      / | t/opposite edge
                //     /  | / ▴  /
                //    / a |/  | /
                //   *----*----*
                //  /     b     \
                oppositeEdge.prev = oppositeEdge.prev.prev
                oppositeEdge.prev.next = oppositeEdge
            }
            //       /|
            //      / |
            //     /  |
            //    / a |
            //   *----*----*
            //  /     b  ▴  \
            //           |
            //     redundant edge
            next.prev = prev.prev
            next.prev.next = next

            //       / \  \
            //      /   \->\
            //     /     \<-\ opposite edge
            //    / a     \  \
            //   *----*----*
            //  /     b  ^  \
            next.setOpposite(oppositeEdge)

            oppositeFace.computeNormalAndCentroid()
        } else {
            // trivial case
            //        *
            //       /|\
            //      / | \
            //     /  |--> next
            //    / a |   \
            //   *----*----*
            //    \ b |   /
            //     \  |--> prev
            //      \ | /
            //       \|/
            //        *
            prev.next = next
            next.prev = prev
        }
        return discardedFace
    }

    mergeAdjacentFaces(adjacentEdge:HalfEdge, discardedFaces:Face[]) {
        const oppositeEdge = adjacentEdge.opposite;
        const oppositeFace = oppositeEdge.face;

        discardedFaces.push(oppositeFace);
        oppositeFace.mark = FaceMark.DELETED

        // find the chain of edges whose opposite face is `oppositeFace`
        //
        //                ===>
        //      \         face         /
        //       * ---- * ---- * ---- *
        //      /     opposite face    \
        //                <===
        //
        let adjacentEdgePrev = adjacentEdge.prev;
        let adjacentEdgeNext = adjacentEdge.next;
        let oppositeEdgePrev = oppositeEdge.prev;
        let oppositeEdgeNext = oppositeEdge.next;

        // left edge
        while (adjacentEdgePrev.opposite.face === oppositeFace) {
            adjacentEdgePrev = adjacentEdgePrev.prev;
            oppositeEdgeNext = oppositeEdgeNext.next;
        }
        // right edge
        while (adjacentEdgeNext.opposite.face === oppositeFace) {
            adjacentEdgeNext = adjacentEdgeNext.next;
            oppositeEdgePrev = oppositeEdgePrev.prev;
        }
        // adjacentEdgePrev  \         face         / adjacentEdgeNext
        //                    * ---- * ---- * ---- *
        // oppositeEdgeNext  /     opposite face    \ oppositeEdgePrev

        // fix the face reference of all the opposite edges that are not part of
        // the edges whose opposite face is not `face` i.e. all the edges that
        // `face` and `oppositeFace` do not have in common
        let edge;
        for (edge = oppositeEdgeNext; edge !== oppositeEdgePrev.next; edge = edge.next) {
            edge.face = this;
        }

        // make sure that `face.edge` is not one of the edges to be destroyed
        // Note: it's important for it to be a `next` edge since `prev` edges
        // might be destroyed on `connectHalfEdges`
        this.edge = adjacentEdgeNext;

        // connect the extremes
        // Note: it might be possible that after connecting the edges a triangular
        // face might be redundant
        let discardedFace;
        discardedFace = this.connectHalfEdges(oppositeEdgePrev, adjacentEdgeNext);
        if (discardedFace) {
            discardedFaces.push(discardedFace);
        }
        discardedFace = this.connectHalfEdges(adjacentEdgePrev, oppositeEdgeNext);
        if (discardedFace) {
            discardedFaces.push(discardedFace);
        }

        this.computeNormalAndCentroid();
        // TODO: additional consistency checks
        return discardedFaces;
    }

    collectIndices() {
        let indices:number[] = []
        let edge = this.edge
        do {
            indices.push(edge.head().index)
            edge = edge.next
        } while (edge !== this.edge)
        return indices;
    }

    static createTriangle(v0:Vertex, v1:Vertex, v2:Vertex, minArea = 0) {
        const face = new Face();
        const e0 = new HalfEdge(v0, face);
        const e1 = new HalfEdge(v1, face);
        const e2 = new HalfEdge(v2, face);

        // join edges
        e0.next = e2.prev = e1;
        e1.next = e0.prev = e2;
        e2.next = e1.prev = e0;

        // main half edge reference
        face.edge = e0;
        face.computeNormalAndCentroid(minArea);

        return face;
    }
}

enum MergeMode {
    MERGE_NON_CONVEX_WRT_LARGER_FACE = 1,
    MERGE_NON_CONVEX = 2
};

class QuickHull {

    tolerance:number;
    nFaces:number;
    nPoints:number;
    faces:Face[];
    newFaces:Face[];
    claimed:VertexList;
    unclaimed:VertexList;
    vertices:Vertex[];
    discardedFaces:Face[];
    vertexPointIndices:number[];

    constructor(points:Vec3Tuple[]) {
        if (points.length < 4) {
            throw Error('cannot build a simplex out of <4 points');
        }

        this.tolerance = -1;

        // buffers
        this.nFaces = 0;
        this.nPoints = points.length;

        this.faces = [];
        this.newFaces = [];
        // helpers
        //
        // let `a`, `b` be `Face` instances
        // let `v` be points wrapped as instance of `Vertex`
        //
        //     [v, v, ..., v, v, v, ...]
        //      ^             ^
        //      |             |
        //  a.outside     b.outside
        //
        this.claimed = new VertexList();
        this.unclaimed = new VertexList();

        // vertices of the hull(internal representation of points)
        this.vertices = [];
        for (let i = 0; i < points.length; i += 1) {
            this.vertices.push(new Vertex(points[i], i));
        }
        this.discardedFaces = [];
        this.vertexPointIndices = [];
    }

    addVertexToFace(vertex:Vertex, face:Face) {
        vertex.face = face;
        if (!face.outside) {
            this.claimed.add(vertex);
        } else {
            this.claimed.insertBefore(face.outside, vertex);
        }
        face.outside = vertex;
    }

    /**
     * Removes `vertex` for the `claimed` list of vertices, it also makes sure
     * that the link from `face` to the first vertex it sees in `claimed` is
     * linked correctly after the removal
     */
    removeVertexFromFace(vertex: Vertex, face: Face) {
        if (vertex === face.outside) {
            // fix face.outside link
            if (vertex.next && vertex.next.face === face) {
                // face has at least 2 outside vertices, move the `outside` reference
                face.outside = vertex.next;
            } else {
                // vertex was the only outside vertex that face had
                face.outside = null
            }
        }
        this.claimed.remove(vertex)
    }

    /**
     * Removes all the visible vertices that `face` is able to see which are
     * stored in the `claimed` vertext list
     *
     * @param {Face} face
     * @return {Vertex|undefined} If face had visible vertices returns
     * `face.outside`, otherwise undefined
     */
    removeAllVerticesFromFace(face: Face): Vertex | undefined {
        if (face.outside) {
            // pointer to the last vertex of this face
            // [..., outside, ..., end, outside, ...]
            //          |           |      |
            //          a           a      b
            let end = face.outside
            while (end.next && end.next.face === face) {
                end = end.next
            }
            this.claimed.removeChain(face.outside, end)
            //                            b
            //                       [ outside, ...]
            //                            |  removes this link
            //     [ outside, ..., end ] -┘
            //          |           |
            //          a           a
            end.next = null
            return face.outside
        }
    }

    /**
     * Removes all the visible vertices that `face` is able to see, additionally
     * checking the following:
     *
     * If `absorbingFace` doesn't exist then all the removed vertices will be
     * added to the `unclaimed` vertex list
     *
     * If `absorbingFace` exists then this method will assign all the vertices of
     * `face` that can see `absorbingFace`, if a vertex cannot see `absorbingFace`
     * it's added to the `unclaimed` vertex list
     *
     * @param {Face} face
     * @param {Face} [absorbingFace]
     */
    deleteFaceVertices(face: Face, absorbingFace?: Face) {
        const faceVertices = this.removeAllVerticesFromFace(face)
        if (faceVertices) {
            if (!absorbingFace) {
                // mark the vertices to be reassigned to some other face
                this.unclaimed.addAll(faceVertices)
            } else {
                // if there's an absorbing face try to assign as many vertices
                // as possible to it

                // the reference `vertex.next` might be destroyed on
                // `this.addVertexToFace` (see VertexList#add), nextVertex is a
                // reference to it
                let nextVertex
                for (let vertex = faceVertices; vertex; vertex = nextVertex) {
                    nextVertex = vertex.next
                    const distance = absorbingFace.distanceToPlane(vertex.point)

                    // check if `vertex` is able to see `absorbingFace`
                    if (distance > this.tolerance) {
                        this.addVertexToFace(vertex, absorbingFace)
                    } else {
                        this.unclaimed.add(vertex)
                    }
                }
            }
        }
    }

    /**
     * Reassigns as many vertices as possible from the unclaimed list to the new
     * faces
     */
    resolveUnclaimedPoints(newFaces: Face[]) {
        // cache next vertex so that if `vertex.next` is destroyed it's still
        // recoverable
        let vertexNext = this.unclaimed.first()
        for (let vertex = vertexNext; vertex; vertex = vertexNext) {
            vertexNext = vertex.next
            let maxDistance = this.tolerance
            let maxFace
            for (let i = 0; i < newFaces.length; i += 1) {
                let face = newFaces[i]
                if (face.mark === FaceMark.VISIBLE) {
                    const dist = face.distanceToPlane(vertex.point)
                    if (dist > maxDistance) {
                        maxDistance = dist
                        maxFace = face
                    }
                    if (maxDistance > 1000 * this.tolerance) {
                        break
                    }
                }
            }

            if (maxFace) {
                this.addVertexToFace(vertex, maxFace)
            }
        }
    }

    /**
     * Computes the extremes of a tetrahedron which will be the initial hull
     */
    computeExtremes(): [VertexTriple, VertexTriple] {
        const min:Vec3Tuple = [0, 0, 0];
        const max:Vec3Tuple = [0, 0, 0];

        // min vertex on the x,y,z directions
        const minVertices:VertexTriple = [this.vertices[0], this.vertices[0], this.vertices[0]];
        // max vertex on the x,y,z directions
        const maxVertices:VertexTriple = [this.vertices[0], this.vertices[0], this.vertices[0]];

        let i:number, j:number;

        // compute the min/max vertex on all 6 directions
        for (i = 0; i < this.vertices.length; i += 1) {
            const vertex = this.vertices[i];
            const point = vertex.point;
            // update the min coordinates
            for (j = 0; j < 3; j += 1) {
                if (point[j] < min[j]) {
                    min[j] = point[j];
                    minVertices[j] = vertex;
                }
            }
            // update the max coordinates
            for (j = 0; j < 3; j += 1) {
                if (point[j] > max[j]) {
                    max[j] = point[j];
                    maxVertices[j] = vertex;
                }
            }
        }

        // compute epsilon
        this.tolerance = 3 * Number.EPSILON * (
            Math.max(Math.abs(min[0]), Math.abs(max[0])) +
            Math.max(Math.abs(min[1]), Math.abs(max[1])) +
            Math.max(Math.abs(min[2]), Math.abs(max[2]))
        );
        return [minVertices, maxVertices]
    }

    /**
     * Compues the initial tetrahedron assigning to its faces all the points that
     * are candidates to form part of the hull
     */
    createInitialSimplex() {
        const vertices = this.vertices
        const [min, max] = this.computeExtremes()
        let v0:Vertex, v1:Vertex, v2:Vertex, v3:Vertex;
        let i:number, j:number;

        // Find the two vertices with the greatest 1d separation
        // (max.x - min.x)
        // (max.y - min.y)
        // (max.z - min.z)
        let maxDistance = 0;
        let indexMax = 0;
        for (i = 0; i < 3; i += 1) {
            const distance = max[i].point[i] - min[i].point[i];
            if (distance > maxDistance) {
                maxDistance = distance;
                indexMax = i;
            }
        }
        v0 = min[indexMax];
        v1 = max[indexMax];
        // the next vertex is the one farthest to the line formed by `v0` and `v1`
        maxDistance = 0;
        for (i = 0; i < this.vertices.length; i += 1) {
            const vertex = this.vertices[i];
            if (vertex !== v0 && vertex !== v1) {
                const distance = pointLineDistance(
                    vertex.point, v0.point, v1.point
                );
                if (distance > maxDistance) {
                    maxDistance = distance;
                    v2 = vertex;
                }
            }
        }

        // the next vertes is the one farthest to the plane `v0`, `v1`, `v2`
        // normalize((v2 - v1) x (v0 - v1))
        const normal = getPlaneNormal([0, 0, 0], v0.point, v1.point, v2.point);
        // distance from the origin to the plane
        const distPO = dot(v0.point, normal);
        maxDistance = -1;
        for (i = 0; i < this.vertices.length; i += 1) {
            const vertex = this.vertices[i]
            if (vertex !== v0 && vertex !== v1 && vertex !== v2) {
                const distance = Math.abs(dot(normal, vertex.point) - distPO);
                if (distance > maxDistance) {
                    maxDistance = distance;
                    v3 = vertex;
                }
            }
        }

        // initial simplex
        // Taken from http://everything2.com/title/How+to+paint+a+tetrahedron
        //
        //                              v2
        //                             ,|,
        //                           ,7``\'VA,
        //                         ,7`   |, `'VA,
        //                       ,7`     `\    `'VA,
        //                     ,7`        |,      `'VA,
        //                   ,7`          `\         `'VA,
        //                 ,7`             |,           `'VA,
        //               ,7`               `\       ,..ooOOTK` v3
        //             ,7`                  |,.ooOOT''`    AV
        //           ,7`            ,..ooOOT`\`           /7
        //         ,7`      ,..ooOOT''`      |,          AV
        //        ,T,..ooOOT''`              `\         /7
        //     v0 `'TTs.,                     |,       AV
        //            `'TTs.,                 `\      /7
        //                 `'TTs.,             |,    AV
        //                      `'TTs.,        `\   /7
        //                           `'TTs.,    |, AV
        //                                `'TTs.,\/7
        //                                     `'T`
        //                                       v1
        //
        const faces = [];
        if (dot(v3.point, normal) - distPO < 0) {
            // the face is not able to see the point so `planeNormal`
            // is pointing outside the tetrahedron
            faces.push(
                Face.createTriangle(v0, v1, v2),
                Face.createTriangle(v3, v1, v0),
                Face.createTriangle(v3, v2, v1),
                Face.createTriangle(v3, v0, v2)
            );

            // set the opposite edge
            for (i = 0; i < 3; i += 1) {
                let j = (i + 1) % 3;
                // join face[i] i > 0, with the first face
                faces[i + 1].getEdge(2).setOpposite(faces[0].getEdge(j));
                // join face[i] with face[i + 1], 1 <= i <= 3
                faces[i + 1].getEdge(1).setOpposite(faces[j + 1].getEdge(0));
            }
        } else {
            // the face is able to see the point so `planeNormal`
            // is pointing inside the tetrahedron
            faces.push(
                Face.createTriangle(v0, v2, v1),
                Face.createTriangle(v3, v0, v1),
                Face.createTriangle(v3, v1, v2),
                Face.createTriangle(v3, v2, v0)
            );

            // set the opposite edge
            for (i = 0; i < 3; i += 1) {
                let j = (i + 1) % 3;
                // join face[i] i > 0, with the first face
                faces[i + 1].getEdge(2).setOpposite(faces[0].getEdge((3 - i) % 3));
                // join face[i] with face[i + 1]
                faces[i + 1].getEdge(0).setOpposite(faces[j + 1].getEdge(1));
            }
        }

        // the initial hull is the tetrahedron
        for (i = 0; i < 4; i += 1) {
            this.faces.push(faces[i]);
        }

        // initial assignment of vertices to the faces of the tetrahedron
        for (i = 0; i < vertices.length; i += 1) {
            const vertex = vertices[i]
            if (vertex !== v0 && vertex !== v1 && vertex !== v2 && vertex !== v3) {
                maxDistance = this.tolerance;
                let maxFace;
                for (j = 0; j < 4; j += 1) {
                    const distance = faces[j].distanceToPlane(vertex.point);
                    if (distance > maxDistance) {
                        maxDistance = distance;
                        maxFace = faces[j];
                    }
                }

                if (maxFace) {
                    this.addVertexToFace(vertex, maxFace);
                }
            }
        }
    }

    reindexFaceAndVertices() {
        // remove inactive faces
        let activeFaces = []
        for (let i = 0; i < this.faces.length; i += 1) {
            let face = this.faces[i];
            if (face.mark === FaceMark.VISIBLE) {
                activeFaces.push(face);
            }
        }
        this.faces = activeFaces;
    }

    collectFaces(skipTriangulation:boolean) {
        let faceIndices = []
        for (let i = 0; i < this.faces.length; i += 1) {
            if (this.faces[i].mark !== FaceMark.VISIBLE) {
                throw Error('attempt to include a destroyed face in the hull');
            }
            let indices = this.faces[i].collectIndices();
            if (skipTriangulation) {
                faceIndices.push(indices);
            } else {
                for (let j = 0; j < indices.length - 2; j += 1) {
                    faceIndices.push(
                        [indices[0], indices[j + 1], indices[j + 2]]
                    );
                }
            }
        }
        return faceIndices;
    }

    /**
     * Finds the next vertex to make faces with the current hull
     *
     * - let `face` be the first face existing in the `claimed` vertex list
     *  - if `face` doesn't exist then return since there're no vertices left
     *  - otherwise for each `vertex` that face sees find the one furthest away
     *  from `face`
     *
     * @return Returns undefined when there're no more visible vertices
     */
    nextVertexToAdd(): Vertex | undefined {
        if (!this.claimed.isEmpty()) {
            let eyeVertex, vertex;
            let maxDistance = 0;
            const eyeFace = this.claimed.first().face;
            for (vertex = eyeFace.outside; vertex && vertex.face === eyeFace; vertex = vertex.next) {
                let distance = eyeFace.distanceToPlane(vertex.point);
                if (distance > maxDistance) {
                    maxDistance = distance;
                    eyeVertex = vertex;
                }
            }
            return eyeVertex;
        }
    }

    /**
     * Computes a chain of half edges in ccw order called the `horizon`, for an
     * edge to be part of the horizon it must join a face that can see
     * `eyePoint` and a face that cannot see `eyePoint`
     *
     * @param eyePoint - The coordinates of a point
     * @param crossEdge - The edge used to jump to the current `face`
     * @param face - The current face being tested
     * @param horizon - The edges that form part of the horizon in
     * ccw order
     */
    computeHorizon(eyePoint: Vec3Tuple, crossEdge: HalfEdge, face: Face, horizon: HalfEdge[]) {
        // moves face's vertices to the `unclaimed` vertex list
        this.deleteFaceVertices(face);

        face.mark = FaceMark.DELETED;

        let edge;
        if (!crossEdge) {
            edge = crossEdge = face.getEdge(0);
        } else {
            // start from the next edge since `crossEdge` was already analyzed
            // (actually `crossEdge.opposite` was the face who called this method
            // recursively)
            edge = crossEdge.next;
        }

        // All the faces that are able to see `eyeVertex` are defined as follows
        //
        //       v    /
        //           / <== visible face
        //          /
        //         |
        //         | <== not visible face
        //
        //  dot(v, visible face normal) - visible face offset > this.tolerance
        //
        do {
            let oppositeEdge = edge.opposite;
            let oppositeFace = oppositeEdge.face;
            if (oppositeFace.mark === FaceMark.VISIBLE) {
                if (oppositeFace.distanceToPlane(eyePoint) > this.tolerance) {
                    this.computeHorizon(eyePoint, oppositeEdge, oppositeFace, horizon);
                } else {
                    horizon.push(edge);
                }
            }
            edge = edge.next;
        } while (edge !== crossEdge);
    }

    /**
     * Creates a face with the points `eyeVertex.point`, `horizonEdge.tail` and
     * `horizonEdge.tail` in ccw order
     *
     * @param eyeVertex
     * @param horizonEdge
     * @return The half edge whose vertex is the eyeVertex
     */
    addAdjoiningFace(eyeVertex: Vertex, horizonEdge: HalfEdge): HalfEdge {
        // all the half edges are created in ccw order thus the face is always
        // pointing outside the hull
        // edges:
        //
        //                  eyeVertex.point
        //                       / \
        //                      /   \
        //                  1  /     \  0
        //                    /       \
        //                   /         \
        //                  /           \
        //          horizon.tail --- horizon.head
        //                        2
        //
        let face = Face.createTriangle(
            eyeVertex,
            horizonEdge.tail(),
            horizonEdge.head()
        );
        this.faces.push(face);
        // join face.getEdge(-1) with the horizon's opposite edge
        // face.getEdge(-1) = face.getEdge(2)
        face.getEdge(-1).setOpposite(horizonEdge.opposite);
        return face.getEdge(0);
    }

    /**
     * Adds horizon.length faces to the hull, each face will be 'linked' with the
     * horizon opposite face and the face on the left/right
     *
     * @param {Vertex} eyeVertex
     * @param {HalfEdge[]} horizon - A chain of half edges in ccw order
     */
    addNewFaces(eyeVertex: Vertex, horizon: HalfEdge[]) {
        this.newFaces = []
        let firstSideEdge, previousSideEdge
        for (let i = 0; i < horizon.length; i += 1) {
            const horizonEdge = horizon[i]
            // returns the right side edge
            const sideEdge = this.addAdjoiningFace(eyeVertex, horizonEdge)
            if (!firstSideEdge) {
                firstSideEdge = sideEdge
            } else {
                // joins face.getEdge(1) with previousFace.getEdge(0)
                sideEdge.next.setOpposite(previousSideEdge)
            }
            this.newFaces.push(sideEdge.face)
            previousSideEdge = sideEdge
        }
        firstSideEdge.next.setOpposite(previousSideEdge)
    }

    /**
     * Computes the distance from `edge` opposite face's centroid to
     * `edge.face`
     *
     * @param {HalfEdge} edge
     * @return {number}
     * - A positive number when the centroid of the opposite face is above the
     *   face i.e. when the faces are concave
     * - A negative number when the centroid of the opposite face is below the
     *   face i.e. when the faces are convex
     */
    oppositeFaceDistance(edge: HalfEdge): number {
        return edge.face.distanceToPlane(edge.opposite.face.centroid)
    }

    /**
     * Merges a face with none/any/all its neighbors according to the strategy
     * used
     *
     * if `mergeType` is MERGE_NON_CONVEX_WRT_LARGER_FACE then the merge will be
     * decided based on the face with the larger area, the centroid of the face
     * with the smaller area will be checked against the one with the larger area
     * to see if it's in the merge range [tolerance, -tolerance] i.e.
     *
     *    dot(centroid smaller face, larger face normal) - larger face offset > -tolerance
     *
     * Note that the first check (with +tolerance) was done on `computeHorizon`
     *
     * If the above is not true then the check is done with respect to the smaller
     * face i.e.
     *
     *    dot(centroid larger face, smaller face normal) - smaller face offset > -tolerance
     *
     * If true then it means that two faces are non convex (concave), even if the
     * dot(...) - offset value is > 0 (that's the point of doing the merge in the
     * first place)
     *
     * If two faces are concave then the check must also be done on the other face
     * but this is done in another merge pass, for this to happen the face is
     * marked in a temporal NON_CONVEX state
     *
     * if `mergeType` is MERGE_NON_CONVEX then two faces will be merged only if
     * they pass the following conditions
     *
     *    dot(centroid smaller face, larger face normal) - larger face offset > -tolerance
     *    dot(centroid larger face, smaller face normal) - smaller face offset > -tolerance
     *
     * @param face
     * @param mergeType - Either MERGE_NON_CONVEX_WRT_LARGER_FACE or
     * MERGE_NON_CONVEX
     */
    doAdjacentMerge(face: Face, mergeType: MergeMode) {
        let edge = face.edge;
        let convex = true;
        let it = 0;
        do {
            if (it >= face.nVertices) {
                throw Error('merge recursion limit exceeded');
            }
            const oppositeFace = edge.opposite.face;
            let merge = false;

            // Important notes about the algorithm to merge faces
            //
            // - Given a vertex `eyeVertex` that will be added to the hull
            //   all the faces that cannot see `eyeVertex` are defined as follows
            //
            //      dot(v, not visible face normal) - not visible offset < tolerance
            //
            // - Two faces can be merged when the centroid of one of these faces
            // projected to the normal of the other face minus the other face offset
            // is in the range [tolerance, -tolerance]
            // - Since `face` (given in the input for this method) has passed the
            // check above we only have to check the lower bound e.g.
            //
            //      dot(v, not visible face normal) - not visible offset > -tolerance
            //
            if (mergeType === MergeMode.MERGE_NON_CONVEX) {
                if (this.oppositeFaceDistance(edge) > -this.tolerance ||
                    this.oppositeFaceDistance(edge.opposite) > -this.tolerance) {
                    merge = true;
                }
            } else {
                if (face.area > oppositeFace.area) {
                    if (this.oppositeFaceDistance(edge) > -this.tolerance) {
                        merge = true;
                    } else if (this.oppositeFaceDistance(edge.opposite) > -this.tolerance) {
                        convex = false;
                    }
                } else {
                    if (this.oppositeFaceDistance(edge.opposite) > -this.tolerance) {
                        merge = true;
                    } else if (this.oppositeFaceDistance(edge) > -this.tolerance) {
                        convex = false;
                    }
                }
            }

            if (merge) {
                // when two faces are merged it might be possible that redundant faces
                // are destroyed, in that case move all the visible vertices from the
                // destroyed faces to the `unclaimed` vertex list
                let discardedFaces = face.mergeAdjacentFaces(edge, []);
                for (let i = 0; i < discardedFaces.length; i += 1) {
                    this.deleteFaceVertices(discardedFaces[i], face);
                }
                return true
            }

            edge = edge.next;
            it += 1;
        } while (edge !== face.edge);
        if (!convex) {
            face.mark = FaceMark.NON_CONVEX;
        }
        return false;
    }

    /**
     * Adds a vertex to the hull with the following algorithm
     *
     * - Compute the `horizon` which is a chain of half edges, for an edge to
     *   belong to this group it must be the edge connecting a face that can
     *   see `eyeVertex` and a face which cannot see `eyeVertex`
     * - All the faces that can see `eyeVertex` have its visible vertices removed
     *   from the claimed VertexList
     * - A new set of faces is created with each edge of the `horizon` and
     *   `eyeVertex`, each face is connected with the opposite horizon face and
     *   the face on the left/right
     * - The new faces are merged if possible with the opposite horizon face first
     *   and then the faces on the right/left
     * - The vertices removed from all the visible faces are assigned to the new
     *   faces if possible
     *
     * @param eyeVertex
     */
    addVertexToHull(eyeVertex: Vertex) {
        const horizon:HalfEdge[] = [];

        this.unclaimed.clear();

        // remove `eyeVertex` from `eyeVertex.face` so that it can't be added to the
        // `unclaimed` vertex list
        this.removeVertexFromFace(eyeVertex, eyeVertex.face);
        this.computeHorizon(eyeVertex.point, null, eyeVertex.face, horizon);
        this.addNewFaces(eyeVertex, horizon);

        // first merge pass
        // Do the merge with respect to the larger face
        for (let i = 0; i < this.newFaces.length; i += 1) {
            const face = this.newFaces[i];
            if (face.mark === FaceMark.VISIBLE) {
                while (this.doAdjacentMerge(face, MergeMode.MERGE_NON_CONVEX_WRT_LARGER_FACE)) { }
            }
        }

        // second merge pass
        // Do the merge on non convex faces (a face is marked as non convex in the
        // first pass)
        for (let i = 0; i < this.newFaces.length; i += 1) {
            const face = this.newFaces[i];
            if (face.mark === FaceMark.NON_CONVEX) {
                face.mark = FaceMark.VISIBLE;
                while (this.doAdjacentMerge(face, MergeMode.MERGE_NON_CONVEX)) { }
            }
        }
        // reassign `unclaimed` vertices to the new faces
        this.resolveUnclaimedPoints(this.newFaces);
    }

    build() {
        let iterations = 0;
        let eyeVertex:Vertex;
        this.createInitialSimplex();
        while ((eyeVertex = this.nextVertexToAdd())) {
            iterations += 1;
            this.addVertexToHull(eyeVertex);
        }
        this.reindexFaceAndVertices();
    }

    static createHull(points: (Vector3 | Vec3Tuple)[]): Array<Array<number>> {
        points = points.slice();
        for (var pti = 0; pti < points.length; pti++) {
            let pt = points[pti];
            if (Array.isArray(pt)) {

            } else {
                points[pti] = [pt.x, pt.y, pt.z];
            }
        }
        let hull = new QuickHull(points as Vec3Tuple[]);
        hull.build();
        let faces = hull.collectFaces(false);
        return faces;
    }
}

export { QuickHull };