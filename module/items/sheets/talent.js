/* global game, ItemSheet, mergeObject */

import { COC7 } from '../../config.js'
// import { CoCActor } from '../../actors/actor.js';

/**
 * Extend the basic ItemSheet with some very simple modifications
 */
export class CoC7TalentSheet extends ItemSheet {
  /**
   *
   */
  static get defaultOptions () {
    return mergeObject(super.defaultOptions, {
      classes: ['coc7', 'sheet', 'talent'],
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
    return 'systems/CoC7/templates/items/talent.html'
  }

  /* Prepare data for rendering the Item sheet
   * The prepared data object contains both the actor data as well as additional sheet options
   */
  getData () {
    // this.item.checkSkillProperties();
    const data = super.getData()

    /** MODIF: 0.8.x **/
    const itemData = data.data
    data.data = itemData.data // MODIF: 0.8.x data.data
    /*****************/

    data.itemProperties = []

    for (const [key, value] of Object.entries(data.data.type)) {
      if (value) {
        data.itemProperties.push(
          COC7.talentType[key] ? COC7.talentType[key] : null
        )
      }
    }

    data.isKeeper = game.user.isGM
    return data
  }
}
