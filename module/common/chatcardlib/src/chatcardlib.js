const ECC_CLASS = 'enhanced-chat-card'

const PERMISSION_TYPE = {
  GM: 'gm', // user is GM
  SPEAKER: 'speaker', // the speaker is an actor controled/owned by the user
  USER: 'user', // the user is the message's author
  EVERYONE: 'all', // equivalent to empty string
  BLACKLIST: 'blacklist' // invert the logic
}

const STATE = {
  ON: 'switched-on',
  OFF: 'switched-off'
}

export function initEEC (...cardclass) {
  // Hooks.once('init', function () {
  // })

  Hooks.on('renderChatLog', (app, html, data) =>
    EnhancedChatCardLib.injectCSS(app, html, data)
  )

  Hooks.once('socketlib.ready', function () {
    EnhancedChatCardLib.register(cardclass)
    EnhancedChatCardLib.socket = socketlib.registerSystem(game.system.id) //Socket is attached to current system
    EnhancedChatCardLib.socket.register('updateMessage', updateMessage)
    EnhancedChatCardLib.socket.register('advise', advise)
    // EnhancedChatCardLib.socket.register('gmtradeitemto', gmtradeitemto)
  })

  Hooks.on('renderChatMessage', (app, html, data) =>
    EnhancedChatCard.bindListeners(html)
  )
}

async function updateMessage (messageId, newContent) {
  const chatMessage = game.messages.get(messageId)

  const msg = await chatMessage.update({
    content: newContent
  })
}

async function advise () {
  return
}

class EnhancedChatCardLib {
  constructor () {
    this.types = new Map()
    this.socket = null
    // this.enhancedChatCardClass = EnhancedChatCard
  }

  static injectCSS (app, html, data) {
    return
  }

  static set socket (x) {
    if (!game.enhancedChatCardsLib)
      game.enhancedChatCardsLib = new EnhancedChatCardLib()
    game.enhancedChatCardsLib.socket = x
  }

  static get socket () {
    if (!game.enhancedChatCardsLib) {
      ui.notifications.error('EEC not Initialized')
      return undefined
    }
    if (!game.enhancedChatCardsLib.socket) {
      ui.notifications.error('EEC no socket')
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
    })
  }

  // static gm_onToggle (data){
  //   ui.notifications.info( 'gm_onToggle')
  // }
}

export class EnhancedChatCard {
  // static register (cardConstructor) {
  //   EnhancedChatCardLib.register(cardConstructor)
  // }

  constructor (data = {}, options = {}) {
    this.initialize(data)
    this._options = options
  }

  initialize (data) {
    this._data = data
    if (!this._data.flags) this._data.flags = {}
  }

  get options () {
    return mergeObject(this.constructor.defaultOptions, this._options)
  }

  get template () {
    return this.options.template
  }

  get cssClasses () {
    return this.options.classes?.join(' ')
  }

  get speaker () {
    if (this.options.ooc) return game.user
    if (
      this.options.speaker &&
      ChatMessage.getSpeakerActor(this.options.speaker)
    )
      return ChatMessage.getSpeakerActor(this.options.speaker)
    return game.user
  }

  getData () {
    return {
      card: this,
      flags: this.flags,
      data: this.toObject(),
      options: this.options,
      css: this.cssClasses,
      user: game.user,
      speaker: this.speaker
    }
  }

