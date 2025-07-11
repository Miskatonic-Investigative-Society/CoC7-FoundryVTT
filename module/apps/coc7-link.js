/* global $, canvas, ChatMessage, CONFIG, CONST, foundry, game, ui */
import { CoCActor } from '../actors/actor.js'
import { CoC7Check } from '../check.js'
import { CoC7ContentLinkDialog } from './coc7-content-link-dialog.js'
import { CoC7GroupMessage } from './coc7-group-message.js'
import { CoC7Utilities } from '../utilities.js'
import { SanCheckCard } from '../chat/cards/san-check.js'
import { chatHelper, isCtrlKey } from '../chat/helper.js'

/**
 * Allow for parsing of CoC7 elements in chat message and sheets.
 * Format is :
 * @coc7.TYPE_OF_REQUEST[OPTIONS]{DISPLAYED_NAME}
 * TYPE_OF_REQUEST :
 * - sanloss: trigger a san check, upon failure will propose to deduct the corresponding SAN.
 * - check: trigger a check depending on the options.
 * - item: Trigger a weapon check
 * - effect: Add an effect
 *
 * OPTIONS: [] = optional
 * sanloss:
 *   sanMax: max SAN loss
 *   sanMin: min SAN loss
 *   sanReason: Reason
 * check:
 *   type: type of check (characteristic, skill, attrib).
 *   name: name of the skill/characteristic.
 *   [difficulty]: ? (blind), 0 (regular), + (hard), ++ (extreme), +++ (critical).
 *   [modifier]: -x (x penalty dice), +x (x bonus dice), 0 (no modifier).
 *   [icon]: icon to use (font awsome).
 *   [blind]: will trigger a blind roll.
 *   [pushing]: will trigger a pushed roll
 *
 * [DISPLAYED_NAME: name to display.]
 *
 * To add/edit a new link update these sections
 *   fromDropData => Add all defaults here
 *   _createLink => Create HTML from document data
 *   _createDocumentLink => Create @link from document data
 *   _onLinkActorClick => Process link
 */
export class CoC7Link {
  static get CHECK_TYPE () {
    return {
      CHECK: 'check',
      SANLOSS: 'sanloss',
      ITEM: 'item',
      EFFECT: 'effect'
    }
  }

  static get LINK_TYPE () {
    return {
      CHARACTERISTIC: 'characteristic',
      ATTRIBUTE: 'attribute',
      SKILL: 'skill'
    }
  }

  static init () {
    CONFIG.CoC7Link = {
      documentClass: CoC7Link
    }
    const body = $('body')
    body.on('click', 'a.coc7-link', CoC7Link._onLinkClick)
    body.on('dragstart', 'a.coc7-link', event => CoC7Link._onDragCoC7Link(event))

    CONFIG.TextEditor.enrichers.push({
      pattern: new RegExp('@(coc7)\\.' + '(check|effect|item|sanloss)' + '\\[([^\\[\\]]*(?:\\[[^\\[\\]]*(?:\\[[^\\[\\]]*\\])*[^\\[\\]]*\\])*[^\\[\\]]*)\\]' + '(?:{([^}]+)})?', 'gi'),
      enricher: CoC7Link._createLink
    })
  }

  static _linkFromEvent (event) {
    const a = event.currentTarget
    const i = a.querySelector('[data-link-icon]')
    const data = foundry.utils.duplicate(a.dataset)

    const oldType = data.type

    data.type = 'CoC7Link'
    data.icon = null

    if (oldType) {
      data.linkType = oldType
    }

    if (
      data.object &&
      (typeof data.object === 'string' || data.object instanceof String)
    ) {
      data.object = JSON.parse(data.object)
      // data.linkType = CoC7Link.LINK_TYPE.EFFECT
    }

    if (
      i.dataset &&
      i.dataset.linkIcon &&
      i.dataset.linkIcon !== 'fas fa-dice'
    ) {
      data.icon = i.dataset.linkIcon
    }
    data.displayName = a.dataset.displayName ? a.innerText : null
    if (data.difficulty) {
      data.difficulty = CoC7Utilities.convertDifficulty(data.difficulty)
    }
    return data
  }

