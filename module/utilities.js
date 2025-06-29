/* global canvas, ChatMessage, CONFIG, CONST, Dialog, Folder, foundry, fromUuid, fromUuidSync, game, getDocumentClass, Hooks, Macro, Roll, Token, ui */
import { COC7 } from './config.js'
import { CoC7Check } from './check.js'
import { CoC7Item } from './items/item.js'
import { CoC7Link } from './apps/coc7-link.js'
import { RollDialog } from './apps/roll-dialog.js'
import { chatHelper } from './chat/helper.js'

export class CoC7Utilities {
  // static test(event){
  //   if( event.shiftKey) ui.notifications.info('Hello from SHIFT utilities');
  //   else ui.notifications.info('Hello from utilities');
  //   const speaker = ChatMessage.getSpeaker();
  //   let actor;
  //   if (speaker.token) actor = game.actors.tokens[speaker.token];
  //   if (!actor) actor = game.actors.get(speaker.actor);

  //  actor.setCondition(COC7.status.criticalWounds);
  // }

  static isFormula (x) {
    if (typeof x !== 'string') return false
    if (!isNaN(Number(x))) return false
    return Roll.validate(x)
  }

  static ParseChatEntry (html, content) {
    const regX = /(\S+)/g
    const terms = content.match(regX)
    if (
      terms[0]?.toLowerCase().match(/^\/r(oll)?$/) &&
      terms[1]?.toLowerCase().startsWith('1d%')
    ) {
      // Delay calling function to prevent chatmessage key down triggering default
      setTimeout(function () {
        CoC7Utilities._ExecCommand(content)
      }, 200)
      return false
    }
  }

  static async _ExecCommand (content) {
    const options = content
      .toLowerCase()
      .split(' ')
      ?.join('')
      ?.replace(/\/r(oll)?1d%/, '')
    const check = new CoC7Check()
    if (options.length) {
      let escaped = options
      let threshold
      let difficulty = CoC7Check.difficultyLevel.regular
      let diceModifier = 0
      let ask = false
      let flatDiceModifier
      let flatThresholdModifier
      const thresholdStr = escaped.match(/[^(]+(?=\))/)
      if (thresholdStr && thresholdStr.length) {
        threshold = Number(thresholdStr[0])
        for (const match of thresholdStr) {
          escaped = escaped.replace(`(${match})`, '')
        }
      }
      const difficultyStr = escaped.match(/[^[]+(?=\])/)
      if (difficultyStr && difficultyStr.length) {
        difficulty = CoC7Utilities.convertDifficulty(difficultyStr[0])
        for (const match of difficultyStr) {
          escaped = escaped.replace(`[${match}]`, '')
        }
      }
      if (escaped.includes('?')) {
        ask = true
        escaped = escaped.replace('?', '')
      }
      if (!isNaN(Number(escaped))) diceModifier = Number(escaped)

      if (ask) {
        const dialogOptions = {
          threshold,
          modifier: diceModifier,
          difficulty,
          askValue: true
        }
        const usage = await RollDialog.create(dialogOptions)
        if (usage) {
          diceModifier = Number(usage.get('bonusDice'))
          difficulty = Number(usage.get('difficulty'))
          threshold = Number(usage.get('threshold')) || threshold
          flatDiceModifier = Number(usage.get('flatDiceModifier'))
          flatThresholdModifier = Number(usage.get('flatThresholdModifier'))
        }
      }

      check.diceModifier = diceModifier || 0
      check.difficulty = difficulty || CoC7Check.difficultyLevel.regular
      check.rawValue = threshold
      check.flatDiceModifier = flatDiceModifier
      check.flatThresholdModifier = flatThresholdModifier
      if (threshold) check.rawValue = !isNaN(threshold) ? threshold : undefined
    }
    const speaker = ChatMessage.getSpeaker()
    if (speaker.token && speaker.scene) {
      const actor = chatHelper.getActorFromKey(
        `${speaker.scene}.${speaker.token}`
      ) // REFACTORING (2) +++ why speaker.scene.
      if (actor) check.actor = actor
    } else if (speaker.actor) {
      const actor = game.actors.get(speaker.actor)
      if (actor) check.actor = actor
    }
    await check.roll()
    check.toMessage()
  }

