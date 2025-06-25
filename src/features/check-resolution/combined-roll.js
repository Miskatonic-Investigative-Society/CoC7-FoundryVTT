/* global AudioHelper, CONFIG, foundry, game */
import { RollCard } from './cards/roll-card.js'
import { CoC7Check } from '../../core/check.js'
import { CoC7Dice } from '../../shared/dice/dice.js'

export class CombinedCheckCard extends RollCard {
  static async bindListerners (html) {
    html.on(
      'click',
      '.roll-card.combined .toggle-switch',
      this._onToggle.bind(this)
    )
    // html.find('.roll-card a').click(async (event) => CombinedCheckCard._onClick( event));
    html.on(
      'click',
      '.roll-card.combined a',
      CombinedCheckCard._onClick.bind(this)
    )
    html.on(
      'click',
      '.roll-card.combined button',
      CombinedCheckCard._onClick.bind(this)
    )
  }

  static get defaultConfig () {
    return foundry.utils.mergeObject(super.defaultConfig, {
      template: 'systems/CoC7/templates/chat/cards/combined-roll.html',
      type: 'combinedCard',
      title: 'CoC7.CombinedRollCard'
    })
  }

  get config () {
    return CombinedCheckCard.defaultConfig
  }

  get successCount () {
    if (this.rolled) {
      let count = 0
      for (const r of this.rolls) {
        if (r.passed) count += 1
      }
      return count
    }
    return undefined
  }

  get mainActorKey () {
    return this.rolls[0]?.actor?.actorKey || undefined
  }

  get success () {
    if (typeof this.successCount === 'undefined') return undefined
    if (this.any) {
      if (this.successCount > 0) return true
      return false
    }
    if (this.all) {
      if (this.successCount === this.rolls.length) return true
      return false
    }
    return undefined
  }

  get failure () {
    if (typeof this.success === 'undefined') return undefined
    return !this.success
  }

  get checkGMInitiator () {
    return game.users.get(this.initiator)?.isGM
  }

  async getHtmlRoll () {
    if (!this.rolled) return undefined
    const check = new CoC7Check()
    await check._perform({
      roll: this._roll[check.diceModifier || 0],
      silent: true
    })
    return await check.getHtmlRoll({ hideSuccess: true })
  }

  process (data) {
    switch (data.action) {
      case 'new':
        this.addRollData(data)
        break

      case 'roll':
        this.addRollData(data)
        break

      case 'updateRoll': {
        this.updateRoll(data)
        break
      }

      case 'assignRoll': {
        this.assignRoll(data)
        break
      }
    }

    if (game.user.isGM) this.updateChatCard()
    else game.socket.emit('system.CoC7', data)
  }

  async assignRoll (data) {
    if (game.user.isGM) {
      if (!this.rolled) {
        this.rolled = true
        this._roll = data.roll
      }
    }
  }

  static async _onClick (event) {
    event.preventDefault()

    const a = event.target
    const action = a.dataset.action
    const li = a.closest('li.actor-roll')
    const message = a.closest('.chat-message')
    const cardElement = a.closest('div.roll-card')
    const card = await CombinedCheckCard.fromHTMLCardElement(cardElement)
    card.messageId = message.dataset.messageId
    const rank = Number(li?.dataset?.rank)

    switch (action) {
      case 'remove-roll': {
        card.removeRoll(rank)
        await card.updateChatCard()
        break
      }

      case 'close-card': {
        card.closeCard()
        await card.updateChatCard()
        break
      }

      case 'roll-card': {
        const pool = {}
        for (const dice of card.rolls) {
          const diceModifier = parseInt(dice.diceModifier, 10)
          if (!isNaN(diceModifier)) {
            pool[diceModifier] = false
          }
        }

        const roll = await CoC7Dice.combinedRoll({ pool })
        roll.initiator = game.user.id

        const data = {
          type: this.defaultConfig.type,
          action: 'assignRoll',
          fromGM: game.user.isGM,
          roll
        }
        AudioHelper.play({ src: CONFIG.sounds.dice }, true)
        card.process(data)
        break
      }

      default: {
        const options = {
          update: false,
          data: a.dataset,
          classes: a.classList,
          target: a
        }
        await CoC7Check.alter(card.rolls[rank], action, options)
        const data = {
          type: this.defaultConfig.type,
          action: 'updateRoll',
          rank,
          fromGM: game.user.isGM,
          roll: {
            initiator: game.user.id
          }
        }
        if (!game.user.isGM) data.roll = card.rolls[rank].JSONRollData
        card.process(data)
        break
      }
    }
  }

  async compute () {
    if (!this._roll) return

    this.rolls = this.rolls.filter(roll => {
      return typeof roll.actor.system !== 'undefined' // remove any actors that no longer exist
    })

    for (const r of this.rolls) {
      if (!r.rolled) {
        r.modifier = r.diceModifier || 0
        r.difficulty = r.difficulty || CoC7Check.difficultyLevel.regular
        r.flatDiceModifier = r.flatDiceModifier || 0
        r.flatThresholdModifier = r.flatThresholdModifier || 0
        await r._perform({ roll: this._roll[r.modifier], silent: true })
      }
    }
    for (let i = 0; i < this.rolls.length; i++) {
      if (this.rolls[i].rolled) {
        this.rolls[i]._htmlRoll = await this.rolls[i].getHtmlRoll({
          hideDiceResult: true
        })
      }
    }

    this._htmlRoll = await this.getHtmlRoll()
  }

  closeCard () {
    this.closed = true
  }
}
