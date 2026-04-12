/* global Actor canvas ChatMessage CONFIG CONST Folder foundry fromUuid fromUuidSync game getComputedStyle Hooks Macro Ray Roll Token TokenDocument ui */
import { FOLDER_ID, STATUS_EFFECTS, TARGET_ALLOWED, TRADE_ALLOWED } from '../constants.js'
import CoC7ActorPickerDialog from './actor-picker-dialog.js'
import CoC7DicePool from './dice-pool.js'
import CoC7Link from './link.js'
import CoC7ModelsItemDocumentClass from '../models/item/document-class.js'
import CoC7RollNormalize from './roll-normalize.js'
import CoC7SystemSocket from './system-socket.js'
import deprecated from '../deprecated.js'

export default class CoC7Utilities {
  /**
   * Get Characteristic Names
   * @param {string} characteristic
   * @returns {object}
   */
  static getCharacteristicNames (characteristic) {
    const field = CONFIG.Actor.dataModels.character.schema.getField('characteristics').getField(characteristic.toLowerCase())
    if (field) {
      return {
        short: game.i18n.localize(field.label),
        label: game.i18n.localize(field.hint)
      }
    }
    return CoC7Utilities.getAttributeNames(characteristic)
  }

  /**
   * Convert difficult string types into CoC7DicePool.difficultyLevel value
   * @param {string|number} difficulty
   * @returns {number}
   */
  static convertDifficulty (difficulty) {
    if (!isNaN(Number(difficulty))) {
      if (Object.values(CoC7DicePool.difficultyLevel).includes(Number(difficulty))) {
        return Number(difficulty)
      }
    }
    switch (difficulty) {
      case '?':
        return CoC7DicePool.difficultyLevel.unknown
      case '+':
        return CoC7DicePool.difficultyLevel.hard
      case '++':
        return CoC7DicePool.difficultyLevel.extreme
      case '+++':
        return CoC7DicePool.difficultyLevel.critical
      default:
        return CoC7DicePool.difficultyLevel.regular
    }
  }

  /**
   * Trigger a skill check
   * @param {object} skill
   * @param {Event} event
   * @param {object} options
   * @returns {undefined|int}
   */
  static async skillCheckMacro (skill, event, options = {}) {
    event.preventDefault()
    const speaker = ChatMessage.getSpeaker()
    const actor = ChatMessage.getSpeakerActor(speaker)

    if (!actor) {
      ui.notifications.warn('CoC7.WarnNoActorAvailable', { localize: true })
      return
    }

    const check = await actor.skillCheck(skill, event.shiftKey, options)

    return check?.dice?.roll?.options?.coc7Result?.successLevel
  }

  /**
   * Trigger a Weapon check for current actor
   * @param {object} weapon
   * @param {Event} event
   */
  static weaponCheckMacro (weapon, event) {
    event.preventDefault()
    const speaker = ChatMessage.getSpeaker()
    const actor = ChatMessage.getSpeakerActor(speaker)

    if (!actor) {
      ui.notifications.warn('CoC7.WarnNoActorAvailable', { localize: true })
      return
    }

    actor.weaponCheck(weapon, event.shiftKey)
  }

  /**
   * Macro helper for roll dice
   * @param {int|undefined} threshold
   * @param {null|Event} event
   */
  static async checkMacro (threshold = undefined, event = null) {
    await CoC7Utilities.rollDice(event, { threshold })
  }

  /**
   * Create macro in slot
   * @param {Document} bar
   * @param {object} data
   * @param {int} slot
   * @returns {bool}
   */
  static createMacro (bar, data, slot) {
    if (!['Item', 'CoC7Link'].includes(data.type)) return true

    if (data.type === 'CoC7Link') {
      CoC7Link.makeMacroData(data).then(macroData => {
        if (macroData) {
          Macro.create(macroData).then(macro => {
            game.user.assignHotbarMacro(macro, slot)
          })
        }
      })
      return false
    }

    const item = fromUuidSync(data.uuid, bar)

    if (!item) {
      ui.notifications.warn('CoC7.WarnMacroNoItemFound', { localize: true })
      return true
    }
    if (!(item.type === 'weapon') && !(item.type === 'skill')) {
      ui.notifications.warn('CoC7.WarnMacroIncorrectType', { localize: true })
      return true
    }

    let command = ''

    if (item.type === 'weapon') {
      command = `game.CoC7.macros.weaponCheck({name:'${item.name}', uuid:'${data.uuid}'}, event);`
    }

    if (item.type === 'skill') {
      if (CoC7ModelsItemDocumentClass.isAnySpec(item)) {
        ui.notifications.warn('CoC7.WarnNoGlobalSpec', { localize: true })
        return true
      }
      command = `game.CoC7.macros.skillCheck({name:'${item.name}', uuid:'${data.uuid}'}, event);`
    }

    if (command !== '') {
      // Create the macro command
      const macro = game.macros.contents.find(m => m.name === item.name && m.command === command)
      if (!macro) {
        Macro.create(foundry.utils.duplicate({
          name: item.name,
          type: 'script',
          img: item.img,
          command
        })).then(macro => {
          game.user.assignHotbarMacro(macro, slot)
        })
        return false
      }
      game.user.assignHotbarMacro(macro, slot)
      return false
    }
    return true
  }

  /**
   * Toggle world character creation flag
   * @param {boolean} toggled
   */
  static async toggleDevPhase (toggled) {
    await game.settings.set(FOLDER_ID, 'developmentEnabled', toggled)
    ui.notifications.info(toggled ? 'CoC7.DevPhaseEnabled' : 'CoC7.DevPhaseDisabled', { localize: true })
    await CoC7Utilities.refreshOpenOwnerCharacterSheets()
    game.socket.emit('system.' + FOLDER_ID, {
      type: 'refreshOpenOwnerCharacterSheets'
    })
  }

  /**
   * Toggle world character creation flag
   * @param {boolean} toggled
   */
  static async toggleCharCreation (toggled) {
    await game.settings.set(FOLDER_ID, 'charCreationEnabled', toggled)
    ui.notifications.info(toggled ? 'CoC7.CharCreationEnabled' : 'CoC7.CharCreationDisabled', { localize: true })
    await CoC7Utilities.refreshOpenOwnerCharacterSheets()
    game.socket.emit('system.' + FOLDER_ID, {
      type: 'refreshOpenOwnerCharacterSheets'
    })
  }

