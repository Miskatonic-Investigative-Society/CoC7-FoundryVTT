
const ECC_CLASS = 'enhanced-chat-card'

const PERMISSION_TYPE = {
	GM: 'gm',
  SPEAKER: 'speaker',
	EVERYONE: 'all'
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
    EnhancedChatCardLib.socket.register('updateMessage', updateMessage)
    EnhancedChatCardLib.socket.register('advise',advise)
    // EnhancedChatCardLib.socket.register('gmtradeitemto', gmtradeitemto)
  })

  Hooks.on('renderChatMessage', (app, html, data) =>
    EnhancedChatCard.bindListeners(html)
  )
}

async function updateMessage( messageId, newContent){
  const chatMessage = game.messages.get(messageId)

  const msg = await chatMessage.update({ 
    content: newContent
  })
}

async function advise( ){
  return
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

  // static gm_onToggle (data){
  //   ui.notifications.info( 'gm_onToggle')
  // }
}

export class EnhancedChatCard {
  // static register (cardConstructor) {
  //   EnhancedChatCardLib.register(cardConstructor)
  // }

  constructor (data={},options = {}) {
    this.initialize( data)
    this._options = options
  }

  initialize( data){
    this._data = data
    if( !this._data.flags) this._data.flags = {}
  }

  get options () {
    return mergeObject(this.constructor.defaultOptions, this._options)
  }

  get template () {
    return this.options.template
  }

  get cssClasses () {
    return this.options.classes?.join( ' ')
  }

  getData(){
    return{
      card: this,
      flags: this.flags,
      data: this.toObject(),
      options: this.options,
      css: this.cssClasses,
      mySelectOptions: {
        0: 'option 1',
        1: 'option 2'
      }
    }
  }

  toObject() {
    if( !this._data) return
    const data = {};
    for ( let k of Object.keys(this._data) ) {
      const v = this._data[k]
      if ( v instanceof Object ) {
        data[k] = v.toObject ? v.toObject() : deepClone(v);
      }
      else data[k] = v;
    }
    return data;
  }

