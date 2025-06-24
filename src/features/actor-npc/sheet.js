/* global ChatMessage, CONFIG, foundry, fromUuid, game, TextEditor */
import { CoC7Link } from '../link-creation/coc7-link.js'
import { SanCheckCard } from '../sanity/chat/san-check.js'
import { CoC7ChatMessage } from '../../core/coc7-chat-message.js'
import { CoC7ActorSheet } from '../../core/sheets/actor-sheet-base.js'
import { chatHelper, isCtrlKey } from '../../shared/dice/helper.js'
import { CoC7ContextMenu } from '../../shared/ui-components/context-menu.js'
import { RollDialog } from '../../shared/ui-dialogs/roll-dialog.js'

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

    sheetData.movementTypes = Object.keys(CONFIG.Token.movement.actions).reduce((c, i) => {
      c.push({
        id: i,
        name: CONFIG.Token.movement.actions[i].label,
        order: CONFIG.Token.movement.actions[i].order
      })
      return c
    }, []).sort((a, b) => {
      return a.order - b.order
    })

    sheetData.macros = await this.actor.system.special.macros.reduce(async (c, i) => {
      const carry = await c
      const macro = await fromUuid(i.uuid)
      if (macro) {
        carry.push({
          uuid: macro.uuid,
          img: macro.img,
          name: macro.name
        })
      }
      return carry
    }, [])

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
    html.find('.add-movement').click(this._onAddMovement.bind(this))
    html.find('.remove-movement').click(this._onRemoveMovement.bind(this))
    html.find('.remove-macro').click(this._onRemoveMacro.bind(this))
    html.find('.execute-macro').click(this._onExecuteMacro.bind(this))
  }

  _onAddMovement () {
    const movement = this.actor.system.special.movement ? foundry.utils.duplicate(this.actor.system.special.movement) : []
    movement.push({
      value: '',
      type: 'walk'
    })
    this.actor.update({ 'system.special.movement': movement })
  }

  _onRemoveMovement (event) {
    const a = event.currentTarget
    if (typeof a.dataset.index !== 'undefined') {
      const movement = foundry.utils.duplicate(this.actor.system.special.movement)
      movement.splice(Number(a.dataset.index), 1)
      this.actor.update({ 'system.special.movement': movement })
    }
  }

  _onRemoveMacro (event) {
    const a = event.currentTarget
    if (typeof a.dataset.index !== 'undefined') {
      const macros = foundry.utils.duplicate(this.actor.system.special.macros)
      macros.splice(Number(a.dataset.index), 1)
      this.actor.update({ 'system.special.macros': macros })
    }
  }

  async _onExecuteMacro (event) {
    const a = event.currentTarget
    if (typeof a.dataset.uuid !== 'undefined') {
      const macro = await fromUuid(a.dataset.uuid)
      if (macro) {
        macro.execute({
          speaker: ChatMessage.getSpeaker({ actor: this.actor, token: this.token }),
          actor: this.actor,
          token: this.token,
          event
        })
      }
    }
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
    const system = foundry.utils.expandObject(formData)?.system
    if (system.special?.movement) {
      const movement = foundry.utils.duplicate(this.actor.system.special.movement)
      for (const offset in system.special.movement) {
        for (const key in system.special.movement[offset]) {
          movement[offset][key] = system.special.movement[offset][key]
        }
      }
      formData['system.special.movement'] = movement
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
