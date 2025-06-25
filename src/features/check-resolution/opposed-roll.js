/* global ChatMessage, foundry, game */
import { RollCard } from './cards/roll-card.js'
import { DamageCard } from '../combat/chat/damage.js'
import { CoC7Check } from '../../core/check.js'

export class OpposedCheckCard extends RollCard {
  static async bindListerners (html) {
    html.on(
      'click',
      '.roll-card.opposed .toggle-switch',
      this._onToggle.bind(this)
    )
    // super.bindListerners( html);
    html.on(
      'click',
      '.roll-card.opposed a',
      OpposedCheckCard._onClick.bind(this)
    )
    html.on(
      'click',
      '.roll-card.opposed button',
      OpposedCheckCard._onClick.bind(this)
    )
  }

  static get defaultConfig () {
    return foundry.utils.mergeObject(super.defaultConfig, {
      template: 'systems/CoC7/templates/chat/cards/opposed-roll.html',
      type: 'opposedCard'
    })
  }

  get config () {
    return OpposedCheckCard.defaultConfig
  }

  get attackerRoll () {
    if (this.combat) {
      if (this.rolls?.length) {
        const attacker = this.rolls.filter(r => r.index === 0 || r.attacker)
        if (attacker.length) return attacker[0]
      }
      return undefined
    }
    return undefined
  }

  get defenderRoll () {
    if (this.combat) {
      if (this.rolls?.length) {
        const defender = this.rolls.filter(r => r.index !== 0 || !r.attacker)
        if (defender.length) return defender[0]
      }
      return undefined
    }
    return undefined
  }

  get defenderIsDodging () {
    if (
      this.defenderRoll?.actor?.dodgeSkill?.name &&
      this.defenderRoll?.skill?.name
    ) {
      return (
        this.defenderRoll.actor.dodgeSkill.name.toLowerCase() ===
        this.defenderRoll.skill.name.toLowerCase()
      )
    }
    return false
  }

  get advantageAttacker () {
    if (typeof this._aa === 'undefined') {
      if (this.defenderRoll) {
        return !this.defenderIsDodging
      } else {
        return false
      }
    }
    return this._aa
  }

  get winnerRollsDamage () {
    if (
      this.combat &&
      this.rolls.length >= 2 &&
      this.hasWinner &&
      this.winner?.item?.type === 'weapon'
    ) {
      return true
    }
    return false
  }

  set advantageAttacker (x) {
    this._aa = true
    this._ad = false
  }

  get advantageDefender () {
    if (typeof this._ad === 'undefined') return this.defenderIsDodging
    return this._ad
  }

  set advantageDefender (x) {
    this._ad = true
    this._aa = false
  }

  get isTie () {
    return this.winnerCount > 1
  }

  get needsTieBreaker () {
    if (!this.combat) return false
    if (
      this.attackerRoll &&
      this.defenderRoll &&
      this.attackerRoll.successLevel === this.defenderRoll.successLevel
    ) {
      return true
    }
    return false
  }

  get winnerCount () {
    let count = 0
    for (const r of this.rolls) {
      if (r.winner) count += 1
    }
    return count
  }

  get isAttackManeuver () {
    if (
      this.combat &&
      this.attackerRoll &&
      (!this.attackerRoll?.item ||
        this.attackerRoll?.item.system.properties?.mnvr)
    ) {
      return true
    }
    return false
  }

  get resultText () {
    if (this.combat && this.attackerRoll && this.defenderRoll) {
      if (!this.attackerRoll.winner && !this.defenderRoll.winner) {
        return game.i18n.localize('CoC7.NoWinner')
      }
      if (this.attackerRoll.winner) {
        if (this.attackerRoll.maneuver) {
          return game.i18n.format('CoC7.ManeuverSuccess', {
            name: this.attackerRoll.actor.name
          })
        }
        return game.i18n.format('CoC7.AttackSuccess', {
          name: this.attackerRoll.actor.name
        })
      }
      if (this.defenderRoll.winner) {
        if (this.defenderRoll.maneuver) {
          return game.i18n.format('CoC7.ManeuverSuccess', {
            name: this.defenderRoll.actor.name
          })
        }
        if (this.defenderIsDodging) {
          return game.i18n.format('CoC7.DodgeSuccess', {
            name: this.defenderRoll.actor.name
          })
        }
        return game.i18n.format('CoC7.AttackSuccess', {
          name: this.defenderRoll.actor.name
        })
      }
    }
    return undefined
  }

  async process (data) {
    switch (data.action) {
      case 'new':
        if (!this.rolls?.length) {
          this.combat = data.combat || undefined
          if (this.combat) {
            data.roll.attacker = true
          }
        }
        data.roll.index = this.rolls.length
        this.addRollData(data)
        break

      case 'roll':
        this.addRollData(data)
        break

      case 'updateRoll':
        this.updateRoll(data)
        break
    }

    if (game.user.isGM) await this.updateChatCard()
    else game.socket.emit('system.CoC7', data)
  }

  async roll (rank) {
    await this.rolls[rank]._perform()
    const data = {
      type: this.config.type,
      action: 'updateRoll',
      rank,
      fromGM: game.user.isGM
    }
    if (!game.user.isGM) data.roll = this.rolls[rank].JSONRollData
    return data
  }

