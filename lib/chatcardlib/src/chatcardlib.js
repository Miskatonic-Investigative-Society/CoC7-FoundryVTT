const ECC_CLASS = 'enhanced-chat-card'

Hooks.once('socketlib.ready', initECCSocket)

Hooks.on('renderChatMessage' , (app, html, data) => EnhancedChatCard.bindListeners(html))

function initECCSocket(){
  EnhancedChatCardLib.socket = socketlib.registerSystem(game.system.id)  //Socket is attached to current system
  Hooks.callAll("eec.ready");
}

class EnhancedChatCardLib {
  constructor(){
    this.types = new Map()
    this.socket = null
  }

  static set socket(x){
    if(!game.enhancedChatCardsLib) game.enhancedChatCardsLib = new EnhancedChatCardLib()
    game.enhancedChatCardsLib.socket = x
  }

  static get types(){
    if(!game.enhancedChatCardsLib) game.enhancedChatCardsLib = new EnhancedChatCardLib()
    return game.enhancedChatCardsLib.types    
  }

  register (cardConstructor){
    if ( !this.types.get( cardConstructor.name)){
      this.types.set( cardConstructor.name, cardConstructor)
    }
  }

  // registerCard( cardClass){
  //   const cardClassName = cardClass.name
  //   if( !this.types.get( cardClassName)){
  //     this.types.set( cardClassName, cardClass)
  //   }
  // }
}

export class EnhancedChatCard {
  static register( cardConstructor){
    EnhancedChatCardLib.register( cardConstructor)
  }

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
    if(this.options.attachObject) htmlCardElement.dataset.object = escape(this.objectDataString)
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

    if ( ["gmroll", "blindroll"].includes(this.rollMode) ) chatData.whisper = ChatMessage.getWhisperRecipients("GM");
    if ( this.rollMode === "selfroll" ) chatData.whisper = [game.user.id];
    if ( this.rollMode === "blindroll" ) chatData.blind = true;

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
      htmlCardElement.dataset.cardClass = this.constructor.name
      htmlCardElement.classList.add(...this.cssClasses)

      // Update the message.
      const chatMessage = game.messages.get(this.messageId)

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
      `.${ECC_CLASS} .ic-radio-switch`,
      this._onToggle.bind(this)
    )
    html.on('click', `.${ECC_CLASS} .ic-switch`, this._onToggle.bind(this))
    html.on('click', `.${ECC_CLASS} .submit`, this._onSubmit.bind(this))
    html.on('focusout', 'input', this._onSubmit.bind(this))
    html.on('click', `.${ECC_CLASS} button`, this._onButton.bind(this))
    html.on('keydown', 'form', this._onKey.bind(this))
  }

  static async bindListeners (html) {
    const htmlMessageElement = html[0]
    const htmlCardElement = htmlMessageElement.querySelector(`.${ECC_CLASS}`)
    if (!htmlCardElement) return
    if (!htmlCardElement.dataset.eccClass) return
    const cardClass = EnhancedChatCardLib.types.get( htmlCardElement.dataset.eccClass)
    if ( !cardClass) {
      console.error(`Unknown chat card type: ${htmlCardElement.dataset.eccClass}`)
      return
    }

    const card = await EnhancedChatCard.fromHTMLCardElement(htmlCardElement)
    const typedCard = Object.assign(
      new cardClass(),
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
    if (this._messageId) return game.message.get(this._messageId)
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