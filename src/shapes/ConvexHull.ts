import { QuickHull } from "math/QuickHull";
import { Vec3 } from "math/Vec3";
import { ConvexPolyhedron } from "./ConvexPolyhedron";

export class ConvexHull extends ConvexPolyhedron {
    constructor(vertices:Vec3[]){
        const faces = QuickHull.createHull(vertices);

        super({
            vertices,
            faces
        })
    }
}