  static _onDragCoC7Link (event) {
    const data = CoC7Link._linkFromEvent(event)
    event.originalEvent.dataTransfer.setData('text/plain', JSON.stringify(data))
  }

  /**
   * A helper function to handle obtaining the relevant Document from dropped data provided via a DataTransfer event.
   * The dropped data could have:
   * 1. A data object explicitly provided
   * @memberof ClientDocumentMixin
   *
   * @param {object} data           The data object extracted from a DataTransfer event
   * @param {object} options        Additional options which affect drop data behavior
   * @returns {Promise<Document>}   The resolved Document
   * @throws If a Document could not be retrieved from the provided data.
   */
  static async fromDropData (data, options = {}) {
    const cls = new CoC7Link()
    cls.object = foundry.utils.mergeObject({
      type: 'CoC7Link',
      check: CoC7Link.CHECK_TYPE.CHECK,
      linkType: CoC7Link.LINK_TYPE.SKILL,
      difficulty: CoC7Check.difficultyLevel.regular,
      modifier: 0,
      object: {
        label: game.i18n.localize('CoC7.EffectNew'),
        icon: 'icons/svg/aura.svg',
        changes: []
      }
    }, data)
    for (const key of ['name', 'displayName', 'icon', 'id', 'pack', 'sanMin', 'sanMax', 'sanReason']) {
      cls.object[key] = cls.object[key] ?? ''
    }
    if (typeof cls.object.object.icon !== 'undefined' && typeof cls.object.object.external !== 'undefined' && ['http', 'https'].includes(cls.object.object.external)) {
      cls.object.object.icon = cls.object.object.external + '://' + cls.object.object.icon
    }
    cls.options = options
    return cls
  }

