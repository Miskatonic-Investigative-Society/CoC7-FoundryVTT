/* global mergeObject */

import { CoC7ActorSheet } from './base.js'

/**
 * Extend the basic ActorSheet with some very simple modifications
 */
export class CoC7NPCSheet extends CoC7ActorSheet {
  /**
   * Prepare data for rendering the Actor sheet
   * The prepared data object contains both the actor data as well as additional sheet options
   */
  async getData () {
    const data = await super.getData()

    // TODO : do we need that ?
    data.allowFormula = true
    data.displayFormula = this.actor.getActorFlag('displayFormula')
    if (data.displayFormula === undefined) data.displayFormula = false
    // await this.actor.creatureInit();
    data.hasSan = data.data.attribs.san.value !== null
    data.hasMp = data.data.attribs.mp.value !== null
    data.hasLuck = data.data.attribs.lck.value !== null

    return data
  }

  activateListeners (html) {
    super.activateListeners(html)
    if (this.actor.isOwner) {
      html
        .find('[name="data.attribs.hp.value"]')
        .change(event => this.actor.setHealthStatusManually(event))
    }
  }

  onCloseSheet () {
    this.actor.unsetActorFlag('displayFormula')
    super.onCloseSheet()
  }

  /* -------------------------------------------- */

  /**
   * Extend and override the default options used by the 5e Actor Sheet
   * @returns {Object}
   */

  static get defaultOptions () {
    return mergeObject(super.defaultOptions, {
      classes: ['coc7', 'sheet', 'actor', 'npc'],
      dragDrop: [{ dragSelector: '.item', dropSelector: null }],
      template: 'systems/CoC7/templates/actors/npc-sheet.html',
      width: 580,
      resizable: true
    })
  }

  static forceAuto (app, html) {
    const cell = html.find('.description.pannel.expanded')
    cell.height(Math.max(200, (html.height() - cell.position().top - 8)) + 'px')
  }

  setPosition (a) {
    super.setPosition(a)
    CoC7NPCSheet.forceAuto(a, this._element)
  }
}
