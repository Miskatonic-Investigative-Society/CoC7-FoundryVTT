/* global ActiveEffectConfig, foundry */

export default class CoC7ActiveEffectSheet extends ActiveEffectConfig {
  /** @override */
  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: 'systems/CoC7/templates/system/active-effect.hbs'
    })
  }

  /** @override */
  async _updateObject (event, formData) {
    if (typeof formData.system?.alwaysShow === 'boolean' && this.object.getFlag('CoC7', 'alwaysShow') !== formData.system?.alwaysShow) {
      await this.object.setFlag('CoC7', 'alwaysShow', formData.system.alwaysShow)
    }
    super._updateObject(event, formData)
  }

  /** @override */
  async getData (options = {}) {
    const data = await super.getData(options)
    data.system = {
      alwaysShow: typeof this.object.getFlag('CoC7', 'alwaysShow') === 'boolean' ? this.object.getFlag('CoC7', 'alwaysShow') : true
    }
    return data
  }

  // /** @inheritdoc */
  // _getSubmitData (updateData = {}) {
  //   const submitData = super._getSubmitData(updateData)
  //   return submitData
  // }

  // _updateObject (event, formData) {
  //   super._updateObject(event, formData)
  // }
}
