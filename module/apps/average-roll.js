/* global NumericTerm, Roll, RollTerm */

export class AverageRoll extends Roll {
  constructor (formula, data = {}, options = {}) {
    super('(' + formula + ')', data, options)
  }

  /**
   * Evaluate the roll synchronously.
   * A temporary helper method used to migrate behavior from 0.7.x (sync by default) to 0.9.x (async by default).
   * @param {object} [options]      Options which inform how evaluation is performed
   * @param {boolean} [options.minimize]    Force the result to be minimized
   * @param {boolean} [options.maximize]    Force the result to be maximized
   * @returns {Roll}
   * @private
   */
  _evaluateSync ({ minimize = false, maximize = false } = {}) {
    // Step 1 - Replace intermediate terms with evaluated numbers
    this.terms = this.terms.map(term => {
      if (!(term instanceof RollTerm)) {
        throw new Error('Roll evaluation encountered an invalid term which was not a RollTerm instance')
      }
      if (term.isIntermediate) {
        term.evaluate({ minimize, maximize, async: false })
        this._dice = this._dice.concat(term.dice)

        // This section is replaced to calculate the average
        let total = term.total
        if (minimize && maximize) {
          total = Math.floor((term.dice[0].faces + 1) / 2 * term.total)
        }

        return new NumericTerm({ number: total, options: term.options })
      }
      return term
    })

    // Step 2 - Simplify remaining terms
    this.terms = this.constructor.simplifyTerms(this.terms)

    // Step 3 - Evaluate remaining terms
    for (const term of this.terms) {
      if (!term._evaluated) term.evaluate({ minimize, maximize, async: false })
    }

    // Step 4 - Evaluate the final expression
    this._total = this._evaluateTotal()
    return this
  }
}