  static async _onClick (event) {
    event.preventDefault()

    const a = event.currentTarget
    const action = a.dataset.action
    const li = a.closest('li.actor-roll')
    const message = a.closest('.chat-message')
    const cardElement = a.closest('div.roll-card')
    const card = await OpposedCheckCard.fromHTMLCardElement(cardElement)
    card.messageId = message.dataset.messageId
    const rank = Number(li?.dataset?.rank)

    switch (action) {
      case 'toggle-combat': {
        card.combat = !card.combat
        // if( !card.advantageAttacker && !card.advantageDefender) card.advantageAttacker = true;
        await card.updateChatCard()
        break
      }

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

      case 'roll-check': {
        const speaker = ChatMessage.getSpeaker()
        if (!card.rolls[rank].actorKey) {
          card.rolls[rank].actorKey = `${speaker.scene}.${speaker.token}`
        }

        const data = await card.roll(rank)
        await card.process(data)
        break
      }

      case 'roll-damage': {
        card.closeCard()
        await card.updateChatCard()
        const damageChatCard = new DamageCard({
          critical: card.winner.isExtremeSuccess,
          fastForward: event.shiftKey
        })
        damageChatCard.actorKey = card.winner.actor.actorKey
        damageChatCard.targetKey = card.looser.actor.actorKey
        damageChatCard.itemId = card.winner.itemId
        // if( originMessage.dataset.messageId) damageChatCard.messageId = originMessage.dataset.messageId;
        damageChatCard.updateChatCard()
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
          fromGM: game.user.isGM
        }
        if (!game.user.isGM) data.roll = card.rolls[rank].JSONRollData
        card.process(data)
        break
      }
    }
  }

  async compute (rank = undefined) {
    this.rolls = this.rolls.filter(roll => {
      return typeof roll.actor.actorKey !== 'undefined' // remove any actors that no longer exist
    })

    if (!rank) {
      for (let i = 0; i < this.rolls.length; i++) {
        delete this.rolls[i].maneuver
        if (
          this.combat &&
          (!this.rolls[i].item ||
            this.rolls[i].item.system.properties?.mnvr) &&
          ((this.rolls[i]?.actor?.dodgeSkill?.name &&
            this.rolls[i]?.skill?.name &&
            this.rolls[i].actor.dodgeSkill.name.toLowerCase() !==
              this.rolls[i].skill.name.toLowerCase()) ||
            !this.rolls[i]?.actor?.dodgeSkill?.name)
        ) {
          this.rolls[i].maneuver = true
        }
        if (this.rolls[i].rolled) {
          this.rolls[i]._htmlRoll = await this.rolls[i].getHtmlRoll({
            hideDiceResult: true
          })
        }
      }
    } else {
      if (this.rolls[rank].rolled) {
        this.rolls[rank]._htmlRoll = await this.rolls[rank].getHtmlRoll({
          hideDiceResult: true
        })
      }
    }

    if (this.combat) {
      // Sort combat rolls by index.
      this.rolls.sort((a, b) => {
        if (a.index > b.index) return 1
        if (a.index < b.index) return -1
        return 0
      })

      // Combat roll includes only 2 persons, remove the rest.
      if (this.rolls.length > 1) {
        this.rolls = [this.rolls[0], this.rolls[1]]
        for (const r of this.rolls) {
          delete r.winner
          delete r.tie
        }
      }

      // First person added is the attacker.
      if (this.rolls[0]) this.rolls[0].attacker = true

      if (this.rolls[0]?.rolled && this.rolls[1]?.rolled) {
        if (this.rolls[0].passed || this.rolls[1].passed) {
          if (this.rolls[0].successLevel > this.rolls[1].successLevel) {
            this.rolls[0].winner = true
          } else if (this.rolls[1].successLevel > this.rolls[0].successLevel) {
            this.rolls[1].winner = true
          } else {
            if (this.advantageAttacker) this.rolls[0].winner = true
            else this.rolls[1].winner = true
          }
        }
      }
    } else {
      this.rolls.sort((a, b) => {
        if (a.rolled && !b.rolled) return -1
        if (!a.rolled && b.rolled) return 1
        if (!a.rolled && !b.rolled) return 0
        if (a.successLevel > b.successLevel) {
          this.resolved = true
          return -1
        }
        if (a.successLevel < b.successLevel) {
          this.resolved = true
          return 1
        }
        if (game.settings.get('CoC7', 'opposedRollTieBreaker')) {
          if (a.modifiedResult > b.modifiedResult) {
            this.resolved = true
            return -1
          }
          if (a.modifiedResult < b.modifiedResult) {
            this.resolved = true
            return 1
          }
        } else {
          if (a.rawValue > b.rawValue) {
            this.resolved = true
            return -1
          }
          if (a.rawValue < b.rawValue) {
            this.resolved = true
            return 1
          }
        }
        return 0
      })

      this.winCount = 0
      if (this.rolls[0] && this.rolls[0].rolled && !this.rolls[0].failed) {
        this.winCount = 1
        for (let i = 1; i < this.rolls.length; i++) {
          if (
            this.rolls[i] &&
            this.rolls[i].rolled &&
            this.rolls[0].successLevel === this.rolls[i].successLevel &&
            (game.settings.get('CoC7', 'opposedRollTieBreaker')
              ? this.rolls[0].modifiedResult === this.rolls[i].modifiedResult
              : this.rolls[0].rawValue === this.rolls[i].rawValue)
          ) {
            this.winCount = this.winCount + 1
          }
        }
      }

      for (let i = 0; i < this.rolls.length; i++) {
        this.rolls[i].winner = i < this.winCount
        this.rolls[i].tie = this.rolls[i].winner && this.winCount > 1
      }
    }
  }

  closeCard () {
    this.closed = true
  }
}
