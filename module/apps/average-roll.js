/* global foundry, MathTerm, Roll */
class AverageParentheticalTerm extends foundry.dice.terms.ParentheticalTerm {
  /** @inheritdoc */
  _evaluateSync ({ minimize = false, maximize = false } = {}) {
    // Evaluate the inner Roll
    const roll = this.roll || new AverageRoll(this.term)
    this.roll = roll.evaluate({ minimize, maximize, async: false })

    // Propagate flavor text to inner terms
    if (this.flavor) this.roll.terms.forEach(t => { t.options.flavor = t.options.flavor ?? this.flavor })
    return this
  }
}

export class AverageRoll extends Roll {
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
      if (!(term instanceof foundry.dice.terms.RollTerm)) {
        throw new Error('Roll evaluation encountered an invalid term which was not a RollTerm instance')
      }
      if (term.isIntermediate) {
        term.evaluate({ minimize, maximize, async: false })
        this._dice = this._dice.concat(term.dice)

        // This section is replaced to calculate the average
        let total = term.total
        if (minimize && maximize && term.dice.length) {
          total = Math.floor((term.dice[0].faces + 1) / 2 * term.total)
        }

        return new foundry.dice.terms.NumericTerm({ number: total, options: term.options })
      }
      return term
    })

    // Step 2 - Simplify remaining terms
    this.terms = this.constructor.simplifyTerms(this.terms)

    // Step 3 - Evaluate remaining terms
    this.terms = this.terms.map(term => {
      if (!term._evaluated) {
        if (typeof term.faces !== 'undefined') {
          return new foundry.dice.terms.NumericTerm({ number: Math.floor((term.faces + 1) / 2 * term.number), options: term.options })
        } else {
          term.evaluate({ minimize, maximize, async: false })
        }
      }
      return term
    })

    // Step 4 - Evaluate the final expression
    this._total = this._evaluateTotal()
    return this
  }

  /**
   * Split a formula by identifying its outer-most parenthetical and math terms
   * @param {string} _formula      The raw formula to split
   * @returns {string[]}          An array of terms, split on parenthetical terms
   * @private
   */
  static _splitParentheses (_formula) {
    return this._splitGroup(_formula, {
      openRegexp: AverageParentheticalTerm.OPEN_REGEXP,
      closeRegexp: AverageParentheticalTerm.CLOSE_REGEXP,
      openSymbol: '(',
      closeSymbol: ')',
      onClose: group => {
        // Extract group arguments
        const fn = group.open.slice(0, -1)
        const expression = group.terms.join('')
        const options = { flavor: group.flavor ? group.flavor.slice(1, -1) : undefined }

        // Classify the resulting terms
        const terms = []
        if (fn in Math) {
          const args = this._splitMathArgs(expression)
          terms.push(new MathTerm({ fn, terms: args, options }))
        } else {
          if (fn) terms.push(fn)
          terms.push(new AverageParentheticalTerm({ term: expression, options }))
        }
        return terms
      }
    })
  }
}