  /* // FoundryVTT V10 */
  // static async test () {
  //   ui.notifications.infos('Do some stuff')
  // }

  /* // FoundryVTT V10 */
  // static getActorFromString (actorString) {
  //   let actor

  //   // Token is better than actor.
  //   // Case 1 : trying with ID.
  //   // Case 1.1 : token found.
  //   if (game.actors.tokens[actorString]) return game.actors.tokens[actorString]
  //   // Case 1.2 : actor found.
  //   actor = game.actors.get(actorString)
  //   if (actor) return actor

  //   // Case 2 : trying with name
  //   // Case 2.1 : token found.
  //   actor = Object.values(game.actors.tokens).find(t => {
  //     if (t.name.toLowerCase() === actorString.toLowerCase()) return true
  //     return false
  //   })
  //   if (!actor) {
  //     // Case 2.2 : actor found.
  //     actor = game.actors.find(a => {
  //       if (a.name.toLowerCase() === actorString.toLowerCase()) return true
  //       return false
  //     })
  //   }
  //   if (actor) return actor

  //   // // Case 3 string maybe an actorKey
  //   // if (creature.includes('.')) {
  //   //   const [, actorId] = key.split('.')
  //   //   return CoC7Utilities.getActorFromString(actorId)
  //   // }

  //   // No joy
  //   return null
  // }

  static getCharacteristicNames (char) {
    const charKey = char.toLowerCase()

    switch (charKey) {
      case 'str':
        return {
          short: game.i18n.localize('CHARAC.STR'),
          label: game.i18n.localize('CHARAC.Strength')
        }
      case 'con':
        return {
          short: game.i18n.localize('CHARAC.CON'),
          label: game.i18n.localize('CHARAC.Constitution')
        }
      case 'siz':
        return {
          short: game.i18n.localize('CHARAC.SIZ'),
          label: game.i18n.localize('CHARAC.Size')
        }
      case 'dex':
        return {
          short: game.i18n.localize('CHARAC.DEX'),
          label: game.i18n.localize('CHARAC.Dexterity')
        }
      case 'app':
        return {
          short: game.i18n.localize('CHARAC.APP'),
          label: game.i18n.localize('CHARAC.Appearance')
        }
      case 'int':
        return {
          short: game.i18n.localize('CHARAC.INT'),
          label: game.i18n.localize('CHARAC.Intelligence')
        }
      case 'pow':
        return {
          short: game.i18n.localize('CHARAC.POW'),
          label: game.i18n.localize('CHARAC.Power')
        }
      case 'edu':
        return {
          short: game.i18n.localize('CHARAC.EDU'),
          label: game.i18n.localize('CHARAC.Education')
        }
      case 'luck':
        return {
          short: game.i18n.localize('CoC7.Luck'),
          label: game.i18n.localize('CoC7.Luck')
        }
      default: {
        const characteristicList = (!foundry.utils.isNewerVersion(game.version, '12') ? game.system.template.Actor.templates.characteristics.characteristics : game.system.template.Actor.character.characteristics)
        for (const [, value] of Object.entries(characteristicList)) {
          if (charKey === game.i18n.localize(value.short).toLowerCase()) {
            return {
              short: game.i18n.localize(value.short),
              label: game.i18n.localize(value.label)
            }
          }
        }
        return null
      }
    }
  }

  static convertDifficulty (difficulty) {
    if (String(difficulty) === '0') return CoC7Check.difficultyLevel.regular
    if (typeof difficulty !== 'string') return difficulty
    if (!isNaN(Number(difficulty))) return Number(difficulty)

    switch (difficulty) {
      case '?':
        return CoC7Check.difficultyLevel.unknown
      case '+':
        return CoC7Check.difficultyLevel.hard
      case '++':
        return CoC7Check.difficultyLevel.extreme
      case '+++':
        return CoC7Check.difficultyLevel.critical
      default:
        return CoC7Check.difficultyLevel.regular
    }
  }