  /**
   * Select Actors for Rest and trigger
   */
  static async restTargets () {
    const contents = []
    contents.push('<div>' + game.i18n.localize('CoC7.restTargets') + ': <input type="checkbox" name="CoC7RestTargetsAll" id="CoC7RestTargetsAll" style="margin-top: -2px; vertical-align: text-top; margin-bottom: 0;"><label for="CoC7RestTargetsAll">' + game.i18n.localize('CoC7.allActors') + '</label></div>')
    contents.push('<section class="scrollable flexcol" style="height: 25rem; padding: 0.125rem 0; gap: 0.5rem;">')
    const playerTokenIds = game.users.filter(user => user.active).map(u => u.character?.id).filter(id => id)
    // Build checkbox list for all active players
    game.actors.forEach(actor => {
      if (TARGET_ALLOWED.includes(actor.type)) {
        contents.push('<div class="flexrow"><input type="checkbox" name="CoC7RestTargets' + actor.id + '" id="CoC7RestTargets' + actor.id + '" style="margin-top: -2px; vertical-align: text-top; margin-bottom: 0; flex: 0 0 auto;"><label for="CoC7RestTargets' + actor.id + '"' + (playerTokenIds.includes(actor.id) ? ' checked="checked"' : '') + '>' + actor.name + '</label></div>')
      }
    })
    contents.push('</section>')
    new foundry.applications.api.DialogV2({
      id: 'CoC7RestTargets',
      window: { title: 'CoC7.dreaming' },
      classes: ['coc7', 'dialog'],
      content: contents.join('\n'),
      buttons: [{
        action: 'start',
        label: 'CoC7.startRest',
        default: true,
        callback: (event, button, dialog) => {
          const ids = []
          let allChecked = false
          for (const element of button.form.elements) {
            if (element.checked || allChecked) {
              const name = element.name.replace(/^CoC7RestTargets/, '')
              if (name === 'All') {
                allChecked = true
              } else if (name !== element.name) {
                ids.push(name)
              }
            }
          }
          return ids
        }
      }],
      submit: async targets => {
        await CoC7Utilities.startRest(targets)
      }
    }).render({ force: true })
  }

  /**
   * Perform rest on selected targets
   * @param {Array} targets
   */
  static async startRest (targets) {
    if (!targets.length) {
      return
    }
    const actors = game.actors.filter(actor => targets.includes(actor.id))
    const changes = []
    const contents = []
    for (const actor of actors) {
      if (TARGET_ALLOWED.includes(actor.type)) {
        const nameQuickHealer = game.i18n.localize('CoC7.quickHealer')
        const quickHealer = !!actor.items.find(doc => doc.type === 'talent' && doc.name === nameQuickHealer)
        const isCriticalWounds = !game.settings.get(FOLDER_ID, 'pulpRuleIgnoreMajorWounds') && actor.hasConditionStatus(STATUS_EFFECTS.criticalWounds)
        const dailySanityLoss = actor.system.attribs.san.dailyLoss
        const currentSanityLimit = actor.system.attribs.san.dailyLimit
        const dailySanityLimit = Math.floor(actor.system.attribs.san.value / 5)
        const hpValue = actor.system.attribs.hp.value
        const hpMax = actor.system.attribs.hp.max
        const mpValue = actor.system.attribs.mp.value
        const mpMax = actor.system.attribs.mp.max
        const pow = actor.system.characteristics.pow.value
        contents.push('<div class="coc7-rest-block">')
        contents.push('<b>' + actor.name + '</b>')
        const rows = []
        const actorChanges = {}
        if (hpValue < hpMax) {
          if (isCriticalWounds === true) {
            rows.push('<li class="coc7-upgrade-failed">' + game.i18n.localize('CoC7.hasCriticalWounds') + '</li>')
          } else {
            let healAmount = (game.settings.get(FOLDER_ID, 'pulpRuleFasterRecovery') ? 2 : 1)
            if (quickHealer === true) {
              healAmount++
            }
            healAmount = Math.min(healAmount, hpMax - hpValue)
            if (healAmount === 1) {
              rows.push('<li class="coc7-upgrade-success">' + game.i18n.localize('CoC7.healthRecovered') + '</li>')
            } else {
              rows.push('<li class="coc7-upgrade-success">' + game.i18n.format('CoC7.pulpHealthRecovered', { number: healAmount }) + '</li>')
            }
            actorChanges['system.attribs.hp.value'] = hpValue + healAmount
          }
        }
        if (dailySanityLoss > 0 || dailySanityLimit !== currentSanityLimit) {
          rows.push('<li class="coc7-upgrade-success">' + game.i18n.localize('CoC7.dailySanLossRestarted') + '</li>')
          actorChanges['system.attribs.san.dailyLoss'] = 0
          actorChanges['system.attribs.san.dailyLimit'] = dailySanityLimit
        }
        const hours = 7
        if (hours > 0 && mpValue < mpMax) {
          const magicAmount = Math.min(hours * Math.ceil(pow / 100), mpMax - mpValue)
          rows.push('<li class="coc7-upgrade-success">' + game.i18n.localize('CoC7.magicPointsRecovered') + ': ' + magicAmount + '</li>')
          actorChanges['system.attribs.mp.value'] = mpValue + magicAmount
        }
        if (rows.length === 0) {
          rows.push('<li>' + game.i18n.localize('CoC7.AlreadyRested') + '</li>')
        }
        contents.push('<ul>')
        contents.push(...rows)
        contents.push('</ul>')
        contents.push('</div>')
        if (Object.keys(actorChanges).length > 0) {
          changes.push({
            _id: actor.id,
            ...actorChanges
          })
        }
      }
    }
    if (changes.length > 0) {
      Actor.updateDocuments(changes)
    }
    const chatData = {
      flavor: game.i18n.localize('CoC7.dreaming'),
      speaker: { alias: game.user.name },
      content: contents.join('\n')
    }
    ChatMessage.create(chatData)
  }

  /**
   * Toggle world automatic xp gain
   * @param {boolean} toggled
   */
  static async toggleXPGain (toggled) {
    await game.settings.set(FOLDER_ID, 'xpEnabled', toggled)
    ui.notifications.info(toggled ? 'CoC7.XPGainEnabled' : 'CoC7.XPGainDisabled', { localize: true })
  }

