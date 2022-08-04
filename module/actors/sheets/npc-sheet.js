/* global game, mergeObject */

import { CoC7ActorSheet } from './base.js'
import { RollDialog } from '../../apps/roll-dialog.js'
import { CoC7Parser } from '../../apps/parser.js'
import { chatHelper } from '../../chat/helper.js'
import { SanCheckCard } from '../../chat/cards/san-check.js'

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

    data.isCreature = false

    data.showInventoryItems =
      Object.prototype.hasOwnProperty.call(data.itemsByType, 'item') ||
      !data.data.flags.locked
    data.showInventoryBooks =
      Object.prototype.hasOwnProperty.call(data.itemsByType, 'book') ||
      !data.data.flags.locked
    data.showInventorySpells =
      Object.prototype.hasOwnProperty.call(data.itemsByType, 'spell') ||
      !data.data.flags.locked
    data.showInventoryTalents =
      Object.prototype.hasOwnProperty.call(data.itemsByType, 'talent') ||
      (!data.data.flags.locked && game.settings.get('CoC7', 'pulpRuleTalents'))
    data.showInventoryStatuses =
      Object.prototype.hasOwnProperty.call(data.itemsByType, 'status') ||
      !data.data.flags.locked
    data.showInventoryWeapons = false
    data.hasInventory =
      data.showInventoryItems ||
      data.showInventoryBooks ||
      data.showInventorySpells ||
      data.showInventoryTalents ||
      data.showInventoryStatuses ||
      data.showInventoryWeapons

    return data
  }

  activateListeners (html) {
    super.activateListeners(html)
    html.find('.roll-san').click(this._onSanCheck.bind(this))
    if (this.actor.isOwner) {
      html
        .find('[name="data.attribs.hp.value"]')
        .change(event => this.actor.setHealthStatusManually(event))
    }
  }

  async _onSanCheck (event) {
    event.preventDefault()
    if (
      !this.actor.data.data.special.sanLoss.checkPassed &&
      !this.actor.data.data.special.sanLoss.checkFailled
    ) {
      // ui.notifications.info('No sanity loss value');
      return
    }
    if (
      (event.metaKey ||
        event.ctrlKey ||
        event.keyCode === 91 ||
        event.keyCode === 224) &&
      game.user.isGM
    ) {
      let difficulty, modifier
      if (!event.shiftKey) {
        const usage = await RollDialog.create({
          disableFlatDiceModifier: true
        })
        if (usage) {
          modifier = Number(usage.get('bonusDice'))
          difficulty = Number(usage.get('difficulty'))
        }
      }
      const linkData = {
        check: 'sanloss',
        sanMin: this.actor.data.data.special.sanLoss.checkPassed,
        sanMax: this.actor.data.data.special.sanLoss.checkFailled,
        sanReason: this.actor.data.data.infos.type?.length
          ? this.actor.data.data.infos.type
          : this.actor.name,
        tokenKey: this.actor.actorKey
      }
      if (game.settings.get('core', 'rollMode') === 'blindroll') {
        linkData.blind = true
      }
      if (typeof modifier !== 'undefined') linkData.modifier = modifier
      if (typeof difficulty !== 'undefined') linkData.difficulty = difficulty
      const link = CoC7Parser.createCoC7Link(linkData)
      if (link) {
        chatHelper.createMessage(
          null,
          game.i18n.format('CoC7.MessageCheckRequestedWait', {
            check: link
          })
        )
      }
    } else {
      const sanData = {
        sanMax: this.actor.sanLossCheckFailled,
        sanMin: this.actor.sanLossCheckPassed,
        sanReason: this.actor.data.data.infos.type?.length
          ? this.actor.data.data.infos.type
          : this.actor.name,
        tokenKey: this.actor.actorKey
      }
      SanCheckCard.checkTargets(sanData, event.shiftKey)
    }
  }

  onCloseSheet () {
    this.actor.unsetActorFlag('displayFormula')
    super.onCloseSheet()
  }

  /* -------------------------------------------- */

  /**
   * Extend and override the default options used by the Actor Sheet
   * @returns {Object}
   */

  static get defaultOptions () {
    return mergeObject(super.defaultOptions, {
      classes: ['coc7', 'sheet', 'actor', 'npc'],
      dragDrop: [{ dragSelector: '.item', dropSelector: null }],
      template: 'systems/CoC7/templates/actors/npc-sheet.html',
      width: 580,
      resizable: false,
      minimizable: true
    })
  }

  /**
   * Implement the _updateObject method as required by the parent class spec
   * This defines how to update the subject of the form when the form is submitted
   * @private
   */

  async _updateObject (event, formData) {
    if (event.currentTarget) {
      if (event.currentTarget.classList) {
        if (event.currentTarget.classList.contains('characteristic-score')) {
          this.actor.setCharacteristic(
            event.currentTarget.name,
            event.currentTarget.value
          )
          return
        }
      }
    }
    return super._updateObject(event, formData)
  }

  static forceAuto (app, html) {
    html.height('auto')
    // const cell = html.find('.pannel.expanded.resizededitor')
    // if (cell.length) {
    //   cell.height(
    //     Math.max(200, (html.height() - cell.position().top - 8) / cell.length) +
    //       'px'
    //   )
    // }
  }

  setPosition (a) {
    super.setPosition(a)
    CoC7NPCSheet.forceAuto(a, this._element)
  }
}
