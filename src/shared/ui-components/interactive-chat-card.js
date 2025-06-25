/* global $, ChatMessage, FormDataExtended, foundry, game, renderTemplate, ui */
import { chatHelper } from '../dice/helper.js'

export class InteractiveChatCard {
  constructor (options = {}) {
    this._options = options
  }

  get options () {
    return foundry.utils.mergeObject(this.constructor.defaultOptions, this._options)
  }

  get template () {
    return this.options.template
  }

  get cssClasses () {
    return this.options.classes
  }

  async toMessage (optionnalChatData = {}) {
    const html = await renderTemplate(this.template, this)
    const htmlCardElement = $(html)[0]
    htmlCardElement.dataset.object = escape(this.dataString)
    htmlCardElement.dataset.cardClass = this.constructor.name
    htmlCardElement.classList.add(...this.cssClasses)

    const chatData = foundry.utils.mergeObject(
      {
        user: game.user.id,
        flavor: game.i18n.localize(this.options.title),
        content: htmlCardElement.outerHTML
      },
      optionnalChatData
    )

    if (['gmroll', 'blindroll'].includes(this.rollMode)) {
      chatData.whisper = ChatMessage.getWhisperRecipients('GM')
    }
    if (this.rollMode === 'blindroll') chatData.blind = true

    ChatMessage.create(chatData).then(msg => {
      return msg
    })
  }

