/* global foundry Roll */
export default class CoC7StringField extends foundry.data.fields.StringField {
  /**
   * Active Effect on String Field Add as a formula
   * @param {string} value
   * @param {string} delta
   * @param {Actor} model
   * @param {object} change
   * @returns {string}
   */
  _applyChangeAdd (value, delta, model, change) {
    let string = (value ?? '0') + (delta.match(/^\s*-/) ? delta : '+' + delta)
    if (!string.match(/@/)) {
      const roll = new Roll(string)
      if (roll.isDeterministic) {
        string = roll.evaluateSync().total.toString()
      }
    }
    return string
  }

  /**
   * Active Effect on String Field Add as a formula
   * @param {string} value
   * @param {string} delta
   * @param {Actor} model
   * @param {object} change
   * @returns {string}
   */
  _applyChangeMultiply (value, delta, model, change) {
    let string = '(' + (value ?? '0') + ')*' + delta
    if (!string.match(/@/)) {
      const roll = new Roll(string)
      if (roll.isDeterministic) {
        string = roll.evaluateSync().total.toString()
      }
    }
    return string
  }
}
