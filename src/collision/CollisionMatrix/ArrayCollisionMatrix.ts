import type { Body } from '../../objects/Body'

/**
 * Collision "matrix".
 * It's actually a triangular-shaped array of whether two bodies are touching this step, for reference next step
 */
export class ArrayCollisionMatrix {
  /**
   * The matrix storage.
   */
  matrix: number[] = []

  /**
   * Get an element
   */
  get(bi: Body, bj: Body): number {
    let { index: i } = bi
    let { index: j } = bj
    if (j > i) {
      const temp = j
      j = i
      i = temp
    }
    return this.matrix[((i * (i + 1)) >> 1) + j - 1]
  }

  /**
   * Set an element
   */
  set(bi: Body, bj: Body, value: boolean): void {
    let { index: i } = bi
    let { index: j } = bj
    if (j > i) {
      const temp = j
      j = i
      i = temp
    }
    this.matrix[((i * (i + 1)) >> 1) + j - 1] = value ? 1 : 0
  }

  /**
   * Sets all elements to zero
   */
  reset(): void {
    for (let i = 0, l = this.matrix.length; i !== l; i++) {
      this.matrix[i] = 0
    }
  }

  /**
   * Sets the max number of objects
   */
  setNumObjects(n: number): void {
    this.matrix.length = (n * (n - 1)) >> 1
  }
}
