/* global canvas, ChatMessage, CONST, foundry, fromUuid, game, Ray, Token, ui */
import { CoC7Check } from '../check.js'
import { CoC7Utilities } from '../utilities.js'

/**
 * Return <a> element of a roll instance. foundry.js ref:TextEditor._createInlineRoll
 * @param {Roll} roll      The roll object
 */
export function createInlineRoll (roll) {
  const data = {
    cls: ['inline-roll'],
    dataset: {}
  }

  try {
    data.cls.push('inline-result')
    data.result = roll.total
    data.title = roll.formula
    data.dataset.roll = escape(JSON.stringify(roll))
  } catch (err) {
    return null
  }

  // Construct and return the formed link element
  const a = document.createElement('a')
  a.classList.add(...data.cls)
  a.title = data.title
  for (const [k, v] of Object.entries(data.dataset)) {
    a.dataset[k] = v
  }
  a.innerHTML = `<i class="fas fa-dice-d20"></i> ${data.result}`
  return a
}

/**
 * Return true is CTRL key is pressed
 * Used for MAC compat.
 * @param {S.Event} event
 * @returns
 */
export function isCtrlKey (event) {
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

export class chatHelper {
  static hyphenToCamelCase (string) {
    return string.replace(/-([a-z])/g, function (string) {
      return string[1].toUpperCase()
    })
  }

  static async createMessage (title, message, options = {}) {
    const messageData = {}
    messageData.flavor = title
    messageData.speaker = options.speaker || ChatMessage.getSpeaker()
    if (options.whisper) {
      messageData.type = CONST.CHAT_MESSAGE_TYPES.WHISPER
      messageData.whisper = options.whisper
    }
    if (typeof options.roll !== 'undefined') {
      messageData.roll = options.roll
      messageData.type = CONST.CHAT_MESSAGE_TYPES.ROLL
      messageData.rollMode = CONST.DICE_ROLL_MODES.SELF
    }
    messageData.user = game.user.id
    messageData.content = message

    ChatMessage.create(messageData).then(msg => {
      return msg
    })
  }

  static camelCaseToHyphen (string) {
    return string.replace(/([A-Z])/g, function (string) {
      return '-' + string.toLowerCase()
    })
  }

  static getActorFromKey (key) {
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
      const token = chatHelper.getTokenFromKey(key)
      return token?.actor
    }

    // Case 2 - use Actor ID directory
    return game.actors.get(key) || null
  }

  static getSpeakerFromKey (actorKey) {
    const speaker = {}
    const actor = chatHelper.getActorFromKey(actorKey) // REFACTORING (2)
    if (actorKey.includes('.')) {
      const [sceneId, tokenId] = actorKey.split('.') // REFACTORING (2)
      speaker.token = tokenId
      speaker.scene = sceneId
      if (actor.token?.name) speaker.alias = actor.token.name
      speaker.actor = actor.id
    } else {
      speaker.actor = actorKey
      speaker.alias = actor.name
    }
    return speaker
  }

  static attachObjectToElement (object, element, objectName = '') {
    for (const prop of Object.keys(object)) {
      if (!prop.startsWith('_')) {
        if (typeof object[prop] === 'object') {
          chatHelper.attachObjectToElement(
            object[prop],
            element,
            `${objectName}:${prop}:`
          )
        } else {
          element.dataset[`${objectName}${prop}`] = object[prop]
        }
      }
    }
  }

  static getObjectFromElement (object, element) {
    function deserialize (obj, key, value) {
      if (key.startsWith(':')) {
        const s = key.slice(1)
        const objProp = s.slice(s.indexOf(':') + 1)
        const objName = s.substring(0, s.indexOf(':'))
        if (typeof obj[objName] === 'undefined') obj[objName] = {}
        deserialize(obj[objName], objProp, value)
      } else {
        if (value === 'true') obj[key] = true
        else if (value === 'false') obj[key] = false
        else if (Number(value).toString() === value) obj[key] = Number(value)
        else obj[key] = value
      }
    }

    if (!element || !object) return
    for (const prop of Object.keys(element.dataset)) {
      if (prop === 'template') return
      deserialize(object, prop, element.dataset[prop])
    }
  }

  static getTokenFromKey (key) {
    if (!key) return null
    if (key.includes('.')) {
      const [sceneId, tokenId] = key.split('.')
      if (sceneId === 'TOKEN') {
        const tokenDoc = game.actors.tokens[tokenId]?.token
        return tokenDoc.object // REFACTORING (2)
      } else {
        const scene = game.scenes.get(sceneId)
        if (!scene) return null
        const tokenData = scene.getEmbeddedDocument('Token', tokenId)
        if (!tokenData) return null
        const token = new Token(tokenData)
        if (!token.scene) token.scene = foundry.utils.duplicate(scene.document)
        return token
      }
    } else {
      const actor = game.actors.get(key)
      return chatHelper.getActorToken(actor)
    }
  }

  static getActorToken (actor) {
    if (!actor) return null
    return actor.token || actor.prototypeToken
    /*******************/
    // // Case 0 - Actor is a token (synthetic actor), return that token.
    // if(actor.isToken) return actor.token;
    // else{
    //  // Case 1 - Actor is not a token, find if a token exist for that actor.
    //  const actorTokens = actor.getActiveTokens();
    //  if( actorTokens.length){
    //    // Case 1.1 - If he has only one Token return it.
    //    if( 1 === actorTokens.length) return actorTokens[0];

    //    // Case 1.2 - Actor has multiple tokens, find if one of them is the controlled token.
    //    const controlledTokens = actorTokens.filter( t => t._controlled);
    //    if( controlledTokens.length){
    //      // Return the 1st controlled token, rise a warning if he has multiple controlled tokens.
    //      if( verbose && controlledTokens.length > 1) ui.notifications.warn( `Actor ${actor.name} has ${controlledTokens.length} controlled tokens. Using the first found`);
    //      return controlledTokens[0];
    //    }

    //    // Case 1.3 actor doesn't have any active token. Return the first valid token for that actor and raise a warning.
    //    if( verbose) ui.notifications.warn( `Actor ${actor.name} doesn't have any controlled token. Using first token found.`);
    //    return actorTokens[0];
    //  }

    //  if( verbose) ui.notifications.error( `Could not fin any token for ${actor.name}.`);
    //  return null;
    // }
  }

  static getActorImgFromKey (actorKey) {
    if (!actorKey) return null
    if (game.settings.get('CoC7', 'useToken')) {
      // Try to find a token.
      const token = chatHelper.getTokenFromKey(actorKey)
      if (token) {
        if ((token.document || token).texture.src) {
          if ((token.document || token).texture.src.indexOf('*') === -1) {
            return (token.document || token).texture.src
          }
        }
      }
    }
    const actor = chatHelper.getActorFromKey(actorKey) // REFACTORING (2)
    if (game.settings.get('CoC7', 'useToken')) {
      // if no token found for that actor return the prototype token image.
      if (actor.prototypeToken) {
        if (actor.prototypeToken.texture.src) {
          if (actor.prototypeToken.texture.src?.indexOf('*') === -1) {
            return actor.prototypeToken.texture.src
          }
        }
      }
    }
    return actor.img
  }

  static getDistance (startToken, endToken) {
    // startToken.updateSource();
    // canvas.sight.initializeTokens();
    if (
      typeof endToken.center === 'undefined' &&
      typeof endToken.id !== 'undefined'
    ) {
      if (startToken.scene?.id || false) {
        const scene = game.scenes.get(startToken.scene.id)
        if (typeof scene?.tokens !== 'undefined') {
          const tokens = scene?.tokens
            .filter(token => token.actor.id === endToken.data.document.id)
            .map(token => token.object)
          if (tokens.length === 1) {
            endToken = tokens[0]
          }
        }
      }
    }
    let distance = {
      gridUnit: 0,
      value: 0,
      unit: canvas.scene.grid.units
    }
    if (
      typeof startToken !== 'undefined' &&
      typeof startToken.center !== 'undefined' &&
      typeof endToken !== 'undefined' &&
      typeof endToken.center !== 'undefined'
    ) {
      const ray = new Ray(startToken.center, endToken.center)
      const segment = [{ ray }]
      distance = {
        gridUnit: ray.distance / canvas.scene.grid.size,
        value: canvas.grid.measureDistances(segment, {
          gridSpaces: game.settings.get('CoC7', 'gridSpaces')
        })[0],
        unit: canvas.scene.grid.units
      }
      if (game.settings.get('CoC7', 'distanceElevation')) {
        const elevation = Math.abs(
          (startToken.document.elevation || 0) - (endToken.document.elevation || 0)
        )
        distance.value = Math.sqrt(
          distance.value * distance.value + elevation * elevation
        )
      }
    } else if (!game.settings.get('CoC7', 'distanceTheatreOfTheMind')) {
      ui.notifications.warn(
        game.i18n.localize('CoC7.MessageDistanceCalculationFailure')
      )
    }
    return distance
  }

  static toYards (distance) {
    switch (distance.unit) {
      case 'ft':
        return distance.value / 3

      case 'yd':
        return distance.value

      case 'm':
        return distance.value

      default:
        return distance.value
    }
  }
}

