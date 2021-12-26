import type { Body } from '../../objects/Body'

/**
 * Records what objects are colliding with each other
 */
export class ObjectCollisionMatrix {
  /**
   * The matrix storage.
   */
  matrix: Record<string, boolean> = {}

  get(bi: Body, bj: Body): boolean {
    const { id: i } = bi
    const { id: j } = bj

    const key = i < j ? `${i}-${j}` : `${j}-${i}`

    return key in this.matrix
  }

  set(bi: Body, bj: Body, value: boolean): void {
    const { id: i } = bi
    const { id: j } = bj

    const key = i < j ? `${i}-${j}` : `${j}-${i}`

    if (value) {
      this.matrix[key] = true
    } else {
      delete this.matrix[key]
    }
  }

  /**
   * Empty the matrix
   */
  reset(): void {
    this.matrix = {}
  }

  /**
   * Set max number of objects
   */
  setNumObjects(): void {
    /**/
  }
}
