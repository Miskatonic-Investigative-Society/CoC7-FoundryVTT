/* global ChatMessage CONST foundry fromUuid game Hooks renderTemplate TextEditor TokenDocument ui */
import { FOLDER_ID, DICE_POOL_REASONS } from '../constants.js'
import CoC7ActorPickerDialog from './actor-picker-dialog.js'
import CoC7ChatDropdown from './chat-dropdown.js'
import CoC7ChatDamage from './chat-damage.js'
import CoC7DicePool from './dice-pool.js'
import CoC7SystemSocket from './system-socket.js'
import CoC7Utilities from './utilities.js'

export default class CoC7ChatCombatMelee {
  #asyncAttacker
  #asyncTarget
  #asyncItem
  #attackerMessageId
  #checkRevealed
  #dicePool
  #isAutoSuccess
  #isNoResponse
  #participant
  #poolModifier
  #poolKeys
  #responded

  /**
   * Constructor
   */
  constructor () {
    this.#checkRevealed = true
    this.#dicePool = CoC7DicePool.newPool({ })
    this.#isAutoSuccess = false
    this.#isNoResponse = false
    this.#poolModifier = 0
    this.#participant = CoC7ChatCombatMelee.participant.initiator
    this.#poolKeys = []
    this.#responded = false
  }

  /**
   * participant
   * @returns {object}
   */
  static get participant () {
    return {
      initiator: 0,
      target: 1
    }
  }

  /**
   * Open Actor From Message
   * @param {Event} event
   * @param {Document} message
   */
  static async _changeTargetActor (event, message) {
    if (game.user.isGM) {
      const check = await CoC7ChatCombatMelee.loadFromMessage(message)
      if (check) {
        const selected = CoC7Utilities.getActorUuid(await check.target)
        const notAutomaticUuid = CoC7Utilities.getActorUuid(await check.attacker)
        const actorUuid = await CoC7ActorPickerDialog.create({ allowNoActor: true, notAutomaticUuid, selected })
        check.target = actorUuid
        check.updateMessage()
      }
    }
  }

  /**
   * Create melee initiator message
   * @param {object} options
   * @param {string|null} options.attackerMessageId
   * @param {string|null} options.attackerUuid
   * @param {string} options.itemUuid
   * @param {integer} options.participant
   * @param {string|null} options.targetUuid
   */
  static async createMessage ({ attackerMessageId, attackerUuid, itemUuid, participant = CoC7ChatCombatMelee.participant.initiator, targetUuid } = {}) {
    if (attackerUuid) {
      const check = new CoC7ChatCombatMelee()
      check.#attackerMessageId = attackerMessageId
      check.attacker = attackerUuid
      check.item = itemUuid
      check.#participant = participant
      check.target = targetUuid
      await check.#setInitialPoolModifier(check.attacker)
      const chatData = await check.getChatData()
      await ChatMessage.create(chatData)
      return
    }
    ui.notifications.warn('CoC7.Errors.UnparsableRoll', { localize: true })
  }

  /**
   * Create CoC7ChatCombatMelee from message
   * @param {Document} message
   * @returns {CoC7ChatCombatMelee}
   */
  static async loadFromMessage (message) {
    const keys = [
      // 'attackerMessageId' - for target only
      'attackerUuid',
      'checkRevealed',
      'isAutoSuccess',
      'isNoResponse',
      // 'itemUuid' - response can be selected
      'participant',
      'poolKeys',
      'poolModifier',
      'responded'
    ]
    if (message.id && message.flags[FOLDER_ID]?.load?.as === 'CoC7ChatCombatMelee' && keys.every(k => typeof message.flags[FOLDER_ID]?.load?.[k] !== 'undefined') && CoC7DicePool.isValidPool(message.flags[FOLDER_ID]?.load?.dicePool)) {
      const check = new CoC7ChatCombatMelee()
      const load = foundry.utils.duplicate(message.flags[FOLDER_ID].load)
      check.message = message
      check.#attackerMessageId = load.attackerMessageId
      check.attacker = load.attackerUuid
      check.#checkRevealed = load.checkRevealed
      check.#dicePool = CoC7DicePool.fromObject(load.dicePool)
      check.#isAutoSuccess = load.isAutoSuccess
      check.#isNoResponse = load.isNoResponse
      check.item = load.itemUuid
      check.#participant = load.participant
      check.#poolKeys = load.poolKeys
      check.#poolModifier = load.poolModifier
      check.#responded = load.responded
      check.target = load.targetUuid
      return check
    }
    ui.notifications.warn('CoC7.Errors.UnableToLoadMessage', { localize: true })
    throw new Error('CoC7.Errors.UnableToLoadMessage')
  }