export class CoC7Roll {
  static getFromCard (card) {
    const rollDiv = card.querySelector('div.dice-roll')
    if (!rollDiv) return null

    const roll = new CoC7Roll()
    chatHelper.getObjectFromElement(roll, rollDiv)

    return roll
  }

  get resultType () {
    this.successLevel = parseInt(this.successLevel)
    switch (this.successLevel) {
      case CoC7Check.successLevel.regular:
        return game.i18n.format('CoC7.RegularSuccess')
      case CoC7Check.successLevel.hard:
        return game.i18n.format('CoC7.HardSuccess')
      case CoC7Check.successLevel.extreme:
        return game.i18n.format('CoC7.ExtremeSuccess')
      case CoC7Check.successLevel.critical:
        return game.i18n.format('CoC7.CriticalSuccess')
      case CoC7Check.successLevel.fumble:
        return game.i18n.format('CoC7.Fumble')
      case CoC7Check.successLevel.failure:
        return game.i18n.format('CoC7.Failure')

      default:
        return null
    }
  }

  get actor () {
    if (this.actorKey) return chatHelper.getActorFromKey(this.actorKey) // REFACTORING (2)
    return null
  }

  get item () {
    if (this.itemId && this.actor) return this.actor.items.get(this.itemId)
    return null
  }