  static async _createLink (match) {
    const name = match[4] ?? undefined
    const options = match[3] ?? undefined
    const type = match[2] ?? undefined

    const data = {
      cls: ['coc7-link'],
      dataset: { check: type },
      icon: null,
      blind: false,
      name
    }

    if (type === CoC7Link.CHECK_TYPE.EFFECT) {
      data.effect = JSON.parse(options)
      data.dataset.object = options
      if (typeof data.effect.icon !== 'undefined' && typeof data.effect.external !== 'undefined' && ['http', 'https'].includes(data.effect.external)) {
        data.effect.icon = data.effect.external + '://' + data.effect.icon
      }
    } else {
      const matches = options.matchAll(/[^,]+/gi)
      for (const match of Array.from(matches)) {
        let [key, value] = match[0].split(':')
        if (key === 'icon') {
          data.icon = value
        }
        if (typeof value === 'undefined') {
          if (key === 'blind') {
            value = true
            data.blind = true && [CoC7Link.CHECK_TYPE.CHECK].includes(type.toLowerCase())
          } else if (key === 'pushing') {
            value = true
            data.pushing = true && [CoC7Link.CHECK_TYPE.CHECK].includes(type.toLowerCase())
          } else if (key === 'combat') {
            value = true
            data.combat = true && [CoC7Link.CHECK_TYPE.CHECK].includes(type.toLowerCase())
          }
        }
        data.dataset[key] = value
      }
      if (typeof data.dataset.icon !== 'undefined' && typeof data.dataset.external !== 'undefined' && ['http', 'https'].includes(data.dataset.external)) {
        data.dataset.icon = data.dataset.external + '://' + data.dataset.icon
        data.icon = data.dataset.icon
      }
    }

    let title
    const difficulty = CoC7Check.difficultyString(data.dataset.difficulty)

    switch (type.toLowerCase()) {
      case CoC7Link.CHECK_TYPE.CHECK: {
        let humanName = data.dataset.name
        if (['attributes', 'attribute', 'attrib', 'attribs'].includes(data.dataset.type?.toLowerCase())) {
          if (data.dataset.name === 'lck') {
            humanName = game.i18n.localize('CoC7.Luck')
          }
          if (data.dataset.name === 'san') {
            humanName = game.i18n.localize('CoC7.Sanity')
          }
        } else if (['charac', 'char', 'characteristic', 'characteristics'].includes(data.dataset.type?.toLowerCase())) {
          humanName = CoC7Utilities.getCharacteristicNames(data.dataset.name)?.label
        } else {
          if (!name && data.dataset.name.match(/^.\.[^\\.]*\..+$/)) {
            const cocIdName = (await game.system.api.cocid.fromCoCID(data.dataset.name))?.[0]?.name
            if (cocIdName) {
              humanName = cocIdName
            }
          }
        }
        title = game.i18n.format(
          `CoC7.LinkCheck${!data.dataset.difficulty ? '' : 'Diff'}${!data.dataset.modifier ? '' : 'Modif'}${data.pushing ? 'Pushing' : ''}`,
          {
            difficulty,
            modifier: data.dataset.modifier,
            name: humanName
          }
        )
        break
      }

      case CoC7Link.CHECK_TYPE.SANLOSS:
        title = game.i18n.format(
          `CoC7.LinkSanLoss${!data.dataset.difficulty ? '' : 'Diff'}${!data.dataset.modifier ? '' : 'Modif'}`,
          {
            difficulty,
            modifier: data.dataset.modifier,
            sanMin: data.dataset.sanMin,
            sanMax: data.dataset.sanMax
          }
        )
        break

      case CoC7Link.CHECK_TYPE.ITEM:
        title = game.i18n.format(
          `CoC7.LinkItem${!data.dataset.difficulty ? '' : 'Diff'}${!data.dataset.modifier ? '' : 'Modif'}`,
          {
            difficulty,
            modifier: data.dataset.modifier,
            name: data.dataset.name
          }
        )
        break

      case CoC7Link.CHECK_TYPE.EFFECT:
        title = data.effect.label
        break
    }

    if (!name) {
      data.name = title
    } else {
      data.dataset.displayName = true
    }

    const a = document.createElement('a')
    a.title = game.user.isGM ? data.name : title
    a.classList.add(...data.cls)
    for (const [k, v] of Object.entries(data.dataset)) {
      a.dataset[k] = v
    }
    a.draggable = true
    data.icon = data.icon ?? data.effect?.icon ?? 'fas fa-dice'
    // check if it's an image or an icon
    if (data.icon.includes('\\') || data.icon.includes('.')) {
      data.img = data.icon
    }
    if (data.blind) {
      a.innerHTML += '<i class="fas fa-eye-slash"></i>'
    }
    if (data.img) {
      a.innerHTML += `<img data-link-icon="${data.icon}" src="${data.img}">`
    } else {
      a.innerHTML += `<i data-link-icon="${data.icon}" class="link-icon ${data.icon}"></i>`
    }
    a.innerHTML += `<span>${data.name}</span>`

    return a
  }

