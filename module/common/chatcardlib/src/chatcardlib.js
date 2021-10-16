
const ECC_CLASS = 'enhanced-chat-card'

const PERMISSION_TYPE = {
	GM: 'gm',
	OWNERS: 'owners',
  SPEAKER: 'speaker',
  USER: 'user',
	EVERYONE: ''
}

const STATE = {
  ON: 'switched-on',
  OFF: 'switched-off'
}


export function initEEC (...cardclass) {
  // Hooks.once('init', function () {
  // })

  Hooks.once('socketlib.ready', function () {
    EnhancedChatCardLib.register( cardclass)
    EnhancedChatCardLib.socket = socketlib.registerSystem(game.system.id) //Socket is attached to current system
    EnhancedChatCardLib.socket.register('gm_onToggle', EnhancedChatCardLib.gm_onToggle)
    // EnhancedChatCardLib.socket.register('gmtradeitemto', gmtradeitemto)
  })

  Hooks.on('renderChatMessage', (app, html, data) =>
    EnhancedChatCard.bindListeners(html)
  )
}

class EnhancedChatCardLib {
  constructor () {
    this.types = new Map()
    this.socket = null
    // this.enhancedChatCardClass = EnhancedChatCard
  }

  static set socket (x) {
    if (!game.enhancedChatCardsLib)
      game.enhancedChatCardsLib = new EnhancedChatCardLib()
    game.enhancedChatCardsLib.socket = x
  }

  static get socket () {
    if( !game.enhancedChatCardsLib) {
      ui.notifications.error( 'EEC not Initialized')
      return undefined
    }
    if( !game.enhancedChatCardsLib.socket){
      ui.notifications.error( 'EEC no socket')
      return undefined
    }
    return game.enhancedChatCardsLib.socket
  }

  static get types () {
    if (!game.enhancedChatCardsLib)
      game.enhancedChatCardsLib = new EnhancedChatCardLib()
    return game.enhancedChatCardsLib.types
  }

  static register (cardConstructors) {
    cardConstructors.forEach(cardConstructor => {
      if (!EnhancedChatCardLib.types.get(cardConstructor.name)) {
        EnhancedChatCardLib.types.set(cardConstructor.name, cardConstructor)
      }
    });
  }

  static gm_onToggle (data){
    ui.notifications.info( 'gm_onToggle')
  }
}

export class EnhancedChatCard {
  // static register (cardConstructor) {
  //   EnhancedChatCardLib.register(cardConstructor)
  // }

  constructor (options = {}) {
    this._options = options
  }

  get options () {
    return mergeObject(this.constructor.defaultOptions, this._options)
  }

  get template () {
    return this.options.template
  }

  get cssClasses () {
    return this.options.classes
  }

  async toMessage (optionnalChatData = {}) {
    //Map eec card type if not registered already
    // this.registerEECClass()

    //Publish by current user by default unless options.GMchatCard
    const html = await renderTemplate(this.template, this)
    const htmlCardElement = $(html)[0]
    if (this.options.attachObject)
      htmlCardElement.dataset.object = escape(this.objectDataString)
    htmlCardElement.dataset.eccClass = this.constructor.name
    htmlCardElement.classList.add(...this.cssClasses)

    const chatData = foundry.utils.mergeObject(
      {
        user: game.user.id,
        flavor: game.i18n.localize(this.options.title),
        content: htmlCardElement.outerHTML
      },
      optionnalChatData
    )

    if (['gmroll', 'blindroll'].includes(this.rollMode))
      chatData.whisper = ChatMessage.getWhisperRecipients('GM')
    if (this.rollMode === 'selfroll') chatData.whisper = [game.user.id]
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
      htmlCardElement.dataset.object = escape(this.objectDataString)
      htmlCardElement.dataset.eccClass = this.constructor.name
      htmlCardElement.classList.add(...this.cssClasses)

      // Update the message.
      const chatMessage = game.messages.get(this.messageId)

      const msg = await chatMessage.update({ //Dispatch request by socket
        content: htmlCardElement.outerHTML //Dispatch request by socket
      }) //Dispatch request by socket
      await ui.chat.updateMessage(msg, false) //Dispatch request by socket
      return msg //Dispatch request by socket
    }
  }

  activateListeners (html) {
    const card = this
    html.on(
      'click',
      `.${ECC_CLASS} .ecc-radio-switch`,
      this._onToggle.bind(this)
    )
    html.on('click', `.${ECC_CLASS} .ecc-switch`, this._onToggle.bind(this))
    html.on('click', `.${ECC_CLASS} .submit`, this._onSubmit.bind(this))
    html.on('focusout', `.${ECC_CLASS} input`, this._onSubmit.bind(this))
    html.on('click', `.${ECC_CLASS} button`, this._onButton.bind(this))
    html.on('keydown', `.${ECC_CLASS} form`, this._onKey.bind(this))

    html.find(`.${ECC_CLASS} .ecc-switch`).each( function() {
      card.setState(this)
      card.setVisibility(this)})
  }

  setState( element){
    if( !element.dataset.flag) return
    element.classList.add( this[element.dataset.flag]?STATE.ON:STATE.OFF)
  }

  setVisibility( element){
    if( !element.dataset.eecVisibility) return

  }

  hasPerm( restrictedTo){
    if( !restrictedTo.length) return true
  }

  static async bindListeners (html) {
    const htmlMessageElement = html[0]
    const htmlCardElement = htmlMessageElement.querySelector(`.${ECC_CLASS}`)
    if (!htmlCardElement) return
    if (!htmlCardElement.dataset.eccClass) return
    const cardClass = game.enhancedChatCardsLib.types.get(
      htmlCardElement.dataset.eccClass
    )
    if (!cardClass) {
      console.error(
        `Unknown chat card type: ${htmlCardElement.dataset.eccClass}`
      )
      return
    }

    const card = await EnhancedChatCard.fromHTMLCardElement(htmlCardElement)
    const typedCard = Object.assign(new cardClass(), card)
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
    if (this[action]) this[action]({ event: event, update: true })
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
      let data = fd.toObject()
      data = diffObject(this, expandObject(data))
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
      attachObject: true,
      classes: [ECC_CLASS],
      exclude: [],
      excludeStartWith: '_'
    }
  }

  get objectData () {
    return JSON.parse(this.objectDataString)
  }

  get objectDataString () {
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
    const cardElement = $(message.data.content)[0]
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
    const answer = await EnhancedChatCardLib.socket.executeAsGM('gm_onToggle', {
      event: event,
      card: this
    })
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
}
