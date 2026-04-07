/* global foundry PlaceablesLayer */
/* // FoundryVTT V12 */
export default class CoC7MenuLayer extends (foundry.canvas?.layers?.PlaceablesLayer ?? PlaceablesLayer) {
  /**
   * @inheritdoc
   */
  constructor () {
    super()
    this.objects = {}
  }

  /**
   * @inheritdoc
   */
  static get layerOptions () {
    return foundry.utils.mergeObject(super.layerOptions, {
      name: 'coc7menu',
      zIndex: 60
    })
  }

  /**
   * @inheritdoc
   */
  static get documentName () {
    return 'Token'
  }

  /**
   * @inheritdoc
   */
  get placeables () {
    return []
  }
}
