import type { Material } from './Material'

export type ContactMaterialOptions = {
  /**
   * Friction coefficient.
   * @default 0.3
   */
  friction?: number
  /**
   * Restitution coefficient.
   * @default 0.3
   */
  restitution?: number
  /**
   * Stiffness of the produced contact equations.
   * @default 1e7
   */
  contactEquationStiffness?: number
  /**
   * Relaxation time of the produced contact equations.
   * @default 3
   */
  contactEquationRelaxation?: number
  /**
   * Stiffness of the produced friction equations.
   * @default 1e7
   */
  frictionEquationStiffness?: number
  /**
   * Relaxation time of the produced friction equations
   * @default 3
   */
  frictionEquationRelaxation?: number
}

/**
 * Defines what happens when two materials meet.
 */
export class ContactMaterial {
  /**
   * Identifier of this ContactMaterial.
   */
  id: number
  /**
   * Participating materials.
   */
  materials: [materialA: Material, materialB: Material]
  /**
   * Friction coefficient.
   * @default 0.3
   */
  friction: number
  /**
   * Restitution coefficient.
   * @default 0.3
   */
  restitution: number
  /**
   * Stiffness of the produced contact equations.
   * @default 1e7
   */
  contactEquationStiffness: number
  /**
   * Relaxation time of the produced contact equations.
   * @default 3
   */
  contactEquationRelaxation: number
  /**
   * Stiffness of the produced friction equations.
   * @default 1e7
   */
  frictionEquationStiffness: number
  /**
   * Relaxation time of the produced friction equations
   * @default 3
   */
  frictionEquationRelaxation: number

  static idCounter = 0

  constructor(
    materialA: Material,
    materialB: Material,
    {
      friction = 0.3,
      restitution = 0.3,
      contactEquationStiffness = 1e7,
      contactEquationRelaxation = 3,
      frictionEquationStiffness = 1e7,
      frictionEquationRelaxation = 3,
    }: ContactMaterialOptions = {}
  ) {
    this.id = ContactMaterial.idCounter++
    this.materials = [materialA, materialB]
    this.friction = friction
    this.restitution = restitution
    this.contactEquationStiffness = contactEquationStiffness
    this.contactEquationRelaxation = contactEquationRelaxation
    this.frictionEquationStiffness = frictionEquationStiffness
    this.frictionEquationRelaxation = frictionEquationRelaxation
  }
}
