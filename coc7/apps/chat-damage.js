/* global ChatMessage CONST foundry fromUuid game renderTemplate Roll TextEditor TokenDocument ui */
import { FOLDER_ID } from '../constants.js'
import CoC7ActorPickerDialog from './actor-picker-dialog.js'
import CoC7ChatCombatMelee from './chat-combat-melee.js'
import CoC7DicePool from './dice-pool.js'
import CoC7SystemSocket from './system-socket.js'
import CoC7Utilities from './utilities.js'

export default class CoC7ChatDamage {
  #asyncAttacker
  #asyncItem
  #asyncTarget
  #cardOpen
  #damageRange
  #ignoreArmor
  #isCritical
  #isDamageInflicted
  #isImpale
  #resultText
  #rollDamage
  #targetArmor

  /**
   * Constructor
   */
  constructor () {
    this.#cardOpen = true
    this.#damageRange = 'normal'
    this.#ignoreArmor = false
    this.#isCritical = false
    this.#isDamageInflicted = false
    this.#isImpale = false
    this.#resultText = ''
    this.#rollDamage = false
    this.#targetArmor = '0'
  }

  /**
   * Create damage message from two combat melee messages
   * @param {object} options
   * @param {string} options.attacker   Message ID
   * @param {string} options.target     Message ID
   * @param {string} options.targetUuid Actor UUID
   */
  static async createFromCombatMelee ({ attacker, target = '', targetUuid = '' }) {
    const messageAttacker = game.messages.get(attacker)
    if (messageAttacker?.flags?.[FOLDER_ID]?.load?.as === 'CoC7ChatCombatMelee') {
      const check = new CoC7ChatDamage()
      const attackerData = await (await CoC7ChatCombatMelee.loadFromMessage(messageAttacker)).getTemplateData()
      const messageTarget = (target === '' ? false : game.messages.get(target))
      let targetData
      if (messageTarget?.flags?.[FOLDER_ID]?.load?.as === 'CoC7ChatCombatMelee') {
        targetData = await (await CoC7ChatCombatMelee.loadFromMessage(messageTarget)).getTemplateData()
      }
      let checkCritical = false
      if (targetData?.isNoResponse) {
        check.attacker = attackerData.attackerUuid
        check.item = attackerData.itemUuid
        check.target = attackerData.targetUuid
        if (attackerData.successLevel >= CoC7DicePool.successLevel.regular) {
          checkCritical = true
          check.#resultText = game.i18n.format('CoC7.WinnerRollDamage', {
            name: attackerData.attackerName
          })
          check.#rollDamage = true
        } else {
          check.#resultText = game.i18n.format('CoC7.InitiatorMissed', {
            name: attackerData.attackerName
          })
        }
      } else if (targetData?.isDodge) {
        if (attackerData.successLevel < CoC7DicePool.successLevel.regular && targetData.successLevel < CoC7DicePool.successLevel.regular) {
          check.#resultText = game.i18n.localize('CoC7.NoWinner')
        } else if (attackerData.successLevel > targetData.successLevel) {
          checkCritical = true
          check.#resultText = game.i18n.format('CoC7.WinnerRollDamage', {
            name: attackerData.attackerName
          })
          check.attacker = attackerData.attackerUuid
          check.item = attackerData.itemUuid
          check.target = attackerData.targetUuid
          check.#rollDamage = true
        } else {
          check.#resultText = game.i18n.format('CoC7.DodgeSuccess', {
            name: attackerData.targetName
          })
          check.attacker = attackerData.targetUuid
          check.item = targetData.itemUuid
          check.target = attackerData.attackerUuid
        }
      } else if (targetData?.isFightBack) {
        if (attackerData.successLevel < CoC7DicePool.successLevel.regular && targetData.successLevel < CoC7DicePool.successLevel.regular) {
          check.#resultText = game.i18n.localize('CoC7.NoWinner')
        } else if (attackerData.successLevel >= targetData.successLevel) {
          checkCritical = true
          check.#resultText = game.i18n.format('CoC7.WinnerRollDamage', {
            name: attackerData.attackerName
          })
          check.attacker = attackerData.attackerUuid
          check.item = attackerData.itemUuid
          check.target = attackerData.targetUuid
          check.#rollDamage = true
        } else {
          check.#resultText = game.i18n.format('CoC7.WinnerRollDamage', {
            name: attackerData.targetName
          })
          check.attacker = attackerData.targetUuid
          check.item = targetData.itemUuid
          check.target = attackerData.attackerUuid
          check.#rollDamage = true
        }
      } else if (targetData?.isManeuver) {
        if (attackerData.successLevel < CoC7DicePool.successLevel.regular && targetData.successLevel < CoC7DicePool.successLevel.regular) {
          check.#resultText = game.i18n.localize('CoC7.NoWinner')
        } else if (attackerData.successLevel >= targetData.successLevel) {
          checkCritical = true
          check.#resultText = game.i18n.format('CoC7.WinnerRollDamage', {
            name: attackerData.attackerName
          })
          check.attacker = attackerData.attackerUuid
          check.item = attackerData.itemUuid
          check.target = attackerData.targetUuid
          check.#rollDamage = true
        } else {
          check.#resultText = game.i18n.format('CoC7.ManeuverSuccess', {
            name: attackerData.targetName
          })
          check.attacker = attackerData.targetUuid
          check.item = targetData.itemUuid
          check.target = attackerData.attackerUuid
        }
      } else if (attackerData.isSuccess) {
        checkCritical = true
        check.#resultText = game.i18n.format('CoC7.WinnerRollDamage', {
          name: attackerData.attackerName
        })
        check.attacker = attackerData.attackerUuid
        check.item = attackerData.itemUuid
        check.target = targetUuid
        check.#rollDamage = true
      } else {
        check.#resultText = game.i18n.format('CoC7.InitiatorMissed', {
          name: attackerData.attackerName
        })
        check.attacker = attackerData.attackerUuid
        check.item = attackerData.itemUuid
      }
      if (checkCritical && attackerData.successLevel >= CoC7DicePool.successLevel.extreme) {
        check.#isCritical = true
        const item = (await this.item)
        if (item?.system?.properties.impl ?? false) {
          check.#isImpale = true
        }
      }
      const targetActor = (await check.target)
      check.#targetArmor = (targetActor ? (targetActor.isToken ? targetActor.token.actor : targetActor)?.system.attribs.armor.value ?? '0' : '0')
      const chatData = await check.getChatData()
      await ChatMessage.create(chatData)
    }
  }

  /**
   * Create damage message from two combat melee messages
   * @param {object} options
   * @param {Actor} options.attacker
   * @param {Item} options.weapon
   * @param {boolean} options.isCritical
   * @param {Actor} options.target
   */
  static async createFromActors ({ attacker, weapon, isCritical, target } = {}) {
    const check = new CoC7ChatDamage()
    check.#resultText = game.i18n.format('CoC7.WinnerRollDamage', {
      name: attacker.name
    })
    check.attacker = attacker.uuid
    check.item = weapon.uuid
    check.target = target.uuid
    check.#rollDamage = true
    check.#isCritical = isCritical
    if (isCritical) {
      const item = (await this.item)
      if (item?.system?.properties.impl ?? false) {
        check.#isImpale = true
      }
    }
    const targetActor = (await check.target)
    check.#targetArmor = (targetActor ? (targetActor.isToken ? targetActor.token.actor : targetActor).system.attribs.armor.value ?? '0' : '0')
    const chatData = await check.getChatData()
    await ChatMessage.create(chatData)
  }

  /**
   * Create damage message from weapon
   * @param {object} options
   * @param {string} options.attackerUuid
   * @param {string} options.weaponUuid
   * @param {string} options.damageRange
   * @param {boolean} options.isCritical
   */
  static async createFromWeapon ({ attackerUuid, weaponUuid, damageRange, isCritical = false } = {}) {
    const check = new CoC7ChatDamage()
    check.attacker = attackerUuid
    check.item = weaponUuid
    check.#damageRange = damageRange
    check.#rollDamage = true
    check.#isCritical = isCritical
    if (isCritical) {
      const item = (await this.item)
      if (item?.system?.properties.impl ?? false) {
        check.#isImpale = true
      }
    }
    const chatData = await check.getChatData()
    await ChatMessage.create(chatData)
  }

  /**
   * Create CoC7ChatDamage from message
   * @param {Document} message
   * @returns {CoC7ChatDamage}
   */
  static async loadFromMessage (message) {
    const keys = [
      'attackerUuid',
      'cardOpen',
      'damageRange',
      // 'itemUuid', - Optional
      'ignoreArmor',
      'isCritical',
      'isDamageInflicted',
      'isImpale',
      'resultText',
      'rollDamage'
      // 'targetArmor'
      // 'targetUuid' - Target not required
    ]
    if (message.id && message.flags[FOLDER_ID]?.load?.as === 'CoC7ChatDamage' && keys.every(k => typeof message.flags[FOLDER_ID]?.load?.[k] !== 'undefined')) {
      const check = new CoC7ChatDamage()
      check.message = message
      const load = foundry.utils.duplicate(message.flags[FOLDER_ID].load)
      check.attacker = load.attackerUuid
      check.#cardOpen = load.cardOpen
      check.#damageRange = load.damageRange
      check.#isCritical = load.isCritical
      check.#isDamageInflicted = load.isDamageInflicted
      check.#isImpale = load.isImpale
      check.#ignoreArmor = load.ignoreArmor
      check.item = load.itemUuid
      check.#resultText = load.resultText
      check.#rollDamage = load.rollDamage
      check.target = load.targetUuid
      check.#targetArmor = load.targetArmor
      return check
    }
    ui.notifications.warn('CoC7.Errors.UnableToLoadMessage', { localize: true })
    throw new Error('CoC7.Errors.UnableToLoadMessage')
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
   * Get attacker item promise
   * @returns {Promise<Document>} async Actor
   */
  get item () {
    return this.#asyncItem
  }

  /**
   * Set attacker item from document/uuid
   * @param {string} value
   */
  set item (value) {
    this.#asyncItem = (typeof value === 'string' ? fromUuid(value) : undefined)
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
   * Work out the damage formula from weapon damage, damage bonus, critical, and impale
   * @returns {string}
   */
  async #damageFormula () {
    const item = (await this.item)
    const addFullDB = item?.system?.properties?.addb ?? false
    const addHalfDB = item?.system?.properties?.ahdb ?? false
    let weaponDB = ''
    let weaponDamage = item?.system?.range?.[this.#damageRange]?.damage
    if ((weaponDamage ?? '').toString().trim() === '') {
      weaponDamage = '0'
    }
    if (addFullDB || addHalfDB) {
      const attacker = (await this.attacker)
      const db = attacker.system.attribs.db.value
      if (addFullDB) {
        const formulaDb = ((db ?? '').toString().trim() === '' ? 0 : db).toString().replace(/\s+/g, '')
        weaponDB = (!formulaDb.startsWith('-') ? '+' : '') + formulaDb
      } else if (addHalfDB) {
        weaponDB = CoC7Utilities.halfDB(db)
      }
    }
    if (this.#isCritical) {
      const maxDamage = new Roll(weaponDamage + weaponDB).evaluateSync({ maximize: true }).total.toString()
      if (this.#isImpale) {
        return weaponDamage + '+' + maxDamage
      }
      return maxDamage
    }
    return weaponDamage + weaponDB
  }

  /**
   * Work out rolled damage minus armor
   * @returns {string|int}
   */
  async #inflictDamageText () {
    let value = 0
    if (await this.#isDamageOnlyNumbers()) {
      const roll = (this.message?.rolls ?? [])[0]
      if (typeof roll !== 'undefined') {
        value = parseInt(roll.total, 10)
      } else {
        value = parseInt(await this.#damageFormula(), 10)
      }
    }
    if (!this.#ignoreArmor) {
      if (this.#isArmorFormula) {
        return game.i18n.localize('CoC7.ArmorWillFormula')
      }
      const armor = parseInt(this.#targetArmor, 10)
      if (!isNaN(armor)) {
        value = value - armor
      }
      if (value <= 0) {
        return game.i18n.localize('CoC7.ArmorAbsorbsDamage')
      }
    }
    return value
  }

  /**
   * Is armor formula
   * @returns {boolean}
   */
  get #isArmorFormula () {
    return (!this.#targetArmor.toString().match(/^\d+$/) && Roll.validate(this.#targetArmor.toString()))
  }

  /**
   * Is damage a number
   * @returns {boolean}
   */
  async #isDamageOnlyNumbers () {
    if (this.#rollDamage) {
      const roll = (this.message?.rolls ?? [])[0]
      if (typeof roll !== 'undefined' || (await this.#damageFormula()).match(/^[+\-\d+]$/)) {
        return true
      }
    }
    return false
  }

  /**
   * Roll Armor
   * @param {string} messageId
   */
  async rollArmor (messageId) {
    const target = (await this.target)
    const newValue = document.querySelector('[data-message-id="' + messageId + '"] input[type=text]')?.value
    if (typeof newValue !== 'undefined') {
      this.#targetArmor = newValue
    }
    this.#targetArmor = (await new Roll(this.#targetArmor, target.parsedValues()).roll()).total
  }

  /**
   * Roll damage
   */
  async rollDamage () {
    const formula = await this.#damageFormula()
    const roll = await new Roll(formula).roll()
    this.message.rolls.push(roll)
  }

  /**
   * Create Message Data object
   * @returns {object}
   */
  async getTemplateData () {
    const attacker = (await this.attacker)
    const target = (await this.target)
    const item = (await this.item)
    const data = {
      attackerImg: (attacker ? (attacker.isToken ? attacker.token.texture.src : (attacker instanceof TokenDocument ? attacker.texture.src : attacker.img)) : ''),
      attackerName: (attacker ? (attacker.isToken ? attacker.token.name : attacker.name) : ''),
      attackerUuid: CoC7Utilities.getActorUuid(attacker),
      cardOpen: this.#cardOpen,
      damageFormula: await this.#damageFormula(),
      displayActorOnCard: game.settings.get(FOLDER_ID, 'displayActorOnCard'),
      enrichedWeaponDescriptionSpecial: '',
      /* // FoundryVTT V12 */
      enrichedItemDescriptionValue: await (foundry.applications.ux?.TextEditor.implementation ?? TextEditor).enrichHTML(
        item?.system?.description?.value,
        {
          async: true,
          secrets: false
        }
      ),
      foundryGeneration: game.release.generation,
      hasWeaponSpecial: item?.system?.properties.spcl ?? false,
      ignoreArmor: this.#ignoreArmor,
      isArmorFormula: this.#isArmorFormula,
      isCritical: this.#isCritical,
      isDamageOnlyNumbers: await this.#isDamageOnlyNumbers(),
      isDamageInflicted: this.#isDamageInflicted,
      inflictDamageText: await this.#inflictDamageText(),
      isImpale: this.#isImpale,
      itemDamage: item?.name,
      itemImg: item?.img,
      itemName: item?.name,
      itemUuid: item?.uuid,
      resultText: this.#resultText,
      rollDamage: this.#rollDamage,
      rollHtml: await (this.message?.rolls ?? [])[0]?.render(),
      targetArmor: this.#targetArmor,
      targetImg: (target ? (target.isToken ? target.token.texture.src : (target instanceof TokenDocument ? target.texture.src : target.img)) : ''),
      targetName: (target ? (target.isToken ? target.token.name : target.name) : ''),
      targetUuid: CoC7Utilities.getActorUuid(target),
      weaponAddFullDB: item?.system?.properties?.addb ?? false,
      weaponAddHalfDB: item?.system?.properties?.ahdb ?? false,
      weaponDamage: item?.system?.range?.[this.#damageRange]?.damage
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
    if (!data.targetUuid) {
      data.targetImg = 'icons/svg/mystery-man-black.svg'
      data.targetName = game.i18n.localize('CoC7.NoTarget')
    }
    if (!data.rollHtml && data.isDamageInflicted) {
      // Number only damage inflicted fake roll
      data.rollHtml = ' '
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
            as: 'CoC7ChatDamage',
            actorUuids: [data.attackerUuid, data.targetUuid],
            attackerUuid: data.attackerUuid,
            cardOpen: this.#cardOpen,
            damageRange: this.#damageRange,
            ignoreArmor: this.#ignoreArmor,
            isCritical: this.#isCritical,
            isDamageInflicted: this.#isDamageInflicted,
            isImpale: this.#isImpale,
            itemUuid: data.itemUuid,
            resultText: this.#resultText,
            rollDamage: this.#rollDamage,
            targetArmor: this.#targetArmor,
            targetUuid: data.targetUuid
          }
        }
      },
      rolls: (this.message?.rolls ?? []),
      /* // FoundryVTT V12 */
      content: await (foundry.applications.handlebars?.renderTemplate ?? renderTemplate)('systems/' + FOLDER_ID + '/templates/chat/damage.hbs', data)
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
   * Click Event on dice roll
   * @param {ClickEvent} event
   * @param {Document} message
   */
  static async _onChangeEvent (event, message) {
    switch (event.target?.type) {
      case 'text':
        {
          const check = await CoC7ChatDamage.loadFromMessage(message)
          if (check) {
            const newValue = document.querySelector('[data-message-id="' + message.id + '"] input[type=text]')?.value
            if (typeof newValue !== 'undefined') {
              check.#targetArmor = newValue
            }
            check.updateMessage()
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
      case 'applyValue':
        {
          const check = await CoC7ChatDamage.loadFromMessage(message)
          if (check) {
            const damage = await check.#inflictDamageText()
            if (typeof damage !== 'string') {
              const actorUuid = await CoC7ActorPickerDialog.create()
              const actor = await CoC7Utilities.getActorFromUuid(actorUuid)
              if (actor) {
                const damageTaken = await actor.dealDamage(damage)
                ChatMessage.create({
                  speaker: { alias: actor.name },
                  content: game.i18n.localize('CoC7.DamageInflicted') + ': ' + damageTaken
                })
              } else {
                ui.notifications.warn('CoC7.Errors.UnparsableActor', { localize: true })
              }
            } else {
              ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
            }
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableMessage', { localize: true })
          }
        }
        break
      case 'dealDamage':
        {
          const check = await CoC7ChatDamage.loadFromMessage(message)
          if (check) {
            const damage = await check.#inflictDamageText()
            if (typeof damage !== 'string') {
              const targetActor = (await check.target)
              targetActor.dealDamage(damage, { ignoreArmor: true })
              check.#isDamageInflicted = true
              check.updateMessage()
            } else if (damage === game.i18n.localize('CoC7.ArmorAbsorbsDamage')) {
              check.#isDamageInflicted = true
              check.updateMessage()
            } else {
              ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
            }
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableMessage', { localize: true })
          }
        }
        break
      case 'rollArmor':
        {
          const check = await CoC7ChatDamage.loadFromMessage(message)
          if (check) {
            await check.rollArmor(message.id)
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableMessage', { localize: true })
          }
        }
        break
      case 'rollDamage':
        {
          const check = await CoC7ChatDamage.loadFromMessage(message)
          if (check) {
            if (check.#isArmorFormula) {
              await check.rollArmor(message.id)
            }
            await check.rollDamage()
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableMessage', { localize: true })
          }
        }
        break
      case 'toggleValue':
        {
          const check = await CoC7ChatDamage.loadFromMessage(message)
          const set = event.currentTarget?.dataset?.set
          if (check && set) {
            switch (set) {
              case 'ignoreArmor':
                check.#ignoreArmor = !check.#ignoreArmor
                check.updateMessage()
                break
              case 'isCritical':
                check.#isCritical = !check.#isCritical
                if (!check.#isCritical) {
                  check.#isImpale = false
                }
                check.updateMessage()
                break
              case 'isImpale':
                check.#isImpale = !check.#isImpale
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
    html.querySelectorAll('[data-action]').forEach((element) => {
      if (game.user.isGM || allowed.includes(element.parentElement.dataset.actorUuid)) {
        element.addEventListener('click', event => CoC7ChatDamage._onClickEvent(event, message))
      }
    })
    html.querySelectorAll('input[type=text]').forEach((element) => {
      if (game.user.isGM || allowed.includes(element.parentElement.dataset.actorUuid)) {
        element.addEventListener('change', event => CoC7ChatDamage._onChangeEvent(event, message))
      }
    })
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
      const dataSet = JSON.parse(decodeURIComponent(contents.dataset.object))
      let attackerUuid = CoC7Utilities.oldStyleToUuid(dataSet.actorKey)
      let targetUuid = (dataSet._targetKey ? CoC7Utilities.oldStyleToUuid(dataSet._targetKey) : null)
      let attacker = await fromUuid(attackerUuid)
      if (attacker?.actor) {
        attacker = attacker.actor
        attackerUuid = attacker.uuid
      }
      if (targetUuid) {
        let target = await fromUuid(targetUuid)
        if (target?.actor) {
          target = target.actor
          targetUuid = target.uuid
        }
      }
      let itemUuid = attackerUuid + '.Item.' + dataSet.itemId
      if (attacker) {
        itemUuid = (attacker.actor ?? attacker).items.get(dataSet.itemId).uuid
      }
      const update = {
        ['flags.' + FOLDER_ID + '.load.as']: 'CoC7ChatDamage',
        ['flags.' + FOLDER_ID + '.load.actorUuids']: [attackerUuid, targetUuid],
        ['flags.' + FOLDER_ID + '.load.attackerUuid']: attackerUuid,
        ['flags.' + FOLDER_ID + '.load.cardOpen']: dataSet.damageInflicted ?? false,
        ['flags.' + FOLDER_ID + '.load.damageRange']: dataSet._options?.range ?? 'normal',
        ['flags.' + FOLDER_ID + '.load.ignoreArmor']: dataSet.ignoreArmor ?? false,
        ['flags.' + FOLDER_ID + '.load.isCritical']: dataSet._options?.critical ?? false,
        ['flags.' + FOLDER_ID + '.load.isDamageInflicted']: dataSet.damageInflicted ?? false,
        ['flags.' + FOLDER_ID + '.load.isImpale']: dataSet._impale ?? false,
        ['flags.' + FOLDER_ID + '.load.itemUuid']: itemUuid,
        ['flags.' + FOLDER_ID + '.load.resultText']: '', //
        ['flags.' + FOLDER_ID + '.load.rollDamage']: true,
        ['flags.' + FOLDER_ID + '.load.targetArmor']: dataSet._armor ?? 0,
        ['flags.' + FOLDER_ID + '.load.targetUuid']: targetUuid,
        rolls: (dataSet.roll ? [Roll.fromData(dataSet.roll)] : [])
      }
      const merged = foundry.utils.mergeObject(message, update, { inplace: false })
      const check = await CoC7ChatDamage.loadFromMessage(merged)
      if (check) {
        const data = await check.getTemplateData()
        update.content = await (foundry.applications.handlebars?.renderTemplate ?? renderTemplate)('systems/' + FOLDER_ID + '/templates/chat/damage.hbs', data)
        update.flavor = check.flavor
        update._id = message.id
        updates.push(update)
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
  static async migrateOlderMeleeMessages ({ offset, updates, deleteIds } = {}) {
    const message = game.messages.contents[offset]
    const div = document.createElement('div')
    div.innerHTML = message.content
    const contents = div.children[0]
    if (contents) {
      let attackerUuid = CoC7Utilities.oldStyleToUuid(contents.dataset.actorKey)
      let targetUuid = (contents.dataset.targetKey ? CoC7Utilities.oldStyleToUuid(contents.dataset.targetKey) : null)
      let attacker = await fromUuid(attackerUuid)
      if (attacker?.actor) {
        attacker = attacker.actor
        attackerUuid = attacker.uuid
      }
      if (targetUuid) {
        let target = await fromUuid(targetUuid)
        if (target?.actor) {
          target = target.actor
          targetUuid = target.uuid
        }
      }
      const button = contents.querySelector('button[data-action="roll-melee-damage"]')
      let itemUuid = attackerUuid + '.Item.' + (button?.dataset.weapon)
      if (attacker && typeof button?.dataset.weapon === 'string') {
        itemUuid = (attacker.actor ?? attacker).items.get(button?.dataset.weapon).uuid
      }
      const update = {
        ['flags.' + FOLDER_ID + '.load.as']: 'CoC7ChatDamage',
        ['flags.' + FOLDER_ID + '.load.actorUuids']: [attackerUuid, targetUuid],
        ['flags.' + FOLDER_ID + '.load.attackerUuid']: attackerUuid,
        ['flags.' + FOLDER_ID + '.load.cardOpen']: false,
        ['flags.' + FOLDER_ID + '.load.damageRange']: 'normal',
        ['flags.' + FOLDER_ID + '.load.ignoreArmor']: false,
        ['flags.' + FOLDER_ID + '.load.isCritical']: false,
        ['flags.' + FOLDER_ID + '.load.isDamageInflicted']: false,
        ['flags.' + FOLDER_ID + '.load.isImpale']: false,
        ['flags.' + FOLDER_ID + '.load.itemUuid']: itemUuid,
        ['flags.' + FOLDER_ID + '.load.resultText']: '', //
        ['flags.' + FOLDER_ID + '.load.rollDamage']: true,
        ['flags.' + FOLDER_ID + '.load.targetArmor']: 0,
        ['flags.' + FOLDER_ID + '.load.targetUuid']: targetUuid
      }
      const merged = foundry.utils.mergeObject(message, update, { inplace: false })
      const check = await CoC7ChatDamage.loadFromMessage(merged)
      if (check) {
        const data = await check.getTemplateData()
        update.content = await (foundry.applications.handlebars?.renderTemplate ?? renderTemplate)('systems/' + FOLDER_ID + '/templates/chat/damage.hbs', data)
        update.flavor = check.flavor
        update._id = message.id
        updates.push(update)
      }
    }
  }
}