  static async skillCheckMacro (skill, event, options = {}) {
    event.preventDefault()
    const speaker = ChatMessage.getSpeaker()
    let actor
    if (speaker.token) actor = game.actors.tokens[speaker.token]
    if (!actor) actor = game.actors.get(speaker.actor) // No need to fill actor token

    if (!actor) {
      ui.notifications.warn(game.i18n.localize('CoC7.WarnNoActorAvailable'))
      return
    }

    const check = await actor.skillCheck(skill, event.shiftKey, options)

    return check?.dice?.roll?.options?.coc7Result?.successLevel
  }

  static weaponCheckMacro (weapon, event) {
    event.preventDefault()
    const speaker = ChatMessage.getSpeaker()
    let actor
    if (speaker.token) actor = game.actors.tokens[speaker.token]
    if (!actor) {
      if (speaker.scene && speaker.token) {
        // Create a synthetic actor linked with the active token.
        const baseActor = game.actors.get(speaker.actor)
        const scene = game.scenes.get(speaker.scene)
        const token = scene.tokens.get(speaker.token)

        const ActorClass = getDocumentClass('Actor')
        const tokenActor = new ActorClass(baseActor.toJSON(), {
          parent: token
        })
        actor = tokenActor
      } else actor = game.actors.get(speaker.actor)
    }

    if (!actor) {
      ui.notifications.warn(game.i18n.localize('CoC7.WarnNoActorAvailable'))
      return
    }

    actor.weaponCheck(weapon, event.shiftKey)
  }

  static async checkMacro (threshold = undefined, event = null) {
    await CoC7Utilities.rollDice(event, { threshold })
  }

  static createMacro (bar, data, slot) {
    if (!['Item', 'CoC7Link'].includes(data.type)) return

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
      return ui.notifications.warn(
        game.i18n.localize('CoC7.WarnMacroNoItemFound')
      )
    }
    if (!(item.type === 'weapon') && !(item.type === 'skill')) {
      return ui.notifications.warn(
        game.i18n.localize('CoC7.WarnMacroIncorrectType')
      )
    }

    let command = ''

    if (item.type === 'weapon') {
      command = `game.CoC7.macros.weaponCheck({name:'${item.name}', uuid:'${data.uuid}'}, event);`
    }

    if (item.type === 'skill') {
      if (CoC7Item.isAnySpec(item)) {
        return ui.notifications.warn(
          game.i18n.localize('CoC7.WarnNoGlobalSpec')
        )
      }
      command = `game.CoC7.macros.skillCheck({name:'${item.name}', uuid:'${data.uuid}'}, event);`
    }