  /**
   * Roll Dice
   * @param {Event} event
   * @param {object} options
   * @param {int} options.difficulty
   * @param {int} options.fastForward
   * @param {int} options.flatDiceModifier
   * @param {int} options.flatThresholdModifier
   * @param {int} options.poolModifier
   * @param {int} options.threshold
   */
  static async rollDice (event, options = {}) {
    if (typeof options.modifier !== 'undefined') {
      deprecated.warningLogger({
        was: 'rollDice(?, {modifier})',
        now: 'roll.(?, {poolModifier})',
        until: 15
      })
    }
    const config = {
      askValue: !options.threshold,
      cardType: CoC7RollNormalize.CARD_TYPE.NORMAL,
      cardTypeFixed: true,
      difficulty: options.difficulty,
      event,
      fastForward: options.fastForward,
      flatDiceModifier: options.flatDiceModifier,
      flatThresholdModifier: options.flatThresholdModifier,
      poolModifier: options.poolModifier,
      runRoll: false,
      threshold: options.threshold
    }

    const actors = []
    if (game.user.isGM && canvas.ready && canvas.tokens.controlled.length) {
      for (const token of canvas.tokens.controlled) {
        actors.push(token)
      }
    } else if (!game.user.isGM) {
      const actor = await CoC7ActorPickerDialog.create()
      if (actor) {
        actors.push(await fromUuid(actor))
      }
    } else if (game.user.character) {
      actors.push(game.user.character)
    }

    const normalized = await CoC7RollNormalize.trigger(config)
    normalized.runRoll = true
    normalized.isShiftKey = true
    normalized.event = event

    for (const actor of actors) {
      normalized.actor = actor
      await CoC7RollNormalize.trigger(normalized)
    }

    if (actors.length === 0) {
      await CoC7RollNormalize.trigger(normalized)
    }
  }