  /**
   * Create a content link for this document.
   * @param {object} eventData                     The parsed object of data provided by the drop transfer event.
   * @param {object} [options]                     Additional options to configure link generation.
   * @param {ClientDocument} [options.relativeTo]  A document to generate a link relative to.
   * @param {string} [options.label]               A custom label to use instead of the document's name.
   * @returns {string}
   * @internal
   */
  _createDocumentLink (eventData, { relativeTo, label } = {}) {
    if (!eventData.check) {
      return ''
    }
    switch (eventData.check.toLowerCase()) {
      case CoC7Link.CHECK_TYPE.CHECK: {
        // @coc7.check[type:charac,name:STR,difficulty:+,modifier:-1]{Hard STR check(-1)}
        // @coc7.check[blind,type:characteristic,name:str,difficulty:1,modifier:0,icon:fa fa-link]{Strength}
        // @coc7.check[blind,type:attribute,name:lck,difficulty:1,modifier:0,icon:fa fa-link]{Luck}
        // @coc7.check[blind,type:skill,name:Law,difficulty:1,modifier:0,icon:fa fa-link]{Law}
        if (!eventData.linkType || (!eventData.name && !eventData.rolls)) {
          return ''
        }
        let options = `${eventData.blind ? 'blind,' : ''}${eventData.pushing ? 'pushing,' : ''}type:${eventData.linkType}`
        if (eventData.name) {
          options += `,name:${eventData.name}`
        } else if (eventData.rolls) {
          options += `,rolls:${eventData.rolls}`
          if (eventData.combat) {
            options += ',combat'
          }
        }
        if (typeof eventData.difficulty !== 'undefined' && eventData.difficulty !== CoC7Check.difficultyLevel.regular) {
          options += `,difficulty:${eventData.difficulty}`
        }
        if (typeof eventData.modifier !== 'undefined' && eventData.modifier !== 0) {
          options += `,modifier:${eventData.modifier}`
        }
        if (eventData.icon) {
          const parts = eventData.icon.match(/^(https?):\/\/(.+)$/)
          if (parts) {
            options += `,external:${parts[1]},icon:${parts[2]}`
          } else {
            options += `,icon:${eventData.icon}`
          }
        }
        if (eventData.pack) {
          options += `,pack:${eventData.pack}`
        }
        if (eventData.id) {
          options += `,id:${eventData.id}`
        }
        let link = `@coc7.check[${options}]`
        const displayName = eventData.displayName ?? (label ?? '')
        if (displayName) {
          link += `{${displayName}}`
        }
        return link
      }

      case CoC7Link.CHECK_TYPE.SANLOSS: {
        // @coc7.sanloss[sanMax:1D6,sanMin:1,difficulty:++,modifier:-1]{Hard San Loss (-1) 1/1D6}
        if (!eventData.sanMax || !eventData.sanMin) {
          return ''
        }
        let options = `${eventData.blind ? 'blind,' : ''}sanMax:${eventData.sanMax},sanMin:${eventData.sanMin}`
        if (eventData.sanReason) {
          options += `,sanReason:${eventData.sanReason}`
        }
        if (eventData.difficulty && eventData.difficulty !== CoC7Check.difficultyLevel.regular) {
          options += `,difficulty:${eventData.difficulty}`
        }
        if (eventData.modifier && eventData.modifier !== 0) {
          options += `,modifier:${eventData.modifier}`
        }
        if (eventData.icon) {
          const parts = eventData.icon.match(/^(https?):\/\/(.+)$/)
          if (parts) {
            options += `,external:${parts[1]},icon:${parts[2]}`
          } else {
            options += `,icon:${eventData.icon}`
          }
        }
        let link = `@coc7.sanloss[${options}]`
        const displayName = eventData.displayName ?? (label ?? '')
        if (displayName) {
          link += `{${displayName}}`
        }
        return link
      }

      case CoC7Link.CHECK_TYPE.ITEM: {
        // @coc7.item[type:optional,name:Shotgun,difficulty:+,modifier:-1]{Hard Shitgun check(-1)}
        if (!eventData.name) {
          return ''
        }
        let options = `${eventData.blind ? 'blind,' : ''}name:${eventData.name}`
        if (eventData.icon) {
          const parts = eventData.icon.match(/^(https?):\/\/(.+)$/)
          if (parts) {
            options += `,external:${parts[1]},icon:${parts[2]}`
          } else {
            options += `,icon:${eventData.icon}`
          }
        }
        if (eventData.pack) {
          options += `,pack:${eventData.pack}`
        }
        if (eventData.id) {
          options += `,id:${eventData.id}`
        }
        let link = `@coc7.item[${options}]`
        const displayName = eventData.displayName ?? (label ?? '')
        if (displayName) {
          link += `{${displayName}}`
        }
        return link
      }

      case CoC7Link.CHECK_TYPE.EFFECT: {
        // @coc7.effect[{"label":"Kapow","icon":"icons/svg/aura.svg","changes":[{"key":"system.unknown.test","mode":2,"value":"5"}],"tint":"#e91616","duration":{"seconds":null,"rounds":6,"turns":null}}]{Kapowing}
        // const effectData = foundry.utils.deepClone(eventData)
        // if (!this.effectIsTemp) delete effectData.duration
        // if (effectData.changes?.length === 0) delete effectData.changes
        // if (!effectData.disabled) delete effectData.disabled
        // if (!effectData.tint) delete effectData.tint
        const parts = eventData.object.icon.match(/^(https?):\/\/(.+)$/)
        if (parts) {
          eventData.object.external = parts[1]
          eventData.object.icon = parts[2]
        }
        let link = `@coc7.effect[${JSON.stringify(eventData.object)}]`
        const displayName = eventData.displayName ?? (label ?? '')
        if (displayName) {
          link += `{${displayName}}`
        }
        return link
      }
    }
    return '?'
  }