  async updateChatCard (options = {}) {
    if (options.compute) this.compute()
    if (!this.messageId) {
      this.toMessage()
    } else {
      const html = await renderTemplate(this.template, this)
      const htmlCardElement = $.parseHTML(html)[0]

      // Attach the sanCheckCard object to the message.
      htmlCardElement.dataset.object = escape(this.dataString)
      htmlCardElement.dataset.cardClass = this.constructor.name
      htmlCardElement.classList.add(...this.cssClasses)

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

  activateListeners (html) {
    html.on(
      'click',
      '.interactive-card .ic-radio-switch',
      this._onToggle.bind(this)
    )
    html.on('click', '.interactive-card .ic-switch', this._onToggle.bind(this))
    html.on('click', '.interactive-card .submit', this._onSubmit.bind(this))
    html.on('focusout', 'input', this._onSubmit.bind(this))
    html.on('click', '.interactive-card button', this._onButton.bind(this))
    html.on('keydown', 'form', this._onKey.bind(this))
  }

  static async bindListeners (html) {
    const htmlMessageElement = html[0]
    const htmlCardElement = htmlMessageElement.querySelector('.chat-card')
    if (!htmlCardElement) return
    if (!htmlCardElement.dataset.cardClass) return
    if (
      !Object.getOwnPropertyNames(game.CoC7.cards).includes(
        htmlCardElement.dataset.cardClass
      )
    ) {
      return
    }
    const card = await InteractiveChatCard.fromHTMLCardElement(htmlCardElement)
    const typedCard = Object.assign(
      new game.CoC7.cards[htmlCardElement.dataset.cardClass](),
      card
    )
    typedCard.assignObject()
    typedCard.activateListeners(html)
  }

  /**
   * Override to reassign object type
   * @returns
   */
  assignObject () {}

  /**
   *
   * @param {*} event will check for an action (data-action)
   * if a method with that name exist it will be triggered.
   */
  _onButton (event) {
    const button = event.currentTarget
    // button.style.display = 'none' //Avoid multiple push
    const action = button.dataset.action
    if (this[action]) this[action]({ event, update: true })
  }

  /**
   *
   * @param {*} event
   * @returns false if key is enter to avoid global submission
   */
  _onKey (event) {
    if (event.key === 'Enter') this._onSubmit(event)
    return event.key !== 'Enter'
  }

  _onSubmit (event) {
    event.preventDefault()

    const target = event.currentTarget
    const card = target.closest('.interactive-card')
    if (!card) return
    const updates = this._update(card)
    if (updates) this.updateChatCard()
  }

  _update (card) {
    const forms = card.querySelectorAll('form')
    let updates = false
    for (let i = 0; i < forms.length; i++) {
      const form = forms[i]
      const fd = new FormDataExtended(form)
      let data = fd.object
      data = foundry.utils.diffObject(this, foundry.utils.expandObject(data))
      for (const [key, value] of Object.entries(data)) {
        this[key] = value
        updates = true
      }
    }
    return updates
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

  static get defaultOptions () {
    return {
      classes: ['interactive-card'],
      exclude: ['_actor', '_skill', '_item', '_message', '_htmlRoll'],
      excludeStartWith: '__'
    }
  }

  get data () {
    return JSON.parse(this.dataString)
  }

  get dataString () {
    return JSON.stringify(this, (key, value) => {
      if (value === null) return undefined
      if (this.options.exclude?.includes(key)) return undefined
      if (key.startsWith(this.options.excludeStartWith)) return undefined
      return value
    })
  }

  get rollMode () {
    if (!this._rollMode) this._rollMode = game.settings.get('core', 'rollMode')
    return this._rollMode
  }

  set rollMode (x) {
    if (x === false) this._rollMode = game.settings.get('core', 'rollMode')
    this._rollMode = x
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
    if (!cardData.messageId) {
      const message = card.closest('.message')
      cardData.messageId = message?.dataset?.messageId
    }
    return await this.fromData(cardData)
  }

  static async fromData (data) {
    const card = Object.assign(new this(), data)
    await card.assignObject()
    return card
  }

  /// ////////////////////////////////
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

  async _onToggle (event) {
    event.preventDefault()

    const target = event.currentTarget
    if ('action' in target.dataset) return this._onButton(event)
    if (
      target &&
      target.classList.contains('gm-select-only') &&
      !game.user.isGM
    ) {
      return
    }
    const flag = target.dataset.flag
    if (!flag) return
    const toggle = target.closest('.ic-radio')
    if (!toggle) {
      this.toggleFlag(flag)
    } else {
      const buttons = toggle.querySelectorAll('.ic-radio-switch')
      for (const b of buttons) {
        this.unsetFlag(b.dataset.flag)
      }
      this.setFlag(flag)
    }
    const card = target.closest('.interactive-card')
    if (card) this._update(card)
    this.updateChatCard()
  }

  /// ///////////////////////////////

  get displayActorOnCard () {
    return game.settings.get('CoC7', 'displayActorOnCard')
  }

  get isBlind () {
    if (!this.rollMode) return null
    if (undefined === this._isBlind) {
      this._isBlind = this.rollMode === 'blindroll'
    }
    return this._isBlind
  }

  set isBlind (x) {
    this._isBlind = x
  }

  get actor () {
    if (!this.actorKey) return null
    return chatHelper.getActorFromKey(this.actorKey) // REFACTORING (2)
  }

  get token () {
    if (!this.actor) return null
    return chatHelper.getTokenFromKey(this.actorKey)
  }

  get item () {
    if (!this.itemId) return null
    return this.actor.items.get(this.itemId)
  }

  get weapon () {
    return this.item
  }

  get targetedTokens () {
    return [...game.user.targets]
  }

  get target () {
    if (this.targetToken) return this.targetToken
    return this.targetActor
  }

  get isTargetOwner () {
    return this.target.isOwner
  }

  get isKeeper () {
    return game.user.isGM
  }

  /**
   * If a targetKey was provided try to find a token with that key and use it.
   * If not targetKey provided return the first target.
   */
  get targetToken () {
    if (!this._targetToken) {
      if (this._targetKey) {
        this._targetToken = chatHelper.getTokenFromKey(this._targetKey)
      } else {
        this._targetToken = this.targetedTokens.pop()
        if (this._targetToken) {
          this._targetKey = `${this._targetToken.scene.id}.${this._targetToken.id}`
        } else {
          // REFACTORING (2)
          this._targetToken = null
        }
      }
    }
    return this._targetToken
  }

  get targetActor () {
    if (!this._targetActor) {
      if (this.targetToken) {
        this._targetActor =
          this.targetToken.actor ||
          this.targetToken.data.actor ||
          this.targetToken.data.document
      } else {
        this._targetActor = chatHelper.getActorFromKey(this._targetKey) // REFACTORING (2)
      }
    }
    return this._targetActor
  }

  get targetKey () {
    if (!this.targetToken && !this.targetActor) return null
    return this._targetKey
  }

  get hasTarget () {
    if (!this.targetToken && !this.targetActor) return false
    return true
  }

  set targetKey (x) {
    this._targetKey = x
  }

  get skills () {
    return this.actor.getWeaponSkills(this.itemId)
  }

  get targetImg () {
    const img = chatHelper.getActorImgFromKey(this.targetKey)
    if (img) return img
    return '../icons/svg/mystery-man-black.svg'
  }

  get name () {
    if (this.token) return this.token.name
    return this.actor.name
  }

  get targetName () {
    if (!this.target) return 'dummy'
    return this.target.name
  }

  get actorImg () {
    const img = chatHelper.getActorImgFromKey(this.actorKey)
    if (img) return img
    return '../icons/svg/mystery-man-black.svg'
  }
}
