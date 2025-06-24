/* global $, ChatMessage, game, renderTemplate, ui */
// import { CoCActor } from '../../actors/actor.js';
import { CoC7Check } from '../../../core/check.js'

export class RollCard {
  constructor () {
    this.rolls = []
    this.initiator = null
  }

  static async fromMessageId (messageId) {
    const message = game.messages.get(messageId)
    if (!message) return undefined
    const card = await this.fromMessage(message)
    card.messageId = messageId
    return card
  }

  static async fromMessage (message) {
    const cardElement = $(message.content)[0]
    if (!cardElement) return undefined
    const card = await this.fromHTMLCardElement(cardElement)
    card.message = message
    return card
  }

  static async fromHTMLCardElement (card) {
    const cardData = JSON.parse(unescape(card.dataset.object))
    return await this.fromData(cardData)
  }

  static async fromData (data) {
    const card = Object.assign(new this(), data)
    for (let index = 0; index < card.rolls.length; index++) {
      if (card.rolls[index]?.constructor?.name === 'Object') {
        card.rolls[index] = Object.assign(new CoC7Check(), card.rolls[index])
        if (card.rolls[index].rolled) {
          card.rolls[index]._htmlRoll = await card.rolls[index].getHtmlRoll()
        }
      }
    }
    return card
  }

  static async _onToggle (event) {
    event.preventDefault()

    const span = event.target
    if (span && span.classList.contains('gm-select-only') && !game.user.isGM) {
      return
    }
    const message = span.closest('.chat-message')
    const card = await this.fromMessageId(message.dataset.messageId)
    if (!card) return
    const flag = span.dataset.flag
    if (!flag) return
    const toggle = span.closest('.toggle')
    if (!toggle) {
      card.toggleFlag(flag)
    } else {
      const buttons = toggle.querySelectorAll('.toggle-switch')
      for (const b of buttons) {
        card.unsetFlag(b.dataset.flag)
      }
      card.setFlag(flag)
    }
    card.updateChatCard()
  }

  static async dispatch (data) {
    if (game.user.isGM) {
      let messages = ui.chat.collection.filter(message => {
        if (
          this.defaultConfig.type === message.getFlag('CoC7', 'type') &&
          message.getFlag('CoC7', 'state') !== 'resolved'
        ) {
          if (['combinedCard'].includes(this.defaultConfig.type)) {
            return message.getFlag('CoC7', 'initiator') === data.roll.initiator
          }
          return true
        }
        return false
      })

      if (messages.length) {
        // Old messages can't be used if message is more than a day old mark it as resolved
        const timestamp = new Date(messages[0].timestamp)
        const now = new Date()
        const timeDiffSec = (now - timestamp) / 1000
        if (24 * 60 * 60 < timeDiffSec) {
          await messages[0].setFlag('CoC7', 'state', 'resolved')
          messages = []
        }
      }

      let card
      if (!messages.length) card = new this()
      else card = await this.fromMessage(messages[0])
      if (typeof data._rollMode !== 'undefined') {
        card._rollMode = data._rollMode
      }
      await card.process(data)
    } else game.socket.emit('system.CoC7', data)
  }

  static async resolveOld (userId) {
    const messages = ui.chat.collection.filter(message => {
      if (this.defaultConfig.type === message.getFlag('CoC7', 'type') && message.getFlag('CoC7', 'state') !== 'resolved') {
        if (['combinedCard'].includes(this.defaultConfig.type)) {
          return message.getFlag('CoC7', 'initiator') === userId
        }
        return true
      }
      return false
    })
    if (messages.length) {
      await messages[0].setFlag('CoC7', 'state', 'resolved')
      const card = await this.fromMessage(messages[0])
      card.closeCard()
      await card.updateChatCard()
    }
  }

  async toMessage () {
    const html = await renderTemplate(this.config.template, this)
    const htmlCardElement = $(html)
    htmlCardElement[0].dataset.object = escape(this.dataString)

    const chatData = {
      user: game.user.id,
      flavor: game.i18n.localize(this.config.title),
      content: htmlCardElement[0].outerHTML,
      flags: {
        CoC7: {
          type: this.config.type,
          state: 'initiated',
          initiator: this.initiator
        }
      }
    }

    if (['gmroll', 'blindroll'].includes(this.rollMode)) {
      chatData.whisper = ChatMessage.getWhisperRecipients('GM')
    }
    if (this.rollMode === 'blindroll') chatData.blind = true

    const msg = await ChatMessage.create(chatData)
    return msg
  }

  async updateChatCard () {
    await this.compute()
    if (!this.messageId) {
      await this.toMessage()
    } else {
      const html = await renderTemplate(this.config.template, this)
      const htmlCardElement = $.parseHTML(html)[0]

      // Attach the sanCheckCard object to the message.
      htmlCardElement.dataset.object = escape(this.dataString)

      // Update the message.
      const chatMessage = game.messages.get(this.messageId)
      if (this.closed) await chatMessage.setFlag('CoC7', 'state', 'resolved')

      const msg = await chatMessage.update({
        content: htmlCardElement.outerHTML
      })
      await ui.chat.updateMessage(msg, false)
      return msg
    }
  }

  updateRoll (data) {
    if (!data.fromGM) {
      Object.assign(this.rolls[data.rank], data.roll)
    }
  }

  addRollData (data) {
    const check = Object.assign(new CoC7Check(), data.roll)
    this.rolls.push(check)
    if (this.config.type === 'combinedCard') {
      this.initiator = data.roll.initiator
    }
  }

  addRoll (data) {
    this.rolls.push(data)
  }

  removeRoll (rank) {
    this.rolls.splice(rank, 1)
  }

  setFlag (flagName) {
    if (!flagName && !($.type(flagName) === 'string')) return
    this[flagName] = true
  }

  unsetFlag (flagName) {
    if (!flagName && !($.type(flagName) === 'string')) return
    this[flagName] = false
  }

  toggleFlag (flagName) {
    this[flagName] = !this[flagName]
  }

  get message () {
    if (this._message) return this._message
    if (this._messageId) return game.messages.get(this._messageId)
    return undefined
  }

  set message (x) {
    this._message = x
  }

  get messageId () {
    if (this._messageId) return this._messageId
    if (this._message) return this._message.id
    return undefined
  }

  set messageId (x) {
    this._messageId = x
  }

  /// /////////////////////////

  static get defaultConfig () {
    return {
      exclude: ['_actor', '_skill', '_item', '_message', '_htmlRoll'],
      excludeStartWith: '__'
    }
  }

  /// ////////////////////////

  get winners () {
    return this.rolls.filter(r => r.winner)
  }

  get winner () {
    if (this.winners.length) return this.winners[0]
    return undefined
  }

  get loosers () {
    return this.rolls.filter(r => !r.winner)
  }

  get looser () {
    if (this.loosers.length) return this.loosers[0]
    return undefined
  }

  get hasWinner () {
    if (this.winners.length > 0) return true
    return false
  }

  get isKeeper () {
    return game.user.isGM
  }

  get rollMode () {
    if (!this._rollMode) this._rollMode = game.settings.get('core', 'rollMode')
    return this._rollMode
  }

  set rollMode (x) {
    if (x === false) this._rollMode = game.settings.get('core', 'rollMode')
    this._rollMode = x
  }

  get data () {
    return JSON.parse(this.dataString)
  }

  get dataString () {
    return JSON.stringify(this, (key, value) => {
      if (value === null) return undefined
      if (this.config.exclude?.includes(key)) return undefined
      if (key.startsWith(this.config.excludeStartWith)) return undefined
      return value
    })
  }
}
