/* global $, ChatMessage, deepClone, FormDataExtended, foundry, fromUuid, game, Hooks, renderTemplate, socketlib, ui */

const ECC_CLASS = 'enhanced-chat-card'

const PERMISSION_TYPE = {
  GM: 'gm', // user is GM
  NOT_GM: '!gm', // user is NOT gm (hide to GM in case of visibility)
  SPEAKER: 'speaker', // the speaker is an actor controled/owned by the user
  USER: 'user', // the user is the message's author
  EVERYONE: 'all', // equivalent to empty string
  BLACKLIST: 'blacklist' // invert the logic
}

const STATE = {
  ON: 'switched-on',
  OFF: 'switched-off',
  SELECTED: 'value-selected'
}

export function initECC (...cardclass) {
  // Hooks.once('init', function () {
  // })

  Hooks.on('renderChatLog', (app, html, data) =>
    EnhancedChatCardLib.injectCSS(app, html, data)
  )

  Hooks.once('socketlib.ready', function () {
    EnhancedChatCardLib.register(cardclass)
    EnhancedChatCardLib.socket = socketlib.registerSystem(game.system.id) // Socket is attached to current system
    EnhancedChatCardLib.socket.register('updateMessage', updateMessage)
    EnhancedChatCardLib.socket.register('GMUpdate', GMUpdate)
    EnhancedChatCardLib.socket.register('advise', advise)
    // EnhancedChatCardLib.socket.register('gmtradeitemto', gmtradeitemto)
  })

  Hooks.on('renderChatMessage', (app, html, data) =>
    EnhancedChatCard.bindListeners(html)
  )
}

async function updateMessage (messageId, newContent) {
  const chatMessage = game.messages.get(messageId)

  await chatMessage.update({
    content: newContent
  })
}

async function GMUpdate (data, options, cardClassName, messageId = undefined) {
  const card = await EnhancedChatCard.fromData(
    data,
    options,
    cardClassName,
    messageId
  )
  await card.GMUpdate()
  // const diff = foundry.utils.diffObject( data, card.toObject())
  return card.toObject()
}

async function advise () {}

class EnhancedChatCardLib {
  constructor () {
    this.types = new Map()
    this.socket = null
    // this.enhancedChatCardClass = EnhancedChatCard
  }

  static injectCSS () {
    let style = $('head').find('style')
    if (!style?.length) {
      $('head').append($('<style  type="text/css"></style>'))
      style = $('head').find('style')
    }
    style.append(`
      .${ECC_CLASS} {
        .ecc-restricted {color: red}
        .ecc-restricted:hover {cursor: not-allowed}
        .ecc-dropdown-button {
          border: none;
          cursor: pointer;
          display: inline-block;
          width: 100%;
          height: 100%;
        }
        .ecc-dropdown {
          position: relative;
          display: inline-block;
        }

        .ecc-dropdown-content {
          height: auto;
          display: block;
          visibility: hidden;
          position: absolute;
          min-width: 126px;
          overflow: auto;
          z-index: 1;
        }
        .ecc-dropdown-content a {
          display: block;
        }
        .show {
          visibility: visible;
        }
      }`
    )
  }

  static set socket (x) {
    if (!game.enhancedChatCardsLib) {
      game.enhancedChatCardsLib = new EnhancedChatCardLib()
    }
    game.enhancedChatCardsLib.socket = x
  }

  static get socket () {
    if (!game.enhancedChatCardsLib) {
      ui.notifications.error('ECC not Initialized')
      return undefined
    }
    if (!game.enhancedChatCardsLib.socket) {
      ui.notifications.error('ECC no socket')
      return undefined
    }
    return game.enhancedChatCardsLib.socket
  }