  static async _onLinkActorClick (actor, options, { shiftKey = false } = {}) {
    switch (options.check) {
      case CoC7Link.CHECK_TYPE.CHECK:
        if (['charac', 'char', 'characteristic', 'characteristics'].includes(options.linkType.toLowerCase())) {
          return actor.characteristicCheck(
            options.name,
            shiftKey,
            options
          )
        }
        if (['skill'].includes(options.linkType.toLowerCase())) {
          return actor.skillCheck(options, shiftKey, options)
        }
        if (['attributes', 'attribute', 'attrib', 'attribs'].includes(options.linkType.toLowerCase())) {
          return actor.attributeCheck(options.name, shiftKey, options)
        }
        if (['combinedall', 'combinedany', 'opposed'].includes(options.linkType.toLowerCase())) {
          return CoC7GroupMessage.createGroupMessage({
            type: options.linkType.toLowerCase(),
            rollRequisites: options.rolls.split('&&'),
            isCombat: Boolean(options.combat ?? false)
          })
        }
        break

      case CoC7Link.CHECK_TYPE.SANLOSS:
        SanCheckCard.create(actor.actorKey, options, {
          fastForward: shiftKey
        })
        return

      case CoC7Link.CHECK_TYPE.ITEM:
        return actor.weaponCheck(options, shiftKey)

      case CoC7Link.CHECK_TYPE.EFFECT:
        await actor.createEmbeddedDocuments('ActiveEffect', [{
          label: options.object.label,
          icon: options.object.icon,
          changes: options.object.changes
        }])
        break
    }
  }

  static toChatMessage (options) {
    const option = {
      speaker: {
        alias: game.user.name
      }
    }
    let message
    const link = (new CoC7Link())._createDocumentLink(options)
    if (options.check === CoC7Link.CHECK_TYPE.EFFECT) {
      message = `<div class="effect-message">${link}</div>`
    } else {
      message = game.i18n.format('CoC7.MessageCheckRequestedWait', {
        check: link
      })
    }
    chatHelper.createMessage(null, message, option)
  }

  static toWhisperMessage (options, actors) {
    for (const actor of actors) {
      const option = {
        speaker: {
          alias: game.user.name
        },
        whisper: actor.owners.map(a => a.id)
      }
      let message
      const link = (new CoC7Link())._createDocumentLink(options)
      if (options.check === CoC7Link.CHECK_TYPE.EFFECT) {
        message = `<div class="effect-message">${link}</div>`
      } else {
        message = game.i18n.format('CoC7.MessageTargetCheckRequested', {
          name: actor.name,
          check: link
        })
      }
      chatHelper.createMessage(null, message, option)
    }
  }

  static async makeMacroData (data) {
    const linkObj = await CoC7Link.fromDropData(data)
    const regEx = new RegExp('@(coc7)\\.' + '(check|effect|item|sanloss)' + '\\[([^\\[\\]]*(?:\\[[^\\[\\]]*(?:\\[[^\\[\\]]*\\])*[^\\[\\]]*\\])*[^\\[\\]]*)\\]' + '(?:{([^}]+)})?', 'gi')
    const match = regEx.exec(linkObj.link)
    if (match) {
      const element = await CoC7Link._createLink(match)
      return {
        name: element.querySelector('span').innerHTML.trim(),
        type: 'script',
        command: 'game.CoC7.macros.linkMacro(' + JSON.stringify(data) + ')'
      }
    }
    return false
  }