  toObject () {
    if (!this._data) return
    const data = {}
    for (let k of Object.keys(this._data)) {
      const v = this._data[k]
      if (v instanceof Object) {
        data[k] = v.toObject ? v.toObject() : deepClone(v)
      } else data[k] = v
    }
    return data
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

    const speaker =
      this.options.speaker && !this.options.ooc
        ? ChatMessage.getSpeaker(this.options.speaker)
        : {}

    const chatData = foundry.utils.mergeObject(
      {
        user: game.user.id,
        speaker: speaker,
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
      game.enhancedChatCardsLib.socket.executeAsGM(
        'updateMessage',
        this.messageId,
        htmlCardElement.outerHTML
      )
      // const chatMessage = game.messages.get(this.messageId)

      // const msg = await chatMessage.update({ //Dispatch request by socket
      // content: htmlCardElement.outerHTML //Dispatch request by socket
      // }) //Dispatch request by socket
      // await ui.chat.updateMessage(msg, false) //Dispatch request by socket
      // return msg //Dispatch request by socket
    }
  }

  async activateListeners (html) {
    // html.on(
    //   'click',
    //   `.${ECC_CLASS} .ecc-radio-switch`,
    //   this._onToggle.bind(this)
    // )
    html.on('change', 'input,select,textarea', this._onChange.bind(this))
    html.on('click', `.${ECC_CLASS} .ecc-switch`, this._onToggle.bind(this))
    html.on('click', `.${ECC_CLASS} .submit`, this._onSubmit.bind(this))
    html.on('focusout', `.${ECC_CLASS} input`, this._onChange.bind(this))
    html.on('click', `.${ECC_CLASS} button`, this._onButton.bind(this))
    html.on('keydown', `.${ECC_CLASS} form`, this._onKey.bind(this))

    // const visi = html.find('[data-eec-visibility]')
    // for (let i = 0; i < visi.length; i++) {
    //   const el = visi[i];
    //   await this.setVisibility(el)

    // }

    html
      .find('[data-eec-visibility]')
      .each(async (i, el) => await this.setVisibility(el))
    html
      .find('[data-eec-permissions]')
      .each(async (i, el) => await this.setPermission(el))
    html.find(`.${ECC_CLASS} .ecc-switch`).each((i, el) => this.setState(el))
    html
      .find(`.${ECC_CLASS} input[type="radio"]`)
      .each((i, el) => this.setRadioState(el))
    // html.find(`.${ECC_CLASS} .ecc-radio-switch`).each( (i, el) => this.setState(el))
  }

  setState (element) {
    if (!element || !element.dataset.flag) return
    element.classList.add(
      this.flags[element.dataset.flag] ? STATE.ON : STATE.OFF
    )
  }

  setRadioState (element) {
    if (!element || !element.name) return
    const splited = element.name.split('.')
    if ('data' != splited[0].toLowerCase()) return
    if (this._data && undefined != this._data[splited[1]]) {
      if (this._data[splited[1]] == element.value) {
        element.checked = true
      }
    }
  }

  async setVisibility (element) {
    if (!element.dataset.eecVisibility) return
    const canYouSee = await this.hasPerm(element.dataset.eecVisibility, true)
    if (!canYouSee) element.style.display = 'none'
  }

  async setPermission (element) {
    if (!element.dataset.eecPermissions) return
    const canYouMod = await this.hasPerm(element.dataset.eecModify)
    if (!canYouMod) element.classList.add('eec-restricted')
  }

  /**
   * Check if the current user as permission against a string of allowed persons.
   * If the string is empty permission are all granted
   * @param {string} restrictedTo   A string containing the set of player allowed. Value can be owner, gm, players, uuid separated by space
   * @param {boolean} vision        if true gm will be considered for permissions. false = gm has always right. true GM permission will be checked
   * @returns
   */
  async hasPerm (restrictedTo, vision = false) {
    if (!restrictedTo.length) return true
    let permissionsArray = restrictedTo.split(' ')
    const whiteList = !permissionsArray.includes(PERMISSION_TYPE.BLACKLIST)
    if (!whiteList)
      permissionsArray = permissionsArray.filter(
        e => e != PERMISSION_TYPE.BLACKLIST
      )
    if (game.user.isGM) {
      if (!vision) return true //GM can always modify everything ! Nah
      if (permissionsArray.includes(PERMISSION_TYPE.GM))
        return true && whiteList
      return false || !whiteList //If pass the filter return false unless it's a blacklist
    } else {
      permissionsArray = permissionsArray.filter(e => e != PERMISSION_TYPE.GM)
    }

    if (permissionsArray.includes(PERMISSION_TYPE.USER)) {
      if (this.message.isAuthor) return true && whiteList //isAuthor vs user.isOwner ?
      permissionsArray = permissionsArray.filter(e => e != PERMISSION_TYPE.USER)
    }

    if (permissionsArray.includes(PERMISSION_TYPE.SPEAKER)) {
      const speaker = this.message.data.speaker
      if (speaker.token && speaker.scene) {
        const actor = await fromUuid(
          `Scene.${speaker.scene}.Token.${speaker.token}`
        )
        if (actor) {
          if (actor.isOwner) return true && whiteList
        }
      } else if (speaker.actor) {
        const actor = game.actors.get(speaker.actor)
        if (actor) {
          if (actor.isOwner) return true && whiteList
        }
      }
      // else if (speaker.user) {
      //   if (game.user.id == speaker.user) return true && whiteList
      // }
      permissionsArray = permissionsArray.filter(
        e => e != PERMISSION_TYPE.SPEAKER
      )
    }
    // All filter passed, array should contains only uuids or actor/token ids
    if (permissionsArray.length) {
      ui.notifications.info('Array permission is not empty !')
    }
    return false || !whiteList //If pass the filter return false unless it's a blacklist
  }

  static async bindListeners (html) {
    const htmlMessageElement = html[0]
    const htmlCardElement = htmlMessageElement.querySelector(`.${ECC_CLASS}`)
    if (!htmlCardElement) return

    const card = await EnhancedChatCard.fromHTMLCardElement(htmlCardElement)
    card.assignObject()
    card.activateListeners(html)
  }

  get flags () {
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
    if (!action) {
      console.warn(`no action associated with this button`)
      return
    }
    if (!this[action]) {
      console.warn(`no ${action} action found for this card`)
      return
    }
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

  _onChange (event) {
    if (this.options.submitOnChange) {
      return this._onSubmit(event)
    }
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
      data = foundry.utils.diffObject(
        this._data,
        foundry.utils.expandObject(data)
      )
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
      submitOnChange: true,
      speaker: ChatMessage.getSpeaker(),
      ooc: false //  * @param {boolean} [options.ooc=false]  Use the speaker/getspeaker. if true use the user instead
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
    const cardClass = game.enhancedChatCardsLib.types.get(cardClassName)

    if (!cardClass) {
      console.error(
        `Unknown chat card type: ${htmlCardElement.dataset.eccClass}`
      )
      return
    }

    const card = new cardClass(data)
    if (messageId) card.messageId = messageId
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
    if (this.options.submitOnChange) {
      if (card) this._update(card)
      this.updateChatCard()
    }
  }
}