  /**
   * Lock open Actors
   */
  static async lockOpenCharacterSheets () {
    const documents = [...foundry.applications.instances].filter(doc => doc[1] instanceof foundry.applications.sheets.ActorSheetV2 && !doc[1].document.system.flags.locked && doc[1].document.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)).map(doc => doc[1].document)
    for (const document of documents) {
      await document.update({
        'system.flags.locked': true
      })
    }
  }

  /**
   * Refresh open Actor character sheets if owner
   */
  static async refreshOpenOwnerCharacterSheets () {
    const sheets = [...foundry.applications.instances].filter(doc => doc[1] instanceof CONFIG.Actor.sheetClasses.character['CoC7.CoC7ModelsActorCharacterSheetV2'].cls && doc[1].document.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)).map(doc => doc[1])
    for (const sheet of sheets) {
      await sheet.render()
    }
  }

  /**
   * Called from _onDrop to get the dropped documents that match entityType
   * @param {Event} event
   * @param {string} entityType
   * @returns {Array}
   */
  static async getDataFromDropEvent (event, entityType = 'Item') {
    try {
      const dataList = JSON.parse(event.dataTransfer.getData('text/plain'))
      if (dataList.type === 'Folder') {
        const folder = await fromUuid(dataList.uuid)
        if (!folder) return []
        return folder.contents.filter(doc => doc.documentName === entityType)
      } else if (dataList.type === entityType) {
        const item = await fromUuid(dataList.uuid)
        if (!item) return []
        return [item]
      } else {
        return []
      }
    } catch (err) {
      return []
    }
  }

  /**
   * Get Embedded Grouped Documents from an Item
   * @param {Document|object} document
   * @returns {Array}
   */
  static async getEmbeddedGroupedSkills (document) {
    const groups = []
    for (const index in document.system.groups) {
      const skills = await CoC7Utilities.getEmbeddedItems(document, 'system.groups.' + index)
      skills.sort(CoC7Utilities.sortByNameKey)
      groups[index] = {
        options: document.system.groups[index].options,
        skills,
        isEmpty: skills.length === 0
      }
    }
    return groups
  }

  /**
   * Get Embedded Documents from an Item
   * @param {Document|object} document
   * @param {string} source
   * @returns {Array}
   */
  static async getEmbeddedItems (document, source) {
    const eras = Object.entries(document.flags?.[FOLDER_ID]?.cocidFlag?.eras ?? {}).filter(e => e[1]).map(e => e[0])
    const worldEra = game.settings.get(FOLDER_ID, 'worldEra')
    const era = (eras.length === 0 || eras.includes(worldEra) ? worldEra : eras[0])
    const items = foundry.utils.getProperty(document, source).itemDocuments.map(d => typeof d === 'string' ? JSON.parse(d) : d).concat(await game.CoC7.cocid.expandItemArray({ itemList: foundry.utils.getProperty(document, source).itemKeys, era, showLoading: true }))
    items.sort(CoC7Utilities.sortByNameKey)
    return items
  }

  /**
   * Delete Embedded Document from an Item
   * @param {Document|object} document
   * @param {string} documentId
   * @returns {Promise<undefined|Document>}
   */
  static async deleteEmbeddedItem (document, documentId) {
    const updates = {}
    const itemDocuments = foundry.utils.duplicate(document.system.itemDocuments)
    const offset = itemDocuments.findIndex(d => d._id === documentId)
    if (offset === -1) {
      const item = (await document.system.items()).find(d => d._id === documentId)
      if (!item) {
        throw new Error('Unable to find embedded document')
      }
      const id = item.flags.CoC7.cocidFlag.id
      const offset = document.system.itemKeys.findIndex(k => k === id)
      if (offset === -1) {
        throw new Error('Unable to find embedded document')
      }
      updates['system.itemKeys'] = foundry.utils.duplicate(document.system.itemKeys)
      updates['system.itemKeys'].splice(offset, 1)
    } else {
      updates['system.itemDocuments'] = itemDocuments
      updates['system.itemDocuments'].splice(offset, 1)
    }
    return document.update(updates)
  }

  /**
   * Edit Embedded Document from an Item
   * @param {Document|object} document
   * @param {string} documentId
   * @param {object} submitData
   * @returns {Promise<undefined|Document>}
   */
  static async editEmbeddedItem (document, documentId, submitData) {
    const updates = {
      'system.itemDocuments': foundry.utils.duplicate(document.system.itemDocuments)
    }
    const offset = updates['system.itemDocuments'].findIndex(d => d._id === documentId)
    if (offset === -1) {
      const item = (await document.system.items()).find(d => d._id === documentId)
      if (!item) {
        throw new Error('Unable to find embedded document')
      }
      const id = item.flags.CoC7.cocidFlag.id
      const offset = document.system.itemKeys.findIndex(k => k === id)
      if (offset === -1) {
        throw new Error('Unable to find embedded document')
      }
      updates['system.itemKeys'] = foundry.utils.duplicate(document.system.itemKeys)
      updates['system.itemKeys'].splice(offset, 1)
      const itemData = foundry.utils.mergeObject(item.toObject(), submitData)
      updates['system.itemDocuments'].push(itemData)
    } else {
      updates['system.itemDocuments'][offset] = foundry.utils.mergeObject(updates['system.itemDocuments'][offset], submitData)
    }
    return document.update(updates)
  }

  /**
   * Open Embedded Document from an Item
   * @param {Document|object} document
   * @param {string} documentId
   */
  static async openEmbeddedItem (document, documentId) {
    const itemData = (await document.system.items()).find(d => d._id === documentId)
    if (itemData) {
      const Cls = CONFIG.Item.documentClass
      const item = new Cls(itemData, { parent: document })
      item.sheet.render({ force: true })
    }
  }

  /**
   * Slide a configured element up
   * @param {HtmlElement} outer
   * @param {object} options
   * @param {boolean} options.remove Remove the toggled element when closed
   * @param {null|Function} options.then Function to be called when toggled element is closed
   */
  static htmlElementToggleHide (outer, { remove = false, then = null } = {}) {
    const element = outer.querySelector('.html-element-toggled')
    if (element) {
      outer.dataset.htmlElementToggled = 'off'
      const fn = () => {
        element.removeEventListener('transitionend', fn)
        if (remove) {
          element.remove()
        }
        if (!this.htmlElementToggled(outer)) {
          if (then) {
            then()
          }
        }
      }
      element.addEventListener('transitionend', fn)
      if (['auto', ''].includes(element.style.height)) {
        const height = element.offsetHeight
        element.style.height = height + 'px'
        setTimeout(() => {
          element.style.height = 0
        }, 10)
      } else {
        element.style.height = 0
      }
    } else {
      outer.dataset.htmlElementToggled = 'off'
    }
  }

  /**
   * Configure an element and slide it down
   * @param {HtmlElement} outer
   * @param {HtmlElement} element
   */
  static htmlElementToggleShow (outer, element) {
    outer.dataset.htmlElementToggled = 'on'
    element.classList.add('html-element-toggled')
    element.classList.remove('html-element-hidden')
    element.style.height = ''
    const height = element.offsetHeight
    element.classList.add('html-element-hidden')
    setTimeout(() => {
      const fn = () => {
        element.removeEventListener('transitionend', fn)
        if (this.htmlElementToggled(outer)) {
          element.style.height = 'auto'
        }
      }
      element.addEventListener('transitionend', fn)
      element.style.height = height + 'px'
    }, 10)
  }

  /**
   * Check if element is configured and slid down
   * @param {HtmlElement} element
   * @returns {boolean}
   */
  static htmlElementToggled (element) {
    return element.dataset.htmlElementToggled === 'on'
  }

  /**
   * Escape a string for use in a Regular Expression
   * @param {string} string
   * @returns {string}
   */
  static quoteRegExp (string) {
    // Replace with RegExp.escape() when support is increased
    // https://bitbucket.org/cggaertner/js-hacks/raw/master/quote.js
    const len = string.length
    let qString = ''

    for (let current, i = 0; i < len; ++i) {
      current = string.charAt(i)

      if (current >= ' ' && current <= '~') {
        if (current === '\\' || current === "'") {
          qString += '\\'
        }

        qString += current.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&')
      } else {
        switch (current) {
          case '\b':
            qString += '\\b'
            break

          case '\f':
            qString += '\\f'
            break

          case '\n':
            qString += '\\n'
            break

          case '\r':
            qString += '\\r'
            break

          case '\t':
            qString += '\\t'
            break

          case '\v':
            qString += '\\v'
            break

          default:
            qString += '\\u'
            current = current.charCodeAt(0).toString(16)
            for (let j = 4; --j >= current.length; qString += '0');
            qString += current
        }
      }
    }

    return qString
  }

  /**
   * Creates a folder on the actors tab called "Imported Characters" if the folder doesn't exist.
   * @returns {Folder} the importedCharactersFolder
   */
  static async createImportCharactersFolderIfNotExists () {
    let folderName = game.i18n.localize('CoC7.ImportedCharactersFolder')
    if (folderName === 'CoC7.ImportedCharactersFolder') {
      folderName = 'Imported characters'
    }
    let importedCharactersFolder = game.folders.find(doc => doc.name === folderName && doc.type === 'Actor')
    if (importedCharactersFolder === null || typeof importedCharactersFolder === 'undefined') {
      // Create the folder
      importedCharactersFolder = await Folder.create({
        name: folderName,
        type: 'Actor',
        parent: null
      })
      ui.notifications.info('CoC7.CreatedImportedCharactersFolder', { localize: true })
    }
    return importedCharactersFolder
  }

  /**
   * Get Item from name and type
   * @param {string} type
   * @param {Array} names
   * @param {object} options
   * @param {string} options.source
   * @param {boolean} options.fallbackAny
   * @returns {object}
   */
  static async guessItems (type, names, { source = '', fallbackAny = false } = {}) {
    const checkList = names.map(t => t.toLocaleLowerCase())
    const foundItems = []
    for (let o = 0, oM = source.length; o < oM; o++) {
      let existing = []
      switch (source.substring(o, o + 1)) {
        case 'i':
          existing = game.items.filter(doc => doc.type === type && checkList.includes(doc.flags?.[FOLDER_ID]?.cocidFlag?.id.toLocaleLowerCase()))
          for (const item of existing) {
            if (typeof foundItems[item.flags[FOLDER_ID].cocidFlag.id] === 'undefined') {
              foundItems[item.flags[FOLDER_ID].cocidFlag.id] = item
            }
          }
          existing = game.items.filter(doc => doc.type === type && checkList.includes(doc.name.toLocaleLowerCase()))
          for (const item of existing) {
            const name = item.name.toLocaleLowerCase()
            if (typeof foundItems[name] === 'undefined') {
              foundItems[name] = item
            } else if (typeof foundItems[name].flags?.[FOLDER_ID]?.cocidFlag?.id === 'undefined' && typeof item.flags?.[FOLDER_ID]?.cocidFlag?.id === 'string') {
              foundItems[name] = item
            }
          }
          break
        case 'w':
        case 'm':
        case 's':
          for (const pack of game.packs) {
            if (pack.metadata.type === 'Item' && ['wworld', 'ssystem', 'mmodule'].includes(source[o] + pack.metadata.packageType)) { // cspell:disable-line
              const documents = await pack.getDocuments()
              existing = documents.filter(doc => doc.type === type && checkList.includes(doc.flags?.[FOLDER_ID]?.cocidFlag?.id.toLocaleLowerCase()))
              for (const item of existing) {
                if (typeof foundItems[item.flags[FOLDER_ID].cocidFlag.id] === 'undefined') {
                  foundItems[item.flags[FOLDER_ID].cocidFlag.id] = item
                }
              }
              existing = documents.filter(doc => doc.type === type && checkList.includes(doc.name.toLocaleLowerCase()))
              for (const item of existing) {
                const name = item.name.toLocaleLowerCase()
                if (typeof foundItems[name] === 'undefined') {
                  foundItems[name] = item
                } else if (typeof foundItems[name].flags?.[FOLDER_ID]?.cocidFlag?.id === 'undefined' && typeof item.flags?.[FOLDER_ID]?.cocidFlag?.id === 'string') {
                  foundItems[name] = item
                }
              }
            }
          }
          break
      }
    }
    const cocids = Object.keys(foundItems).reduce((c, d) => {
      if (typeof foundItems[d].flags?.[FOLDER_ID]?.cocidFlag?.id === 'string') {
        c[foundItems[d].flags[FOLDER_ID].cocidFlag.id] = d
      }
      return c
    }, {})
    const found = await game.CoC7.cocid.fromCoCIDRegexBest({ cocidRegExp: game.CoC7.cocid.makeGroupRegEx(Object.keys(cocids)), type: 'i', showLoading: true })
    for (const item of found) {
      const cocid = item.flags[FOLDER_ID].cocidFlag.id
      const key = cocids[cocid]
      foundItems[key] = item
    }
    if (fallbackAny && type === 'skill') {
      const keys = Object.keys(foundItems)
      const missing = checkList.filter(k => !keys.includes(k))
      const fallback = {}
      for (const name of missing) {
        const match = name.match(/^(.+ \()(?!any).+(\))$/)
        if (match) {
          fallback[name] = match[1] + 'any' + match[2]
        }
      }
      if (Object.keys(fallback).length > 0) {
        const anyItems = await CoC7Utilities.guessItems('skill', [...new Set(Object.values(fallback))], { source })
        for (const key in fallback) {
          foundItems[key] = foundry.utils.duplicate(anyItems[fallback[key]])
          if (foundItems[key].system.properties?.requiresname ?? false) {
            foundItems[key].system.properties.requiresname = false
          }
          if (foundItems[key].system.properties?.picknameonly ?? false) {
            foundItems[key].system.properties.picknameonly = false
          }
        }
      }
    }
    const output = {}
    for (const name of names) {
      const key = name.toLocaleLowerCase()
      if (typeof foundItems[key] !== 'undefined') {
        output[name] = foundItems[key]
      }
    }
    return output
  }

  /**
   * Set development flag based on item based on message roll
   * @param {string} rollMessageId
   * @param {Document} item
   * @param {boolean} value
   */
  static async messageRollFlagForDevelopment (rollMessageId, item, value) {
    if (game.settings.get(FOLDER_ID, 'xpEnabled')) {
      if (game.modules.get('dice-so-nice')?.active && game.dice3d && game.user.getFlag('dice-so-nice', 'settings')?.enabled && !game.settings.get('dice-so-nice', 'immediatelyDisplayChatMessages')) {
        const fnToggleFlag = async (messageId) => {
          if (messageId === rollMessageId) {
            if (item.system.flags.developement === !value) {
              await item.update({ 'system.flags.developement': value })
            }
            Hooks.off('diceSoNiceRollComplete', fnToggleFlag)
          }
        }
        Hooks.on('diceSoNiceRollComplete', fnToggleFlag)
      } else {
        await item.update({ 'system.flags.developement': value })
      }
    }
  }

  /**
   * Wait for message to update then run func wait for Dice so Nice release if possible
   * @param {string} updatedMessageId
   * @param {Function} func
   */
  static messageUpdatedWithRollThen (updatedMessageId, func) {
    let checks = 1
    if (game.modules.get('dice-so-nice')?.active && game.dice3d && game.user.getFlag('dice-so-nice', 'settings')?.enabled && !game.settings.get('dice-so-nice', 'immediatelyDisplayChatMessages')) {
      const fnToggleFlag = async (messageId) => {
        if (messageId === updatedMessageId) {
          checks--
          Hooks.off('diceSoNiceRollComplete', fnToggleFlag)
          if (checks === 0) {
            func()
          }
        }
      }
      checks++
      Hooks.on('diceSoNiceRollComplete', fnToggleFlag)
    }
    const waitForUpdate = async (messageId) => {
      if (messageId === updatedMessageId) {
        checks--
        Hooks.off('messageUpdatedCoC7', waitForUpdate)
        if (checks === 0) {
          func()
        }
      }
    }
    Hooks.on('messageUpdatedCoC7', waitForUpdate)
  }

  /**
   * Wait for message to update then run func
   * @param {string} updatedMessageId
   * @param {Function} func
   */
  static messageUpdatedThen (updatedMessageId, func) {
    const waitForUpdate = async (messageId) => {
      if (messageId === updatedMessageId) {
        Hooks.off('messageUpdatedCoC7', waitForUpdate)
        func()
      }
    }
    Hooks.on('messageUpdatedCoC7', waitForUpdate)
  }

  /**
   * Add Item summary to HTML Element
   * @param {HtmlElement} div
   * @param {object|Document} item
   * @param {null|Document} actor
   */
  static async setItemSummaryHtml (div, item, actor = null) {
    const chatData = await CONFIG.Item.documentClass.getChatData(item)
    if (chatData.labels.length) {
      const labels = document.createElement('div')
      labels.classList.add('item-labels', 'flexrow')
      for (const label of chatData.labels) {
        const element = document.createElement('div')
        element.classList.add('item-label', 'flexrow')
        const labelElement = document.createElement('label')
        const labelText = document.createTextNode(label.name + ':')
        labelElement.appendChild(labelText)
        element.appendChild(labelElement)
        const valueElement = document.createElement('div')
        const valueText = document.createTextNode(label.value)
        valueElement.appendChild(valueText)
        element.appendChild(valueElement)
        labels.appendChild(element)
      }
      div.appendChild(labels)
    }
    if (chatData.description.value.length) {
      const element = document.createElement('div')
      element.classList.add('coc7-formatted-text')
      element.innerHTML = chatData.description.value
      div.appendChild(element)
    }
    if (chatData.description.special.length) {
      const element = document.createElement('div')
      element.classList.add('coc7-formatted-text')
      element.innerHTML = chatData.description.special
      div.appendChild(element)
    }
    if (chatData.properties.length) {
      const properties = document.createElement('div')
      properties.classList.add('properties-list', 'item-details', 'flexrow')
      for (const property of chatData.properties) {
        const element = document.createElement('div')
        element.classList.add('property')
        element.style.flex = 'none'
        element.style.padding = '0.125rem'
        const elementText = document.createTextNode(property)
        element.appendChild(elementText)
        properties.appendChild(element)
      }
      div.appendChild(properties)
    }
  }

  /**
   * Set multiple actor keys, check for interdependencies and try and resolve them in order.
   * @param {ActorDocument} actor
   * @param {object} keyPairs
   * @param {Function} fnKeyToDotted
   * @param {Function} fnRoll
   */
  static async setMultipleActorValues (actor, keyPairs, fnKeyToDotted, fnRoll) {
    let updates = {}
    let anyUpdates = false
    const derived = {}
    for (const key in keyPairs) {
      if (keyPairs[key].indexOf('@') === -1) {
        updates[fnKeyToDotted(key)] = Math.floor(await fnRoll(keyPairs[key], {}))
      } else {
        derived[key] = keyPairs[key]
      }
    }
    if (Object.keys(updates).length) {
      await actor.update(updates, { render: false })
      anyUpdates = true
    }
    let remaining = Object.keys(derived).length
    while (remaining > 0) {
      updates = {}
      const parsed = actor.parsedValues()
      for (const key in derived) {
        const parsable = derived[key].replace(/@([a-z.0-9_-]+)/gi, (match, term) => {
          term = term.toLocaleLowerCase()
          if (Object.keys(derived).includes(term) || !Object.keys(parsed).includes(term) || typeof parsed[term] !== 'number') {
            return '@'
          }
          return parsed[term]
        })
        if (parsable.indexOf('@') === -1) {
          updates[fnKeyToDotted(key)] = Math.floor(await fnRoll(parsable, {}))
          delete derived[key]
        }
      }
      const nowRemaining = Object.keys(derived).length
      if (nowRemaining === remaining) {
        /* // FoundryVTT V12 */
        throw new Error(game.i18n.format((foundry.utils.isNewerVersion(game.version, 13) ? 'DICE.ErrorNotParsable' : 'DICE.ErrorNonNumeric'), { formula: Object.values(derived).join(' / ') }))
      }
      if (Object.keys(updates).length) {
        await actor.update(updates, { render: false })
        anyUpdates = true
      }
      remaining = nowRemaining
    }
    if (anyUpdates) {
      await actor.sheet.render({ force: true })
    }
  }

  /**
   * Calculate Skill Base Value
   * @param {object} parsedValues
   * @param {Array} skills
   * @returns {int}
   */
  static async setMultipleSkillBases (parsedValues, skills) {
    const completed = []
    let done = 0
    let lastCount = -1
    while (done !== lastCount) {
      lastCount = done
      for (const offset in skills) {
        if (!completed.includes(offset)) {
          const parsable = (skills[offset].system.base ?? '').toString().replace(/@([a-z.0-9_-]+)/gi, (match, term) => {
            term = term.toLocaleLowerCase()
            if (typeof parsedValues[term] !== 'undefined') {
              return parsedValues[term]
            }
            return '@'
          })
          if (parsable === '') {
            completed.push(offset)
            done++
          } else if (parsable.indexOf('@') === -1) {
            const base = Math.floor((await new Roll('(' + parsable + ')', parsedValues).roll()).total)
            foundry.utils.setProperty(skills[offset], 'system.adjustments.base', base)
            const cocid = foundry.utils.getProperty(skills[offset], 'flags.' + FOLDER_ID + '.cocidFlag.id')
            if (typeof cocid !== 'undefined') {
              parsedValues[cocid] = Object.values(foundry.utils.getProperty(skills[offset], 'system.adjustments')).reduce((c, v) => { c = c + v; return c }, 0)
            }
            completed.push(offset)
            done++
          }
        }
      }
      if (lastCount === done) {
        // Default any remaining values to 0
        for (const offset in skills) {
          if (!completed.includes(offset)) {
            const base = Math.floor((await new Roll('(' + skills[offset].system.base + ')', parsedValues).roll()).total)
            foundry.utils.setProperty(skills[offset], 'system.adjustments.base', base)
          }
        }
      }
    }
  }

  /**
   * Create kebab-case string
   * @param {string} s
   * @returns {string}
   */
  static toKebabCase (s) {
    if (!s) {
      return ''
    }
    const match = s.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)

    if (!match) {
      return ''
    }

    return match.join('-').toLowerCase()
  }

  /**
   * Sort by normalized label fields
   * @param {object} a
   * @param {object} b
   * @returns {int}
   */
  static sortByLabelKey (a, b) {
    return a.label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
      .localeCompare(
        b.label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
      )
  }

  /**
   * Sort by normalized skill name fields
   * @param {object} a
   * @param {object} b
   * @returns {int}
   */
  static sortSkillByNameWithOwn (a, b) {
    const nameA = (a.system.properties.special === true ? a.system.specialization + (a.system.properties.own === true ? 'Z' : 'A') + ' (' + a.system.skillName + ')' : a.name)
    const nameB = (b.system.properties.special === true ? b.system.specialization + (b.system.properties.own === true ? 'Z' : 'A') + ' (' + b.system.skillName + ')' : b.name)
    return nameA.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
      .localeCompare(
        nameB.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
      )
  }

  /**
   * Shuffle Array
   * @param {Array} array
   */
  static sortByRandom (array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
    }
  }

  /**
   * Sort by sort, then normalized name fields
   * @param {object} a
   * @param {object} b
   * @returns {int}
   */
  static sortBySortThenNameKey (a, b) {
    if (b.sort === a.sort) {
      return a.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
        .localeCompare(
          b.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
        )
    }
    return a.sort - b.sort
  }

  /**
   * Sort by value, then normalized name fields
   * @param {object} a
   * @param {object} b
   * @returns {int}
   */
  static sortByValueThenNameKey (a, b) {
    if (b.system.value === a.system.value) {
      return a.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
        .localeCompare(
          b.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
        )
    }
    return b.system.value - a.system.value
  }

  /**
   * Sort by normalized name fields
   * @param {object} a
   * @param {object} b
   * @returns {int}
   */
  static sortByNameKey (a, b) {
    return a.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
      .localeCompare(
        b.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
      )
  }

  /**
   * Sort by chase roll then initiative
   * @param {object} a
   * @param {object} b
   * @returns {int}
   */
  static sortByRollInitiative (a, b) {
    if (a.chaser && !b.chaser) {
      return -1
    } else if (!a.chaser && b.chaser) {
      return 1
    }
    if (a.initiativeValue !== b.initiativeValue) {
      return b.initiativeValue - a.initiativeValue
    }
    return a.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
      .localeCompare(
        b.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
      )
  }

  /**
   * Sort by chase initiative
   * @param {object} a
   * @param {object} b
   * @returns {int}
   */
  static sortByInitiative (a, b) {
    if (a.initiativeValue !== b.initiativeValue) {
      return b.initiativeValue - a.initiativeValue
    }
    return a.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
      .localeCompare(
        b.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
      )
  }

  /**
   * Half dice and numbers in Damage Bonus
   * @param {string|integer} db
   * @returns {string}
   */
  static halfDB (db) {
    let formula = ((db ?? '').toString().trim() === '' ? 0 : db).toString().replace(/\s+/g, '')
    if (!formula.startsWith('-')) {
      formula = '+' + formula
    }
    // Roll separates out negative symbols so rounding was longer working as expected
    const values = [...formula.matchAll(/([+-])(\d+)(d(\d+))?/ig)]
    let lastPosition = 0
    for (const value of values) {
      const found = formula.indexOf(value[0], lastPosition)
      if (found > -1) {
        const newText = value[1] + (typeof value[4] === 'undefined' ? (value[1] === '-' ? Math.ceil(value[2] / 2) : Math.floor(value[2] / 2)) : value[2] + 'D' + (value[1] === '-' ? Math.ceil(value[4] / 2) : Math.floor(value[4] / 2)))
        formula = formula.slice(0, found) + newText + formula.slice(found + value[0].length)
        lastPosition = found + 1
      }
    }
    return formula
  }

  /**
   * Trade uuid from Actor to selected actor
   * @param {string} uuid
   */
  static async tradeItem (uuid) {
    const item = await fromUuid(uuid)
    if (item && item.parent) {
      const actor = item.parent
      const actors = game.actors.filter(doc => {
        if (!TRADE_ALLOWED.includes(doc.type)) {
          return false
        }
        if (actor.id === doc.id) {
          return false
        }
        return doc.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED)
      })
      let content = '<div>' + game.i18n.localize('CoC7.MessageSelectUserToGiveTo') + '</div>'
      content = content + '<select name="user">'
      for (const actor of actors) {
        content =
          content + '<option value="' + actor.uuid + '">' + actor.name + '</option>'
      }
      content = content + '</select>'
      const message = {
        type: 'gmTradeItemTo',
        itemFrom: uuid,
        actorTo: ''
      }
      message.actorTo = await foundry.applications.api.DialogV2.wait({
        window: {
          title: 'CoC7.MessageTitleSelectUserToGiveTo'
        },
        position: {
          width: 400
        },
        content,
        buttons: [{
          action: 'cancel',
          label: 'CoC7.Cancel',
          icon: 'fa-solid fa-ban'
        }, {
          action: 'ok',
          label: 'CoC7.Validate',
          icon: 'fa-solid fa-check',
          callback: (event, button, dialog) => button.form.elements.user.value
        }]
      })
      if (message.actorTo !== 'cancel') {
        CoC7SystemSocket.requestKeeperAction(message)
      }
    }
  }

  /**
   * Which chat message Actors are editable by the current user
   * @param {object} options
   * @param {Document} options.message
   * @param {Document} options.user
   * @returns {Array}
   */
  static async canModifyActor ({ message, user = game.user } = {}) {
    const checks = (message.flags[FOLDER_ID]?.load?.actorUuids ?? [message.flags[FOLDER_ID]?.load?.actorUuid])
    const allowed = []
    for (const actorUuid of checks) {
      const actor = await fromUuid(actorUuid)
      if (actor && actor.canUserModify(user, 'update')) {
        allowed.push(actorUuid)
      }
    }
    return allowed
  }

  /**
   * Get Actor Model from Actor UUID
   * @param {string} actorUuid
   * @returns {Document|null}
   */
  static async getActorFromUuid (actorUuid) {
    const model = await fromUuid(actorUuid)
    if (model) {
      if (model instanceof (foundry.canvas.placeables?.Token ?? Token)) {
        if (model.document?.actorLink === true) {
          return model.document.actor
        }
      } else if (model instanceof TokenDocument) {
        if (model.actorLink === true) {
          return model.actor
        }
      }
      return model
    }
    return null
  }

  /**
   * Get UUID from actor related document
   * @param {Document|undefined} model
   * @returns {string|null}
   */
  static getActorUuid (model) {
    if (!model) {
      return null
    } else if (model instanceof (foundry.canvas.placeables?.Token ?? Token)) {
      if (model.document.actorLink === true) {
        return model.document.actor.uuid
      }
      return model.actor.uuid
    } else if (model instanceof TokenDocument) {
      if (model.actorLink === true) {
        return model.actor.uuid
      }
    }
    return model.uuid
  }

  /**
   * Get Attribute Names
   * @param {string} attribute
   * @returns {object}
   */
  static getAttributeNames (attribute) {
    if (attribute.toLocaleLowerCase() === 'luck') {
      attribute = 'LCK'
    }
    const field = CONFIG.Actor.dataModels.character.schema.getField('attribs').getField(attribute.toLowerCase())
    if (field) {
      return {
        short: game.i18n.localize(field.label),
        label: game.i18n.localize(field.hint)
      }
    }
    return {
      short: '',
      label: ''
    }
  }

  /**
   * Return true is CTRL key is pressed, used for MAC compatibility
   * @param {Event} event
   * @returns {boolean}
   */
  static isCtrlKey (event) {
    if (event === false) {
      return false
    }
    return (
      event.metaKey ||
      event.ctrlKey ||
      event.keyCode === 91 ||
      event.keyCode === 224
    )
  }

  /**
   * Update Bout Tables choices based on current roll tables
   */
  static async updateBoutTableChoices () {
    const packs = game.packs.filter(pack => pack.documentName === 'RollTable')
    const tables = []
    for (const pack of packs) {
      const index = await pack.getIndex()
      for (const doc of index) {
        tables.push({
          uuid: doc.uuid,
          name: doc.name + ' (' + pack.title + ')'
        })
      }
    }
    for (const table of game.tables) {
      tables.push({
        uuid: table.uuid,
        name: table.name
      })
    }
    tables.sort(CoC7Utilities.sortByNameKey)
    const choices = tables.reduce((c, r) => { c[r.uuid] = r.name; return c }, {
      none: 'SETTINGS.LetKeeperDecide'
    })
    game.settings.settings.get('CoC7.boutOfMadnessSummaryTable').choices = choices
    game.settings.settings.get('CoC7.boutOfMadnessRealTimeTable').choices = choices
  }

  /**
   * fake Roll Message
   */
  static async fakeRollMessage () {
    ChatMessage.create({
      rolls: JSON.stringify({
        class: 'Roll',
        options: {},
        dice: [],
        formula: '1',
        terms: [{
          class: 'NumericTerm',
          options: {
            flavor: null
          },
          evaluated: true,
          number: 1
        }],
        total: 1,
        evaluated: true
      }),
      whisper: [game.user.id],
      flavor: game.i18n.localize('CoC7.KeeperSentDecoy'),
      flags: {
        CoC7: {
          load: {
            as: 'CoC7ChatMessage'
          }
        }
      }
    })
  }

  /**
   * Refresh open sheets for document uuid
   * @param {string} uuid
   */
  static refreshOpenDocumentSheet (uuid) {
    foundry.applications.instances.forEach(i => {
      if (i.document?.uuid === uuid) {
        i.render()
      }
    })
  }

  /**
   * Get distance between two tokens
   * @param {Token} token1
   * @param {Token} token2
   * @returns {object}
   */
  static distanceBetweenTokens (token1, token2) {
    let distance = new (foundry.canvas.geometry?.Ray ?? Ray)(token1.object.center, token2.object.center).distance / canvas.grid.size
    if (game.settings.get(FOLDER_ID, 'distanceElevation')) {
      const elevation = Math.abs((token1.elevation || 0) - (token2.elevation || 0)) / canvas.grid.distance
      distance = Math.sqrt(distance * distance + elevation * elevation)
    }
    const yards = Math.round(CoC7Utilities.toYards(distance * canvas.grid.distance, canvas.grid.units) * 100) / 100
    if (!game.settings.get(FOLDER_ID, 'gridSpaces')) {
      distance = distance * canvas.grid.distance
    }
    return {
      roundedDistance: Math.round(distance * 100) / 100,
      yards
    }
  }

  static toYardWarnings = {}

  /**
   * Attempt to convert distance to yards
   * @param {float} distance
   * @param {string} unit
   * @returns {float}
   */
  static toYards (distance, unit) {
    switch (unit.toString().toLowerCase()) {
      case 'ft':
      case game.i18n.localize('CoC7.DistanceUnitFeet'):
        return distance / 3
      case 'yd':
      case game.i18n.localize('CoC7.DistanceUnitYard'):
        return distance
      case 'm':
      case game.i18n.localize('CoC7.DistanceUnitMetre'):
        return distance
      default:
        if (typeof this.toYardWarnings[unit] === 'undefined') {
          this.toYardWarnings[unit] = true
          /* // FoundryVTT V12 */
          ui.notifications.warn(game.i18n.format('CoC7.ErrorUnknownDistanceUnit', { distance: distance.toFixed(2), unit }))
        }
        return distance
    }
  }

  /**
   * Convert rem value to pixel number
   * @param {float} rem
   * @returns {integer}
   */
  static remToPx (rem) {
    return Math.floor(rem * Number(getComputedStyle(document.documentElement).fontSize.replace('px', '')))
  }

  /**
   * Get uuid from speaker object or old custom actor key
   * @param {object|string} oldStyle
   * @returns {string}
   */
  static oldStyleToUuid (oldStyle) {
    if (!oldStyle) {
      return undefined
    } else if (typeof oldStyle === 'string') {
      const parts = oldStyle.match(/^([^.]+)(\.([^.]+))?(\.([^.]+))?$/)
      if (parts?.[1] === 'TOKEN' && typeof parts?.[3] === 'string') {
        if (game.actors.tokens[parts?.[3]]) {
          return game.actors.tokens[parts?.[3]].uuid
        }
      } else if (typeof parts?.[5] !== 'undefined') {
        return 'Scene.' + parts[1] + '.Token.' + parts[3] + '.Actor.' + parts[5]
      } else if (typeof parts?.[3] !== 'undefined') {
        return 'Scene.' + parts[1] + '.Token.' + parts[3]
      } else if (typeof parts?.[1] !== 'undefined') {
        return 'Actor.' + parts[1]
      }
    } else if (oldStyle.scene && oldStyle.token && oldStyle.actor) {
      return 'Scene.' + oldStyle.scene + '.Token.' + oldStyle.token + '.Actor.' + oldStyle.actor
    } else if (oldStyle.actor) {
      return 'Actor.' + oldStyle.actor
    }
    return 'Actor.xxxxxxxxxxxxxxxx'
  }
}
