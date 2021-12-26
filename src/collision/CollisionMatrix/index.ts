import { ArrayCollisionMatrix } from './ArrayCollisionMatrix'
import { ObjectCollisionMatrix } from './ObjectCollisionMatrix'

export type CollisionMatrix = ArrayCollisionMatrix | ObjectCollisionMatrix
export type CollisionMatrixClass = typeof ArrayCollisionMatrix | typeof ObjectCollisionMatrix

export { ArrayCollisionMatrix, ObjectCollisionMatrix }