  get skill () {
    if (this.skillId && this.actor) return this.actor.items.get(this.skillId)
    return null
  }

  showDiceRoll () {
    if (game.modules.get('dice-so-nice')?.active) {
      const diceResults = []
      for (const dieResult of this.dices.tens) {
        diceResults.push(dieResult.value === 100 ? 0 : dieResult.value / 10)
      }
      diceResults.push(this.dices.unit.value)

      const diceData = {
        formula: `${this.dices.tens.length}d100+1d10`,
        results: diceResults,
        whisper: null,
        blind: false
      }
      game.dice3d.show(diceData)
    }
  }

  static getFromElement (element, object = null) {
    if (!element) return
    const roll = object || new CoC7Roll()
    chatHelper.getObjectFromElement(roll, element)
    roll.dices = {
      tens: [],
      unit: {}
    }
    chatHelper.getObjectFromElement(
      roll.dices,
      element.querySelector('.dice-result')
    )
    roll.dices.hasBonus = roll.diceModifier !== 0
    roll.dices.bonus = Math.abs(roll.diceModifier)
    roll.dices.bonusType =
      roll.diceModifier < 0
        ? game.i18n.format('CoC7.DiceModifierPenalty')
        : game.i18n.format('CoC7.DiceModifierBonus')
    const tenDice = element.querySelector('.ten-dice')
    if (tenDice) {
      for (const d of tenDice.querySelectorAll('li')) {
        const die = {
          selected: false,
          isMax: false,
          isMin: false,
          value: -1
        }
        chatHelper.getObjectFromElement(die, d)
        roll.dices.tens.push(die)
      }
    }
    const unitDie = element.querySelector('.unit-die')
      ? element.querySelector('.unit-die').querySelector('li')
      : null
    roll.dices.unit.value = unitDie ? parseInt(unitDie.dataset.value) : null

    roll.increaseSuccess = []
    const increaseSuccess = element.querySelector('.increase-success')
    if (increaseSuccess && increaseSuccess.querySelectorAll('button')) {
      for (const isl of increaseSuccess.querySelectorAll('button')) {
        const newSuccesLevel = {}
        chatHelper.getObjectFromElement(newSuccesLevel, isl)
        roll.increaseSuccess.push(newSuccesLevel)
      }
    }

    if (roll.luckNeeded) {
      roll.luckNeededTxt = game.i18n.format('CoC7.SpendLuck', {
        luckNeededValue: roll.luckNeeded
      })
    }
    if (!object) return roll
  }

