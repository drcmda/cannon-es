type EventType =
  | 'addBody'
  | 'beginContact'
  | 'beginShapeContact'
  | 'collide'
  | 'endContact'
  | 'endShapeContact'
  | 'removeBody'
  | 'postStep'
  | 'preStep'
  | 'sleep'
  | 'sleepy'
  | 'wakeup'

type CannonEvent = { type: EventType; target?: EventTarget }
type EventHandler = (event: CannonEvent) => void

/**
 * Base class for objects that dispatches events.
 */
export class EventTarget {
  private _listeners: Record<EventType, EventHandler[]> = {
    addBody: [],
    beginContact: [],
    beginShapeContact: [],
    collide: [],
    endContact: [],
    endShapeContact: [],
    removeBody: [],
    postStep: [],
    preStep: [],
    sleep: [],
    sleepy: [],
    wakeup: [],
  }

  /**
   * Add an event listener
   * @return The self object, for chainability.
   */
  addEventListener(type: EventType, listener: EventHandler): EventTarget {
    if (!this._listeners[type].includes(listener)) {
      this._listeners[type].push(listener)
    }
    return this
  }

  /**
   * Check if an event listener is added
   */
  hasEventListener(type: EventType, listener: EventHandler): boolean {
    return this._listeners[type].includes(listener)
  }

  /**
   * Check if any event listener of the given type is added
   */
  hasAnyEventListener(type: EventType): boolean {
    return !!this._listeners[type].length
  }

  /**
   * Remove an event listener
   * @return The self object, for chainability.
   */
  removeEventListener(type: EventType, listener: EventHandler): EventTarget {
    const index = this._listeners[type].indexOf(listener)
    if (index !== -1) {
      this._listeners[type].splice(index, 1)
    }
    return this
  }

  /**
   * Emit an event.
   * @return The self object, for chainability.
   */
  dispatchEvent(event: CannonEvent): EventTarget {
    event.target = this
    for (let i = 0; i < this._listeners[event.type].length; i += 1) {
      this._listeners[event.type][i].call(this, event)
    }
    return this
  }
}
