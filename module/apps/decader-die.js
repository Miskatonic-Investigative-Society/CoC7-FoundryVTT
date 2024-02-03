/* global Die */

export class CoC7DecaderDie extends Die {
  constructor (termData) {
    termData.faces = 10
    super(termData)
  }

  get total () {
    const total = super.total
    return total === 10 ? 0 : total * 10
  }

  /* -------------------------------------------- */
  /** @override */
  static get DENOMINATION () {
    return 't'
  }
}
