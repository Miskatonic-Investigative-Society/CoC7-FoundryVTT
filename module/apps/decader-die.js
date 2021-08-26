/* global DiceTerm */

export class CoC7DecaderDie extends DiceTerm {
  constructor (termData) {
    super(termData)
    this.faces = 10
  }

  get total () {
    const total = super.total
    return (total === 10 ? 0 : total * 10)
  }

  /* -------------------------------------------- */
  /** @override */
  static get DENOMINATION () {
    return 't'
  }
}