  static get types () {
    if (!game.enhancedChatCardsLib) {
      game.enhancedChatCardsLib = new EnhancedChatCardLib()
    }
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

function setByPath (obj, path, value) {
  const parts = path.split('.')
  let o = obj
  if (parts.length > 1) {
    for (let i = 0; i < parts.length - 1; i++) {
      if (!o[parts[i]]) o[parts[i]] = {}
      o = o[parts[i]]
    }
  }

  o[parts[parts.length - 1]] = value
}

function getByPath (obj, path) {
  const parts = path.split('.')
  let o = obj
  if (parts.length > 1) {
    for (let i = 0; i < parts.length - 1; i++) {
      if (!o[parts[i]]) return undefined
      o = o[parts[i]]
    }
  }

  return o[parts[parts.length - 1]]
}

export class EnhancedChatCard {
  // static register (cardConstructor) {
  //   EnhancedChatCardLib.register(cardConstructor)
  // }

  constructor (data = {}, options = {}) {
    this.data = data
    if (!this.data.flags) this.data.flags = {}
    this._options = options
  }

  /**
   * Called only once before sending message to chat.
   * @override
   */
  async initialize () {}

  get options () {
    return foundry.utils.mergeObject(this.constructor.defaultOptions, this._options)
  }

  set options (x) {
    this._options = x
  }

  get template () {
    return this.options.template
  }

  get cssClasses () {
    return this.options.classes.concat([ECC_CLASS]).join(' ')
  }

  get speaker () {
    if (this.options.ooc) return game.user
    if (
      this.options.speaker &&
      ChatMessage.getSpeakerActor(this.options.speaker)
    ) {
      return ChatMessage.getSpeakerActor(this.options.speaker)
    }
    return game.user
  }

  async getData () {
    // await this.assignObjects()
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
    if (!this.data) return
    const data = {}
    for (const k of Object.keys(this.data)) {
      const v = this.data[k]
      if (v instanceof Object) {
        data[k] = v.toObject ? v.toObject() : deepClone(v)
      } else data[k] = v
    }
    return data
  }

  async toMessage (optionnalChatData = {}) {
    // Map ecc card type if not registered already
    // this.registerECCClass()

    await this.initialize()

    // Publish by current user by default unless options.GMchatCard
    const data = await this.getData()
    const html = await renderTemplate(this.template, data)
    const htmlCardElement = $(html)[0]
    if (this.options.attachObject) {
      htmlCardElement.dataset.object = escape(this.objectDataString)
    }
    htmlCardElement.dataset.eccClass = this.constructor.name
    htmlCardElement.classList.add(...this.options.classes.concat([ECC_CLASS]))

    const speaker =
      this.options.speaker && !this.options.ooc
        ? ChatMessage.getSpeaker(this.options.speaker)
        : {}

    // const userId = this.options.userId ? this.options.userId : game.user.id

    const chatData = foundry.utils.mergeObject(
      {
        // user: userId,
        user: game.user.id,
        speaker,
        flavor: game.i18n.localize(this.options.title),
        content: htmlCardElement.outerHTML
      },
      optionnalChatData
    )

    if (['gmroll', 'blindroll'].includes(this.rollMode)) {
      chatData.whisper = ChatMessage.getWhisperRecipients('GM')
    }
    if (this.rollMode === 'selfroll') chatData.whisper = [game.user.id]
    if (this.rollMode === 'blindroll') chatData.blind = true

    ChatMessage.create(chatData).then(msg => {
      return msg
    })
  }

  async updateChatCard ({ attachObject = true } = {}) {
    // TODO the whole function has to be executed by GM if options.GMchatCard
    if (this.options.compute) await this.localCompute()
    if (this.options.GMUpdate) await this.ExecuteGMUpdate()
    if (!this.messageId) {
      this.toMessage()
    } else {
      const data = await this.getData()
      const html = await renderTemplate(this.template, data)
      const htmlCardElement = $.parseHTML(html)[0]

      // Attach the object to the message.
      if (attachObject && !this.data.EEC_ACTION?.detachData) {
        htmlCardElement.dataset.object = escape(this.objectDataString)
      }
      htmlCardElement.dataset.eccClass = this.constructor.name
      htmlCardElement.classList.add(...this.options.classes.concat([ECC_CLASS]))

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
    html.on('click', `.${ECC_CLASS} .inactive`, this._onInactive.bind(this))
    html.on('change', 'input,select,textarea', this._onChange.bind(this))
    html.on('click', `.${ECC_CLASS} .ecc-switch:not('.inactive')`, this._onToggle.bind(this))
    html.on('click', `.${ECC_CLASS} input[type="checkbox"]:not('.inactive')`, this._onToggle.bind(this))
    html.on('click', `.${ECC_CLASS} .submit:not('.inactive')`, this._onSubmit.bind(this))
    html.on('focusout', `.${ECC_CLASS} input:not('.inactive')`, this._onChange.bind(this))
    html.on('click', `.${ECC_CLASS} button:not('.inactive')`, this._onButton.bind(this))
    html.on('keydown', `.${ECC_CLASS} form:not('.inactive')`, this._onKey.bind(this))

    // ECC DropDown Management
    html
      .find(`.${ECC_CLASS} .ecc-dropdown:not('.inactive') .ecc-dropdown-button`).click(event => {
        event.preventDefault()
        event.stopPropagation()
        event.currentTarget
          ?.closest('.ecc-dropdown')
          ?.querySelector('.ecc-dropdown-content')
          ?.classList.toggle('show')
      })
    html
      .find('.ecc-dropdown:not(".inactive")')
      .mouseleave(event =>
        event.currentTarget
          ?.querySelector('.ecc-dropdown-content')
          ?.classList.remove('show')
      )

    html.on('click', `.${ECC_CLASS} .ecc-dropdown .ecc-dropdown-element`, this._onDropDownSelect.bind(this))

    // const visi = html.find('[data-ecc-visibility]')
    // for (let i = 0; i < visi.length; i++) {
    //   const el = visi[i];
    //   await this.setVisibility(el)

    // }

    html
      .find('[data-ecc-visibility]')
      .each(async (i, el) => await this.setVisibility(el))
    html
      .find('[data-ecc-permissions]')
      .each(async (i, el) => await this.setPermission(el))
    html.find(`.${ECC_CLASS} .ecc-switch`).each((i, el) => this.setState(el))
    html.find(`.${ECC_CLASS} .ecc-dropdown`).each((i, el) => this.setSelectedState(el))
    html
      .find(`.${ECC_CLASS} input[type="radio"]`)
      .each((i, el) => this.setRadioState(el))
    html
      .find(`.${ECC_CLASS} input[type="checkbox"]`)
      .each((i, el) => this.setCheckboxState(el))
    // html.find(`.${ECC_CLASS} .ecc-radio-switch`).each( (i, el) => this.setState(el))
  }

  setState (element) {
    if (!element) return
    if (element.dataset.flag) {
      element.classList.add(
        this.flags[element.dataset.flag] ? STATE.ON : STATE.OFF
      )
    } else if (element.dataset.name) {
      const value = getByPath(this, element.dataset.name)
      element.classList.add(value ? STATE.ON : STATE.OFF)
    }
  }

  setSelectedState (element) {
    if (!element) return
    if (element.dataset.name) {
      const value = getByPath(this, element.dataset.name)
      if (!value) return
      if (Array.from(element.querySelectorAll('.ecc-dropdown-element'), node => node.dataset?.value).includes(value)) {
        element.classList.add(STATE.SELECTED)
      }
    }
    if (element.dataset.flag) {
      element.classList.add(
        this.flags[element.dataset.flag] ? STATE.ON : STATE.OFF
      )
    }
  }

  setRadioState (element) {
    if (!element || !element.name) return
    const splited = element.name.split('.')
    if (splited[0].toLowerCase() !== 'data') return
    if (this.data && typeof this.data[splited[1]] !== 'undefined') {
      if (this.data[splited[1]] === element.value) {
        element.checked = true
      }
    }
  }

  setCheckboxState (element) {
    if (!element || !element.dataset.flag) return
    if (this.flags && typeof this.flags[element.dataset.flag] !== 'undefined') {
      this.flags[element.dataset.flag] ? element.checked = true : element.checked = false
    }
  }

  async setVisibility (element) {
    if (!element.dataset.eccVisibility) return
    const canYouSee = await this.hasPerm(element.dataset.eccVisibility, true)
    if (!canYouSee) element.style.display = 'none'
  }

  async setPermission (element) {
    if (!element.dataset.eccPermissions) return
    const canYouMod = await this.hasPerm(element.dataset.eccPermissions)
    if (!canYouMod) {
      element.classList.add('ecc-restricted')
      if ($(element).is('input')) {
        if (element.type === 'range') $(element).attr('disabled', true)
        else $(element).attr('readonly', true)
      }
      if ($(element).is('select')) $(element).attr('disabled', true)
    }
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
    if (!whiteList) {
      permissionsArray = permissionsArray.filter(
        e => e !== PERMISSION_TYPE.BLACKLIST
      )
    }
    if (game.user.isGM) {
      if (!vision) return true // GM can always modify everything ! Nah
      if (permissionsArray.includes(PERMISSION_TYPE.GM)) {
        return true && whiteList
      }
      if (permissionsArray.includes(PERMISSION_TYPE.NOT_GM)) {
        return false || !whiteList
      }
    }

    permissionsArray = permissionsArray.filter(e => e !== PERMISSION_TYPE.GM)
    permissionsArray = permissionsArray.filter(
      e => e !== PERMISSION_TYPE.NOT_GM
    )

    //   return false || !whiteList //If pass the filter return false unless it's a blacklist
    // } else {
    //   permissionsArray = permissionsArray.filter(e => e != PERMISSION_TYPE.GM)
    // }

    if (permissionsArray.includes(PERMISSION_TYPE.USER)) {
      if (this.message.isAuthor) return true && whiteList // isAuthor vs user.isOwner ?
      permissionsArray = permissionsArray.filter(
        e => e !== PERMISSION_TYPE.USER
      )
    }

    if (permissionsArray.includes(PERMISSION_TYPE.SPEAKER)) {
      const speaker = this.message.speaker
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
        e => e !== PERMISSION_TYPE.SPEAKER
      )
    }
    // All filter passed, array should contains only uuids or actor/token ids
    if (permissionsArray.length) {
      for (let i = 0; i < permissionsArray.length; i++) {
        const uuid = permissionsArray[i]
        let actor = await fromUuid(uuid)
        if (!actor) actor = game.actors.get(uuid)
        if (actor) {
          return actor.isOwner
        } else {
          ui.notifications.error(`Unable to find actor ${uuid}`)
        }
      }
    }
    return false || !whiteList // If pass the filter return false unless it's a blacklist
  }

  static async bindListeners (html) {
    const htmlMessageElement = html[0]
    const htmlCardElement = htmlMessageElement.querySelector(`.${ECC_CLASS}`)
    if (!htmlCardElement) return

    const card = await EnhancedChatCard.fromHTMLCardElement(htmlCardElement)
    if (!card) return
    card.activateListeners(html)
  }

  get flags () {
    return this.data.flags
  }

  /**
   * Override to reassign object from the data structure.
   * @returns
   */
  async assignObjects () {}

  /**
   * Override to update object after data change.
   * This is called by the local client
   * @returns
   */
  async localCompute () {}

  /**
   * Override to update object after data change.
   * This is called by one of the GM clients.
   * @returns
   */
  async GMUpdate () {}

  async ExecuteGMUpdate () {
    const newData = await game.enhancedChatCardsLib.socket.executeAsGM(
      'GMUpdate',
      this.toObject(),
      this._options,
      this.constructor.name,
      this.messageId
    )

    this.data = newData
    await this.assignObjects()
  }

  /**
   *
   * @param {*} event will check for an action (data-action)
   * if a method with that name exist it will be triggered.
   */
  async _onButton (event) {
    event.preventDefault()

    const target = event.currentTarget

    const originalDisplayStyle = target.style.display
    target.style.display = 'none' // Avoid multiple push
    const action = target.dataset.action

    let formUpdate
    let actionUpdate = false

    // if ('submit' == target.type) {
    //   console.warn('Button is also a submit')
    // }

    // Perform card update first
    const card = target.closest(`.${ECC_CLASS}`)
    if (card) formUpdate = this._update(card)
    else {
      console.error(
        `Could not find a EEC class for this card: ${this.constructor.name}`
      )
    }

    if (!action) {
      console.warn('no action associated with this button')
      if (!formUpdate) return false// If the form was updated we still update the card
    }
    if (!this[action]) {
      console.warn(`no ${action} action found for this card`)
      if (!formUpdate) return false// If the form was updated we still update the card
    }
    if (this[action]) {
      actionUpdate = await this[action]({ event, updateCard: false })
    }

    if (formUpdate || actionUpdate) await this.updateChatCard()
    else target.style.display = originalDisplayStyle
    return (formUpdate || actionUpdate)
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

  _onInactive (event) {
    event.stopPropagation()
    event.preventDefault()
  }

  _onSubmit (event) {
    const target = event.currentTarget
    const tagName = target.tagName
    if (tagName === 'BUTTON' && 'action' in target.dataset) return //
    event.preventDefault()

    const card = target.closest(`.${ECC_CLASS}`)
    if (!card) return
    const updates = this._update(card)
    if (updates) this.updateChatCard()
  }

  /**
   * Retrieve the form from the card and update the data structure
   * @param {HTMLElement} card
   * @returns
   */
  _update (card) {
    const forms = card.querySelectorAll('form')
    let updates = false
    for (let i = 0; i < forms.length; i++) {
      const form = forms[i]
      const fd = new FormDataExtended(form)
      const data = fd.object
      // data = foundry.utils.diffObject(
      //   this.data,
      //   foundry.utils.expandObject(data)
      // )
      for (const [key, value] of Object.entries(data)) {
        const oldValue = getByPath(this, key)
        if (!(oldValue === value)) {
          setByPath(this, key, value)
          updates = true
        }
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
      classes: [],
      exclude: [],
      excludeStartWith: '_',
      submitOnChange: true,
      speaker: ChatMessage.getSpeaker(),
      ooc: false, //  * @param {boolean} [options.ooc=false]  Use the speaker/getspeaker. if true use the user instead
      compute: true, // * @param {boolean} [options.compute.local=true] invoque the compute method as local user => need to override localCompute
      GMUpdate: false // * @param {boolean} [options.compute.GM=false] invoque the GMUpdate method as GM => need to override GMUpdate
    }
  }

  get objectDataString () {
    const saveData = {
      data: this.data,
      options: this._options
    }
    return JSON.stringify(saveData, (key, value) => {
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

  static async fromHTMLCardElement (htmmlCard) {
    if (!htmmlCard) return
    if (!htmmlCard.dataset.eccClass) return
    if (!htmmlCard.dataset.object) return
    const cardData = JSON.parse(unescape(htmmlCard.dataset.object))
    const message = htmmlCard.closest('.message')
    const messageId = message?.dataset?.messageId

    return await this.fromData(
      cardData.data,
      cardData.options,
      htmmlCard.dataset.eccClass,
      messageId
    )
  }

  static async fromData (data, options, cardClassName, messageId = undefined) {
    const CardClass = game.enhancedChatCardsLib.types.get(cardClassName)

    if (!CardClass) {
      console.error(`Unknown chat card type: ${cardClassName}`)
      return
    }
    const card = new CardClass(data, options)
    if (messageId) card.messageId = messageId
    await card.assignObjects()
    return card
  }

  setData (name, value = true) {
    if (!name && !($.type(name) === 'string')) return
    setByPath(this, name, value)
  }

  unsetData (name) {
    if (!name && !($.type(name) === 'string')) return
    setByPath(this, name, false)
  }

  toggleData (name) {
    if (!name && !($.type(name) === 'string')) return
    const value = getByPath(this, name)
    setByPath(this, name, !value)
  }

  // setDataValue (name, value) {
  //   if (!name && !($.type(name) === 'string')) return
  //   setByPath(this, name, value)
  // }

  clearData (name) {
    if (!name && !($.type(name) === 'string')) return
    setByPath(this, name, null)
  }

  async _onDropDownSelect (event) {
    event.preventDefault()

    const target = event.currentTarget
    if (
      target &&
      target.classList.contains('gm-select-only') &&
      !game.user.isGM
    ) {
      return
    }
    const dropdown = target.closest('.ecc-dropdown')
    const name = dropdown.dataset.name
    const value = target.dataset.value
    // ui.notifications.info(`SELECT ${name} to value ${value}`)
    this.setData(name, value)
    const card = target.closest(`.${ECC_CLASS}`)
    card.querySelectorAll(`[data-name="${name}"][data-flag]`).forEach((node) => {
      if (node.dataset.value && node.dataset.value === value) this.flags[node.dataset.flag] = true
      else if (Array.from(node.querySelectorAll('.ecc-dropdown-element'), el => el.dataset?.value).includes(value)) this.flags[node.dataset.flag] = true
      else this.flags[node.dataset.flag] = false
    })
    if (dropdown.dataset.flag) this.flags[dropdown.dataset.flag] = true // Should be on already
    if (this.options.submitOnChange) {
      if (card) this._update(card)
    }
    let updated = false
    if ('action' in target.dataset) updated = await this._onButton(event)
    if (!updated) await this.updateChatCard() // Submit on change ?
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
    const name = target.dataset.flag
      ? `data.flags.${target.dataset.flag}`
      : target.dataset.name
    if (!name) return
    const toggle = target.closest('.ecc-radio')
    if (!toggle) {
      if (target.dataset.name) {
        this.setData(target.dataset.name, target.dataset.flag ? target.dataset.flag : name)
        const card = target.closest(`.${ECC_CLASS}`)
        card.querySelectorAll(`[data-name="${target.dataset.name}"][data-flag]`).forEach((node) => {
          this.flags[node.dataset.flag] = false
        })
      }
      this.toggleData(name)
    } else {
      const buttons = toggle.querySelectorAll('.ecc-switch')
      for (const b of buttons) {
        const bName = b.dataset.flag
          ? `data.flags.${b.dataset.flag}`
          : b.dataset.name
        this.unsetData(bName)
      }
      this.setData(name)
    }
    const card = target.closest(`.${ECC_CLASS}`)
    if (this.options.submitOnChange) {
      if (card) this._update(card)
    }
    await this.updateChatCard() // Submit on change ?
  }
}