  async toMessage (optionnalChatData = {}) {

    //Map eec card type if not registered already
    // this.registerEECClass()

    //Publish by current user by default unless options.GMchatCard
    const html = await renderTemplate(this.template, this.getData())
    const htmlCardElement = $(html)[0]
    if (this.options.attachObject)
      htmlCardElement.dataset.object = escape(this.objectDataString)
    htmlCardElement.dataset.eccClass = this.constructor.name
    htmlCardElement.classList.add(...this.options.classes)

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
      const html = await renderTemplate(this.template, this.getData())
      const htmlCardElement = $.parseHTML(html)[0]

      // Attach the sanCheckCard object to the message.
      htmlCardElement.dataset.object = escape(this.objectDataString)
      htmlCardElement.dataset.eccClass = this.constructor.name
      htmlCardElement.classList.add(...this.options.classes)

      // Update the message.
      game.enhancedChatCardsLib.socket.executeAsGM( 'updateMessage', this.messageId, htmlCardElement.outerHTML)
      // const chatMessage = game.messages.get(this.messageId)

      // const msg = await chatMessage.update({ //Dispatch request by socket
        // content: htmlCardElement.outerHTML //Dispatch request by socket
      // }) //Dispatch request by socket
      // await ui.chat.updateMessage(msg, false) //Dispatch request by socket
      // return msg //Dispatch request by socket
    }
  }

  activateListeners (html) {
    // html.on(
    //   'click',
    //   `.${ECC_CLASS} .ecc-radio-switch`,
    //   this._onToggle.bind(this)
    // )
    html.on("change", "input,select,textarea", this._onSubmit.bind(this));
    html.on('click', `.${ECC_CLASS} .ecc-switch`, this._onToggle.bind(this))
    html.on('click', `.${ECC_CLASS} .submit`, this._onSubmit.bind(this))
    html.on('focusout', `.${ECC_CLASS} input`, this._onSubmit.bind(this))
    html.on('click', `.${ECC_CLASS} button`, this._onButton.bind(this))
    html.on('keydown', `.${ECC_CLASS} form`, this._onKey.bind(this))

    html.find('[data-eec-visibility]').each(( i ,el) => this.setVisibility(el))
    html.find(`.${ECC_CLASS} .ecc-switch`).each( (i, el) => this.setState(el))
    html.find(`.${ECC_CLASS} input[type="radio"]`).each( (i, el) => this.setRadioState(el))
    // html.find(`.${ECC_CLASS} .ecc-radio-switch`).each( (i, el) => this.setState(el))

  }

  setState( element){
    if( !element || !element.dataset.flag) return
    element.classList.add( this.flags[element.dataset.flag]?STATE.ON:STATE.OFF)
  }

  setRadioState( element){
    if( !element || !element.name) return
    const splited = element.name.split('.')
    if( 'data' != splited[0].toLowerCase() ) return
    if( this._data && undefined != this._data[splited[1]]){
    if( this._data[splited[1]] == element.value){
      element.checked = true
    }
  }

  }

  setVisibility( element){
    if( !element.dataset.eecVisibility) return
    const perm = element.dataset.eecVisibility.split('|')
    if( !this.hasPerm(element.dataset.eecVisibility)) element.style.display = 'none'
  }

  hasPerm( restrictedTo){
    if( !restrictedTo.length) return true
    if( game.user.isGM){
      if(restrictedTo.includes(PERMISSION_TYPE.XGM)) return false
      return true
    }
  }

  static async bindListeners (html) {
    const htmlMessageElement = html[0]
    const htmlCardElement = htmlMessageElement.querySelector(`.${ECC_CLASS}`)
    if (!htmlCardElement) return

    const card = await EnhancedChatCard.fromHTMLCardElement(htmlCardElement)
    card.assignObject()
    card.activateListeners(html)
  }

  get flags(){
    return this._data.flags
  }

  /**
   * Override to reassign object from the data structure.
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
    const card = target.closest(`.${ECC_CLASS}`)
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
      data = foundry.utils.diffObject(this._data, foundry.utils.expandObject(data))
      for (const [key, value] of Object.entries(data.data)) {
        this._data[key] = value
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
      excludeStartWith: '_',
      submitOnChange: true
    }
  }

  // get objectData () {
  //   return JSON.parse(this.objectDataString)
  // }

  get objectDataString () {
    return JSON.stringify(this._data, (key, value) => {
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

  static async fromHTMLCardElement (htmmlCard) {
    if (!htmmlCard) return
    if (!htmmlCard.dataset.eccClass) return
    const cardData = JSON.parse(unescape(htmmlCard.dataset.object))
    const message = htmmlCard.closest('.message')
    const messageId = message?.dataset?.messageId

    return await this.fromData(cardData, htmmlCard.dataset.eccClass, messageId)
   
  }

  static async fromData (data, cardClassName, messageId = null) {
    const cardClass = game.enhancedChatCardsLib.types.get( cardClassName)

    if (!cardClass) {
      console.error(
        `Unknown chat card type: ${htmlCardElement.dataset.eccClass}`
      )
      return
    }

   const card = new cardClass(data)
   if( messageId) card.messageId = messageId
   await card.assignObject()
    return card
  }

  setFlag (flagName) {
    if (!flagName && !($.type(flagName) === 'string')) return
    this._data.flags[flagName] = true
  }

  unsetFlag (flagName) {
    if (!flagName && !($.type(flagName) === 'string')) return
    this._data.flags[flagName] = false
  }

  toggleFlag (flagName) {
    this.flags[flagName] = !this.flags[flagName]
  }

  async _onToggle (event) {
    // const answer = await EnhancedChatCardLib.socket.executeAsGM('gm_onToggle', {
    //   event: event,
    //   card: this
    // })
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
    const toggle = target.closest('.ecc-radio')
    if (!toggle) {
      this.toggleFlag(flag)
    } else {
      const buttons = toggle.querySelectorAll('.ecc-switch')
      for (const b of buttons) {
        this.unsetFlag(b.dataset.flag)
      }
      this.setFlag(flag)
    }
    const card = target.closest(`.${ECC_CLASS}`)
    if (card) this._update(card)
    this.updateChatCard()
  }
}