  static async linkMacro (data) {
    const linkObj = await CoC7Link.fromDropData(data)
    const regEx = new RegExp('@(coc7)\\.' + '(check|effect|item|sanloss)' + '\\[([^\\[\\]]*(?:\\[[^\\[\\]]*(?:\\[[^\\[\\]]*\\])*[^\\[\\]]*\\])*[^\\[\\]]*)\\]' + '(?:{([^}]+)})?', 'gi')
    const match = regEx.exec(linkObj.link)
    if (match) {
      CoC7Link._createLink(match).then(element => {
        CoC7Link._onLinkClick({
          currentTarget: element
        })
      })
    }
    return false
  }

  /**
   * Trigger a check when a link is clicked.
   * Depending the origin
   * @param {*} event
   *
   */
  static async _onLinkClick (event) {
    const options = CoC7Link._linkFromEvent(event)

    if (game.user.isGM) {
      if (isCtrlKey(event)) {
        CoC7ContentLinkDialog.create(options)
        return
      }
      if (canvas.tokens.controlled.length) {
        for (const token of canvas.tokens.controlled) {
          CoC7Link._onLinkActorClick(token.actor, options, { shiftKey: event.shiftKey })
        }
        return
      }
      const speaker = ChatMessage.getSpeaker()
      const actor = ChatMessage.getSpeakerActor(speaker)
      if (actor) {
        CoC7Link._onLinkActorClick(actor, options, { shiftKey: event.shiftKey })
        return
      }
      CoC7Link.toChatMessage(options)
      return
    } else {
      const speaker = ChatMessage.getSpeaker()
      let actor = ChatMessage.getSpeakerActor(speaker)
      if (!actor) {
        const actors = game.actors.filter(a => (a.ownership[game.user.id] ?? a.ownership.default) === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)
        if (actors.length === 1) {
          actor = actors[0]
        } else {
          const actors = game.actors.filter(a => (a.ownership[game.user.id] ?? a.ownership.default) === CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)
          if (actors.length === 1) {
            actor = actors[0]
          }
        }
      }
      if (actor) {
        CoC7Link._onLinkActorClick(actor, options, { shiftKey: event.shiftKey })
        return
      }
    }
    ui.notifications.warn(game.i18n.localize('CoC7.WarnNoControlledActor'))
  }

  setValue (key, value) {
    this.object[key] = value
  }

  get link () {
    return this._createDocumentLink(this.object)
  }

  get id () {
    return this.object.id
  }

  get pack () {
    return this.object.pack
  }

  get checkType () {
    return this.object.check
  }

  get difficulty () {
    return this.object.difficulty
  }

  get icon () {
    return this.object.icon
  }

  get displayName () {
    return this.object.displayName
  }

  get modifier () {
    return this.object.modifier
  }

  get linkType () {
    return this.object.linkType
  }

  get sanMin () {
    return this.object.sanMin
  }

  get sanMax () {
    return this.object.sanMax
  }

  get sanReason () {
    return this.object.sanReason
  }

  get effect () {
    return this.object.object
  }

  get checkName () {
    if (this.isCharacteristicCheck) {
      const characteristics = CoCActor.getCharacteristicDefinition()
      return characteristics.find(c => c.key === this.object.name || c.shortName === this.object.name || c.label === this.object.name)?.key ?? ''
    }
    return this.object.name
  }

  get isCheck () {
    return this.object.check === CoC7Link.CHECK_TYPE.CHECK
  }

  get isCharacteristicCheck () {
    return this.isCheck && this.object.linkType === CoC7Link.LINK_TYPE.CHARACTERISTIC
  }

  get isAttributeCheck () {
    return this.isCheck && this.object.linkType === CoC7Link.LINK_TYPE.ATTRIBUTE
  }

  get isSkillCheck () {
    return this.isCheck && this.object.linkType === CoC7Link.LINK_TYPE.SKILL
  }

  get isItemCheck () {
    return this.object.check === CoC7Link.CHECK_TYPE.ITEM
  }

  get isSanLossCheck () {
    return this.object.check === CoC7Link.CHECK_TYPE.SANLOSS
  }

  get isEffect () {
    return this.object.check === CoC7Link.CHECK_TYPE.EFFECT
  }

  get isBlind () {
    return this.isCheck && this.object.blind
  }

  get isPushing () {
    return this.isCheck && this.object.pushing
  }
}
