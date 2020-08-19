export class Utils{
  /**
   * Extend an options object with default values.
   * @static
   * @method defaults
   * @param  {object} options The options object. May be falsy: in this case, a new object is created and returned.
   * @param  {object} defaults An object containing default values.
   * @return {object} The modified options object.
   */
  static defaults = (options: Record<string, any> = {}, defaults: Record<string, any>): Record<string, any> => {
    for (let key in defaults) {
      if (!(key in options)) {
        options[key] = defaults[key]
      }
    }

    return options
  }
}


