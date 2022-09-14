/* global game, ItemSheet, mergeObject */

import CoC7ActiveEffect from '../../active-effect.js'
import { COC7 } from '../../config.js'

/**
 * Extend the basic ItemSheet with some very simple modifications
 */
export class CoC7StatusSheet extends ItemSheet {
  /**
   *
   */
  static get defaultOptions () {
    return mergeObject(super.defaultOptions, {
      classes: ['coc7', 'sheet', 'status'],
      width: 520,
      height: 480,
      scrollY: ['.tab.description'],
      tabs: [
        {
          navSelector: '.sheet-navigation',
          contentSelector: '.sheet-body',
          initial: 'description'
        }
      ]
    })
  }

  /**
   *
   */
  get template () {
    return 'systems/CoC7/templates/items/status.html'
  }

  activateListeners (html) {
    super.activateListeners(html)

    html
      .find('.effect-control')
      .click(ev => CoC7ActiveEffect.onManageActiveEffect(ev, this.item))
  }

  /* Prepare data for rendering the Item sheet
   * The prepared data object contains both the actor data as well as additional sheet options
   */
  getData () {
    // this.item.checkSkillProperties();
    const data = super.getData()

    data.effects = CoC7ActiveEffect.prepareActiveEffectCategories(this.item.effects)

    /** MODIF: 0.8.x **/
    const itemData = data.data
    data.data = itemData.data // MODIF: 0.8.x data.data
    /*****************/

    data.itemProperties = []

    for (const [key, value] of Object.entries(data.data.type)) {
      if (value) {
        data.itemProperties.push(
          COC7.statusType[key] ? COC7.statusType[key] : null
        )
      }
    }

    data.isKeeper = game.user.isGM
    return data
  }
}