    if (command !== '') {
      // Create the macro command
      const macro = game.macros.contents.find(
        m => m.name === item.name && m.command === command
      )
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

  static async toggleDevPhase (toggle) {
    await game.settings.set('CoC7', 'developmentEnabled', toggle)
    ui.notifications.info(
      toggle
        ? game.i18n.localize('CoC7.DevPhaseEnabled')
        : game.i18n.localize('CoC7.DevPhaseDisabled')
    )
    game.socket.emit('system.CoC7', {
      type: 'updateChar'
    })
    CoC7Utilities.updateCharSheets()
  }

  static async toggleCharCreation (toggle) {
    await game.settings.set('CoC7', 'charCreationEnabled', toggle)
    ui.notifications.info(
      toggle
        ? game.i18n.localize('CoC7.CharCreationEnabled')
        : game.i18n.localize('CoC7.CharCreationDisabled')
    )
    game.socket.emit('system.CoC7', {
      type: 'updateChar'
    })
    CoC7Utilities.updateCharSheets()
    Hooks.call('toggleCharCreation', toggle)
  }

  static async getTarget () {
    const users = game.users.filter(user => user.active)
    const actors = game.actors
    let checkOptions = `<input type="checkbox" name="COCCheckAllPC" id="COCCheckAllPC">\n
    <label for="COCCheckAllPC">${game.i18n.localize('CoC7.allActors')}</label>`
    const playerTokenIds = users
      .map(u => u.character?.id)
      .filter(id => id !== undefined)
    const selectedPlayerIds = canvas.tokens.controlled.map(token => {
      return token.actor.id
    })

    // Build checkbox list for all active players
    actors.forEach(actor => {
      const checked =
        (selectedPlayerIds.includes(actor.id) ||
          playerTokenIds.includes(actor.id)) &&
        'checked'
      checkOptions += `
     <br>
     <input type="checkbox" name="${actor.id}" id="${actor.id}" value="${actor.name}" ${checked}>\n
     <label for="${actor.id}">${actor.name}</label>
       `
    })

    new Dialog({
      title: `${game.i18n.localize('CoC7.dreaming')}`,
      content: `${game.i18n.localize(
        'CoC7.restTargets'
      )}: ${checkOptions} <br>`,
      buttons: {
        whisper: {
          label: `${game.i18n.localize('CoC7.startRest')}`,
          callback: async html => {
            const targets = []
            let all = false
            const users = html.find('[type="checkbox"]')
            for (const user of users) {
              if (user.name === 'COCCheckAllPC' && user.checked) all = true
              if (user.checked || all) targets.push(user.id)
            }
            await CoC7Utilities.startRest(targets)
          }
        }
      }
    }).render(true)
  }

  static async startRest (targets) {
    if (!targets.length) return
    const actors = game.actors.filter(actor => targets.includes(actor.id))
    let chatContent = `<i>${game.i18n.localize('CoC7.dreaming')}...</i><br>`
    for (const actor of actors) {
      if (['character', 'npc', 'creature'].includes(actor.type)) {
        let quickHealer = false
        for (const item of actor.items) {
          if (item.type === 'talent') {
            if (item.name === `${game.i18n.localize('CoC7.quickHealer')}`) {
              quickHealer = true
            }
          }
        }
        const isCriticalWounds =
          !game.settings.get('CoC7', 'pulpRuleIgnoreMajorWounds') &&
          actor.hasConditionStatus(COC7.status.criticalWounds)
        const dailySanityLoss = actor.system.attribs.san.dailyLoss
        const hpValue = actor.system.attribs.hp.value
        const hpMax = actor.system.attribs.hp.max
        const mpValue = actor.system.attribs.mp.value
        const mpMax = actor.system.attribs.mp.max
        const pow = actor.system.characteristics.pow.value
        chatContent = chatContent + `<br><b>${actor.name}. </b>`
        if (hpValue < hpMax) {
          if (isCriticalWounds === true) {
            chatContent =
              chatContent +
              `<b style="color:darkred">${game.i18n.localize(
                'CoC7.hasCriticalWounds'
              )}. </b>`
          } else {
            let healAmount = 1
            if (game.settings.get('CoC7', 'pulpRuleFasterRecovery')) {
              healAmount = 2
            }
            if (quickHealer === true) {
              healAmount++
            }
            healAmount = Math.min(healAmount, hpMax - hpValue)
            if (healAmount === 1) {
              chatContent =
                chatContent +
                `<b style="color:darkolivegreen">${game.i18n.localize(
                  'CoC7.healthRecovered'
                )}. </b>`
            } else {
              chatContent =
                chatContent +
                `<b style="color:darkolivegreen">${game.i18n.format(
                  'CoC7.pulpHealthRecovered',
                  { number: healAmount }
                )}. </b>`
            }
            actor.update({
              'system.attribs.hp.value':
                actor.system.attribs.hp.value + healAmount
            })
          }
        }
        if (dailySanityLoss > 0) {
          chatContent =
            chatContent +
            `<b style="color:darkolivegreen">${game.i18n.localize(
              'CoC7.dailySanLossRestarted'
            )}.</b>`
          actor.update({
            'system.attribs.san.dailyLoss': 0,
            'system.attribs.san.dailyLimit': Math.floor(actor.system.attribs.san.value / 5)
          })
        }
        const hours = 7
        if (hours > 0 && mpValue < mpMax) {
          let magicAmount = hours * Math.ceil(pow / 100)
          magicAmount = Math.min(magicAmount, mpMax - mpValue)
          chatContent =
            chatContent +
            `<b style="color:darkolivegreen">${game.i18n.format(
              'CoC7.magicPointsRecovered'
            )}: ${magicAmount}.</b>`
          actor.update({
            'system.attribs.mp.value':
              actor.system.attribs.mp.value + magicAmount
          })
        }
      }
    }
    const chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker(),
      content: chatContent,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER
    }
    ChatMessage.create(chatData)
  }

