export type MaterialOptions = {
  /**
   * Friction for this material.
   * If non-negative, it will be used instead of the friction given by ContactMaterials.
   * If there's no matching ContactMaterial, the value from `defaultContactMaterial` in the World will be used.
   */
  friction?: number
  /**
   * Restitution for this material.
   * If non-negative, it will be used instead of the restitution given by ContactMaterials.
   * If there's no matching ContactMaterial, the value from `defaultContactMaterial` in the World will be used.
   */
  restitution?: number
}

/**
 * Defines a physics material.
 */
export class Material {
  /** Material id. */
  id: number
  /**
   * Friction for this material.
   * If non-negative, it will be used instead of the friction given by ContactMaterials.
   * If there's no matching ContactMaterial, the value from `defaultContactMaterial` in the World will be used.
   */
  friction: number
  /**
   * Restitution for this material.
   * If non-negative, it will be used instead of the restitution given by ContactMaterials.
   * If there's no matching ContactMaterial, the value from `defaultContactMaterial` in the World will be used.
   */
  restitution: number

  static idCounter = 0

  constructor({ friction = -1, restitution = -1 }: MaterialOptions = {}) {
    this.id = Material.idCounter++

    this.friction = friction
    this.restitution = restitution
  }
}
