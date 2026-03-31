/* global foundry game */
export default class CoC7ModelsItemGlobalSystem extends foundry.abstract.TypeDataModel {
  /**
   * Create update object
   * @param {string} property
   * @param {string} key
   * @param {object} options
   * @param {boolean} options.isCtrlKey
   * @returns {object}
   */
  async prepareToggleUpdate (property, key, { isCtrlKey = false } = {}) {
    const propertyKey = 'system.' + (property !== '' ? property + '.' : '') + key
    const changes = {
      [propertyKey]: !(foundry.utils.getProperty(this.parent, propertyKey) ?? false)
    }
    return changes
  }

  /**
   * Toggle flag
   * @param {string} property
   * @param {string} key
   * @param {object} options
   * @param {boolean} options.isCtrlKey
   */
  async toggleProperty (property, key, { isCtrlKey = false } = {}) {
    if (property === 'eras') {
      await game.CoC7.cocid.eraToggle(this.parent, key, { isCtrlKey })
    } else {
      const changes = await this.prepareToggleUpdate(property, key, { isCtrlKey })
      this.parent.update(changes)
    }
  }
}