  static async toggleXPGain (toggle) {
    await game.settings.set('CoC7', 'xpEnabled', toggle)
    ui.notifications.info(
      toggle
        ? game.i18n.localize('CoC7.XPGainEnabled')
        : game.i18n.localize('CoC7.XPGainDisabled')
    )
  }

  static async rollDice (event, options = {}) {
    options.askValue = !options.threshold
    let diceModifier, difficulty, flatDiceModifier, flatThresholdModifier
    let threshold = options.threshold

    if (undefined !== options.modifier) diceModifier = Number(options.modifier)
    if (undefined !== options.difficulty) {
      difficulty = CoC7Utilities.convertDifficulty(options.difficulty)
    }

    if (!event?.shiftKey && !options.fastForward) {
      const usage = await RollDialog.create(options)
      if (usage) {
        diceModifier = Number(usage.get('bonusDice'))
        difficulty = Number(usage.get('difficulty'))
        threshold = Number(usage.get('threshold'))
        flatDiceModifier = Number(usage.get('flatDiceModifier'))
        flatThresholdModifier = Number(usage.get('flatThresholdModifier'))
      }
    }

    const actors = []

    if (game.user.isGM && canvas.tokens.controlled.length) {
      for (const token of canvas.tokens.controlled) {
        actors.push(token.actor.tokenKey)
      }
    } else if (game.user.character) {
      actors.push(game.user.character.tokenKey)
    }

    for (const tk of actors) {
      const check = new CoC7Check()
      check.diceModifier = diceModifier || 0
      check.difficulty = difficulty || CoC7Check.difficultyLevel.regular
      check.rawValue = threshold
      check.flatDiceModifier = flatDiceModifier
      check.flatThresholdModifier = flatThresholdModifier
      check.actor = tk
      await check.roll()
      check.toMessage()
    }

    if (!actors.length) {
      const check = new CoC7Check()
      check.diceModifier = diceModifier || 0
      check.difficulty = difficulty || CoC7Check.difficultyLevel.regular
      check.rawValue = threshold
      check.flatDiceModifier = flatDiceModifier
      check.flatThresholdModifier = flatThresholdModifier
      await check.roll()
      check.toMessage()
    }
  }

  static updateCharSheets () {
    if (game.user.isGM) {
      for (const a of game.actors.contents) {
        if (a?.type === 'character' && a?.sheet && a?.sheet?.rendered) {
          a.update({ 'system.flags.locked': true })
          a.render(false)
        }
      }
    } else {
      for (const a of game.actors.contents) {
        if (a.isOwner) {
          a.update({ 'system.flags.locked': true })
          a.render(false)
        }
      }
    }
  }