  static getFromCheck (check) {
    const roll = new CoC7Roll()

    roll.rollType = check.rollType
    roll.side = check.side
    roll.action = check.action
    roll.refMessageId = check.refMessageId
    roll.referenceMessageId = check.referenceMessageId

    roll.successLevel = check.successLevel
    roll.difficulty = check.difficulty
    roll.skillId = check.skill ? check.skill.id : null
    roll.itemId = check.item ? check.item.id : null
    roll.diceMod = check.diceModifier
    roll.value = parseInt(check.rawValue)
    roll.fumble = check.isFumble
    roll.critical = check.isCritical
    roll.characteristic = check.characteristic ? check.characteristic : null
    roll.result = check.dice.total

    roll.actorKey = check.actor.tokenKey // REFACTORING (2)

    if (check.actor.isToken) {
      roll.tokenId = check.actor.tokenKey // REFACTORING (2)
      roll.actorId = null
    } else {
      roll.tokenKey = null
      roll.actorId = check.actor.tokenKey // REFACTORING (2)
    }

    return roll
  }

  static attachCheckToElement (htmlElement, check) {
    const roll = CoC7Roll.getFromCheck(check)
    roll.attachToElement(htmlElement)

    return roll
  }

  attachToElement (htmlElement) {
    chatHelper.attachObjectToElement(this, htmlElement)
  }
}

export class CoC7Damage {
  static getMainDie (damageString) {
    if (damageString.toLowerCase().includes('d20')) return 'd20'
    if (damageString.toLowerCase().includes('d12')) return 'd12'
    if (damageString.toLowerCase().includes('d10')) return 'd10'
    if (damageString.toLowerCase().includes('d8')) return 'd8'
    if (damageString.toLowerCase().includes('d4')) return 'd4'
    return 'd6'
  }

  static getFromElement (element, object = null) {
    if (!element) return
    const damage = object || {}
    chatHelper.getObjectFromElement(damage, element)
    const rolls = element.querySelector('.dice-rolls').querySelectorAll('li')
    damage.rolls = []
    for (const r of rolls) {
      const roll = {}
      chatHelper.getObjectFromElement(roll, r)
      const group = roll.group
      const dice = {
        faces: roll.faces,
        result: roll.result
      }
      delete roll.group
      delete roll.faces
      delete roll.result
      if (typeof damage.rolls[group] === 'undefined') {
        roll.dice = []
        damage.rolls.push(roll)
      }
      damage.rolls[group].dice.push(dice)
    }
    if (!object) return damage
  }
}