  /**
   * Click Event on dice roll
   * @param {ClickEvent} event
   * @param {Document} message
   */
  static async _onChangeEvent (event, message) {
    switch (event.target?.type) {
      case 'range':
        {
          const check = await CoC7ChatCombatMelee.loadFromMessage(message)
          const set = event.target?.name
          if (check && set) {
            switch (set) {
              case 'poolModifier':
                check.#poolModifier = event.target.value
                CoC7Utilities.messageUpdatedThen(message.id, () => {
                  setTimeout(() => {
                    document.querySelector('[data-message-id="' + message.id + '"] input[type=range][name=' + set + ']').focus()
                  }, 50)
                })
                check.updateMessage()
                break
              default:
                ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
                break
            }
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableMessage', { localize: true })
          }
        }
        break
    }
  }

  /**
   * Click Event on dice roll
   * @param {ClickEvent} event
   * @param {Document} message
   */
  static async _onClickEvent (event, message) {
    switch (event.currentTarget?.dataset?.action) {
      case 'attackerRoll':
        {
          const check = await CoC7ChatCombatMelee.loadFromMessage(message)
          check.#checkRevealed = !game.user.isGM
          const attacker = (await check.attacker)
          const skill = attacker.items.get(event.target.dataset.skill)
          const threshold = skill?.system?.value
          if (threshold) {
            check.#dicePool.poolModifier = message.flags[FOLDER_ID].load.finalPoolModifier
            check.#dicePool.threshold = threshold
            await check.#dicePool.roll()
            if (check.#dicePool.isRolledSuccess) {
              await CoC7Utilities.messageRollFlagForDevelopment(message.id, skill, true)
            }
            if (check.#isAutoSuccess && !check.#dicePool.isFumble && !check.#dicePool.isSuccess) {
              check.#dicePool.setSuccess(true)
            }
            const target = (await check.target)
            if (target) {
              if (!check.#isAutoSuccess) {
                CoC7Utilities.messageUpdatedThen(message.id, () => {
                  CoC7ChatCombatMelee.createMessage({ attackerMessageId: message.id, attackerUuid: attacker.uuid, targetUuid: target.uuid, participant: CoC7ChatCombatMelee.participant.target })
                })
              } else {
                CoC7Utilities.messageUpdatedWithRollThen(message.id, () => {
                  CoC7ChatDamage.createFromCombatMelee({ attacker: message.id, targetUuid: CoC7Utilities.getActorUuid(target) })
                })
              }
            } else if (check.#dicePool.isSuccess) {
              CoC7Utilities.messageUpdatedWithRollThen(message.id, () => {
                CoC7ChatDamage.createFromCombatMelee({ attacker: message.id })
              })
            }
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
          }
        }
        break
      case 'dodge':
        {
          const check = await CoC7ChatCombatMelee.loadFromMessage(message)
          const target = (await check.target)
          if (target) {
            const item = target.items.find(doc => doc.system.isDodge)
            if (item) {
              check.item = item.uuid
              await check.#setInitialPoolModifier(check.target)
              check.updateMessage()
            } else {
              ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
            }
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableMessage', { localize: true })
          }
        }
        break
      case 'revealCheck':
        {
          const check = await CoC7ChatCombatMelee.loadFromMessage(message)
          check.#checkRevealed = true
          check.updateMessage()
        }
        break
      case 'setFightBack':
        {
          const check = await CoC7ChatCombatMelee.loadFromMessage(message)
          const target = (await check.target)
          const buttons = []
          for (const doc of target.items) {
            if (doc.type === 'weapon' && !doc.system.properties.rngd) {
              const skill = target.items.get(doc.system.skill.main.id)
              if (skill) {
                buttons.push({
                  id: doc.id,
                  name: doc.name,
                  value: skill ? skill.system.value : 0
                })
              }
            }
          }
          buttons.sort(CoC7Utilities.sortByNameKey)
          CoC7ChatDropdown.makeDropdown({ message, buttons, target: event.currentTarget, callback: CoC7ChatCombatMelee._onClickEvent })
        }
        break
      case 'setItem':
        {
          const check = await CoC7ChatCombatMelee.loadFromMessage(message)
          const target = (await check.target)
          const itemId = event.currentTarget?.dataset?.itemId
          if (target && itemId) {
            document.getElementById('dropdown-' + message.id)?.remove()
            const item = target.items.get(itemId)
            if (item) {
              check.item = item.uuid
              await check.#setInitialPoolModifier(check.target)
              check.updateMessage()
            } else {
              ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
            }
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableMessage', { localize: true })
          }
        }
        break
      case 'setManeuvers':
        {
          const check = await CoC7ChatCombatMelee.loadFromMessage(message)
          const target = (await check.target)
          const buttons = []
          for (const doc of target.items) {
            if (doc.type === 'skill' && doc.system.properties.fighting) {
              buttons.push({
                id: doc.id,
                name: doc.name,
                value: doc.system.value
              })
            }
          }
          buttons.sort(CoC7Utilities.sortByNameKey)
          CoC7ChatDropdown.makeDropdown({ message, buttons, target: event.currentTarget, callback: CoC7ChatCombatMelee._onClickEvent })
        }
        break
      case 'setNoResponse':
        {
          const check = await CoC7ChatCombatMelee.loadFromMessage(message)
          if (check) {
            check.item = null
            check.#isNoResponse = true
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableMessage', { localize: true })
          }
        }
        break
      case 'targetRoll':
        {
          const check = await CoC7ChatCombatMelee.loadFromMessage(message)
          check.#checkRevealed = true
          if (check.#isNoResponse) {
            check.#responded = true
            CoC7Utilities.messageUpdatedThen(message.id, () => {
              CoC7ChatDamage.createFromCombatMelee({ attacker: check.#attackerMessageId, target: check.message.id })
            })
            check.updateMessage()
          } else {
            const target = (await check.target)
            const item = (await check.item)
            const skillId = event.currentTarget?.dataset?.skillId
            let threshold
            let skill
            if (skillId) {
              skill = target.items.get(skillId)
              threshold = skill?.system?.value
            } else {
              threshold = item?.system?.value
            }
            if (threshold) {
              check.#dicePool.poolModifier = message.flags[FOLDER_ID].load.finalPoolModifier
              check.#dicePool.threshold = threshold
              await check.#dicePool.roll()
              if (check.#dicePool.isRolledSuccess) {
                await CoC7Utilities.messageRollFlagForDevelopment(message.id, skill ?? item, true)
              }
              check.#responded = true
              CoC7Utilities.messageUpdatedWithRollThen(message.id, () => {
                CoC7ChatDamage.createFromCombatMelee({ attacker: check.#attackerMessageId, target: check.message.id })
              })
              check.updateMessage()
            } else {
              ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
            }
          }
        }
        break
      case 'togglePoolKey':
        {
          const check = await CoC7ChatCombatMelee.loadFromMessage(message)
          const set = event.currentTarget?.dataset?.set
          if (check && set) {
            if (DICE_POOL_REASONS[set]?.forMelee === true) {
              const index = check.#poolKeys.findIndex(k => k === set)
              if (index === -1) {
                check.#poolKeys.push(set)
                check.#poolKeys.sort()
              } else {
                check.#poolKeys.splice(index, 1)
              }
              check.updateMessage()
            } else {
              ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
            }
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableMessage', { localize: true })
          }
        }
        break
      case 'toggleValue':
        {
          const check = await CoC7ChatCombatMelee.loadFromMessage(message)
          const set = event.currentTarget?.dataset?.set
          if (check && set) {
            switch (set) {
              case 'isAutoSuccess':
                check.#isAutoSuccess = !check.#isAutoSuccess
                check.updateMessage()
                break
              default:
                ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
                break
            }
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableMessage', { localize: true })
          }
        }
        break
    }
  }

  /**
   * Render Chat Message
   * @param {documents.ChatMessage} message
   * @param {HTMLElement} html
   * @param {ApplicationRenderContext} context
   * @param {false|Array} allowed
   */
  static async _onRenderMessage (message, html, context, allowed) {
    if (game.user.isGM || allowed) {
      html.querySelectorAll('[data-action]').forEach((element) => {
        if (game.user.isGM || allowed.includes(element.parentElement.dataset.actorUuid)) {
          element.addEventListener('click', event => CoC7ChatCombatMelee._onClickEvent(event, message))
        }
      })
    }
    if (game.user.isGM) {
      html.querySelectorAll('.change-actor').forEach((element) => {
        element.classList.add('clickable')
        element.addEventListener('dblclick', event => CoC7ChatCombatMelee._changeTargetActor(event, message))
      })
      html.querySelectorAll('input[type=range]').forEach((element) => {
        element.addEventListener('change', event => CoC7ChatCombatMelee._onChangeEvent(event, message))
      })
    }
    html.querySelectorAll('.coc7-formatted-text').forEach((element) => {
      const div = document.createElement('div')
      div.id = 'temporary-measure-' + Math.floor(Math.random() * 100)
      div.style.width = 'var(--sidebar-width)'
      div.style.visibility = 'hidden'
      div.style.position = 'absolute'
      div.append(element.cloneNode(true))
      document.body.appendChild(div)
      if (div.offsetHeight > 50) {
        element.classList.add('overflowing')
        element.addEventListener('click', event => element.classList.remove('overflowing'))
      }
      document.getElementById(div.id)?.remove()
    })
  }

  /**
   * Get attacker actor promise
   * @returns {Promise<Document>} async Actor
   */
  get attacker () {
    return this.#asyncAttacker
  }

  /**
   * Set attacker actor from document/uuid
   * @param {string} value
   */
  set attacker (value) {
    this.#asyncAttacker = (typeof value === 'string' ? fromUuid(value) : undefined)
  }

  /**
   * Get target actor promise
   * @returns {Promise<Document>} async Actor
   */
  get target () {
    return this.#asyncTarget
  }

  /**
   * Set target actor from document/uuid
   * @param {string} value
   */
  set target (value) {
    this.#asyncTarget = (typeof value === 'string' ? fromUuid(value) : undefined)
  }

  /**
   * Get item promise
   * @returns {Promise<Document>} async Actor
   */
  get item () {
    return this.#asyncItem
  }

  /**
   * Set item from document/uuid
   * @param {string|null} value
   */
  set item (value) {
    if (typeof value === 'string' && value !== '') {
      this.#asyncItem = fromUuid(value)
      this.#isNoResponse = false
    } else {
      this.#asyncItem = undefined
    }
  }

  /**
   * Create Message Data object
   * @returns {object}
   */
  async getTemplateData () {
    const attacker = (await this.attacker)
    const target = (await this.target)
    const item = (await this.item)
    const diceGroup = this.#dicePool.diceGroups.pop() ?? {}
    const data = {
      actorUuid: '',
      attackerImg: (attacker ? (attacker.isToken ? attacker.token.texture.src : attacker.img) : ''),
      attackerName: (attacker ? (attacker.isToken ? attacker.token.name : attacker.name) : ''),
      attackerUuid: CoC7Utilities.getActorUuid(attacker),
      bonusDice: Math.abs(this.#dicePool.poolModifier),
      bonusType: game.i18n.localize(this.#dicePool.poolModifier < 0 ? 'CoC7.DiceModifierPenalty' : 'CoC7.DiceModifierBonus'),
      checkRevealed: this.#checkRevealed,
      diceGroup,
      displayActorOnCard: (attacker ? game.settings.get(FOLDER_ID, 'displayActorOnCard') : false),
      enrichedWeaponDescriptionSpecial: '',
      /* // FoundryVTT V12 */
      enrichedItemDescriptionValue: await (foundry.applications.ux?.TextEditor.implementation ?? TextEditor).enrichHTML(
        item?.system?.description?.value,
        {
          async: true,
          secrets: false
        }
      ),
      finalPoolModifier: this.#poolModifier,
      flavor: '',
      foundryGeneration: game.release.generation,
      hasDodge: false,
      hasMalfunction: (typeof diceGroup.total !== 'undefined' && typeof item?.system?.malfunction !== 'undefined' && typeof item?.system?.malfunction !== 'object' ? diceGroup.total >= item.system.malfunction : false),
      hasWeaponSpecial: (this.#isNoResponse ? false : item?.system?.properties.spcl ?? false),
      isAutoSuccess: this.#isAutoSuccess,
      isDodge: (this.#isNoResponse ? false : item?.type === 'skill' && item?.system?.isDodge === true),
      isFightBack: (this.#isNoResponse ? false : item?.type === 'weapon'),
      isManeuver: (this.#isNoResponse ? false : item?.type === 'skill' && item?.system?.isDodge !== true),
      isNoResponse: this.#isNoResponse,
      isRolledSuccess: (this.#dicePool.isRolled ? this.#dicePool.isRolledSuccess : false),
      isSuccess: (this.#dicePool.isRolled ? this.#dicePool.isSuccess : false),
      itemImg: (this.#isNoResponse ? false : item?.img),
      itemName: (this.#isNoResponse ? game.i18n.localize('CoC7.NoResponse') : (item?.name ?? '...')),
      itemUuid: (this.#isNoResponse ? false : item?.uuid),
      poolBonus: [],
      poolPenalty: [],
      poolModifier: this.#poolModifier,
      responded: this.#responded,
      rollDamage: false,
      rolled: this.#dicePool.isRolled,
      skillId: '',
      skillName: '',
      skills: [],
      skillValue: 0,
      successLevel: (this.#dicePool.isRolled ? this.#dicePool.successLevel : ''),
      tags: [
        game.i18n.localize('CoC7.Combat')
      ],
      targetImg: (target ? (target.isToken ? target.token.texture.src : (target instanceof TokenDocument ? target.texture.src : target.img)) : ''),
      targetName: (target ? (target.isToken ? target.token.name : target.name) : ''),
      targetUuid: CoC7Utilities.getActorUuid(target),
      template: ''
    }
    for (const key in DICE_POOL_REASONS) {
      if (DICE_POOL_REASONS[key].forMelee) {
        const type = (DICE_POOL_REASONS[key].forBonus ? 'poolBonus' : (DICE_POOL_REASONS[key].forPenalty ? 'poolPenalty' : ''))
        if (type) {
          const row = {
            key,
            name: game.i18n.localize(DICE_POOL_REASONS[key].name),
            selected: this.#poolKeys.includes(key),
            tooltip: game.i18n.localize(DICE_POOL_REASONS[key].tooltip)
          }
          if (row.selected) {
            if (type === 'poolBonus') {
              data.finalPoolModifier++
            } else {
              data.finalPoolModifier--
            }
          }
          data[type].push(row)
        }
      }
    }
    if (data.hasMalfunction) {
      data.malfunctionTxt = game.i18n.format('CoC7.Malfunction', {
        itemName: item.name
      })
    }
    const skillMain = item?.system?.skillMain
    if (skillMain) {
      data.skills.push(skillMain)
    }
    if (item?.system?.skill?.alternativ?.id) {
      data.skills.push(item?.system?.skillAlternative)
    }
    data.finalPoolModifier = Math.max(-CoC7DicePool.maxDicePenalty, Math.min(CoC7DicePool.maxDiceBonus, data.finalPoolModifier))
    if (data.finalPoolModifier < 0) {
      data.tags.push(Math.abs(data.finalPoolModifier) + ' ' + game.i18n.localize('CoC7.DiceModifierPenalty'))
    } else if (data.finalPoolModifier > 0) {
      data.tags.push(data.finalPoolModifier + ' ' + game.i18n.localize('CoC7.DiceModifierBonus'))
    }
    data.poolBonus.sort(CoC7Utilities.sortByNameKey)
    data.poolPenalty.sort(CoC7Utilities.sortByNameKey)
    if (!data.targetUuid) {
      data.targetImg = 'icons/svg/mystery-man-black.svg'
      data.targetName = game.i18n.localize('CoC7.NoTarget')
    }
    if (data.hasWeaponSpecial) {
      data.enrichedWeaponDescriptionSpecial = await (foundry.applications.ux?.TextEditor.implementation ?? TextEditor).enrichHTML(
        item.system.description.special,
        {
          async: true,
          secrets: false
        }
      )
    }
    switch (this.#participant) {
      case CoC7ChatCombatMelee.participant.initiator:
        data.template = 'systems/' + FOLDER_ID + '/templates/chat/melee-initiator.hbs'
        data.actorUuid = data.attackerUuid
        break
      case CoC7ChatCombatMelee.participant.target:
        data.template = 'systems/' + FOLDER_ID + '/templates/chat/melee-target.hbs'
        data.actorUuid = data.targetUuid
        if (!data.rolled) {
          if (target?.items.find(doc => doc.system.isDodge)) {
            data.hasDodge = true
          }
          if (data.isFightBack) {
            const skill = target.items.get(item.system.skill.main.id)
            if (skill) {
              data.skillId = skill.id
              data.skillName = skill.name
              data.skillValue = skill.system.value
            }
          } else if (item?.type === 'skill') {
            data.skillValue = item.system.value
          }
        }
        break
    }
    return data
  }

  /**
   * Create Chat Message object
   * @returns {object}
   */
  async getChatData () {
    const data = await this.getTemplateData()
    const chatData = {
      flags: {
        [FOLDER_ID]: {
          load: {
            as: 'CoC7ChatCombatMelee',
            dicePool: this.#dicePool.toObject(),
            actorUuid: data.actorUuid,
            attackerMessageId: this.#attackerMessageId,
            attackerUuid: data.attackerUuid,
            cardOpen: true,
            checkRevealed: this.#checkRevealed,
            finalPoolModifier: data.finalPoolModifier,
            isAutoSuccess: this.#isAutoSuccess,
            isNoResponse: this.#isNoResponse,
            itemUuid: data.itemUuid,
            participant: this.#participant,
            poolKeys: this.#poolKeys,
            poolModifier: this.#poolModifier,
            responded: this.#responded,
            targetUuid: data.targetUuid
          }
        }
      },
      rolls: (this.message?.rolls ?? []).concat(this.#dicePool.newRolls),
      /* // FoundryVTT V12 */
      content: await (foundry.applications.handlebars?.renderTemplate ?? renderTemplate)(data.template, data)
    }
    if (typeof this.message?.whisper === 'undefined') {
      if ([CONST.DICE_ROLL_MODES.PRIVATE].includes(game.settings.get('core', 'rollMode'))) {
        chatData.whisper = ChatMessage.getWhisperRecipients('GM')
      } else if (CONST.DICE_ROLL_MODES.BLIND === game.settings.get('core', 'rollMode')) {
        chatData.blind = true
      }
    }
    return chatData
  }

  /**
   * Set pool modifier when item is set
   * @param {string} target
   */
  async #setInitialPoolModifier (target) {
    let item = (await this.item)
    let poolModifier = 0
    if (item) {
      if (item.type === 'weapon') {
        poolModifier += item.system?.bonusDice ?? 0
        item = (await target)?.items?.get(item.system.skill.main.id)
      }
      if (item?.type === 'skill') {
        poolModifier += item.system?.bonusDice ?? 0
      }
    }
    this.#poolModifier = Math.max(-CoC7DicePool.maxDicePenalty, Math.min(CoC7DicePool.maxDiceBonus, poolModifier))
  }

  /**
   * Save changes to existing Chat Message
   */
  async updateMessage () {
    if (this.message) {
      const diff = foundry.utils.diffObject(this.message.toObject(), await this.getChatData())
      if (!this.message.canUserModify(game.user, 'update')) {
        CoC7SystemSocket.requestKeeperAction({
          type: 'messagePermission',
          messageId: this.message.id,
          who: game.user.id,
          updates: diff
        })
      } else {
        await this.message.update(diff)
        Hooks.call('messageUpdatedCoC7', this.message.id)
      }
    }
  }

  /**
   * Migrate older html
   * @param {object} options
   * @param {integer} options.offset
   * @param {object} options.updates
   * @param {object} options.deleteIds
   */
  static async migrateOlderMessages ({ offset, updates, deleteIds } = {}) {
    const message = game.messages.contents[offset]
    const div = document.createElement('div')
    div.innerHTML = message.content
    const contents = div.children[0]
    if (contents) {
      let unitDie = 0
      const dice = []
      let threshold = 1
      let poolModifier = Number(contents.dataset.diceModifier || 0) || 0
      const poolKeys = []
      if (contents.classList.contains('initiator')) {
        const match = contents.querySelector('button[data-action="melee-initiator-roll"]')?.innerHTML.match(/\((\d+)%\)/)
        if (match) {
          threshold = match[1]
        } else {
          unitDie = Number(contents.querySelector('.unit-die li').dataset.value)
          if (unitDie === 0) {
            unitDie = 10
          }
          for (const die of contents.querySelectorAll('.ten-dice li')) {
            let value = Number(die.dataset.value)
            if (value === 0) {
              value = 10
            } else {
              value = Math.floor(value / 10)
            }
            dice.push(value)
          }
        }
        if (contents.dataset.outnumbered === 'true') {
          poolKeys.push('outnumbered')
          poolModifier--
        }
        if (contents.dataset.surprised === 'true') {
          poolKeys.push('surprised')
          poolModifier--
        }
      }
      const update = {
        ['flags.' + FOLDER_ID + '.load.as']: 'CoC7ChatCombatMelee',
        ['flags.' + FOLDER_ID + '.load.dicePool.bonusCount']: Math.max(poolModifier, 0),
        ['flags.' + FOLDER_ID + '.load.dicePool.currentPoolModifier']: poolModifier,
        ['flags.' + FOLDER_ID + '.load.dicePool.difficulty']: Number(contents.dataset.difficulty || CoC7DicePool.difficultyLevel.regular),
        ['flags.' + FOLDER_ID + '.load.dicePool.flatDiceModifier']: 0,
        ['flags.' + FOLDER_ID + '.load.dicePool.flatThresholdModifier']: 0,
        ['flags.' + FOLDER_ID + '.load.dicePool.luckSpent']: 0,
        ['flags.' + FOLDER_ID + '.load.dicePool.groups']: [],
        ['flags.' + FOLDER_ID + '.load.dicePool.penaltyCount']: Math.min(poolModifier, 0),
        ['flags.' + FOLDER_ID + '.load.dicePool.rolledDice']: [
          {
            rolled: dice.length > 0,
            baseDie: dice.shift() || 0,
            bonusDice: (poolModifier > 0 ? dice : []),
            penaltyDice: (poolModifier < 0 ? dice : []),
            unitDie
          }
        ],
        ['flags.' + FOLDER_ID + '.load.dicePool.suppressRollData']: false,
        ['flags.' + FOLDER_ID + '.load.dicePool.threshold']: Number(threshold),
        ['flags.' + FOLDER_ID + '.load.actorUuid']: CoC7Utilities.oldStyleToUuid(contents.dataset.actorKey),
        ['flags.' + FOLDER_ID + '.load.attackerMessageId']: contents.dataset.parentMessageId ?? undefined,
        ['flags.' + FOLDER_ID + '.load.cardOpen']: true,
        ['flags.' + FOLDER_ID + '.load.checkRevealed']: contents.dataset.checkRevealed !== 'false',
        ['flags.' + FOLDER_ID + '.load.finalPoolModifier']: Number(contents.dataset.diceModifier || 0) || 0,
        ['flags.' + FOLDER_ID + '.load.isAutoSuccess']: contents.dataset.autoSuccess === 'true',
        ['flags.' + FOLDER_ID + '.load.isNoResponse']: false,
        ['flags.' + FOLDER_ID + '.load.poolKeys']: poolKeys,
        ['flags.' + FOLDER_ID + '.load.poolModifier']: poolModifier,
        ['flags.' + FOLDER_ID + '.load.responded']: false,
        ['flags.' + FOLDER_ID + '.load.targetUuid']: CoC7Utilities.oldStyleToUuid(contents.dataset.targetKey)
      }
      if (contents.classList.contains('initiator')) {
        update['flags.' + FOLDER_ID + '.load.participant'] = CoC7ChatCombatMelee.participant.initiator
      } else {
        update['flags.' + FOLDER_ID + '.load.participant'] = CoC7ChatCombatMelee.participant.target
      }
      update['flags.' + FOLDER_ID + '.load.attackerUuid'] = update['flags.' + FOLDER_ID + '.load.actorUuid']
      update['flags.' + FOLDER_ID + '.load.itemUuid'] = update['flags.' + FOLDER_ID + '.load.actorUuid'] + '.Item.' + contents.dataset.itemId
      const merged = foundry.utils.mergeObject(message, update, { inplace: false })
      const check = await CoC7ChatCombatMelee.loadFromMessage(merged)
      const data = await check.getTemplateData()
      update.content = await (foundry.applications.handlebars?.renderTemplate ?? renderTemplate)(data.template, data)
      update._id = message.id
      updates.push(update)
    }
  }
}
