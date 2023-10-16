/* global foundry, game, ui, fromUuid, fromUuidSync */
import { EnhancedChatCard } from '../../common/chatcardlib/src/chatcardlib.js'

export class MeleeAttackCard extends EnhancedChatCard {
  /**
   * Extend and override the default options
   * @returns {Object}
   */
  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: 'systems/CoC7/templates/chat/cards/melee-attack.html'
    })
  }

  async getData () {
    const data = await super.getData()

    // Get card settings
    data.displayActorOnCard = game.settings.get('CoC7', 'displayActorOnCard')

    data.mySelectOptions = {
      0: 'option 1',
      1: 'option 2'
    }
    // ui.notifications.info(`actor: ${this.data.actor}, weapon: ${this.data.weapon}`)

    return data
  }

  get attacker () {
    if (!this.data.actorUuid) return undefined
    if (!this._actor) this._actor = fromUuidSync(this.data.actorUuid)
    return this._actor
  }

  get attackerWeapon () {
    if (!this.data.weaponUuid) return undefined
    if (!this._weapon) this._weapon = fromUuidSync(this.data.weaponUuid)
    return this._weapon
  }

  get defender () {
    if (!this.data.targetUuid) return undefined
    if (!this._target) this._target = fromUuidSync(this.data.targetUuid)
    return this._target
  }
}
