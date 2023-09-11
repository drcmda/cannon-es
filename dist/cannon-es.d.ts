declare module "utils/EventTarget" {
    export class EventTarget {
        private _listeners;
        addEventListener(type: string, listener: Function): EventTarget;
        hasEventListener(type: string, listener: Function): boolean;
        hasAnyEventListener(type: string): boolean;
        removeEventListener(type: string, listener: Function): EventTarget;
        dispatchEvent(event: any): EventTarget;
    }
}
declare module "math/Quaternion" {
    import { Vec3 } from "math/Vec3";
    export class Quaternion {
        x: number;
        y: number;
        z: number;
        w: number;
        constructor(x?: number, y?: number, z?: number, w?: number);
        set(x: number, y: number, z: number, w: number): Quaternion;
        toString(): string;
        toArray(): [number, number, number, number];
        setFromAxisAngle(vector: Vec3, angle: number): Quaternion;
        toAxisAngle(targetAxis?: Vec3): [Vec3, number];
        setFromVectors(u: Vec3, v: Vec3): Quaternion;
        mult(quat: Quaternion, target?: Quaternion): Quaternion;
        inverse(target?: Quaternion): Quaternion;
        conjugate(target?: Quaternion): Quaternion;
        normalize(): Quaternion;
        normalizeFast(): Quaternion;
        vmult(v: Vec3, target?: Vec3): Vec3;
        copy(quat: Quaternion): Quaternion;
        toEuler(target: Vec3, order?: string): void;
        setFromEuler(x: number, y: number, z: number, order?: string): Quaternion;
        clone(): Quaternion;
        slerp(toQuat: Quaternion, t: number, target?: Quaternion): Quaternion;
        integrate(angularVelocity: Vec3, dt: number, angularFactor: Vec3, target?: Quaternion): Quaternion;
    }
}
declare module "math/Mat3" {
    import { Vec3 } from "math/Vec3";
    import type { Quaternion } from "math/Quaternion";
    export class Mat3 {
        elements: number[];
        constructor(elements?: number[]);
        identity(): void;
        setZero(): void;
        setTrace(vector: Vec3): void;
        getTrace(target?: Vec3): Vec3;
        vmult(v: Vec3, target?: Vec3): Vec3;
        smult(s: number): void;
        mmult(matrix: Mat3, target?: Mat3): Mat3;
        scale(vector: Vec3, target?: Mat3): Mat3;
        solve(b: Vec3, target?: Vec3): Vec3;
        e(row: number, column: number): number;
        e(row: number, column: number, value: number): void;
        copy(matrix: Mat3): Mat3;
        toString(): string;
        reverse(target?: Mat3): Mat3;
        setRotationFromQuaternion(q: Quaternion): Mat3;
        transpose(target?: Mat3): Mat3;
    }
}
declare module "math/Vec3" {
    import { Mat3 } from "math/Mat3";
    export class Vec3 {
        x: number;
        y: number;
        z: number;
        static ZERO: Vec3;
        static UNIT_X: Vec3;
        static UNIT_Y: Vec3;
        static UNIT_Z: Vec3;
        constructor(x?: number, y?: number, z?: number);
        cross(vector: Vec3, target?: Vec3): Vec3;
        set(x: number, y: number, z: number): Vec3;
        setZero(): void;
        vadd(vector: Vec3): Vec3;
        vadd(vector: Vec3, target: Vec3): void;
        vsub(vector: Vec3): Vec3;
        vsub(vector: Vec3, target: Vec3): void;
        crossmat(): Mat3;
        normalize(): number;
        unit(target?: Vec3): Vec3;
        length(): number;
        lengthSquared(): number;
        distanceTo(p: Vec3): number;
        distanceSquared(p: Vec3): number;
        scale(scalar: number, target?: Vec3): Vec3;
        vmul(vector: Vec3, target?: Vec3): Vec3;
        addScaledVector(scalar: number, vector: Vec3, target?: Vec3): Vec3;
        dot(vector: Vec3): number;
        isZero(): boolean;
        negate(target?: Vec3): Vec3;
        tangents(t1: Vec3, t2: Vec3): void;
        toString(): string;
        toArray(): [number, number, number];
        copy(vector: Vec3): Vec3;
        lerp(vector: Vec3, t: number, target: Vec3): void;
        almostEquals(vector: Vec3, precision?: number): boolean;
        almostZero(precision?: number): boolean;
        isAntiparallelTo(vector: Vec3, precision?: number): boolean;
        clone(): Vec3;
    }
}
declare module "math/Transform" {
    import { Vec3 } from "math/Vec3";
    import { Quaternion } from "math/Quaternion";
    export type TransformOptions = ConstructorParameters<typeof Transform>[0];
    export class Transform {
        position: Vec3;
        quaternion: Quaternion;
        constructor(options?: {
            position?: Vec3;
            quaternion?: Quaternion;
        });
        pointToLocal(worldPoint: Vec3, result?: Vec3): Vec3;
        pointToWorld(localPoint: Vec3, result?: Vec3): Vec3;
        vectorToWorldFrame(localVector: Vec3, result?: Vec3): Vec3;
        static pointToLocalFrame(position: Vec3, quaternion: Quaternion, worldPoint: Vec3, result?: Vec3): Vec3;
        static pointToWorldFrame(position: Vec3, quaternion: Quaternion, localPoint: Vec3, result?: Vec3): Vec3;
        static vectorToWorldFrame(quaternion: Quaternion, localVector: Vec3, result?: Vec3): Vec3;
        static vectorToLocalFrame(position: Vec3, quaternion: Quaternion, worldVector: Vec3, result?: Vec3): Vec3;
    }
}
declare module "material/Material" {
    export type MaterialOptions = ConstructorParameters<typeof Material>[0];
    export class Material {
        name: string;
        id: number;
        friction: number;
        restitution: number;
        static idCounter: number;
        constructor(options?: {
            friction?: number;
            restitution?: number;
        } | string);
    }
}
declare module "shapes/Shape" {
    import type { Vec3 } from "math/Vec3";
    import type { Quaternion } from "math/Quaternion";
    import type { Body } from "objects/Body";
    import type { Material } from "material/Material";
    export const SHAPE_TYPES: {
        readonly SPHERE: 1;
        readonly PLANE: 2;
        readonly BOX: 4;
        readonly COMPOUND: 8;
        readonly CONVEXPOLYHEDRON: 16;
        readonly HEIGHTFIELD: 32;
        readonly PARTICLE: 64;
        readonly CYLINDER: 128;
        readonly TRIMESH: 256;
    };
    export type ShapeType = (typeof SHAPE_TYPES)[keyof typeof SHAPE_TYPES];
    export type ShapeOptions = ConstructorParameters<typeof Shape>[0];
    export class Shape {
        id: number;
        type: ShapeType | 0;
        boundingSphereRadius: number;
        collisionResponse: boolean;
        collisionFilterGroup: number;
        collisionFilterMask: number;
        material: Material | null;
        body: Body | null;
        static idCounter: number;
        static types: {
            readonly SPHERE: 1;
            readonly PLANE: 2;
            readonly BOX: 4;
            readonly COMPOUND: 8;
            readonly CONVEXPOLYHEDRON: 16;
            readonly HEIGHTFIELD: 32;
            readonly PARTICLE: 64;
            readonly CYLINDER: 128;
            readonly TRIMESH: 256;
        };
        constructor(options?: {
            type?: ShapeType;
            collisionResponse?: boolean;
            collisionFilterGroup?: number;
            collisionFilterMask?: number;
            material?: Material;
        });
        updateBoundingSphereRadius(): void;
        volume(): number;
        calculateLocalInertia(mass: number, target: Vec3): void;
        calculateWorldAABB(pos: Vec3, quat: Quaternion, min: Vec3, max: Vec3): void;
    }
}
declare module "collision/RaycastResult" {
    import { Vec3 } from "math/Vec3";
    import type { Body } from "objects/Body";
    import type { Shape } from "shapes/Shape";
    export class RaycastResult {
        rayFromWorld: Vec3;
        rayToWorld: Vec3;
        hitNormalWorld: Vec3;
        hitPointWorld: Vec3;
        hasHit: boolean;
        shape: Shape | null;
        body: Body | null;
        hitFaceIndex: number;
        distance: number;
        shouldStop: boolean;
        constructor();
        reset(): void;
        abort(): void;
        set(rayFromWorld: Vec3, rayToWorld: Vec3, hitNormalWorld: Vec3, hitPointWorld: Vec3, shape: Shape, body: Body, distance: number): void;
    }
}
declare module "shapes/Sphere" {
    import { Shape } from "shapes/Shape";
    import { Vec3 } from "math/Vec3";
    import type { Quaternion } from "math/Quaternion";
    export class Sphere extends Shape {
        radius: number;
        constructor(radius: number);
        calculateLocalInertia(mass: number, target?: Vec3): Vec3;
        volume(): number;
        updateBoundingSphereRadius(): void;
        calculateWorldAABB(pos: Vec3, quat: Quaternion, min: Vec3, max: Vec3): void;
    }
}
declare module "shapes/ConvexPolyhedron" {
    import { Shape } from "shapes/Shape";
    import { Vec3 } from "math/Vec3";
    import type { Quaternion } from "math/Quaternion";
    export type ConvexPolyhedronContactPoint = {
        point: Vec3;
        normal: Vec3;
        depth: number;
    };
    export class ConvexPolyhedron extends Shape {
        vertices: Vec3[];
        faces: number[][];
        faceNormals: Vec3[];
        worldVertices: Vec3[];
        worldVerticesNeedsUpdate: boolean;
        worldFaceNormals: Vec3[];
        worldFaceNormalsNeedsUpdate: boolean;
        uniqueAxes: Vec3[] | null;
        uniqueEdges: Vec3[];
        constructor(props?: {
            vertices?: Vec3[];
            faces?: number[][];
            normals?: Vec3[];
            axes?: Vec3[];
            boundingSphereRadius?: number;
        });
        computeEdges(): void;
        computeNormals(): void;
        getFaceNormal(i: number, target: Vec3): void;
        static computeNormal(va: Vec3, vb: Vec3, vc: Vec3, target: Vec3): void;
        clipAgainstHull(posA: Vec3, quatA: Quaternion, hullB: ConvexPolyhedron, posB: Vec3, quatB: Quaternion, separatingNormal: Vec3, minDist: number, maxDist: number, result: ConvexPolyhedronContactPoint[]): void;
        findSeparatingAxis(hullB: ConvexPolyhedron, posA: Vec3, quatA: Quaternion, posB: Vec3, quatB: Quaternion, target: Vec3, faceListA?: number[] | null, faceListB?: number[] | null): boolean;
        testSepAxis(axis: Vec3, hullB: ConvexPolyhedron, posA: Vec3, quatA: Quaternion, posB: Vec3, quatB: Quaternion): number | false;
        calculateLocalInertia(mass: number, target: Vec3): void;
        getPlaneConstantOfFace(face_i: number): number;
        clipFaceAgainstHull(separatingNormal: Vec3, posA: Vec3, quatA: Quaternion, worldVertsB1: Vec3[], minDist: number, maxDist: number, result: ConvexPolyhedronContactPoint[]): void;
        clipFaceAgainstPlane(inVertices: Vec3[], outVertices: Vec3[], planeNormal: Vec3, planeConstant: number): Vec3[];
        computeWorldVertices(position: Vec3, quat: Quaternion): void;
        computeLocalAABB(aabbmin: Vec3, aabbmax: Vec3): void;
        computeWorldFaceNormals(quat: Quaternion): void;
        updateBoundingSphereRadius(): void;
        calculateWorldAABB(pos: Vec3, quat: Quaternion, min: Vec3, max: Vec3): void;
        volume(): number;
        getAveragePointLocal(target?: Vec3): Vec3;
        transformAllPoints(offset: Vec3, quat: Quaternion): void;
        pointIsInside(p: Vec3): 1 | -1 | false;
        static project(shape: ConvexPolyhedron, axis: Vec3, pos: Vec3, quat: Quaternion, result: number[]): void;
    }
}
declare module "shapes/Box" {
    import { Shape } from "shapes/Shape";
    import { Vec3 } from "math/Vec3";
    import { ConvexPolyhedron } from "shapes/ConvexPolyhedron";
    import type { Quaternion } from "math/Quaternion";
    export class Box extends Shape {
        halfExtents: Vec3;
        convexPolyhedronRepresentation: ConvexPolyhedron;
        constructor(halfExtents: Vec3);
        updateConvexPolyhedronRepresentation(): void;
        calculateLocalInertia(mass: number, target?: Vec3): Vec3;
        static calculateInertia(halfExtents: Vec3, mass: number, target: Vec3): void;
        getSideNormals(sixTargetVectors: Vec3[], quat: Quaternion): Vec3[];
        volume(): number;
        updateBoundingSphereRadius(): void;
        forEachWorldCorner(pos: Vec3, quat: Quaternion, callback: (x: number, y: number, z: number) => void): void;
        calculateWorldAABB(pos: Vec3, quat: Quaternion, min: Vec3, max: Vec3): void;
    }
}
declare module "shapes/Plane" {
    import { Shape } from "shapes/Shape";
    import { Vec3 } from "math/Vec3";
    import type { Quaternion } from "math/Quaternion";
    export class Plane extends Shape {
        worldNormal: Vec3;
        worldNormalNeedsUpdate: boolean;
        boundingSphereRadius: number;
        constructor();
        computeWorldNormal(quat: Quaternion): void;
        calculateLocalInertia(mass: number, target?: Vec3): Vec3;
        volume(): number;
        calculateWorldAABB(pos: Vec3, quat: Quaternion, min: Vec3, max: Vec3): void;
        updateBoundingSphereRadius(): void;
    }
}
declare module "utils/Utils" {
    export class Utils {
        static defaults(options: Record<string, any> | undefined, defaults: Record<string, any>): Record<string, any>;
    }
}
declare module "shapes/Heightfield" {
    import { Shape } from "shapes/Shape";
    import { ConvexPolyhedron } from "shapes/ConvexPolyhedron";
    import { Vec3 } from "math/Vec3";
    import type { AABB } from "collision/AABB";
    import type { Quaternion } from "math/Quaternion";
    export type HeightfieldOptions = ConstructorParameters<typeof Heightfield>[1];
    type HeightfieldPillar = {
        convex: any;
        offset: any;
    };
    export class Heightfield extends Shape {
        data: number[][];
        maxValue: number | null;
        minValue: number | null;
        elementSize: number;
        cacheEnabled: boolean;
        pillarConvex: ConvexPolyhedron;
        pillarOffset: Vec3;
        private _cachedPillars;
        constructor(data: number[][], options?: {
            maxValue?: number | null;
            minValue?: number | null;
            elementSize?: number;
        });
        update(): void;
        updateMinValue(): void;
        updateMaxValue(): void;
        setHeightValueAtIndex(xi: number, yi: number, value: number): void;
        getRectMinMax(iMinX: number, iMinY: number, iMaxX: number, iMaxY: number, result?: number[]): void;
        getIndexOfPosition(x: number, y: number, result: number[], clamp: boolean): boolean;
        getTriangleAt(x: number, y: number, edgeClamp: boolean, a: Vec3, b: Vec3, c: Vec3): boolean;
        getNormalAt(x: number, y: number, edgeClamp: boolean, result: Vec3): void;
        getAabbAtIndex(xi: number, yi: number, { lowerBound, upperBound }: AABB): void;
        getHeightAt(x: number, y: number, edgeClamp: boolean): number;
        getCacheConvexTrianglePillarKey(xi: number, yi: number, getUpperTriangle: boolean): string;
        getCachedConvexTrianglePillar(xi: number, yi: number, getUpperTriangle: boolean): HeightfieldPillar;
        setCachedConvexTrianglePillar(xi: number, yi: number, getUpperTriangle: boolean, convex: ConvexPolyhedron, offset: Vec3): void;
        clearCachedConvexTrianglePillar(xi: number, yi: number, getUpperTriangle: boolean): void;
        getTriangle(xi: number, yi: number, upper: boolean, a: Vec3, b: Vec3, c: Vec3): void;
        getConvexTrianglePillar(xi: number, yi: number, getUpperTriangle: boolean): void;
        calculateLocalInertia(mass: number, target?: Vec3): Vec3;
        volume(): number;
        calculateWorldAABB(pos: Vec3, quat: Quaternion, min: Vec3, max: Vec3): void;
        updateBoundingSphereRadius(): void;
        setHeightsFromImage(image: HTMLImageElement, scale: Vec3): void;
    }
}
declare module "utils/Octree" {
    import { AABB } from "collision/AABB";
    import type { Transform } from "math/Transform";
    import type { Ray } from "collision/Ray";
    class OctreeNode {
        root: OctreeNode | null;
        aabb: AABB;
        data: number[];
        children: OctreeNode[];
        constructor(options?: {
            root?: Octree | null;
            aabb?: AABB;
        });
        reset(): void;
        insert(aabb: AABB, elementData: number, level?: number): boolean;
        subdivide(): void;
        aabbQuery(aabb: AABB, result: number[]): number[];
        rayQuery(ray: Ray, treeTransform: Transform, result: number[]): number[];
        removeEmptyNodes(): void;
    }
    export class Octree extends OctreeNode {
        maxDepth: number;
        constructor(aabb?: AABB, options?: {
            maxDepth?: number;
        });
    }
}
declare module "shapes/Trimesh" {
    import { Shape } from "shapes/Shape";
    import { Vec3 } from "math/Vec3";
    import { AABB } from "collision/AABB";
    import { Octree } from "utils/Octree";
    import type { Quaternion } from "math/Quaternion";
    export class Trimesh extends Shape {
        vertices: Float32Array;
        indices: Int16Array;
        normals: Float32Array;
        aabb: AABB;
        edges: Int16Array | null;
        scale: Vec3;
        tree: Octree;
        constructor(vertices: number[], indices: number[]);
        updateTree(): void;
        getTrianglesInAABB(aabb: AABB, result: number[]): number[];
        setScale(scale: Vec3): void;
        updateNormals(): void;
        updateEdges(): void;
        getEdgeVertex(edgeIndex: number, firstOrSecond: number, vertexStore: Vec3): void;
        getEdgeVector(edgeIndex: number, vectorStore: Vec3): void;
        static computeNormal(va: Vec3, vb: Vec3, vc: Vec3, target: Vec3): void;
        getVertex(i: number, out: Vec3): Vec3;
        private _getUnscaledVertex;
        getWorldVertex(i: number, pos: Vec3, quat: Quaternion, out: Vec3): Vec3;
        getTriangleVertices(i: number, a: Vec3, b: Vec3, c: Vec3): void;
        getNormal(i: number, target: Vec3): Vec3;
        calculateLocalInertia(mass: number, target: Vec3): Vec3;
        computeLocalAABB(aabb: AABB): void;
        updateAABB(): void;
        updateBoundingSphereRadius(): void;
        calculateWorldAABB(pos: Vec3, quat: Quaternion, min: Vec3, max: Vec3): void;
        volume(): number;
        static createTorus(radius?: number, tube?: number, radialSegments?: number, tubularSegments?: number, arc?: number): Trimesh;
    }
}
declare module "math/JacobianElement" {
    import { Vec3 } from "math/Vec3";
    export class JacobianElement {
        spatial: Vec3;
        rotational: Vec3;
        constructor();
        multiplyElement(element: JacobianElement): number;
        multiplyVectors(spatial: Vec3, rotational: Vec3): number;
    }
}
declare module "equations/Equation" {
    import { JacobianElement } from "math/JacobianElement";
    import type { Body } from "objects/Body";
    import type { Shape } from "shapes/Shape";
    export class Equation {
        id: number;
        minForce: number;
        maxForce: number;
        bi: Body;
        bj: Body;
        si: Shape;
        sj: Shape;
        a: number;
        b: number;
        eps: number;
        jacobianElementA: JacobianElement;
        jacobianElementB: JacobianElement;
        enabled: boolean;
        multiplier: number;
        static idCounter: number;
        constructor(bi: Body, bj: Body, minForce?: number, maxForce?: number);
        setSpookParams(stiffness: number, relaxation: number, timeStep: number): void;
        computeB(a: number, b: number, h: number): number;
        computeGq(): number;
        computeGW(): number;
        computeGWlambda(): number;
        computeGiMf(): number;
        computeGiMGt(): number;
        addToWlambda(deltalambda: number): void;
        computeC(): number;
    }
}
declare module "solver/Solver" {
    import type { Equation } from "equations/Equation";
    import type { World } from "world/World";
    export class Solver {
        equations: Equation[];
        constructor();
        solve(dt: number, world: World): number;
        addEquation(eq: Equation): void;
        removeEquation(eq: Equation): void;
        removeAllEquations(): void;
    }
}
declare module "solver/GSSolver" {
    import { Solver } from "solver/Solver";
    import type { World } from "world/World";
    export class GSSolver extends Solver {
        iterations: number;
        tolerance: number;
        constructor();
        solve(dt: number, world: World): number;
    }
}
declare module "collision/Broadphase" {
    import { Body } from "objects/Body";
    import type { AABB } from "collision/AABB";
    import type { World } from "world/World";
    export class Broadphase {
        world: World | null;
        useBoundingBoxes: boolean;
        dirty: boolean;
        constructor();
        collisionPairs(world: World, p1: Body[], p2: Body[]): void;
        needBroadphaseCollision(bodyA: Body, bodyB: Body): boolean;
        intersectionTest(bodyA: Body, bodyB: Body, pairs1: Body[], pairs2: Body[]): void;
        doBoundingSphereBroadphase(bodyA: Body, bodyB: Body, pairs1: Body[], pairs2: Body[]): void;
        doBoundingBoxBroadphase(bodyA: Body, bodyB: Body, pairs1: Body[], pairs2: Body[]): void;
        makePairsUnique(pairs1: Body[], pairs2: Body[]): void;
        setWorld(world: World): void;
        static boundingSphereCheck(bodyA: Body, bodyB: Body): boolean;
        aabbQuery(world: World, aabb: AABB, result: Body[]): Body[];
    }
}
declare module "collision/NaiveBroadphase" {
    import { Broadphase } from "collision/Broadphase";
    import type { AABB } from "collision/AABB";
    import type { Body } from "objects/Body";
    import type { World } from "world/World";
    export class NaiveBroadphase extends Broadphase {
        constructor();
        collisionPairs(world: World, pairs1: Body[], pairs2: Body[]): void;
        aabbQuery(world: World, aabb: AABB, result?: Body[]): Body[];
    }
}
declare module "utils/Pool" {
    export class Pool {
        objects: any[];
        type: any;
        release(...args: any[]): Pool;
        get(): any;
        constructObject(): void;
        resize(size: number): Pool;
    }
}
declare module "utils/Vec3Pool" {
    import { Pool } from "utils/Pool";
    import { Vec3 } from "math/Vec3";
    export class Vec3Pool extends Pool {
        type: typeof Vec3;
        constructObject(): Vec3;
    }
}
declare module "equations/ContactEquation" {
    import { Equation } from "equations/Equation";
    import { Vec3 } from "math/Vec3";
    import type { Body } from "objects/Body";
    export class ContactEquation extends Equation {
        restitution: number;
        ri: Vec3;
        rj: Vec3;
        ni: Vec3;
        constructor(bodyA: Body, bodyB: Body, maxForce?: number);
        computeB(h: number): number;
        getImpactVelocityAlongNormal(): number;
    }
}
declare module "equations/FrictionEquation" {
    import { Equation } from "equations/Equation";
    import { Vec3 } from "math/Vec3";
    import type { Body } from "objects/Body";
    export class FrictionEquation extends Equation {
        ri: Vec3;
        rj: Vec3;
        t: Vec3;
        constructor(bodyA: Body, bodyB: Body, slipForce: number);
        computeB(h: number): number;
    }
}
declare module "shapes/Particle" {
    import { Shape } from "shapes/Shape";
    import { Vec3 } from "math/Vec3";
    import type { Quaternion } from "math/Quaternion";
    export class Particle extends Shape {
        constructor();
        calculateLocalInertia(mass: number, target?: Vec3): Vec3;
        volume(): number;
        updateBoundingSphereRadius(): void;
        calculateWorldAABB(pos: Vec3, quat: Quaternion, min: Vec3, max: Vec3): void;
    }
}
declare module "shapes/Cylinder" {
    import { ConvexPolyhedron } from "shapes/ConvexPolyhedron";
    export class Cylinder extends ConvexPolyhedron {
        radiusTop: number;
        radiusBottom: number;
        height: number;
        numSegments: number;
        constructor(radiusTop?: number, radiusBottom?: number, height?: number, numSegments?: number);
    }
}
declare module "material/ContactMaterial" {
    import type { Material } from "material/Material";
    export type ContactMaterialOptions = ConstructorParameters<typeof ContactMaterial>[2];
    export class ContactMaterial {
        id: number;
        materials: [Material, Material];
        friction: number;
        restitution: number;
        contactEquationStiffness: number;
        contactEquationRelaxation: number;
        frictionEquationStiffness: number;
        frictionEquationRelaxation: number;
        static idCounter: number;
        constructor(m1: Material, m2: Material, options: {
            friction?: number;
            restitution?: number;
            contactEquationStiffness?: number;
            contactEquationRelaxation?: number;
            frictionEquationStiffness?: number;
            frictionEquationRelaxation?: number;
        });
    }
}
declare module "world/Narrowphase" {
    import { Shape } from "shapes/Shape";
    import { Vec3 } from "math/Vec3";
    import { Quaternion } from "math/Quaternion";
    import { Body } from "objects/Body";
    import { Vec3Pool } from "utils/Vec3Pool";
    import { ContactEquation } from "equations/ContactEquation";
    import { FrictionEquation } from "equations/FrictionEquation";
    import type { Box } from "shapes/Box";
    import type { Sphere } from "shapes/Sphere";
    import type { ConvexPolyhedron } from "shapes/ConvexPolyhedron";
    import type { Particle } from "shapes/Particle";
    import type { Plane } from "shapes/Plane";
    import type { Trimesh } from "shapes/Trimesh";
    import type { Heightfield } from "shapes/Heightfield";
    import { Cylinder } from "shapes/Cylinder";
    import type { ContactMaterial } from "material/ContactMaterial";
    import type { World } from "world/World";
    export const COLLISION_TYPES: {
        sphereSphere: 1;
        spherePlane: 3;
        boxBox: 4;
        sphereBox: 5;
        planeBox: 6;
        convexConvex: 16;
        sphereConvex: 17;
        planeConvex: 18;
        boxConvex: 20;
        sphereHeightfield: 33;
        boxHeightfield: 36;
        convexHeightfield: 48;
        sphereParticle: 65;
        planeParticle: 66;
        boxParticle: 68;
        convexParticle: 80;
        cylinderCylinder: 128;
        sphereCylinder: 129;
        planeCylinder: 130;
        boxCylinder: 132;
        convexCylinder: 144;
        heightfieldCylinder: 160;
        particleCylinder: 192;
        sphereTrimesh: 257;
        planeTrimesh: 258;
    };
    export type CollisionType = typeof COLLISION_TYPES[keyof typeof COLLISION_TYPES];
    export class Narrowphase {
        contactPointPool: ContactEquation[];
        frictionEquationPool: FrictionEquation[];
        result: ContactEquation[];
        frictionResult: FrictionEquation[];
        v3pool: Vec3Pool;
        world: World;
        currentContactMaterial: ContactMaterial;
        enableFrictionReduction: boolean;
        get [COLLISION_TYPES.sphereSphere](): (si: Sphere, sj: Sphere, xi: Vec3, xj: Vec3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi?: Shape | null | undefined, rsj?: Shape | null | undefined, justTest?: boolean | undefined) => boolean | void;
        get [COLLISION_TYPES.spherePlane](): (si: Sphere, sj: Plane, xi: Vec3, xj: Vec3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi?: Shape | null | undefined, rsj?: Shape | null | undefined, justTest?: boolean | undefined) => true | void;
        get [COLLISION_TYPES.boxBox](): (si: Box, sj: Box, xi: Vec3, xj: Vec3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi?: Shape | null | undefined, rsj?: Shape | null | undefined, justTest?: boolean | undefined) => true | void;
        get [COLLISION_TYPES.sphereBox](): (si: Sphere, sj: Box, xi: Vec3, xj: Vec3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi?: Shape | null | undefined, rsj?: Shape | null | undefined, justTest?: boolean | undefined) => true | void;
        get [COLLISION_TYPES.planeBox](): (si: Plane, sj: Box, xi: Vec3, xj: Vec3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi?: Shape | null | undefined, rsj?: Shape | null | undefined, justTest?: boolean | undefined) => true | void;
        get [COLLISION_TYPES.convexConvex](): (si: ConvexPolyhedron, sj: ConvexPolyhedron, xi: Vec3, xj: Vec3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi?: Shape | null | undefined, rsj?: Shape | null | undefined, justTest?: boolean | undefined, faceListA?: number[] | null | undefined, faceListB?: number[] | null | undefined) => true | void;
        get [COLLISION_TYPES.sphereConvex](): (si: Sphere, sj: ConvexPolyhedron, xi: Vec3, xj: Vec3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi?: Shape | null | undefined, rsj?: Shape | null | undefined, justTest?: boolean | undefined) => true | void;
        get [COLLISION_TYPES.planeConvex](): (planeShape: Plane, convexShape: ConvexPolyhedron, planePosition: Vec3, convexPosition: Vec3, planeQuat: Quaternion, convexQuat: Quaternion, planeBody: Body, convexBody: Body, si?: Shape | undefined, sj?: Shape | undefined, justTest?: boolean | undefined) => true | void;
        get [COLLISION_TYPES.boxConvex](): (si: Box, sj: ConvexPolyhedron, xi: Vec3, xj: Vec3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi?: Shape | null | undefined, rsj?: Shape | null | undefined, justTest?: boolean | undefined) => true | void;
        get [COLLISION_TYPES.sphereHeightfield](): (sphereShape: Sphere, hfShape: Heightfield, spherePos: Vec3, hfPos: Vec3, sphereQuat: Quaternion, hfQuat: Quaternion, sphereBody: Body, hfBody: Body, rsi?: Shape | null | undefined, rsj?: Shape | null | undefined, justTest?: boolean | undefined) => true | void;
        get [COLLISION_TYPES.boxHeightfield](): (si: Box, sj: Heightfield, xi: Vec3, xj: Vec3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi?: Shape | null | undefined, rsj?: Shape | null | undefined, justTest?: boolean | undefined) => true | void;
        get [COLLISION_TYPES.convexHeightfield](): (convexShape: ConvexPolyhedron, hfShape: Heightfield, convexPos: Vec3, hfPos: Vec3, convexQuat: Quaternion, hfQuat: Quaternion, convexBody: Body, hfBody: Body, rsi?: Shape | null | undefined, rsj?: Shape | null | undefined, justTest?: boolean | undefined) => true | void;
        get [COLLISION_TYPES.sphereParticle](): (sj: Sphere, si: Particle, xj: Vec3, xi: Vec3, qj: Quaternion, qi: Quaternion, bj: Body, bi: Body, rsi?: Shape | null | undefined, rsj?: Shape | null | undefined, justTest?: boolean | undefined) => true | void;
        get [COLLISION_TYPES.planeParticle](): (sj: Plane, si: Particle, xj: Vec3, xi: Vec3, qj: Quaternion, qi: Quaternion, bj: Body, bi: Body, rsi?: Shape | null | undefined, rsj?: Shape | null | undefined, justTest?: boolean | undefined) => true | void;
        get [COLLISION_TYPES.boxParticle](): (si: Box, sj: Particle, xi: Vec3, xj: Vec3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi?: Shape | null | undefined, rsj?: Shape | null | undefined, justTest?: boolean | undefined) => true | void;
        get [COLLISION_TYPES.convexParticle](): (sj: ConvexPolyhedron, si: Particle, xj: Vec3, xi: Vec3, qj: Quaternion, qi: Quaternion, bj: Body, bi: Body, rsi?: Shape | null | undefined, rsj?: Shape | null | undefined, justTest?: boolean | undefined) => true | void;
        get [COLLISION_TYPES.cylinderCylinder](): (si: ConvexPolyhedron, sj: ConvexPolyhedron, xi: Vec3, xj: Vec3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi?: Shape | null | undefined, rsj?: Shape | null | undefined, justTest?: boolean | undefined, faceListA?: number[] | null | undefined, faceListB?: number[] | null | undefined) => true | void;
        get [COLLISION_TYPES.sphereCylinder](): (si: Sphere, sj: ConvexPolyhedron, xi: Vec3, xj: Vec3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi?: Shape | null | undefined, rsj?: Shape | null | undefined, justTest?: boolean | undefined) => true | void;
        get [COLLISION_TYPES.planeCylinder](): (planeShape: Plane, convexShape: ConvexPolyhedron, planePosition: Vec3, convexPosition: Vec3, planeQuat: Quaternion, convexQuat: Quaternion, planeBody: Body, convexBody: Body, si?: Shape | undefined, sj?: Shape | undefined, justTest?: boolean | undefined) => true | void;
        get [COLLISION_TYPES.boxCylinder](): (si: Box, sj: ConvexPolyhedron, xi: Vec3, xj: Vec3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi?: Shape | null | undefined, rsj?: Shape | null | undefined, justTest?: boolean | undefined) => true | void;
        get [COLLISION_TYPES.convexCylinder](): (si: ConvexPolyhedron, sj: ConvexPolyhedron, xi: Vec3, xj: Vec3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi?: Shape | null | undefined, rsj?: Shape | null | undefined, justTest?: boolean | undefined, faceListA?: number[] | null | undefined, faceListB?: number[] | null | undefined) => true | void;
        get [COLLISION_TYPES.heightfieldCylinder](): (hfShape: Heightfield, convexShape: Cylinder, hfPos: Vec3, convexPos: Vec3, hfQuat: Quaternion, convexQuat: Quaternion, hfBody: Body, convexBody: Body, rsi?: Shape | null | undefined, rsj?: Shape | null | undefined, justTest?: boolean | undefined) => true | void;
        get [COLLISION_TYPES.particleCylinder](): (si: Particle, sj: Cylinder, xi: Vec3, xj: Vec3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi?: Shape | null | undefined, rsj?: Shape | null | undefined, justTest?: boolean | undefined) => true | void;
        get [COLLISION_TYPES.sphereTrimesh](): (sphereShape: Sphere, trimeshShape: Trimesh, spherePos: Vec3, trimeshPos: Vec3, sphereQuat: Quaternion, trimeshQuat: Quaternion, sphereBody: Body, trimeshBody: Body, rsi?: Shape | null | undefined, rsj?: Shape | null | undefined, justTest?: boolean | undefined) => true | void;
        get [COLLISION_TYPES.planeTrimesh](): (planeShape: Plane, trimeshShape: Trimesh, planePos: Vec3, trimeshPos: Vec3, planeQuat: Quaternion, trimeshQuat: Quaternion, planeBody: Body, trimeshBody: Body, rsi?: Shape | null | undefined, rsj?: Shape | null | undefined, justTest?: boolean | undefined) => true | void;
        constructor(world: World);
        createContactEquation(bi: Body, bj: Body, si: Shape, sj: Shape, overrideShapeA?: Shape | null, overrideShapeB?: Shape | null): ContactEquation;
        createFrictionEquationsFromContact(contactEquation: ContactEquation, outArray: FrictionEquation[]): boolean;
        createFrictionFromAverage(numContacts: number): void;
        getContacts(p1: Body[], p2: Body[], world: World, result: ContactEquation[], oldcontacts: ContactEquation[], frictionResult: FrictionEquation[], frictionPool: FrictionEquation[]): void;
        sphereSphere(si: Sphere, sj: Sphere, xi: Vec3, xj: Vec3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi?: Shape | null, rsj?: Shape | null, justTest?: boolean): boolean | void;
        spherePlane(si: Sphere, sj: Plane, xi: Vec3, xj: Vec3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi?: Shape | null, rsj?: Shape | null, justTest?: boolean): true | void;
        boxBox(si: Box, sj: Box, xi: Vec3, xj: Vec3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi?: Shape | null, rsj?: Shape | null, justTest?: boolean): true | void;
        sphereBox(si: Sphere, sj: Box, xi: Vec3, xj: Vec3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi?: Shape | null, rsj?: Shape | null, justTest?: boolean): true | void;
        planeBox(si: Plane, sj: Box, xi: Vec3, xj: Vec3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi?: Shape | null, rsj?: Shape | null, justTest?: boolean): true | void;
        convexConvex(si: ConvexPolyhedron, sj: ConvexPolyhedron, xi: Vec3, xj: Vec3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi?: Shape | null, rsj?: Shape | null, justTest?: boolean, faceListA?: number[] | null, faceListB?: number[] | null): true | void;
        sphereConvex(si: Sphere, sj: ConvexPolyhedron, xi: Vec3, xj: Vec3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi?: Shape | null, rsj?: Shape | null, justTest?: boolean): true | void;
        planeConvex(planeShape: Plane, convexShape: ConvexPolyhedron, planePosition: Vec3, convexPosition: Vec3, planeQuat: Quaternion, convexQuat: Quaternion, planeBody: Body, convexBody: Body, si?: Shape, sj?: Shape, justTest?: boolean): true | void;
        boxConvex(si: Box, sj: ConvexPolyhedron, xi: Vec3, xj: Vec3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi?: Shape | null, rsj?: Shape | null, justTest?: boolean): true | void;
        sphereHeightfield(sphereShape: Sphere, hfShape: Heightfield, spherePos: Vec3, hfPos: Vec3, sphereQuat: Quaternion, hfQuat: Quaternion, sphereBody: Body, hfBody: Body, rsi?: Shape | null, rsj?: Shape | null, justTest?: boolean): true | void;
        boxHeightfield(si: Box, sj: Heightfield, xi: Vec3, xj: Vec3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi?: Shape | null, rsj?: Shape | null, justTest?: boolean): true | void;
        convexHeightfield(convexShape: ConvexPolyhedron, hfShape: Heightfield, convexPos: Vec3, hfPos: Vec3, convexQuat: Quaternion, hfQuat: Quaternion, convexBody: Body, hfBody: Body, rsi?: Shape | null, rsj?: Shape | null, justTest?: boolean): true | void;
        sphereParticle(sj: Sphere, si: Particle, xj: Vec3, xi: Vec3, qj: Quaternion, qi: Quaternion, bj: Body, bi: Body, rsi?: Shape | null, rsj?: Shape | null, justTest?: boolean): true | void;
        planeParticle(sj: Plane, si: Particle, xj: Vec3, xi: Vec3, qj: Quaternion, qi: Quaternion, bj: Body, bi: Body, rsi?: Shape | null, rsj?: Shape | null, justTest?: boolean): true | void;
        boxParticle(si: Box, sj: Particle, xi: Vec3, xj: Vec3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi?: Shape | null, rsj?: Shape | null, justTest?: boolean): true | void;
        convexParticle(sj: ConvexPolyhedron, si: Particle, xj: Vec3, xi: Vec3, qj: Quaternion, qi: Quaternion, bj: Body, bi: Body, rsi?: Shape | null, rsj?: Shape | null, justTest?: boolean): true | void;
        heightfieldCylinder(hfShape: Heightfield, convexShape: Cylinder, hfPos: Vec3, convexPos: Vec3, hfQuat: Quaternion, convexQuat: Quaternion, hfBody: Body, convexBody: Body, rsi?: Shape | null, rsj?: Shape | null, justTest?: boolean): true | void;
        particleCylinder(si: Particle, sj: Cylinder, xi: Vec3, xj: Vec3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi?: Shape | null, rsj?: Shape | null, justTest?: boolean): true | void;
        sphereTrimesh(sphereShape: Sphere, trimeshShape: Trimesh, spherePos: Vec3, trimeshPos: Vec3, sphereQuat: Quaternion, trimeshQuat: Quaternion, sphereBody: Body, trimeshBody: Body, rsi?: Shape | null, rsj?: Shape | null, justTest?: boolean): true | void;
        planeTrimesh(planeShape: Plane, trimeshShape: Trimesh, planePos: Vec3, trimeshPos: Vec3, planeQuat: Quaternion, trimeshQuat: Quaternion, planeBody: Body, trimeshBody: Body, rsi?: Shape | null, rsj?: Shape | null, justTest?: boolean): true | void;
    }
}
declare module "collision/ArrayCollisionMatrix" {
    import type { Body } from "objects/Body";
    export class ArrayCollisionMatrix {
        matrix: number[];
        constructor();
        get(bi: Body, bj: Body): number;
        set(bi: Body, bj: Body, value: boolean): void;
        reset(): void;
        setNumObjects(n: number): void;
    }
}
declare module "collision/OverlapKeeper" {
    export class OverlapKeeper {
        current: number[];
        previous: number[];
        constructor();
        getKey(i: number, j: number): number;
        set(i: number, j: number): void;
        tick(): void;
        getDiff(additions: number[], removals: number[]): void;
    }
}
declare module "utils/TupleDictionary" {
    export class TupleDictionary {
        data: {
            [id: string]: any;
            keys: string[];
        };
        get(i: number, j: number): any;
        set(i: number, j: number, value: any): void;
        delete(i: number, j: number): void;
        reset(): void;
    }
}
declare module "constraints/Constraint" {
    import type { Body } from "objects/Body";
    import type { Equation } from "equations/Equation";
    export type ConstraintOptions = ConstructorParameters<typeof Constraint>[2];
    export class Constraint {
        equations: Equation[];
        bodyA: Body;
        bodyB: Body;
        id: number;
        collideConnected: boolean;
        static idCounter: number;
        constructor(bodyA: Body, bodyB: Body, options?: {
            collideConnected?: boolean;
            wakeUpBodies?: boolean;
        });
        update(): void;
        enable(): void;
        disable(): void;
    }
}
declare module "world/World" {
    import { EventTarget } from "utils/EventTarget";
    import { Narrowphase } from "world/Narrowphase";
    import { Vec3 } from "math/Vec3";
    import { Material } from "material/Material";
    import { ContactMaterial } from "material/ContactMaterial";
    import { ArrayCollisionMatrix } from "collision/ArrayCollisionMatrix";
    import { OverlapKeeper } from "collision/OverlapKeeper";
    import { TupleDictionary } from "utils/TupleDictionary";
    import { RaycastResult } from "collision/RaycastResult";
    import { Body } from "objects/Body";
    import type { Broadphase } from "collision/Broadphase";
    import type { Solver } from "solver/Solver";
    import type { ContactEquation } from "equations/ContactEquation";
    import type { FrictionEquation } from "equations/FrictionEquation";
    import type { RayOptions, RaycastCallback } from "collision/Ray";
    import type { Constraint } from "constraints/Constraint";
    import type { Shape } from "shapes/Shape";
    export type WorldOptions = ConstructorParameters<typeof World>[0];
    export class World extends EventTarget {
        dt: number;
        allowSleep: boolean;
        contacts: ContactEquation[];
        frictionEquations: FrictionEquation[];
        quatNormalizeSkip: number;
        quatNormalizeFast: boolean;
        time: number;
        stepnumber: number;
        default_dt: number;
        nextId: number;
        gravity: Vec3;
        frictionGravity?: Vec3;
        broadphase: Broadphase;
        bodies: Body[];
        hasActiveBodies: boolean;
        solver: Solver;
        constraints: Constraint[];
        narrowphase: Narrowphase;
        collisionMatrix: ArrayCollisionMatrix;
        collisionMatrixPrevious: ArrayCollisionMatrix;
        bodyOverlapKeeper: OverlapKeeper;
        shapeOverlapKeeper: OverlapKeeper;
        contactmaterials: ContactMaterial[];
        contactMaterialTable: TupleDictionary;
        defaultMaterial: Material;
        defaultContactMaterial: ContactMaterial;
        doProfiling: boolean;
        profile: {
            solve: number;
            makeContactConstraints: number;
            broadphase: number;
            integrate: number;
            narrowphase: number;
        };
        accumulator: number;
        subsystems: any[];
        addBodyEvent: {
            type: 'addBody';
            body: Body | null;
        };
        removeBodyEvent: {
            type: 'removeBody';
            body: Body | null;
        };
        idToBodyMap: {
            [id: number]: Body;
        };
        lastCallTime?: number;
        constructor(options?: {
            gravity?: Vec3;
            frictionGravity?: Vec3;
            allowSleep?: boolean;
            broadphase?: Broadphase;
            solver?: Solver;
            quatNormalizeFast?: boolean;
            quatNormalizeSkip?: number;
        });
        getContactMaterial(m1: Material, m2: Material): ContactMaterial;
        collisionMatrixTick(): void;
        addConstraint(c: Constraint): void;
        removeConstraint(c: Constraint): void;
        rayTest(from: Vec3, to: Vec3, result: RaycastResult | RaycastCallback): void;
        raycastAll(from?: Vec3, to?: Vec3, options?: RayOptions, callback?: RaycastCallback): boolean;
        raycastAny(from?: Vec3, to?: Vec3, options?: RayOptions, result?: RaycastResult): boolean;
        raycastClosest(from?: Vec3, to?: Vec3, options?: RayOptions, result?: RaycastResult): boolean;
        addBody(body: Body): void;
        removeBody(body: Body): void;
        getBodyById(id: number): Body;
        getShapeById(id: number): Shape | null;
        addContactMaterial(cmat: ContactMaterial): void;
        removeContactMaterial(cmat: ContactMaterial): void;
        fixedStep(dt?: number, maxSubSteps?: number): void;
        step(dt: number, timeSinceLastCalled?: number, maxSubSteps?: number): void;
        internalStep(dt: number): void;
        emitContactEvents(): void;
        clearForces(): void;
    }
}
declare module "collision/Ray" {
    import { Vec3 } from "math/Vec3";
    import { Quaternion } from "math/Quaternion";
    import { RaycastResult } from "collision/RaycastResult";
    import { Shape } from "shapes/Shape";
    import { AABB } from "collision/AABB";
    import type { Body } from "objects/Body";
    import type { Sphere } from "shapes/Sphere";
    import type { Box } from "shapes/Box";
    import type { Plane } from "shapes/Plane";
    import type { Heightfield } from "shapes/Heightfield";
    import type { ConvexPolyhedron } from "shapes/ConvexPolyhedron";
    import type { Trimesh } from "shapes/Trimesh";
    import type { World } from "world/World";
    export const RAY_MODES: {
        readonly CLOSEST: 1;
        readonly ANY: 2;
        readonly ALL: 4;
    };
    export type RayMode = typeof RAY_MODES[keyof typeof RAY_MODES];
    export type RayOptions = {
        from?: Vec3;
        to?: Vec3;
        mode?: RayMode;
        result?: RaycastResult;
        skipBackfaces?: boolean;
        collisionFilterMask?: number;
        collisionFilterGroup?: number;
        checkCollisionResponse?: boolean;
        callback?: RaycastCallback;
    };
    export type RaycastCallback = (result: RaycastResult) => void;
    export class Ray {
        from: Vec3;
        to: Vec3;
        direction: Vec3;
        precision: number;
        checkCollisionResponse: boolean;
        skipBackfaces: boolean;
        collisionFilterMask: number;
        collisionFilterGroup: number;
        mode: number;
        result: RaycastResult;
        hasHit: boolean;
        callback: RaycastCallback;
        static CLOSEST: 1;
        static ANY: 2;
        static ALL: 4;
        get [Shape.types.SPHERE](): (sphere: Sphere, quat: Quaternion, position: Vec3, body: Body, reportedShape: Shape) => void;
        get [Shape.types.PLANE](): (shape: Plane, quat: Quaternion, position: Vec3, body: Body, reportedShape: Shape) => void;
        get [Shape.types.BOX](): (box: Box, quat: Quaternion, position: Vec3, body: Body, reportedShape: Shape) => void;
        get [Shape.types.CYLINDER](): (shape: ConvexPolyhedron, quat: Quaternion, position: Vec3, body: Body, reportedShape: Shape, options?: {
            faceList: number[];
        } | undefined) => void;
        get [Shape.types.CONVEXPOLYHEDRON](): (shape: ConvexPolyhedron, quat: Quaternion, position: Vec3, body: Body, reportedShape: Shape, options?: {
            faceList: number[];
        } | undefined) => void;
        get [Shape.types.HEIGHTFIELD](): (shape: Heightfield, quat: Quaternion, position: Vec3, body: Body, reportedShape: Shape) => void;
        get [Shape.types.TRIMESH](): (mesh: Trimesh, quat: Quaternion, position: Vec3, body: Body, reportedShape: Shape, options?: {
            faceList?: any[] | undefined;
        } | undefined) => void;
        constructor(from?: Vec3, to?: Vec3);
        intersectWorld(world: World, options: RayOptions): boolean;
        intersectBody(body: Body, result?: RaycastResult): void;
        intersectBodies(bodies: Body[], result?: RaycastResult): void;
        private updateDirection;
        private intersectShape;
        _intersectBox(box: Box, quat: Quaternion, position: Vec3, body: Body, reportedShape: Shape): void;
        _intersectPlane(shape: Plane, quat: Quaternion, position: Vec3, body: Body, reportedShape: Shape): void;
        getAABB(aabb: AABB): void;
        _intersectHeightfield(shape: Heightfield, quat: Quaternion, position: Vec3, body: Body, reportedShape: Shape): void;
        _intersectSphere(sphere: Sphere, quat: Quaternion, position: Vec3, body: Body, reportedShape: Shape): void;
        _intersectConvex(shape: ConvexPolyhedron, quat: Quaternion, position: Vec3, body: Body, reportedShape: Shape, options?: {
            faceList: number[];
        }): void;
        _intersectTrimesh(mesh: Trimesh, quat: Quaternion, position: Vec3, body: Body, reportedShape: Shape, options?: {
            faceList?: any[];
        }): void;
        private reportIntersection;
        static pointInTriangle(p: Vec3, a: Vec3, b: Vec3, c: Vec3): boolean;
    }
}
declare module "collision/AABB" {
    import { Vec3 } from "math/Vec3";
    import type { Ray } from "collision/Ray";
    import type { Transform } from "math/Transform";
    import type { Quaternion } from "math/Quaternion";
    export class AABB {
        lowerBound: Vec3;
        upperBound: Vec3;
        constructor(options?: {
            upperBound?: Vec3;
            lowerBound?: Vec3;
        });
        setFromPoints(points: Vec3[], position?: Vec3, quaternion?: Quaternion, skinSize?: number): AABB;
        copy(aabb: AABB): AABB;
        clone(): AABB;
        extend(aabb: AABB): void;
        overlaps(aabb: AABB): boolean;
        volume(): number;
        contains(aabb: AABB): boolean;
        getCorners(a: Vec3, b: Vec3, c: Vec3, d: Vec3, e: Vec3, f: Vec3, g: Vec3, h: Vec3): void;
        toLocalFrame(frame: Transform, target: AABB): AABB;
        toWorldFrame(frame: Transform, target: AABB): AABB;
        overlapsRay(ray: Ray): boolean;
    }
}
declare module "objects/Body" {
    import { EventTarget } from "utils/EventTarget";
    import { Vec3 } from "math/Vec3";
    import { Mat3 } from "math/Mat3";
    import { Quaternion } from "math/Quaternion";
    import { AABB } from "collision/AABB";
    import type { Shape } from "shapes/Shape";
    import type { Material } from "material/Material";
    import type { World } from "world/World";
    export const BODY_TYPES: {
        readonly DYNAMIC: 1;
        readonly STATIC: 2;
        readonly KINEMATIC: 4;
    };
    export type BodyType = (typeof BODY_TYPES)[keyof typeof BODY_TYPES];
    export const BODY_SLEEP_STATES: {
        readonly AWAKE: 0;
        readonly SLEEPY: 1;
        readonly SLEEPING: 2;
    };
    export type BodySleepState = (typeof BODY_SLEEP_STATES)[keyof typeof BODY_SLEEP_STATES];
    export type BodyOptions = ConstructorParameters<typeof Body>[0];
    export class Body extends EventTarget {
        static idCounter: number;
        static COLLIDE_EVENT_NAME: string;
        static DYNAMIC: 1;
        static STATIC: 2;
        static KINEMATIC: 4;
        static AWAKE: 0;
        static SLEEPY: 1;
        static SLEEPING: 2;
        static wakeupEvent: {
            type: string;
        };
        static sleepyEvent: {
            type: string;
        };
        static sleepEvent: {
            type: string;
        };
        id: number;
        index: number;
        world: World | null;
        vlambda: Vec3;
        collisionFilterGroup: number;
        collisionFilterMask: number;
        collisionResponse: boolean;
        position: Vec3;
        previousPosition: Vec3;
        interpolatedPosition: Vec3;
        initPosition: Vec3;
        velocity: Vec3;
        initVelocity: Vec3;
        force: Vec3;
        mass: number;
        invMass: number;
        material: Material | null;
        linearDamping: number;
        type: BodyType;
        allowSleep: boolean;
        sleepState: BodySleepState;
        sleepSpeedLimit: number;
        sleepTimeLimit: number;
        timeLastSleepy: number;
        wakeUpAfterNarrowphase: boolean;
        torque: Vec3;
        quaternion: Quaternion;
        initQuaternion: Quaternion;
        previousQuaternion: Quaternion;
        interpolatedQuaternion: Quaternion;
        angularVelocity: Vec3;
        initAngularVelocity: Vec3;
        shapes: Shape[];
        shapeOffsets: Vec3[];
        shapeOrientations: Quaternion[];
        inertia: Vec3;
        invInertia: Vec3;
        invInertiaWorld: Mat3;
        invMassSolve: number;
        invInertiaSolve: Vec3;
        invInertiaWorldSolve: Mat3;
        fixedRotation: boolean;
        angularDamping: number;
        linearFactor: Vec3;
        angularFactor: Vec3;
        aabb: AABB;
        aabbNeedsUpdate: boolean;
        boundingRadius: number;
        wlambda: Vec3;
        isTrigger: boolean;
        constructor(options?: {
            collisionFilterGroup?: number;
            collisionFilterMask?: number;
            collisionResponse?: boolean;
            position?: Vec3;
            velocity?: Vec3;
            mass?: number;
            material?: Material;
            linearDamping?: number;
            type?: BodyType;
            allowSleep?: boolean;
            sleepSpeedLimit?: number;
            sleepTimeLimit?: number;
            quaternion?: Quaternion;
            angularVelocity?: Vec3;
            fixedRotation?: boolean;
            angularDamping?: number;
            linearFactor?: Vec3;
            angularFactor?: Vec3;
            shape?: Shape;
            isTrigger?: boolean;
        });
        wakeUp(): void;
        sleep(): void;
        sleepTick(time: number): void;
        updateSolveMassProperties(): void;
        pointToLocalFrame(worldPoint: Vec3, result?: Vec3): Vec3;
        vectorToLocalFrame(worldVector: Vec3, result?: Vec3): Vec3;
        pointToWorldFrame(localPoint: Vec3, result?: Vec3): Vec3;
        vectorToWorldFrame(localVector: Vec3, result?: Vec3): Vec3;
        addShape(shape: Shape, _offset?: Vec3, _orientation?: Quaternion): Body;
        removeShape(shape: Shape): Body;
        updateBoundingRadius(): void;
        updateAABB(): void;
        updateInertiaWorld(force?: boolean): void;
        applyForce(force: Vec3, relativePoint?: Vec3): void;
        applyLocalForce(localForce: Vec3, localPoint?: Vec3): void;
        applyTorque(torque: Vec3): void;
        applyImpulse(impulse: Vec3, relativePoint?: Vec3): void;
        applyLocalImpulse(localImpulse: Vec3, localPoint?: Vec3): void;
        updateMassProperties(): void;
        getVelocityAtWorldPoint(worldPoint: Vec3, result: Vec3): Vec3;
        integrate(dt: number, quatNormalize: boolean, quatNormalizeFast: boolean): void;
    }
}
declare module "collision/ObjectCollisionMatrix" {
    import type { Body } from "objects/Body";
    export class ObjectCollisionMatrix {
        matrix: Record<string, boolean>;
        constructor();
        get(bi: Body, bj: Body): boolean;
        set(bi: Body, bj: Body, value: boolean): void;
        reset(): void;
        setNumObjects(n: number): void;
    }
}
declare module "collision/GridBroadphase" {
    import { Broadphase } from "collision/Broadphase";
    import { Vec3 } from "math/Vec3";
    import type { Body } from "objects/Body";
    import type { World } from "world/World";
    export class GridBroadphase extends Broadphase {
        nx: number;
        ny: number;
        nz: number;
        aabbMin: Vec3;
        aabbMax: Vec3;
        bins: Body[][];
        binLengths: number[];
        constructor(aabbMin?: Vec3, aabbMax?: Vec3, nx?: number, ny?: number, nz?: number);
        collisionPairs(world: World, pairs1: Body[], pairs2: Body[]): void;
    }
}
declare module "collision/SAPBroadphase" {
    import { Broadphase } from "collision/Broadphase";
    import type { AABB } from "collision/AABB";
    import type { Body } from "objects/Body";
    import type { World } from "world/World";
    export class SAPBroadphase extends Broadphase {
        axisList: Body[];
        world: World | null;
        axisIndex: 0 | 1 | 2;
        private _addBodyHandler;
        private _removeBodyHandler;
        static checkBounds(bi: Body, bj: Body, axisIndex: 0 | 1 | 2): boolean;
        static insertionSortX(a: Body[]): Body[];
        static insertionSortY(a: Body[]): Body[];
        static insertionSortZ(a: Body[]): Body[];
        constructor(world: World);
        setWorld(world: World): void;
        collisionPairs(world: World, p1: Body[], p2: Body[]): void;
        sortList(): void;
        autoDetectAxis(): void;
        aabbQuery(world: World, aabb: AABB, result?: Body[]): Body[];
    }
}
declare module "constraints/PointToPointConstraint" {
    import { Constraint } from "constraints/Constraint";
    import { ContactEquation } from "equations/ContactEquation";
    import { Vec3 } from "math/Vec3";
    import type { Body } from "objects/Body";
    export class PointToPointConstraint extends Constraint {
        pivotA: Vec3;
        pivotB: Vec3;
        equationX: ContactEquation;
        equationY: ContactEquation;
        equationZ: ContactEquation;
        constructor(bodyA: Body, pivotA: Vec3 | undefined, bodyB: Body, pivotB?: Vec3, maxForce?: number);
        update(): void;
    }
}
declare module "equations/ConeEquation" {
    import { Vec3 } from "math/Vec3";
    import { Equation } from "equations/Equation";
    import type { Body } from "objects/Body";
    export type ConeEquationOptions = ConstructorParameters<typeof ConeEquation>[2];
    export class ConeEquation extends Equation {
        axisA: Vec3;
        axisB: Vec3;
        angle: number;
        constructor(bodyA: Body, bodyB: Body, options?: {
            maxForce?: number;
            axisA?: Vec3;
            axisB?: Vec3;
            angle?: number;
        });
        computeB(h: number): number;
    }
}
declare module "equations/RotationalEquation" {
    import { Equation } from "equations/Equation";
    import { Vec3 } from "math/Vec3";
    import type { Body } from "objects/Body";
    export type RotationalEquationOptions = ConstructorParameters<typeof RotationalEquation>[2];
    export class RotationalEquation extends Equation {
        axisA: Vec3;
        axisB: Vec3;
        maxAngle: number;
        constructor(bodyA: Body, bodyB: Body, options?: {
            axisA?: Vec3;
            axisB?: Vec3;
            maxAngle?: number;
            maxForce?: number;
        });
        computeB(h: number): number;
    }
}
declare module "constraints/ConeTwistConstraint" {
    import { PointToPointConstraint } from "constraints/PointToPointConstraint";
    import { ConeEquation } from "equations/ConeEquation";
    import { RotationalEquation } from "equations/RotationalEquation";
    import { Vec3 } from "math/Vec3";
    import type { Body } from "objects/Body";
    export type ConeTwistConstraintOptions = ConstructorParameters<typeof ConeTwistConstraint>[2];
    export class ConeTwistConstraint extends PointToPointConstraint {
        axisA: Vec3;
        axisB: Vec3;
        angle: number;
        twistAngle: number;
        coneEquation: ConeEquation;
        twistEquation: RotationalEquation;
        constructor(bodyA: Body, bodyB: Body, options?: {
            pivotA?: Vec3;
            pivotB?: Vec3;
            axisA?: Vec3;
            axisB?: Vec3;
            angle?: number;
            twistAngle?: number;
            maxForce?: number;
            collideConnected?: boolean;
        });
        update(): void;
    }
}
declare module "constraints/DistanceConstraint" {
    import { Constraint } from "constraints/Constraint";
    import { ContactEquation } from "equations/ContactEquation";
    import type { Body } from "objects/Body";
    export class DistanceConstraint extends Constraint {
        distance: number;
        distanceEquation: ContactEquation;
        constructor(bodyA: Body, bodyB: Body, distance?: number, maxForce?: number);
        update(): void;
    }
}
declare module "equations/RotationalMotorEquation" {
    import { Equation } from "equations/Equation";
    import { Vec3 } from "math/Vec3";
    import type { Body } from "objects/Body";
    export class RotationalMotorEquation extends Equation {
        axisA: Vec3;
        axisB: Vec3;
        targetVelocity: number;
        constructor(bodyA: Body, bodyB: Body, maxForce?: number);
        computeB(h: number): number;
    }
}
declare module "constraints/LockConstraint" {
    import { PointToPointConstraint } from "constraints/PointToPointConstraint";
    import { RotationalEquation } from "equations/RotationalEquation";
    import { Vec3 } from "math/Vec3";
    import type { Body } from "objects/Body";
    import type { RotationalMotorEquation } from "equations/RotationalMotorEquation";
    export type LockConstraintOptions = ConstructorParameters<typeof LockConstraint>[2];
    export class LockConstraint extends PointToPointConstraint {
        xA: Vec3;
        xB: Vec3;
        yA: Vec3;
        yB: Vec3;
        zA: Vec3;
        zB: Vec3;
        rotationalEquation1: RotationalEquation;
        rotationalEquation2: RotationalEquation;
        rotationalEquation3: RotationalEquation;
        motorEquation?: RotationalMotorEquation;
        constructor(bodyA: Body, bodyB: Body, options?: {
            maxForce?: number;
        });
        update(): void;
    }
}
declare module "constraints/HingeConstraint" {
    import { PointToPointConstraint } from "constraints/PointToPointConstraint";
    import { RotationalEquation } from "equations/RotationalEquation";
    import { RotationalMotorEquation } from "equations/RotationalMotorEquation";
    import { Vec3 } from "math/Vec3";
    import type { Body } from "objects/Body";
    export type HingeConstraintOptions = ConstructorParameters<typeof HingeConstraint>[2];
    export class HingeConstraint extends PointToPointConstraint {
        axisA: Vec3;
        axisB: Vec3;
        rotationalEquation1: RotationalEquation;
        rotationalEquation2: RotationalEquation;
        motorEquation: RotationalMotorEquation;
        constructor(bodyA: Body, bodyB: Body, options?: {
            pivotA?: Vec3;
            pivotB?: Vec3;
            axisA?: Vec3;
            axisB?: Vec3;
            collideConnected?: boolean;
            maxForce?: number;
        });
        enableMotor(): void;
        disableMotor(): void;
        setMotorSpeed(speed: number): void;
        setMotorMaxForce(maxForce: number): void;
        update(): void;
    }
}
declare module "objects/Spring" {
    import { Vec3 } from "math/Vec3";
    import type { Body } from "objects/Body";
    export type SpringOptions = ConstructorParameters<typeof Spring>[2];
    export class Spring {
        restLength: number;
        stiffness: number;
        damping: number;
        bodyA: Body;
        bodyB: Body;
        localAnchorA: Vec3;
        localAnchorB: Vec3;
        constructor(bodyA: Body, bodyB: Body, options?: {
            restLength?: number;
            stiffness?: number;
            damping?: number;
            localAnchorA?: Vec3;
            localAnchorB?: Vec3;
            worldAnchorA?: Vec3;
            worldAnchorB?: Vec3;
        });
        setWorldAnchorA(worldAnchorA: Vec3): void;
        setWorldAnchorB(worldAnchorB: Vec3): void;
        getWorldAnchorA(result: Vec3): void;
        getWorldAnchorB(result: Vec3): void;
        applyForce(): void;
    }
}
declare module "objects/WheelInfo" {
    import { Vec3 } from "math/Vec3";
    import { Transform } from "math/Transform";
    import { RaycastResult } from "collision/RaycastResult";
    import type { Body } from "objects/Body";
    export type WheelInfoOptions = ConstructorParameters<typeof WheelInfo>[0];
    export type WheelRaycastResult = RaycastResult & Partial<{
        suspensionLength: number;
        directionWorld: Vec3;
        groundObject: number;
    }>;
    export class WheelInfo {
        maxSuspensionTravel: number;
        customSlidingRotationalSpeed: number;
        useCustomSlidingRotationalSpeed: boolean;
        sliding: boolean;
        chassisConnectionPointLocal: Vec3;
        chassisConnectionPointWorld: Vec3;
        directionLocal: Vec3;
        directionWorld: Vec3;
        axleLocal: Vec3;
        axleWorld: Vec3;
        suspensionRestLength: number;
        suspensionMaxLength: number;
        radius: number;
        suspensionStiffness: number;
        dampingCompression: number;
        dampingRelaxation: number;
        frictionSlip: number;
        forwardAcceleration: number;
        sideAcceleration: number;
        steering: number;
        rotation: number;
        deltaRotation: number;
        rollInfluence: number;
        maxSuspensionForce: number;
        engineForce: number;
        brake: number;
        isFrontWheel: boolean;
        clippedInvContactDotSuspension: number;
        suspensionRelativeVelocity: number;
        suspensionForce: number;
        slipInfo: number;
        skidInfo: number;
        suspensionLength: number;
        sideImpulse: number;
        forwardImpulse: number;
        raycastResult: WheelRaycastResult;
        worldTransform: Transform;
        isInContact: boolean;
        constructor(options?: {
            chassisConnectionPointLocal?: Vec3;
            chassisConnectionPointWorld?: Vec3;
            directionLocal?: Vec3;
            directionWorld?: Vec3;
            axleLocal?: Vec3;
            axleWorld?: Vec3;
            suspensionRestLength?: number;
            suspensionMaxLength?: number;
            radius?: number;
            suspensionStiffness?: number;
            dampingCompression?: number;
            dampingRelaxation?: number;
            frictionSlip?: number;
            forwardAcceleration?: number;
            sideAcceleration?: number;
            steering?: number;
            rotation?: number;
            deltaRotation?: number;
            rollInfluence?: number;
            maxSuspensionForce?: number;
            isFrontWheel?: boolean;
            clippedInvContactDotSuspension?: number;
            suspensionRelativeVelocity?: number;
            suspensionForce?: number;
            slipInfo?: number;
            skidInfo?: number;
            suspensionLength?: number;
            maxSuspensionTravel?: number;
            useCustomSlidingRotationalSpeed?: boolean;
            customSlidingRotationalSpeed?: number;
        });
        updateWheel(chassis: Body): void;
    }
}
declare module "objects/RaycastVehicle" {
    import type { Body } from "objects/Body";
    import { WheelInfo } from "objects/WheelInfo";
    import type { WheelInfoOptions } from "objects/WheelInfo";
    import type { Transform } from "math/Transform";
    import type { Constraint } from "constraints/Constraint";
    import type { World } from "world/World";
    export type RaycastVehicleOptions = ConstructorParameters<typeof RaycastVehicle>[0];
    export class RaycastVehicle {
        chassisBody: Body;
        wheelInfos: WheelInfo[];
        sliding: boolean;
        world: World | null;
        indexRightAxis: number;
        indexForwardAxis: number;
        indexUpAxis: number;
        constraints: Constraint[];
        preStepCallback: () => void;
        currentVehicleSpeedKmHour: number;
        numWheelsOnGround: number;
        constructor(options: {
            chassisBody: Body;
            indexRightAxis?: number;
            indexForwardAxis?: number;
            indexUpAxis?: number;
        });
        addWheel(options?: WheelInfoOptions): number;
        setSteeringValue(value: number, wheelIndex: number): void;
        applyEngineForce(value: number, wheelIndex: number): void;
        setBrake(brake: number, wheelIndex: number): void;
        addToWorld(world: World): void;
        private getVehicleAxisWorld;
        updateVehicle(timeStep: number): void;
        updateSuspension(deltaTime: number): void;
        removeFromWorld(world: World): void;
        castRay(wheel: WheelInfo): number;
        updateWheelTransformWorld(wheel: WheelInfo): void;
        updateWheelTransform(wheelIndex: number): void;
        getWheelTransformWorld(wheelIndex: number): Transform;
        updateFriction(timeStep: number): void;
    }
}
declare module "objects/RigidVehicle" {
    import { Vec3 } from "math/Vec3";
    import { Body } from "objects/Body";
    import { HingeConstraint } from "constraints/HingeConstraint";
    import type { World } from "world/World";
    export type RigidVehicleOptions = ConstructorParameters<typeof RigidVehicle>[0];
    export class RigidVehicle {
        wheelBodies: Body[];
        coordinateSystem: Vec3;
        chassisBody: Body;
        constraints: (HingeConstraint & {
            motorTargetVelocity?: number;
        })[];
        wheelAxes: Vec3[];
        wheelForces: number[];
        constructor(options?: {
            coordinateSystem?: Vec3;
            chassisBody?: Body;
        });
        addWheel(options?: {
            body?: Body;
            position?: Vec3;
            axis?: Vec3;
            direction?: Vec3;
        }): number;
        setSteeringValue(value: number, wheelIndex: number): void;
        setMotorSpeed(value: number, wheelIndex: number): void;
        disableMotor(wheelIndex: number): void;
        setWheelForce(value: number, wheelIndex: number): void;
        applyWheelForce(value: number, wheelIndex: number): void;
        addToWorld(world: World): void;
        private _update;
        removeFromWorld(world: World): void;
        getWheelSpeed(wheelIndex: number): number;
    }
}
declare module "objects/SPHSystem" {
    import { Vec3 } from "math/Vec3";
    import type { Body } from "objects/Body";
    export class SPHSystem {
        particles: Body[];
        density: number;
        smoothingRadius: number;
        speedOfSound: number;
        viscosity: number;
        eps: number;
        pressures: number[];
        densities: number[];
        neighbors: Body[][];
        constructor();
        add(particle: Body): void;
        remove(particle: Body): void;
        getNeighbors(particle: Body, neighbors: Body[]): void;
        update(): void;
        w(r: number): number;
        gradw(rVec: Vec3, resultVec: Vec3): void;
        nablaw(r: number): number;
    }
}
declare module "solver/SplitSolver" {
    import { Solver } from "solver/Solver";
    import { Body } from "objects/Body";
    import type { Equation } from "equations/Equation";
    import type { World } from "world/World";
    import { GSSolver } from "solver/GSSolver";
    type SplitSolverNode = {
        body: Body | null;
        children: SplitSolverNode[];
        eqs: Equation[];
        visited: boolean;
    };
    export class SplitSolver extends Solver {
        iterations: number;
        tolerance: number;
        subsolver: GSSolver;
        nodes: SplitSolverNode[];
        nodePool: SplitSolverNode[];
        constructor(subsolver: GSSolver);
        createNode(): SplitSolverNode;
        solve(dt: number, world: World): number;
    }
}
declare module "cannon-es" {
    export * from "collision/ObjectCollisionMatrix";
    export * from "collision/AABB";
    export * from "collision/ArrayCollisionMatrix";
    export * from "collision/Broadphase";
    export * from "collision/GridBroadphase";
    export * from "collision/NaiveBroadphase";
    export * from "collision/Ray";
    export * from "collision/RaycastResult";
    export * from "collision/SAPBroadphase";
    export * from "constraints/ConeTwistConstraint";
    export * from "constraints/Constraint";
    export * from "constraints/DistanceConstraint";
    export * from "constraints/LockConstraint";
    export * from "constraints/PointToPointConstraint";
    export * from "constraints/HingeConstraint";
    export * from "equations/ContactEquation";
    export * from "equations/Equation";
    export * from "equations/FrictionEquation";
    export * from "equations/RotationalEquation";
    export * from "equations/RotationalMotorEquation";
    export * from "material/ContactMaterial";
    export * from "material/Material";
    export * from "math/Quaternion";
    export * from "math/Mat3";
    export * from "math/Transform";
    export * from "math/Vec3";
    export * from "math/JacobianElement";
    export * from "objects/Body";
    export * from "objects/Spring";
    export * from "objects/RaycastVehicle";
    export * from "objects/WheelInfo";
    export * from "objects/RigidVehicle";
    export * from "objects/SPHSystem";
    export * from "shapes/Box";
    export * from "shapes/ConvexPolyhedron";
    export * from "shapes/Cylinder";
    export * from "shapes/Particle";
    export * from "shapes/Plane";
    export * from "shapes/Shape";
    export * from "shapes/Sphere";
    export * from "shapes/Heightfield";
    export * from "shapes/Trimesh";
    export * from "solver/GSSolver";
    export * from "solver/Solver";
    export * from "solver/SplitSolver";
    export * from "utils/Pool";
    export * from "utils/EventTarget";
    export * from "utils/Vec3Pool";
    export * from "world/Narrowphase";
    export * from "world/World";
}