  /**
   * Called from _onDrop to get the dropped entityType or entityType from a folder
   * @param {jQuery} event @see activateListeners
   * @returns [items] array of items
   */
  static async getDataFromDropEvent (event, entityType = 'Item') {
    if (event.originalEvent) return []
    try {
      const dataList = JSON.parse(event.dataTransfer.getData('text/plain'))
      if (dataList.type === 'Folder' && dataList.documentName === entityType) {
        const folder = await fromUuid(dataList.uuid)
        if (!folder) return []
        return folder.contents
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

  static async copyToClipboard (text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999px'
        textArea.style.top = '-999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        return new Promise((resolve, reject) => {
          document.execCommand('copy')
            ? resolve()
            : reject(
              new Error(game.i18n.localize('CoC7.UnableToCopyToClipboard'))
            )
          textArea.remove()
        }).catch(err => ui.notifications.error(err))
      }
    } catch (err) {
      ui.notifications.error(game.i18n.localize('CoC7.UnableToCopyToClipboard'))
    }
  }

  static quoteRegExp (string) {
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

  /* // FoundryVTT V10 */
  // static setByPath (obj, path, value) {
  //   const parts = path.split('.')
  //   let o = obj
  //   if (parts.length > 1) {
  //     for (let i = 0; i < parts.length - 1; i++) {
  //       if (!o[parts[i]]) o[parts[i]] = {}
  //       o = o[parts[i]]
  //     }
  //   }

  //   o[parts[parts.length - 1]] = value
  // }

  /* // FoundryVTT V10 */
  // static getByPath (obj, path) {
  //   const parts = path.split('.')
  //   let o = obj
  //   if (parts.length > 1) {
  //     for (let i = 0; i < parts.length - 1; i++) {
  //       if (!o[parts[i]]) return undefined
  //       o = o[parts[i]]
  //     }
  //   }

  //   return o[parts[parts.length - 1]]
  // }

  /**
   * Retrieve a Document by its Universally Unique Identifier (uuid).
   * @param {string} uuid   The uuid of the Document to retrieve
   * @return {Promise<Document|null>}
   */
  static SfromUuid (uuid) {
    let parts = uuid.split('.')
    let doc

    // Compendium Documents
    if (parts[0] === 'Compendium') {
      return null
      // return fromUuid(uuid) // Return Promise
      // parts.shift();
      // const [scope, packName, id] = parts.slice(0, 3);
      // parts = parts.slice(3);
      // const pack = game.packs.get(`${scope}.${packName}`);
      // return await pack?.getDocument(id);
    } else {
      // World Documents
      const [docName, docId] = parts.slice(0, 2)
      parts = parts.slice(2)
      const collection = CONFIG[docName].collection.instance
      doc = collection.get(docId)
    }

    // Embedded Documents
    while (doc && parts.length > 1) {
      const [embeddedName, embeddedId] = parts.slice(0, 2)
      doc = doc.getEmbeddedDocument(embeddedName, embeddedId)
      parts = parts.slice(2)
    }
    return doc || null
  }

  static isDocumentUuidPack (uuid) {
    if (uuid.includes('Compendium')) return true
    else return false
  }

  static isDocumentUuid (uuid) {
    const identifiers = ['Actor', 'Scene', 'Token', 'Item', 'Compendium']
    for (let i = 0; i < identifiers.length; i++) {
      if (uuid.includes(identifiers[i])) return true
    }
    return false
  }

  static getActorDocumentFromDropData (dropData) {
    let docUuid, actor
    if (dropData.tokenUuid) {
      docUuid = dropData.tokenUuid
    } else if (typeof dropData.uuid !== 'undefined') {
      docUuid = dropData.uuid
    } else {
      docUuid =
        dropData.sceneId && dropData.tokenId
          ? `Scene.${dropData.sceneId}.Token.${dropData.tokenId}`
          : dropData.actorId || dropData.actorKey || dropData.id
    }
    if (dropData.type === 'Token') {
      docUuid = dropData.uuid
    } else if (docUuid) {
      actor = CoC7Utilities.getActorFromKey(docUuid)
      if (!actor && dropData.type === 'Item') docUuid = null
    }

    if (actor && docUuid !== actor.uuid) {
      docUuid = actor.uuid
    }
    return docUuid
  }

  static getDocumentFromKey (key) {
    if (!key) return null
    // Case 0 - a document Uuid
    if (CoC7Utilities.isDocumentUuid(key)) {
      if (CoC7Utilities.isDocumentUuidPack(key)) return fromUuid(key) // TODO Check we can do that
      return CoC7Utilities.SfromUuid(key)
    }

    // Case 1 - a synthetic actor from a Token
    if (key.includes('.')) {
      // REFACTORING (2)
      const [sceneId, tokenId] = key.split('.')
      if (sceneId === 'TOKEN') {
        return game.actors.tokens[tokenId] // REFACTORING (2)
      }
      const scene = game.scenes.get(sceneId)
      if (!scene) return null
      const tokenData = scene.getEmbeddedDocument('Token', tokenId)
      if (!tokenData) return null
      const token = new Token(tokenData)
      if (!token.scene) token.scene = foundry.utils.duplicate(scene)
      return token
    }
    // Case 2 - use Actor ID directory
    return game.actors.get(key) || null
  }

  static getActorFromKey (key) {
    const doc = CoC7Utilities.getDocumentFromKey(key)
    if (!doc) return null
    if (doc.actor) return doc.actor
    if (doc.constructor?.name === 'CoCActor') return doc
    return null
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
    let importedCharactersFolder = game.folders.find(
      entry => entry.name === folderName && entry.type === 'Actor'
    )
    if (
      importedCharactersFolder === null ||
      typeof importedCharactersFolder === 'undefined'
    ) {
      // Create the folder
      importedCharactersFolder = await Folder.create({
        name: folderName,
        type: 'Actor',
        parent: null
      })
      ui.notifications.info(
        game.i18n.localize('CoC7.CreatedImportedCharactersFolder')
      )
    }
    return importedCharactersFolder
  }

  /**
   * guessItem, try and find the item in the locations defined in ${source} i = Item Directory, w = World Compendiums, m = Module Compendiums, s = System Compendiums
   * @param {String} type Item type to find
   * @param {String} name Name of item to find
   * @param {Object} combat null (default). If boolean combat property of skill must match
   * @param {Object} source '' (default). Check order
   * @param {Object} fallbackAny false (default). Should any specialization that isn't found try using (Any) items
   * @returns {Object} formatted Actor data Item or null
   */
  static async guessItem (
    type,
    name,
    { combat = null, source = '', fallbackAny = false } = {}
  ) {
    let existing = null
    name = name.toLocaleLowerCase()
    for (let o = 0, oM = source.length; o < oM; o++) {
      switch (source.substring(o, o + 1)) {
        case 'i':
          existing = game.items.find(
            item => item.type === type &&
              item.name.toLowerCase() === name &&
              (combat === null || item.system.properties.combat === combat)
          )
          if (existing) {
            return existing
          }
          break
        case 'w':
        case 'm':
        case 's':
          for (const pack of game.packs) {
            if (
              pack.metadata.type === 'Item' &&
              ((source[o] === 'w' && pack.metadata.package === 'world') ||
                (source[o] === 'S' && pack.metadata.package === 'CoC7') ||
                (source[o] === 's' &&
                  !['world', 'CoC7'].includes(pack.metadata.package)))
            ) {
              const documents = await pack.getDocuments()
              existing = documents.find(
                item =>
                  item.type === type &&
                  item.name.toLowerCase() === name &&
                  (combat === null || item.system.properties.combat === combat)
              )
              if (existing) {
                return existing
              }
            }
          }
          break
      }
    }
    if (fallbackAny && type === 'skill') {
      const match = name.match(/^(.+ \()(?!any).+(\))$/)
      if (match) {
        return await CoC7Utilities.guessItem(
          type,
          match[1] + 'any' + match[2],
          { combat, source }
        )
      }
    }
  }

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

  static sortByNameKey (a, b) {
    return a.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase()
      .localeCompare(
        b.name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLocaleLowerCase()
      )
  }
 
  static sortBySpecializationThenName (a, b) {
    const normalize = (str) => (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()

    // Use specialization as the primary sort key, or the skill name if no specialization exists.
    const sortKeyA = normalize(a.system.specialization || a.name)
    const sortKeyB = normalize(b.system.specialization || b.name)

    // Compare the primary sort keys.
    const primaryCompare = sortKeyA.localeCompare(sortKeyB)
    if (primaryCompare !== 0) {
      return primaryCompare
    }

    const nameA = normalize(a.name)
    const nameB = normalize(b.name)
    return nameA.localeCompare(nameB)
  }

  static getAnIdForGm () {
    const keepers = game.users.filter(u => u.active && u.isGM && u.id !== game.user.id)
    switch (keepers.length) {
      case 0:
        ui.notifications.error('CoC7.ErrorMissingKeeperUser', { localize: true })
        return false
      case 1:
        return keepers[0].id
    }
    return keepers[Math.floor(Math.random() * keepers.length)].id
  }

  static halfDB (db) {
    db = ((db ?? '').toString().trim() === '' ? 0 : db).toString().trim()
    const roll = new Roll(db)
    for (const term of roll.terms) {
      if (foundry.utils.isNewerVersion(game.version, '12') && term instanceof foundry.dice.terms.Die) {
        term._faces = Math.floor(term._faces / 2)
      } else if (term instanceof foundry.dice.terms.Die) {
        // FoundryVTT V11
        term.faces = Math.floor(term.faces / 2)
      } else if (term instanceof foundry.dice.terms.NumericTerm) {
        term.number = (term.number < 0 ? Math.ceil(term.number / 2) : Math.floor(term.number / 2))
      }
    }
    let formula = roll.formula.toString().trim()
    if (!formula.startsWith('-')) {
      formula = '+' + formula
    }
    return formula
  }
}
