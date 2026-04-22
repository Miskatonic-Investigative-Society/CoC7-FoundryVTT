/* global ChatMessage foundry fromUuid game renderTemplate TokenDocument ui */
// cSpell:words combinedall combinedany
import { FOLDER_ID } from '../constants.js'
import CoC7ActorPickerDialog from './actor-picker-dialog.js'
import CoC7DicePool from './dice-pool.js'
import CoC7SystemSocket from './system-socket.js'
import CoC7Utilities from './utilities.js'

export default class CoC7ChatCombinedMessage {
  #actorRolls
  #cardOpen
  #combinedFixed
  #combinedType
  #isCombat

  /**
   * Constructor
   */
  constructor () {
    this.#actorRolls = {}
    this.#cardOpen = true
    this.#combinedFixed = false
    this.#combinedType = CoC7ChatCombinedMessage.combinedType.none
    this.#isCombat = false
    // this.message = undefined
  }

  /**
   * Combined Type
   * @returns {object}
   */
  static get combinedType () {
    return {
      all: 'all',
      any: 'any',
      none: ''
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
          element.addEventListener('click', event => CoC7ChatCombinedMessage._onClickEvent(event, message))
        }
      })
    }
  }

  /**
   * Create combined message
   * @param {object} options
   * @param {string|null} options.defaultActor
   * @param {bool} options.isCombat
   * @param {object} options.rollRequisites
   * @param {string} options.type
   */
  static async createGroupMessage (options) {
    const config = {
      actorRolls: {},
      combinedFixed: false,
      combinedType: (options.type === 'combinedall' ? CoC7ChatCombinedMessage.combinedType.all : (options.type === 'combinedany' ? CoC7ChatCombinedMessage.combinedType.any : CoC7ChatCombinedMessage.combinedType.none)),
      isCombat: options.isCombat
    }
    config.combinedFixed = (config.combinedType !== CoC7ChatCombinedMessage.combinedType.none)

    let defaultUuid = options.defaultActor ?? ''
    for (const offset in options.rollRequisites) {
      const parsedRoll = await CoC7ChatCombinedMessage.parseRolls({ roll: options.rollRequisites[offset], quick: true, defaultUuid })
      if (!parsedRoll) {
        ui.notifications.warn('CoC7.Errors.UnparsableRoll', { localize: true })
        return
      }
      if (defaultUuid === '' || defaultUuid === parsedRoll.actorUuid) {
        defaultUuid = parsedRoll.actorUuid
      } else {
        ui.notifications.error('CoC7.ErrorCombinedRollsRequireSingleActor', { localize: true })
        return
      }
      if (typeof config.actorRolls[parsedRoll.actorUuid] === 'undefined') {
        parsedRoll.rolls = [parsedRoll.roll]
        delete parsedRoll.roll
        config.actorRolls[parsedRoll.actorUuid] = parsedRoll
        delete config.actorRolls[parsedRoll.actorUuid].actorUuid
      } else {
        config.actorRolls[parsedRoll.actorUuid].rolls.push(parsedRoll.roll)
      }
    }
    if (game.user.isGM) {
      CoC7ChatCombinedMessage.newGroupMessage(config)
    } else {
      CoC7SystemSocket.requestKeeperAction({
        type: 'chatCombinedMessageNew',
        config
      })
    }
  }

  /**
   * Get actor from string
   * @param {string} identifier
   * @returns {null|Document}
   */
  static async getActor (identifier) {
    if (identifier.match(/^a\./)) {
      return ((await game.CoC7.cocid.fromCoCID(identifier))?.[0]) ?? null
    }
    if (identifier.indexOf('.') > -1) {
      return await fromUuid(identifier)
    }
    return game.actors.get(identifier) ?? null
  }

  /**
   * Join combined message (or create if not found)
   * @param {object} options
   * @param {object} options.rollRequisites
   * @param {bool} options.isCombat
   */
  static async joinGroupMessage (options) {
    if (game.user.isGM) {
      const groups = {}
      for (const offset in options.rollRequisites) {
        const parsedRoll = await CoC7ChatCombinedMessage.parseRolls({ roll: options.rollRequisites[offset], quick: true })
        if (!parsedRoll) {
          ui.notifications.warn('CoC7.Errors.UnparsableRoll', { localize: true })
          return
        }
        const actorUuid = parsedRoll.actorUuid
        delete parsedRoll.actorUuid
        if (typeof groups[actorUuid] === 'undefined') {
          groups[actorUuid] = {
            parsedRolls: [],
            rollRequisites: []
          }
        }
        groups[actorUuid].parsedRolls.push(parsedRoll)
        groups[actorUuid].rollRequisites.push(options.rollRequisites[offset])
      }
      for (const actorUuid in groups) {
        let messages = ui.chat.collection.filter(message => message.flags.CoC7?.load?.as === 'CoC7ChatCombinedMessage' && message.flags.CoC7?.load?.cardOpen === true && message.flags.CoC7?.load?.actorUuids.every(k => k === actorUuid))
        if (messages.length) {
          // Old messages can't be used if message is more than a day old
          const timestamp = new Date(messages[messages.length - 1].timestamp)
          const now = new Date()
          const timeDiffSec = (now - timestamp) / 1000
          if (24 * 60 * 60 < timeDiffSec) {
            const check = await CoC7ChatCombinedMessage.loadFromMessage(messages[messages.length - 1])
            if (check) {
              check.#cardOpen = false
              check.updateMessage()
            }
            messages = []
          }
        }
        if (messages.length) {
          const check = await CoC7ChatCombinedMessage.loadFromMessage(messages[messages.length - 1])
          if (check) {
            if (!check.#actorRolls[actorUuid].dicePool.isRolled) {
              for (const parsedRoll of groups[actorUuid].parsedRolls) {
                parsedRoll.rolls = [parsedRoll.roll]
                if (!await check.addActorRoll(actorUuid, parsedRoll)) {
                  return
                }
              }
              check.updateMessage()
            } else {
              console.log('Attempting to add to a started roll')
            }
          }
        } else {
          CoC7ChatCombinedMessage.createGroupMessage(options)
        }
      }
    } else {
      CoC7SystemSocket.requestKeeperAction({
        type: 'chatCombinedMessageJoin',
        options
      })
    }
  }

  /**
   * Create CoC7ChatCombinedMessage from message
   * @param {Document} message
   * @param {boolean} isMigratingMessage
   * @returns {CoC7ChatCombinedMessage}
   */
  static async loadFromMessage (message, isMigratingMessage = false) {
    const keys = [
      'actorRolls',
      'cardOpen',
      'combinedFixed',
      'combinedType',
      'isCombat'
    ]
    if (message.id && message.flags[FOLDER_ID]?.load?.as === 'CoC7ChatCombinedMessage' && keys.every(k => typeof message.flags[FOLDER_ID]?.load?.[k] !== 'undefined')) {
      const check = new CoC7ChatCombinedMessage()
      check.message = message
      const load = foundry.utils.duplicate(message.flags[FOLDER_ID].load)
      check.#actorRolls = Object.keys(load.actorRolls).reduce((c, k) => { c[k.replace(/\//g, '.')] = load.actorRolls[k]; return c }, {})
      check.#cardOpen = load.cardOpen
      check.#combinedType = load.combinedType
      check.#combinedFixed = load.combinedFixed
      check.#isCombat = load.isCombat
      for (const actorUuid in check.#actorRolls) {
        const actor = await fromUuid(actorUuid)
        if (actor || isMigratingMessage) {
          check.#actorRolls[actorUuid].dicePool = CoC7DicePool.fromObject(check.#actorRolls[actorUuid].dicePool)
          check.#actorRolls[actorUuid].playerOwnersOnline = game.users.filter(u => !u.isGM && u.active && actor?.canUserModify(u, 'update')).map(u => { return u.uuid })
        } else {
          ui.notifications.warn('CoC7.Errors.UnparsableActor', { localize: true })
          return false
        }
      }
      return check
    }
    ui.notifications.warn('CoC7.Errors.UnableToLoadMessage', { localize: true })
    throw new Error('CoC7.Errors.UnableToLoadMessage')
  }

  /**
   * Step 1: Get an isGM user to create the message
   * @param {object} config
   * @param {object} config.actorRolls
   * @param {bool} config.combinedFixed
   * @param {string} config.combinedType
   * @param {bool} config.isCombat
   */
  static async newGroupMessage (config) {
    if (['actorRolls', 'combinedFixed', 'combinedType', 'isCombat'].every(k => typeof config[k] !== 'undefined')) {
      const check = new CoC7ChatCombinedMessage()
      check.#actorRolls = {}
      check.#cardOpen = true
      check.#combinedFixed = config.combinedFixed
      check.#combinedType = config.combinedType
      check.#isCombat = config.isCombat
      for (const actorUuid in config.actorRolls) {
        if (!await check.addActorRoll(actorUuid, config.actorRolls[actorUuid])) {
          return
        }
      }
      const chatData = await check.getChatData()
      await ChatMessage.create(chatData)
      return
    }
    ui.notifications.warn('CoC7.Errors.UnableToLoadMessage', { localize: true })
    throw new Error('CoC7.Errors.UnableToLoadMessage')
  }

  /**
   * Click Event on dice roll
   * @param {ClickEvent} event
   * @param {Document} message
   */
  static async _onClickEvent (event, message) {
    switch (event.currentTarget.dataset.action) {
      case 'bonus':
        {
          const quantity = event.currentTarget.dataset.quantity
          const actorRollOffset = event.currentTarget.dataset.actorRollOffset
          if (quantity && typeof actorRollOffset !== 'undefined') {
            const check = await CoC7ChatCombinedMessage.loadFromMessage(message)
            try {
              const actorUuid = Object.keys(check.#actorRolls)[0] ?? ''
              if (typeof check.#actorRolls[actorUuid].rolls[actorRollOffset] !== 'undefined') {
                if (await check.#actorRolls[actorUuid].dicePool.addDiceToPool(quantity)) {
                  check.#actorRolls[actorUuid].rolls[actorRollOffset].poolModifier = check.#actorRolls[actorUuid].dicePool.poolModifier
                  check.updateMessage()
                }
              } else {
                ui.notifications.warn('CoC7.Errors.UnparsableActor', { localize: true })
              }
            } catch (err) {
              ui.notifications.warn(err.message)
            }
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
          }
        }
        break
      case 'luck':
        {
          const luckSpend = event.currentTarget?.dataset?.luckSpend
          if (luckSpend) {
            const check = await CoC7ChatCombinedMessage.loadFromMessage(message)
            if (check) {
              const actorUuid = Object.keys(check.#actorRolls)[0] ?? ''
              if (actorUuid && !check.#actorRolls[actorUuid].dicePool.isPushed) {
                const actor = await fromUuid(actorUuid)
                if (actor) {
                  if (await check.#actorRolls[actorUuid].dicePool.addLuck(actor, parseInt(luckSpend, 10))) {
                    check.updateMessage()
                  }
                }
              }
            }
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
          }
        }
        break
      case 'push':
        {
          const check = await CoC7ChatCombinedMessage.loadFromMessage(message)
          const actorUuid = Object.keys(check.#actorRolls)[0] ?? ''
          document.querySelector('li.chat-message.message[data-message-id="' + message.id + '"] .expanded').classList.remove('expanded')
          await check.#actorRolls[actorUuid].dicePool.pushRoll()
          check.updateMessage()
        }
        break
      case 'removeRoll':
        {
          const check = await CoC7ChatCombinedMessage.loadFromMessage(message)
          const actorUuid = event.currentTarget.dataset.actorUuid
          const actorRollOffset = event.currentTarget.dataset.actorRollOffset
          if (check && actorUuid && typeof actorRollOffset !== 'undefined' && typeof check.#actorRolls[actorUuid] !== 'undefined' && typeof check.#actorRolls[actorUuid].rolls[actorRollOffset] !== 'undefined') {
            if (check.#actorRolls[actorUuid].rolls.length > 1) {
              check.#actorRolls[actorUuid].rolls.splice(actorRollOffset, 1)
              check.updateMessage()
            } else {
              message.delete()
            }
          }
        }
        break
      case 'rollActor':
        {
          const check = await CoC7ChatCombinedMessage.loadFromMessage(message)
          const actorUuid = event.currentTarget.dataset.actorUuid
          if (check && actorUuid) {
            await check.rollForActor(actorUuid)
            check.updateMessage()
          }
        }
        break
      case 'setValue':
        {
          const check = await CoC7ChatCombinedMessage.loadFromMessage(message)
          const set = event.currentTarget.dataset.set
          const value = event.currentTarget.dataset.value
          if (check && set && value) {
            switch (set) {
              case 'combinedType':
                check.#combinedType = value
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
      case 'toggleValue':
        {
          const check = await CoC7ChatCombinedMessage.loadFromMessage(message)
          const set = event.currentTarget.dataset.set
          if (check && set) {
            switch (set) {
              case 'cardOpen':
                check.#cardOpen = !check.#cardOpen
                if (game.settings.get(FOLDER_ID, 'xpEnabled')) {
                  const templateData = await check.getTemplateData()
                  for (const actorUuid in templateData.rollActors) {
                    for (const roll of templateData.rollActors[actorUuid].rolls) {
                      if (roll.isRolledSuccess && roll.type === 'skill') {
                        const item = await fromUuid(roll.key)
                        if (item) {
                          await item.update({ 'system.flags.developement': true })
                        }
                      }
                    }
                  }
                }
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
   * Parse roll string into data
   * @param {object} options
   * @param {string} options.roll
   * @param {bool} options.quick
   * @param {string} options.defaultUuid
   * @returns {null|object}
   */
  static async parseRolls ({ roll, quick = true, defaultUuid = '' }) {
    const match = roll.match(/^(?<actor>[^#]+#)?(?<type>attribute|characteristic|item|skill)#(?<key>[^#]+)(#(?<modifiers>.*))?$/)
    if (match) {
      const modifiers = (match.groups.modifiers ?? '').toLowerCase().split('#')
      const poolModifier = parseInt(modifiers.find(m => m.match(/^[+-]\d+$/)) ?? 0, 10)
      const difficulty = modifiers.find(m => m.match(/^\d+$/))
      const pushing = modifiers.filter(m => m === 'p').length > 0
      if (!match.groups.actor && defaultUuid && defaultUuid !== '') {
        match.groups.actor = defaultUuid + '#'
      }
      const parsedRoll = {
        actorUuid: 'x',
        build: 0,
        name: '-',
        playerOwnersOnline: [],
        portrait: '',
        roll: {
          difficulty: ((difficulty ?? '').toString() === '0' ? CoC7DicePool.difficultyLevel.unknown : (difficulty ? parseInt(difficulty, 10) : (game.settings.get(FOLDER_ID, 'defaultCheckDifficulty') === 'unknown' ? CoC7DicePool.difficultyLevel.unknown : CoC7DicePool.difficultyLevel.regular))),
          flatDiceModifier: 0,
          flatThresholdModifier: 0,
          fullName: '-',
          key: match.groups.key,
          poolModifier,
          isPushable: true,
          pushing,
          shortName: '-',
          tags: [],
          threshold: 0,
          type: match.groups.type
        }
      }
      let actor
      if (match.groups.actor) {
        actor = await CoC7ChatCombinedMessage.getActor(match.groups.actor.substring(0, match.groups.actor.length - 1))
        if (!actor) {
          return null
        }
        parsedRoll.actorUuid = actor.uuid
        parsedRoll.playerOwnersOnline = game.users.filter(u => !u.isGM && u.active && actor.canUserModify(u, 'update')).map(u => { return u.uuid })
      } else {
        parsedRoll.actorUuid = await CoC7ActorPickerDialog.create()
        if (!parsedRoll.actorUuid) {
          ui.notifications.warn('CoC7.WarnNoControlledActor', { localize: true })
          return null
        }
        actor = await fromUuid(parsedRoll.actorUuid)
        if (!actor) {
          return null
        }
        if (!game.user.isGM) {
          parsedRoll.playerOwnersOnline = [game.user.id]
        } else {
          parsedRoll.playerOwnersOnline = game.users.filter(u => !u.isGM && u.active && actor.canUserModify(u, 'update')).map(u => { return u.uuid })
        }
      }
      return parsedRoll
    }
    return null
  }

  /**
   * Get roll flavor text
   * @returns {string}
   */
  get flavor () {
    return game.i18n.localize('CoC7.CombinedRollCard') + (this.#combinedType === CoC7ChatCombinedMessage.combinedType.any ? ' (' + game.i18n.localize('CoC7.Any') + ')' : (this.#combinedType === CoC7ChatCombinedMessage.combinedType.all ? ' (' + game.i18n.localize('CoC7.All') + ')' : ''))
  }

  /**
   * Set roll to actorUuid to roll data
   * @param {string} actorUuid
   * @param {object} data
   * @returns {boolean}
   */
  async addActorRoll (actorUuid, data) {
    const actor = await fromUuid(actorUuid)
    if (actor) {
      if (typeof this.#actorRolls[actorUuid] === 'undefined') {
        this.#actorRolls[actorUuid] = foundry.utils.duplicate(data)
        this.#actorRolls[actorUuid].rolls = []
        this.#actorRolls[actorUuid].dicePool = CoC7DicePool.newPool({ })
      }
      this.#actorRolls[actorUuid].portrait = (actor instanceof TokenDocument ? actor.texture.src : actor.portrait)
      this.#actorRolls[actorUuid].build = actor.system.attribs.build.value ?? 0
      this.#actorRolls[actorUuid].name = actor.name
      for (const roll of data.rolls) {
        roll.fullName = '-'
        roll.shortName = '-'
        roll.tags = []
        roll.threshold = 0
        roll.isPushable = false
        switch (roll.type) {
          case 'characteristic':
            roll.shortName = CoC7Utilities.getCharacteristicNames(roll.key)?.short ?? '-'
            if (roll.shortName === '-') {
              ui.notifications.warn('CoC7.Errors.UnknownCharacteristic', { localize: true })
              return false
            }
            roll.fullName = CoC7Utilities.getCharacteristicNames(roll.key)?.label ?? '-'
            roll.tags.push(roll.shortName)
            roll.threshold = actor.system?.characteristics[roll.key]?.value ?? 1
            break
          case 'attribute':
            if (['lck', 'san'].includes(roll.key)) {
              roll.shortName = CoC7Utilities.getAttributeNames(roll.key)?.short ?? '-'
              if (roll.shortName === '-') {
                ui.notifications.warn('CoC7.Errors.UnknownAttribute', { localize: true })
                return false
              }
              roll.fullName = CoC7Utilities.getAttributeNames(roll.key)?.label ?? '-'
              roll.tags.push(roll.shortName)
              roll.threshold = actor.system?.attribs[roll.key]?.value ?? 1
            } else {
              ui.notifications.warn('CoC7.Errors.IncorrectAttribute', { localize: true })
              return false
            }
            break
          case 'skill':
            {
              const skill = await actor.getItemOrAdd(roll.key, 'skill')
              if (skill?.type === 'skill') {
                roll.shortName = skill.name
                roll.tags.push(roll.shortName)
                roll.threshold = skill.system.value
                roll.isPushable = !this.#isCombat && (skill.system.properties?.push ?? false)
              } else {
                ui.notifications.warn('CoC7.Errors.UnknownSkill', { localize: true })
                return false
              }
            }
            break
          case 'item':
            {
              const item = await actor.getItemOrAdd(roll.key, 'weapon')
              if (item?.type === 'weapon') {
                roll.shortName = item.name
                roll.tags.push(roll.shortName)
                const skillId = item.system.skill[item.system.usesAlternativeSkill ? 'alternativ' : 'main']?.id
                if (skillId) {
                  const skill = actor.items.find(d => d.id === skillId)
                  roll.tags.push(skill.name)
                  roll.threshold = skill.system.value
                  roll.isPushable = !this.#isCombat && (skill.system.properties?.push ?? false)
                } else {
                  ui.notifications.warn('CoC7.Errors.UnknownSkill', { localize: true })
                  return false
                }
              } else {
                ui.notifications.warn('CoC7.Errors.UnknownWeapon', { localize: true })
                return false
              }
            }
            break
        }
        if (roll.poolModifier < 0) {
          roll.tags.push(Math.abs(roll.poolModifier) + ' ' + game.i18n.localize('CoC7.DiceModifierPenalty'))
        } else if (roll.poolModifier > 0) {
          roll.tags.push(roll.poolModifier + ' ' + game.i18n.localize('CoC7.DiceModifierBonus'))
        }
        switch (roll.difficulty) {
          case CoC7DicePool.difficultyLevel.regular:
            roll.tags.push(game.i18n.localize('CoC7.RollDifficultyRegularTitle'))
            break
          case CoC7DicePool.difficultyLevel.hard:
            roll.tags.push(game.i18n.localize('CoC7.RollDifficultyHardTitle'))
            break
          case CoC7DicePool.difficultyLevel.extreme:
            roll.tags.push(game.i18n.localize('CoC7.RollDifficultyExtremeTitle'))
            break
          case CoC7DicePool.difficultyLevel.critical:
            roll.tags.push(game.i18n.localize('CoC7.RollDifficultyCriticalTitle'))
            break
        }
        if (roll.pushing) {
          roll.tags.push(game.i18n.localize('CoC7.Pushing'))
        }
        this.#actorRolls[actorUuid].rolls.push(roll)
      }
      return true
    }
    ui.notifications.warn('CoC7.Errors.UnparsableActor', { localize: true })
    return false
  }

  /**
   * Create Message Data object
   * @returns {object}
   */
  async getTemplateData () {
    const data = {
      actorUuid: Object.keys(this.#actorRolls)[0] ?? '',
      allRollsComplete: true,
      cardOpen: this.#cardOpen,
      combinedFailure: false,
      combinedFixed: this.#combinedFixed,
      combinedSuccess: false,
      combinedType: this.#combinedType,
      combinedTypes: CoC7ChatCombinedMessage.combinedType,
      displayResultType: game.settings.get(FOLDER_ID, 'displayResultType'),
      displayCheckSuccessLevel: game.settings.get(FOLDER_ID, 'displayCheckSuccessLevel'),
      foundryGeneration: game.release.generation,
      rollActors: {},
      stillToRoll: false
    }
    const successes = []
    for (const actorUuid in this.#actorRolls) {
      let luckAvailable = 0
      if (data.actorUuid) {
        const actor = await fromUuid(data.actorUuid)
        luckAvailable = actor?.system.attribs.lck.value ?? 0
      }
      data.rollActors[actorUuid] = {
        portrait: this.#actorRolls[actorUuid].portrait,
        actorName: this.#actorRolls[actorUuid].name,
        rolls: []
      }
      const anyPushing = this.#actorRolls[actorUuid].rolls.reduce((c, r) => c || r.pushing || !r.isPushable, false)
      for (const roll of this.#actorRolls[actorUuid].rolls) {
        this.#actorRolls[actorUuid].dicePool.difficulty = roll.difficulty
        this.#actorRolls[actorUuid].dicePool.flatDiceModifier = roll.flatDiceModifier
        this.#actorRolls[actorUuid].dicePool.flatThresholdModifier = roll.flatThresholdModifier
        this.#actorRolls[actorUuid].dicePool.poolModifier = roll.poolModifier
        this.#actorRolls[actorUuid].dicePool.threshold = roll.threshold
        const diceGroup = foundry.utils.mergeObject(this.#actorRolls[actorUuid].dicePool.diceGroups.pop() ?? {}, roll, { inplace: false })
        diceGroup.isPushed = this.#actorRolls[actorUuid].dicePool.isPushed
        diceGroup.luckSpent = this.#actorRolls[actorUuid].dicePool.luckSpent
        diceGroup.flavor = game.i18n.format('CoC7.CheckResult', {
          name: (roll.fullName !== '-' ? roll.fullName : (roll.shortName ?? '')),
          value: roll.threshold,
          difficulty: CoC7DicePool.difficultyString(roll.difficulty)
        })
        diceGroup.bonusDice = Math.abs(roll.poolModifier)
        diceGroup.bonusType = game.i18n.localize(roll.poolModifier < 0 ? 'CoC7.DiceModifierPenalty' : 'CoC7.DiceModifierBonus')
        diceGroup.removable = true
        if (typeof diceGroup.isSuccess !== 'undefined') {
          successes.push(diceGroup.isSuccess)
          diceGroup.rolled = true
          diceGroup.removable = false
          const buttons = {}
          if (this.#cardOpen) {
            foundry.utils.mergeObject(buttons, this.#actorRolls[actorUuid].dicePool.availableButtons({ luckAvailable, isPushable: roll.isPushable && !anyPushing, key: roll.key }))
          }
          diceGroup.buttons = buttons
        } else {
          data.allRollsComplete = false
          data.stillToRoll = true
        }
        data.rollActors[actorUuid].rolls.push(diceGroup)
      }
    }
    if (data.allRollsComplete) {
      switch (data.combinedType) {
        case CoC7ChatCombinedMessage.combinedType.all:
          if (successes.every(b => b === true)) {
            data.combinedSuccess = true
          } else {
            data.combinedFailure = true
          }
          break
        case CoC7ChatCombinedMessage.combinedType.any:
          if (successes.some(b => b === true)) {
            data.combinedSuccess = true
          } else {
            data.combinedFailure = true
          }
          break
      }
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
            as: 'CoC7ChatCombinedMessage',
            actorRolls: Object.keys(this.#actorRolls).reduce((c, k) => {
              c[k.replace(/\./g, '/')] = Object.keys(this.#actorRolls[k]).reduce((c, k2) => {
                if (k2 === 'dicePool') {
                  c[k2] = this.#actorRolls[k][k2].toObject()
                } else if (k2 !== 'playerOwnersOnline') {
                  c[k2] = this.#actorRolls[k][k2]
                }
                return c
              }, {})
              return c
            }, {}),
            actorUuids: Object.keys(data.rollActors),
            cardOpen: this.#cardOpen,
            combinedFixed: this.#combinedFixed,
            combinedType: this.#combinedType,
            isCombat: this.#isCombat
          }
        }
      },
      rolls: (this.message?.rolls ?? []).concat(Object.keys(this.#actorRolls).reduce((c, k) => {
        c.concat(this.#actorRolls[k].dicePool.newRolls)
        return c
      }, [])),
      flavor: this.flavor,
      speaker: { alias: data.rollActors[data.actorUuid]?.actorName ?? '' },
      /* // FoundryVTT V12 */
      content: await (foundry.applications.handlebars?.renderTemplate ?? renderTemplate)('systems/' + FOLDER_ID + '/templates/chat/combined-roll.hbs', data)
    }

    return chatData
  }

  /**
   * Perform all rolls for Actor
   * @param {string} actorUuid
   */
  async rollForActor (actorUuid) {
    if (typeof this.#actorRolls[actorUuid] !== 'undefined') {
      const poolModifiers = [0]
      for (const roll of this.#actorRolls[actorUuid].rolls) {
        poolModifiers.push(roll.poolModifier)
      }
      this.#actorRolls[actorUuid].dicePool.poolModifierRange(Math.min(...poolModifiers), Math.max(...poolModifiers))
      await this.#actorRolls[actorUuid].dicePool.roll()
    }
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
        this.message.update(diff)
      }
    }
  }

  /**
   * Return an array of results
   * XXXX WIP
   * @returns {Array}
   */
  async publicResults () {
    return []
  }

  /**
   * Migrate older html from roll
   * @param {object} options
   * @param {integer} options.offset
   * @param {object} options.updates
   * @param {object} options.deleteIds
   */
  static async migrateOlderMessagesRoll ({ offset, updates, deleteIds } = {}) {
    const message = game.messages.contents[offset]
    const div = document.createElement('div')
    div.innerHTML = message.content
    const contents = div.children[0]
    if (contents) {
      let actorUuid = ''
      const dataSet = JSON.parse(decodeURIComponent(contents.dataset.object))
      const actorRolls = {}
      const actorDecaders = {}
      for (const roll of dataSet.rolls) {
        const uuid = CoC7Utilities.oldStyleToUuid(roll.actorKey)
        if (actorUuid === '') {
          actorUuid = uuid
        }
        const actor = await fromUuid(uuid)
        const uuidAsKey = uuid.replace(/\./g, '/')
        const currentRoll = {
          difficulty: roll._difficulty,
          flatDiceModifier: roll.flatDiceModifier,
          flatThresholdModifier: roll.flatThresholdModifier,
          fullName: '-',
          poolModifier: roll._diceModifier,
          isPushable: false,
          pushing: roll.pushing,
          shortName: '-',
          tags: [],
          threshold: roll._rawValue
        }
        if (typeof roll.characteristic === 'string') {
          currentRoll.type = 'characteristic'
          currentRoll.key = roll.characteristic
          currentRoll.shortName = CoC7Utilities.getCharacteristicNames(roll.characteristic)?.short ?? '-'
          currentRoll.fullName = CoC7Utilities.getCharacteristicNames(roll.characteristic)?.label ?? '-'
          currentRoll.tags.push(currentRoll.shortName)
        } else if (typeof roll.attribute === 'string') {
          currentRoll.type = 'attribute'
          currentRoll.key = roll.attribute
          currentRoll.shortName = CoC7Utilities.getAttributeNames(roll.attribute)?.short ?? '-'
          currentRoll.fullName = CoC7Utilities.getAttributeNames(roll.attribute)?.label ?? '-'
          currentRoll.tags.push(currentRoll.shortName)
        } else {
          currentRoll.type = 'skill'
          currentRoll.key = uuid + '.Item.' + roll.skillId
          const skill = await fromUuid(currentRoll.key)
          if (skill) {
            currentRoll.shortName = skill.name
            currentRoll.tags.push(currentRoll.shortName)
          }
        }
        if (currentRoll.poolModifier < 0) {
          currentRoll.tags.push(Math.abs(currentRoll.poolModifier) + ' ' + game.i18n.localize('CoC7.DiceModifierPenalty'))
        } else if (currentRoll.poolModifier > 0) {
          currentRoll.tags.push(currentRoll.poolModifier + ' ' + game.i18n.localize('CoC7.DiceModifierBonus'))
        }
        switch (currentRoll.difficulty) {
          case CoC7DicePool.difficultyLevel.regular:
            currentRoll.tags.push(game.i18n.localize('CoC7.RollDifficultyRegularTitle'))
            break
          case CoC7DicePool.difficultyLevel.hard:
            currentRoll.tags.push(game.i18n.localize('CoC7.RollDifficultyHardTitle'))
            break
          case CoC7DicePool.difficultyLevel.extreme:
            currentRoll.tags.push(game.i18n.localize('CoC7.RollDifficultyExtremeTitle'))
            break
          case CoC7DicePool.difficultyLevel.critical:
            currentRoll.tags.push(game.i18n.localize('CoC7.RollDifficultyCriticalTitle'))
            break
        }
        if (currentRoll.isPushable) {
          currentRoll.tags.push(game.i18n.localize('CoC7.Pushing'))
        }
        if (typeof roll.dices?.tens !== 'undefined') {
          if (typeof actorDecaders[uuidAsKey] === 'undefined') {
            actorDecaders[uuidAsKey] = {}
          }
          for (const offset in roll.dices.tens) {
            actorDecaders[uuidAsKey][(currentRoll.poolModifier < 0 ? -offset : offset)] = Math.floor((roll.dices.tens[offset].value === 0 ? 100 : roll.dices.tens[offset].value) / 10)
          }
        }
        if (typeof actorRolls[uuidAsKey] === 'undefined') {
          actorRolls[uuidAsKey] = {
            build: actor?.system.attribs.build.value ?? 0,
            name: actor?.name ?? '?',
            portrait: actor?.img ?? 'icons/svg/mystery-man.svg',
            rolls: [],
            dicePool: {
              bonusCount: Math.max(0, currentRoll.poolModifier),
              currentPoolModifier: currentRoll.poolModifier,
              difficulty: currentRoll.difficulty,
              flatDiceModifier: currentRoll.flatDiceModifier,
              flatThresholdModifier: currentRoll.flatThresholdModifier,
              luckSpent: 0,
              groups: [],
              penaltyCount: Math.min(0, currentRoll.poolModifier),
              rolledDice: [{
                rolled: false,
                baseDie: 0,
                bonusDice: [],
                penaltyDice: [],
                unitDie: (roll.dices?.unit.value === 0 ? 10 : roll.dices?.unit.value) ?? 0
              }],
              suppressRollData: false,
              threshold: currentRoll.threshold
            }
          }
        }
        actorRolls[uuidAsKey].rolls.push(currentRoll)
      }
      for (const uuidAsKey in actorDecaders) {
        actorRolls[uuidAsKey].dicePool.rolledDice[0].rolled = true
        actorRolls[uuidAsKey].dicePool.rolledDice[0].baseDie = actorDecaders[uuidAsKey][0]

        const mp = Math.min(0, ...Object.keys(actorDecaders[uuidAsKey]))
        const mb = Math.max(0, ...Object.keys(actorDecaders[uuidAsKey]))
        for (let p = -1; p >= mp; p--) {
          actorRolls[uuidAsKey].dicePool.rolledDice[0].penaltyDice.push(actorDecaders[uuidAsKey][p])
        }
        for (let b = 1; b <= mb; b++) {
          actorRolls[uuidAsKey].dicePool.rolledDice[0].bonusDice.push(actorDecaders[uuidAsKey][b])
        }
      }
      const update = {
        /* // FoundryVTT V13 */
        ['flags.' + FOLDER_ID + '.-=type']: null,
        /* // FoundryVTT V13 */
        ['flags.' + FOLDER_ID + '.-=state']: null,
        /* // FoundryVTT V13 */
        ['flags.' + FOLDER_ID + '.-=initiator']: null,
        ['flags.' + FOLDER_ID + '.load.as']: 'CoC7ChatCombinedMessage',
        ['flags.' + FOLDER_ID + '.load.actorRolls']: actorRolls,
        ['flags.' + FOLDER_ID + '.load.actorUuids']: Object.keys(actorRolls).map(k => k.replace(/\//g, '.')),
        ['flags.' + FOLDER_ID + '.load.cardOpen']: !(message.flags?.[FOLDER_ID]?.state === 'resolved'),
        ['flags.' + FOLDER_ID + '.load.combinedFixed']: false,
        ['flags.' + FOLDER_ID + '.load.combinedType']: (dataSet.any ? CoC7ChatCombinedMessage.combinedType.any : (dataSet.all ? CoC7ChatCombinedMessage.combinedType.all : CoC7ChatCombinedMessage.combinedType.none)),
        ['flags.' + FOLDER_ID + '.load.isCombat']: false
      }
      const merged = foundry.utils.mergeObject(message, update, { inplace: false })
      const check = await CoC7ChatCombinedMessage.loadFromMessage(merged, true)
      if (check) {
        const data = await check.getTemplateData()
        update.content = await (foundry.applications.handlebars?.renderTemplate ?? renderTemplate)('systems/' + FOLDER_ID + '/templates/chat/combined-roll.hbs', data)
        update.flavor = check.flavor
        update._id = message.id
        updates.push(update)
      }
    }
  }

  /**
   * Migrate older html from link
   * @param {object} options
   * @param {integer} options.offset
   * @param {object} options.updates
   * @param {object} options.deleteIds
   */
  static async migrateOlderMessagesLink ({ offset, updates, deleteIds } = {}) {
    const message = game.messages.contents[offset]
    const uuidAsKey = message.flags[FOLDER_ID]['group-message'].actorUuid.replace(/\./g, '/')
    let actor = await fromUuid(message.flags[FOLDER_ID]['group-message'].actorUuid)
    actor = (actor?.actor ?? actor)
    const actorRolls = {}
    const actorDecaders = {}
    for (const rollStatus of Object.keys(message.flags[FOLDER_ID]['group-message'].rollStatuses)) {
      const currentRoll = {
        difficulty: CoC7DicePool.difficultyLevel.regular,
        flatDiceModifier: 0,
        flatThresholdModifier: 0,
        fullName: '-',
        poolModifier: 0,
        isPushable: false,
        pushing: false,
        shortName: '-',
        tags: [],
        threshold: message.flags[FOLDER_ID]['group-message'].rollStatuses[rollStatus].percent
      }
      const match = message.flags[FOLDER_ID]['group-message'].rollStatuses[rollStatus].roll.match(/^(?<actor>[^#]+#)?(?<type>attribute|characteristic|item|skill)#(?<key>[^#]+)(#(?<modifiers>.*))?$/)
      if (match) {
        const modifiers = (match.groups.modifiers ?? '').toLowerCase().split('#')
        const poolModifier = parseInt(modifiers.find(m => m.match(/^[+-]\d+$/)) ?? 0, 10)
        if (poolModifier) {
          currentRoll.poolModifier = poolModifier
        }
        const difficulty = modifiers.find(m => m.match(/^\d+$/))
        if (difficulty) {
          currentRoll.difficulty = difficulty
        }
        const pushing = modifiers.filter(m => m === 'p').length > 0
        if (pushing) {
          currentRoll.pushing = pushing
        }
        if (currentRoll.pushing) {
          currentRoll.isPushable = true
        }
        currentRoll.key = match.groups.key
        currentRoll.type = match.groups.type
      }
      if (currentRoll.type === 'characteristic') {
        currentRoll.shortName = CoC7Utilities.getCharacteristicNames(currentRoll.key)?.short ?? '-'
        currentRoll.fullName = CoC7Utilities.getCharacteristicNames(currentRoll.key)?.label ?? '-'
        currentRoll.tags.push(currentRoll.shortName)
      } else if (currentRoll.type === 'attribute') {
        currentRoll.shortName = CoC7Utilities.getAttributeNames(currentRoll.key)?.short ?? '-'
        currentRoll.fullName = CoC7Utilities.getAttributeNames(currentRoll.key)?.label ?? '-'
        currentRoll.tags.push(currentRoll.shortName)
      } else {
        currentRoll.shortName = message.flags[FOLDER_ID]['group-message'].rollStatuses[rollStatus].shortName ?? '-'
        currentRoll.fullName = message.flags[FOLDER_ID]['group-message'].rollStatuses[rollStatus].fullName ?? '-'
        currentRoll.tags.push(currentRoll.shortName)
      }
      if (currentRoll.poolModifier < 0) {
        currentRoll.tags.push(Math.abs(currentRoll.poolModifier) + ' ' + game.i18n.localize('CoC7.DiceModifierPenalty'))
      } else if (currentRoll.poolModifier > 0) {
        currentRoll.tags.push(currentRoll.poolModifier + ' ' + game.i18n.localize('CoC7.DiceModifierBonus'))
      }
      switch (currentRoll.difficulty) {
        case CoC7DicePool.difficultyLevel.regular:
          currentRoll.tags.push(game.i18n.localize('CoC7.RollDifficultyRegularTitle'))
          break
        case CoC7DicePool.difficultyLevel.hard:
          currentRoll.tags.push(game.i18n.localize('CoC7.RollDifficultyHardTitle'))
          break
        case CoC7DicePool.difficultyLevel.extreme:
          currentRoll.tags.push(game.i18n.localize('CoC7.RollDifficultyExtremeTitle'))
          break
        case CoC7DicePool.difficultyLevel.critical:
          currentRoll.tags.push(game.i18n.localize('CoC7.RollDifficultyCriticalTitle'))
          break
      }
      if (currentRoll.isPushable) {
        currentRoll.tags.push(game.i18n.localize('CoC7.Pushing'))
      }
      if (typeof message.flags[FOLDER_ID]['group-message'].rollStatuses[rollStatus].completed?.dices.tens !== 'undefined') {
        if (typeof actorDecaders[uuidAsKey] === 'undefined') {
          actorDecaders[uuidAsKey] = {}
        }
        for (const offset in message.flags[FOLDER_ID]['group-message'].rollStatuses[rollStatus].completed.dices.tens) {
          actorDecaders[uuidAsKey][(currentRoll.poolModifier < 0 ? -offset : offset)] = Math.floor((message.flags[FOLDER_ID]['group-message'].rollStatuses[rollStatus].completed.dices.tens[offset].value === 0 ? 100 : message.flags[FOLDER_ID]['group-message'].rollStatuses[rollStatus].completed.dices.tens[offset].value) / 10)
        }
      }
      if (typeof actorRolls[uuidAsKey] === 'undefined') {
        actorRolls[uuidAsKey] = {
          build: actor?.system.attribs.build.value ?? 0,
          name: actor?.name ?? '?',
          portrait: actor?.img ?? 'icons/svg/mystery-man.svg',
          rolls: [],
          dicePool: {
            bonusCount: Math.max(0, currentRoll.poolModifier),
            currentPoolModifier: currentRoll.poolModifier,
            difficulty: currentRoll.difficulty,
            flatDiceModifier: currentRoll.flatDiceModifier,
            flatThresholdModifier: currentRoll.flatThresholdModifier,
            luckSpent: 0,
            groups: [],
            penaltyCount: Math.min(0, currentRoll.poolModifier),
            rolledDice: [{
              rolled: false,
              baseDie: 0,
              bonusDice: [],
              penaltyDice: [],
              unitDie: (message.flags[FOLDER_ID]['group-message'].rollStatuses[rollStatus].completed?.dices.unit.value === 0 ? 10 : message.flags[FOLDER_ID]['group-message'].rollStatuses[rollStatus].completed?.dices.unit.value) ?? 0
            }],
            suppressRollData: false,
            threshold: currentRoll.threshold
          }
        }
      }
      actorRolls[uuidAsKey].rolls.push(currentRoll)
    }
    for (const uuidAsKey in actorDecaders) {
      actorRolls[uuidAsKey].dicePool.rolledDice[0].rolled = true
      actorRolls[uuidAsKey].dicePool.rolledDice[0].baseDie = actorDecaders[uuidAsKey][0]

      const mp = Math.min(0, ...Object.keys(actorDecaders[uuidAsKey]))
      const mb = Math.max(0, ...Object.keys(actorDecaders[uuidAsKey]))
      for (let p = -1; p >= mp; p--) {
        actorRolls[uuidAsKey].dicePool.rolledDice[0].penaltyDice.push(actorDecaders[uuidAsKey][p])
      }
      for (let b = 1; b <= mb; b++) {
        actorRolls[uuidAsKey].dicePool.rolledDice[0].bonusDice.push(actorDecaders[uuidAsKey][b])
      }
    }
    const update = {
      /* // FoundryVTT V13 */
      ['flags.' + FOLDER_ID + '.-=group-message']: null,
      ['flags.' + FOLDER_ID + '.load.as']: 'CoC7ChatCombinedMessage',
      ['flags.' + FOLDER_ID + '.load.actorRolls']: actorRolls,
      ['flags.' + FOLDER_ID + '.load.actorUuids']: Object.keys(actorRolls).map(k => k.replace(/\//g, '.')),
      ['flags.' + FOLDER_ID + '.load.cardOpen']: (message.flags?.[FOLDER_ID]?.resolved === true),
      ['flags.' + FOLDER_ID + '.load.combinedFixed']: true,
      ['flags.' + FOLDER_ID + '.load.combinedType']: message.flags[FOLDER_ID]['group-message'].combined,
      ['flags.' + FOLDER_ID + '.load.isCombat']: false
    }
    const merged = foundry.utils.mergeObject(message, update, { inplace: false })
    const check = await CoC7ChatCombinedMessage.loadFromMessage(merged, true)
    if (check) {
      const data = await check.getTemplateData()
      update.content = await (foundry.applications.handlebars?.renderTemplate ?? renderTemplate)('systems/' + FOLDER_ID + '/templates/chat/combined-roll.hbs', data)
      update.flavor = check.flavor
      update._id = message.id
      updates.push(update)
    }
  }
}
