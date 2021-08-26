/* global DiceTerm */

export class CoC7DecaderDie extends DiceTerm {
  constructor (termData) {
    super(termData)
    this.faces = 10
  }

  /* -------------------------------------------- */
  /** @override */
  static get DENOMINATION () {
    return 't'
  }
}
