/* global foundry */
export default class CoC7DecaderDie extends foundry.dice.terms.Die {
  /**
   * @inheritdoc
   */
  constructor (termData) {
    termData.faces = 10
    super(termData)
  }

  /**
   * @inheritdoc
   */
  get total () {
    const total = super.total
    return total === 10 ? 0 : total * 10
  }

  /**
   * @inheritdoc
   */
  static get DENOMINATION () {
    return 't'
  }
}
