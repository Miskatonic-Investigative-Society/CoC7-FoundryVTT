/* global foundry, game, TextEditor */
import { CoC7ActorSheet } from './base.js'
import { RollDialog } from '../../apps/roll-dialog.js'
import { CoC7Link } from '../../apps/coc7-link.js'
import { chatHelper, isCtrlKey } from '../../chat/helper.js'
import { SanCheckCard } from '../../chat/cards/san-check.js'
import { CoC7ContextMenu } from '../../context-menu.js'
import { CoC7ChatMessage } from '../../apps/coc7-chat-message.js'

/**
 * Extend the basic ActorSheet with some very simple modifications
 */
export class CoC7NPCSheet extends CoC7ActorSheet {
  /**
   * Prepare data for rendering the Actor sheet
   * The prepared data object contains both the actor data as well as additional sheet options
   */
  async getData () {
    const sheetData = await super.getData()

    // TODO : do we need that ?
    sheetData.allowFormula = true
    sheetData.displayFormula = (this.actor.getActorFlag('displayFormula') || false)

    sheetData.hasSan = sheetData.data.system.attribs.san.value !== null
    sheetData.hasMp = sheetData.data.system.attribs.mp.value !== null
    sheetData.hasLuck = sheetData.data.system.attribs.lck.value !== null

    sheetData.isCreature = false

    sheetData.showInventoryItems =
      Object.prototype.hasOwnProperty.call(sheetData.itemsByType, 'item') ||
      !sheetData.data.system.flags.locked
    sheetData.showInventoryBooks =
      Object.prototype.hasOwnProperty.call(sheetData.itemsByType, 'book') ||
      !sheetData.data.system.flags.locked
    sheetData.showInventorySpells =
      Object.prototype.hasOwnProperty.call(sheetData.itemsByType, 'spell') ||
      !sheetData.data.system.flags.locked
    sheetData.showInventoryTalents =
      Object.prototype.hasOwnProperty.call(sheetData.itemsByType, 'talent') ||
      (!sheetData.data.system.flags.locked && game.settings.get('CoC7', 'pulpRuleTalents'))
    sheetData.showInventoryStatuses =
      Object.prototype.hasOwnProperty.call(sheetData.itemsByType, 'status') ||
      !sheetData.data.system.flags.locked

    sheetData.showInventoryArmor =
      Object.prototype.hasOwnProperty.call(sheetData.itemsByType, 'armor') ||
      !sheetData.data.system.flags.locked

    sheetData.showInventoryWeapons = false
    sheetData.hasInventory =
      sheetData.showInventoryItems ||
      sheetData.showInventoryBooks ||
      sheetData.showInventorySpells ||
      sheetData.showInventoryTalents ||
      sheetData.showInventoryStatuses ||
      sheetData.showInventoryWeapons ||
      sheetData.showInventoryArmor

    sheetData.enrichedBiographyPersonalDescription = await TextEditor.enrichHTML(
      sheetData.data.system.biography.personalDescription?.value,
      {
        async: true,
        secrets: sheetData.editable
      }
    )

    sheetData.enrichedDescriptionKeeper = await TextEditor.enrichHTML(
      sheetData.data.system.description.keeper,
      {
        async: true,
        secrets: sheetData.editable
      }
    )

    sheetData.weaponSkillGroups = this.actor.weaponSkillGroups()

    return sheetData
  }

  activateListeners (html) {
    super.activateListeners(html)

    if (game.settings.get('CoC7', 'useContextMenus')) {
      if (!this.menus) this.menus = []

      const sanlossMenu = {
        id: 'san-loss-roll',
        classes: 'roll-menu',
        section: [
          {
            classes: 'main',
            items: [
              { action: 'link-tool', label: 'Open in link tool' },
              { action: 'send-chat', label: 'Send to chat' },
              { action: 'copy-to-clipboard', label: 'Copy to clip-board' }
            ]
          }

        ]
      }

      const sanlossContextMenu = new CoC7ContextMenu()
      sanlossContextMenu.bind(sanlossMenu, html, this._onSanLossContextMenuClick.bind(this))
      this.menus.push(sanlossContextMenu)
    }

    html.find('.roll-san').click(this._onSanCheck.bind(this))
    // if (this.actor.isOwner) {
    //   html
    //     .find('[name="data.attribs.hp.value"]')
    //     .change(event => this.actor.setHealthStatusManually(event))
    // }
  }

  async _onSanLossContextMenuClick (event) {
    const rollOptions = {
      rollType: CoC7ChatMessage.ROLL_TYPE_ENCOUNTER,
      preventStandby: true,
      fastForward: false,
      event,
      cardType: CoC7ChatMessage.CARD_TYPE_SAN_CHECK,
      actor: this.actor
    }

    switch (event.currentTarget.dataset.action) {
      case ('link-tool'):
        rollOptions.cardType = CoC7ChatMessage.CARD_TYPE_NONE
        rollOptions.createEncounter = true
        rollOptions.openLinkTool = true
        break
      case ('send-chat'):
        rollOptions.cardType = CoC7ChatMessage.CARD_TYPE_NONE
        rollOptions.createEncounter = true
        rollOptions.sendToChat = true
        break
      case ('copy-to-clipboard'):
        rollOptions.cardType = CoC7ChatMessage.CARD_TYPE_NONE
        rollOptions.createEncounter = true
        rollOptions.sendToClipboard = true
        break
      default:
        break
    }
    CoC7ChatMessage.trigger(rollOptions)
  }

  async _onSanCheck (event) {
    event.preventDefault()
    if (
      !this.actor.system.special.sanLoss.checkPassed &&
      !this.actor.system.special.sanLoss.checkFailled
    ) {
      // ui.notifications.info('No sanity loss value');
      return
    }
    if (
      isCtrlKey(event) &&
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
        sanMin: this.actor.system.special.sanLoss.checkPassed,
        sanMax: this.actor.system.special.sanLoss.checkFailled,
        sanReason: this.actor.system.infos.type?.length
          ? this.actor.system.infos.type
          : this.actor.name,
        tokenKey: this.actor.actorKey
      }
      if (game.settings.get('core', 'rollMode') === 'blindroll') {
        linkData.blind = true
      }
      if (typeof modifier !== 'undefined') linkData.modifier = modifier
      if (typeof difficulty !== 'undefined') linkData.difficulty = difficulty
      const link = (new CoC7Link())._createDocumentLink(linkData)
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
        sanReason: this.actor.system.infos.type?.length
          ? this.actor.system.infos.type
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
    return foundry.utils.mergeObject(super.defaultOptions, {
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
  }

  setPosition (a) {
    super.setPosition(a)
    CoC7NPCSheet.forceAuto(a, this._element)
  }
}
