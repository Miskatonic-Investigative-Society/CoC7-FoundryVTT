/* global ChatMessage foundry fromUuid game renderTemplate TokenDocument ui */
import { FOLDER_ID } from '../constants.js'
import CoC7ActorPickerDialog from './actor-picker-dialog.js'
import CoC7ChatDamage from './chat-damage.js'
import CoC7Check from './check.js'
import CoC7DicePool from './dice-pool.js'
import CoC7SystemSocket from './system-socket.js'
import CoC7Utilities from './utilities.js'

export default class CoC7ChatOpposedMessage {
  #actorRolls
  #advantage
  #cardOpen
  #isCombat
  #isRolling
  #removeRolls

  /**
   * Constructor
   */
  constructor () {
    this.#actorRolls = {}
    this.#advantage = CoC7ChatOpposedMessage.participant.none
    this.#cardOpen = true
    this.#isCombat = false
    this.#isRolling = false
    this.#removeRolls = []
  }

  /**
   * Participant
   * @returns {object}
   */
  static get participant () {
    return {
      attacker: 'A',
      defender: 'D',
      none: ''
    }
  }

  /**
   * Create opposed message
   * @param {object} options
   * @param {string|null} options.defaultActor
   * @param {bool} options.isCombat
   * @param {object} options.rollRequisites
   */
  static async createGroupMessage (options) {
    const config = {
      actorRolls: {},
      isCombat: options.isCombat
    }

    const defaultUuid = options.defaultActor ?? false
    for (const offset in options.rollRequisites) {
      const parsedRoll = await CoC7ChatOpposedMessage.parseRolls({ roll: options.rollRequisites[offset], quick: true, defaultUuid })
      if (!parsedRoll) {
        ui.notifications.warn('CoC7.Errors.UnparsableRoll', { localize: true })
        return
      }
      config.actorRolls[parsedRoll.actorUuid] = parsedRoll
      delete config.actorRolls[parsedRoll.actorUuid].actorUuid
    }
    if (game.user.isGM) {
      CoC7ChatOpposedMessage.newGroupMessage(config)
    } else {
      CoC7SystemSocket.requestKeeperAction({
        type: 'chatOpposedMessageNew',
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
   * Join opposed message (or create if not found)
   * @param {object} options
   * @param {object} options.rollRequisites
   * @param {bool} options.isCombat
   */
  static async joinGroupMessage (options) {
    if (game.user.isGM) {
      let messages = ui.chat.collection.filter(message => message.flags.CoC7?.load?.as === 'CoC7ChatOpposedMessage' && message.flags.CoC7?.load?.cardOpen === true)
      if (messages.length) {
        // Old messages can't be used if message is more than a day old
        const timestamp = new Date(messages[messages.length - 1].timestamp)
        const now = new Date()
        const timeDiffSec = (now - timestamp) / 1000
        if (24 * 60 * 60 < timeDiffSec) {
          const check = await CoC7ChatOpposedMessage.loadFromMessage(messages[messages.length - 1])
          if (check) {
            check.#cardOpen = false
            check.updateMessage()
          }
          messages = []
        }
      }
      if (messages.length) {
        const check = await CoC7ChatOpposedMessage.loadFromMessage(messages[messages.length - 1])
        if (check) {
          if (!check.#isRolling) {
            for (const offset in options.rollRequisites) {
              const parsedRoll = await CoC7ChatOpposedMessage.parseRolls({ roll: options.rollRequisites[offset], quick: true })
              if (!parsedRoll) {
                ui.notifications.warn('CoC7.Errors.UnparsableRoll', { localize: true })
                return
              }
              const actorUuid = parsedRoll.actorUuid
              delete parsedRoll.actorUuid
              if (!await check.addActor(actorUuid, parsedRoll)) {
                return
              }
            }
            check.updateMessage()
          } else {
            console.log('Attempting to add to a started roll')
          }
        }
      } else {
        CoC7ChatOpposedMessage.createGroupMessage(options)
      }
    } else {
      CoC7SystemSocket.requestKeeperAction({
        type: 'chatOpposedMessageJoin',
        options
      })
    }
  }

  /**
   * Create CoC7ChatOpposedMessage from message
   * @param {Document} message
   * @param {boolean} isMigratingMessage
   * @returns {CoC7ChatOpposedMessage}
   */
  static async loadFromMessage (message, isMigratingMessage = false) {
    const keys = [
      'actorRolls',
      'advantage',
      'cardOpen',
      'isCombat',
      'isRolling'
    ]
    if (message.id && message.flags[FOLDER_ID]?.load?.as === 'CoC7ChatOpposedMessage' && keys.every(k => typeof message.flags[FOLDER_ID]?.load?.[k] !== 'undefined')) {
      const check = new CoC7ChatOpposedMessage()
      check.message = message
      const load = foundry.utils.duplicate(message.flags[FOLDER_ID].load)
      check.#actorRolls = Object.keys(load.actorRolls).reduce((c, k) => { c[k.replace(/\//g, '.')] = load.actorRolls[k]; return c }, {})
      check.#advantage = load.advantage
      check.#cardOpen = load.cardOpen
      check.#isCombat = load.isCombat
      check.#isRolling = load.isRolling
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
   * @param {bool} config.isCombat
   */
  static async newGroupMessage (config) {
    if (['actorRolls', 'isCombat'].every(k => typeof config[k] !== 'undefined')) {
      const check = new CoC7ChatOpposedMessage()
      check.#actorRolls = {}
      check.#cardOpen = true
      check.#isCombat = config.isCombat
      for (const actorUuid in config.actorRolls) {
        if (!await check.addActor(actorUuid, config.actorRolls[actorUuid])) {
          return
        }
      }
      // If there are two occupants on setup first is attacker and other is defender
      if (Object.keys(check.#actorRolls).length === 2) {
        let hasDefender = typeof Object.keys(check.#actorRolls).find(k => check.#actorRolls[k].participant === CoC7ChatOpposedMessage.participant.defender) !== 'undefined'
        if (!hasDefender) {
          const actorUuid = Object.keys(check.#actorRolls).findLast(k => check.#actorRolls[k].participant === CoC7ChatOpposedMessage.participant.none)
          if (actorUuid) {
            check.#actorRolls[actorUuid].participant = CoC7ChatOpposedMessage.participant.defender
            hasDefender = true
          }
        }
        if (hasDefender) {
          for (const actorUuid in check.#actorRolls) {
            if (check.#actorRolls[actorUuid].participant === CoC7ChatOpposedMessage.participant.none) {
              check.#actorRolls[actorUuid].participant = CoC7ChatOpposedMessage.participant.attacker
            }
          }
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
          if (quantity) {
            const check = await CoC7ChatOpposedMessage.loadFromMessage(message)
            try {
              const actorUuid = Object.keys(check.#actorRolls)[0] ?? ''
              if (await check.#actorRolls[actorUuid].dicePool.addDiceToPool(quantity)) {
                check.updateMessage()
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
      case 'participant':
        {
          const check = await CoC7ChatOpposedMessage.loadFromMessage(message)
          const actorUuid = event.currentTarget.closest('.actor-portrait')?.dataset.actorUuid
          if (check && actorUuid && typeof check.#actorRolls[actorUuid] !== 'undefined') {
            if (check.#actorRolls[actorUuid].participant === CoC7ChatOpposedMessage.participant.attacker) {
              Object.keys(check.#actorRolls).forEach(actorUuid => { check.#actorRolls[actorUuid].participant = CoC7ChatOpposedMessage.participant.attacker })
              check.#actorRolls[actorUuid].participant = CoC7ChatOpposedMessage.participant.defender
            } else {
              check.#actorRolls[actorUuid].participant = CoC7ChatOpposedMessage.participant.attacker
            }
            check.updateMessage()
          }
        }
        break
      case 'removeRoll':
        {
          const check = await CoC7ChatOpposedMessage.loadFromMessage(message)
          const actorUuid = event.currentTarget.dataset.actorUuid
          if (check && actorUuid && typeof check.#actorRolls[actorUuid] !== 'undefined') {
            delete check.#actorRolls[actorUuid]
            check.#removeRolls.push(actorUuid.replace(/\./g, '/'))
            check.updateMessage()
          }
        }
        break
      case 'rollActor':
        {
          const check = await CoC7ChatOpposedMessage.loadFromMessage(message)
          const actorUuid = event.currentTarget.dataset.actorUuid
          if (check && actorUuid) {
            await check.rollForActor(actorUuid)
            check.updateMessage()
          }
        }
        break
      case 'rollDamage':
        {
          const check = await CoC7ChatOpposedMessage.loadFromMessage(message)
          await check.flagForDevelopment()
          const templateData = await check.getTemplateData()
          const winnerUuid = Object.keys(templateData.rollActors).find(r => templateData.rollActors[r].isWinner)
          const loserUuid = Object.keys(templateData.rollActors).find(r => !templateData.rollActors[r].isWinner)
          const winner = await fromUuid(winnerUuid)
          const item = winner.getItemByName(check.#actorRolls[winnerUuid].key, 'weapon')
          const loser = await fromUuid(loserUuid)
          let isCritical = false
          if (check.#actorRolls[winnerUuid].dicePool.difficulty < CoC7DicePool.successLevel.extreme && check.#actorRolls[winnerUuid].dicePool.successLevel >= CoC7DicePool.successLevel.extreme) {
            isCritical = true
          } else if (check.#actorRolls[winnerUuid].dicePool.difficulty === CoC7DicePool.successLevel.extreme && check.#actorRolls[winnerUuid].dicePool.isCritical) {
            isCritical = true
          }
          CoC7ChatDamage.createFromActors({ attacker: winner, weapon: item, isCritical, target: loser })
          check.#cardOpen = false
          check.updateMessage()
        }
        break
      case 'rollNoPlayers':
        {
          const check = await CoC7ChatOpposedMessage.loadFromMessage(message)
          if (check) {
            check.#isRolling = true
            for (const actorUuid in check.#actorRolls) {
              if (check.#actorRolls[actorUuid].playerOwnersOnline.length === 0) {
                await check.rollForActor(actorUuid)
              }
            }
            check.updateMessage()
          }
        }
        break
      case 'setValue':
        {
          const check = await CoC7ChatOpposedMessage.loadFromMessage(message)
          const set = event.currentTarget.dataset.set
          const value = event.currentTarget.dataset.value
          if (check && set && value) {
            switch (set) {
              case 'advantage':
                if (check.#advantage === value) {
                  check.#advantage = CoC7ChatOpposedMessage.participant.none
                } else {
                  check.#advantage = value
                }
                check.#advantage = value
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
          const check = await CoC7ChatOpposedMessage.loadFromMessage(message)
          const set = event.currentTarget.dataset.set
          if (check && set) {
            switch (set) {
              case 'cardOpen':
                await check.flagForDevelopment()
                check.#cardOpen = !check.#cardOpen
                check.updateMessage()
                break
              case 'isCombat':
                check.#isCombat = !check.#isCombat
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
      html.querySelectorAll('[data-action]:not(.not-allowed)').forEach((element) => {
        if (game.user.isGM || allowed.includes(element.parentElement.dataset.actorUuid)) {
          element.addEventListener('click', event => CoC7ChatOpposedMessage._onClickEvent(event, message))
        }
      })
    }
  }

  /**
   * Parse roll string into data
   * @param {object} options
   * @param {string} options.roll
   * @param {bool} options.quick
   * @param {string|false} options.defaultUuid
   * @returns {null|object}
   */
  static async parseRolls ({ roll, quick = true, defaultUuid = false }) {
    const match = roll.match(/^(?<actor>[^#]+#)?(?<type>attribute|characteristic|item|skill)#(?<key>[^#]+)(#(?<modifiers>.*))?$/)
    if (match) {
      const modifiers = (match.groups.modifiers ?? '').toLowerCase().split('#')
      const poolModifier = parseInt(modifiers.find(m => m.match(/^[+-]\d+$/)) ?? 0, 10)
      const difficulty = modifiers.find(m => m.match(/^\d+$/))
      const attacker = modifiers.filter(m => m === 'a').length > 0
      const defender = modifiers.filter(m => m === 'd').length > 0
      const parsedRoll = {
        actorUuid: 'x',
        build: 0,
        dicePool: {
          difficulty: ((difficulty ?? '').toString() === '0' ? CoC7DicePool.difficultyLevel.unknown : (difficulty ? parseInt(difficulty, 10) : (game.settings.get(FOLDER_ID, 'defaultCheckDifficulty') === 'unknown' ? CoC7DicePool.difficultyLevel.unknown : CoC7DicePool.difficultyLevel.regular))),
          // flatDiceModifier: 0,
          // flatThresholdModifier: 0,
          poolModifier,
          threshold: 0
        },
        fullName: '-',
        isDodge: false,
        isManeuver: false,
        isPushable: false,
        key: match.groups.key,
        name: '-',
        participant: (attacker && !defender ? CoC7ChatOpposedMessage.participant.attacker : (!attacker && defender ? CoC7ChatOpposedMessage.participant.defender : CoC7ChatOpposedMessage.participant.none)),
        playerOwnersOnline: [],
        portrait: '',
        shortName: '-',
        tags: [],
        type: match.groups.type
      }
      let actor
      if (!match.groups.actor && defaultUuid !== false) {
        match.groups.actor = defaultUuid + '#'
      }
      if (match.groups.actor) {
        actor = await CoC7ChatOpposedMessage.getActor(match.groups.actor.substring(0, match.groups.actor.length - 1))
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
   * Set actor actorUuid to roll data
   * @param {string} actorUuid
   * @param {object} data
   * @returns {boolean}
   */
  async addActor (actorUuid, data) {
    const actor = await fromUuid(actorUuid)
    if (actor) {
      this.#actorRolls[actorUuid] = data
      this.#actorRolls[actorUuid].portrait = (actor instanceof TokenDocument ? actor.texture.src : actor.portrait)
      this.#actorRolls[actorUuid].build = actor.system.attribs.build.value ?? 0
      this.#actorRolls[actorUuid].name = actor.name
      this.#actorRolls[actorUuid].participant = CoC7ChatOpposedMessage.participant.none
      this.#actorRolls[actorUuid].tags = []
      this.#actorRolls[actorUuid].shortName = '-'
      this.#actorRolls[actorUuid].isDodge = false
      this.#actorRolls[actorUuid].isManeuver = false
      this.#actorRolls[actorUuid].dicePool.threshold = 0
      this.#actorRolls[actorUuid].isPushable = false
      this.#actorRolls[actorUuid].skillUuid = false
      switch (this.#actorRolls[actorUuid].type) {
        case CoC7Check.type.characteristic:
          this.#actorRolls[actorUuid].shortName = CoC7Utilities.getCharacteristicNames(this.#actorRolls[actorUuid].key)?.short ?? '-'
          if (this.#actorRolls[actorUuid].shortName === '-') {
            ui.notifications.warn('CoC7.Errors.UnknownCharacteristic', { localize: true })
            return false
          }
          this.#actorRolls[actorUuid].fullName = CoC7Utilities.getCharacteristicNames(this.#actorRolls[actorUuid].key)?.label ?? '-'
          this.#actorRolls[actorUuid].tags.push(this.#actorRolls[actorUuid].shortName)
          this.#actorRolls[actorUuid].dicePool.threshold = actor.system?.characteristics[this.#actorRolls[actorUuid].key]?.value ?? 1
          break
        case CoC7Check.type.attribute:
          if (['lck', 'san'].includes(this.#actorRolls[actorUuid].key)) {
            this.#actorRolls[actorUuid].shortName = CoC7Utilities.getAttributeNames(this.#actorRolls[actorUuid].key)?.short ?? '-'
            if (this.#actorRolls[actorUuid].shortName === '-') {
              ui.notifications.warn('CoC7.Errors.UnknownAttribute', { localize: true })
              return false
            }
            this.#actorRolls[actorUuid].fullName = CoC7Utilities.getAttributeNames(this.#actorRolls[actorUuid].key)?.label ?? '-'
            this.#actorRolls[actorUuid].tags.push(this.#actorRolls[actorUuid].shortName)
            this.#actorRolls[actorUuid].dicePool.threshold = actor.system?.attribs[this.#actorRolls[actorUuid].key]?.value ?? 1
          } else {
            ui.notifications.warn('CoC7.Errors.IncorrectAttribute', { localize: true })
            return false
          }
          break
        case CoC7Check.type.skill:
          {
            const skill = await actor.getItemOrAdd(this.#actorRolls[actorUuid].key, 'skill')
            if (skill?.type === 'skill') {
              this.#actorRolls[actorUuid].shortName = skill.name
              this.#actorRolls[actorUuid].tags.push(this.#actorRolls[actorUuid].shortName)
              this.#actorRolls[actorUuid].isDodge = (skill.system.isDodge ?? false)
              this.#actorRolls[actorUuid].dicePool.threshold = skill.system.value
              this.#actorRolls[actorUuid].isPushable = (skill.system.properties?.push ?? false)
              this.#actorRolls[actorUuid].skillUuid = skill.uuid ?? false
            } else {
              ui.notifications.warn('CoC7.Errors.UnknownSkill', { localize: true })
              return false
            }
          }
          break
        case CoC7Check.type.item:
          {
            const item = await actor.getItemOrAdd(this.#actorRolls[actorUuid].key, 'weapon')
            if (item?.type === 'weapon') {
              this.#actorRolls[actorUuid].shortName = item.name
              this.#actorRolls[actorUuid].tags.push(this.#actorRolls[actorUuid].shortName)
              this.#actorRolls[actorUuid].isManeuver = (item.system.properties?.mnvr ?? false)
              const skillId = item.system.skill[item.system.usesAlternativeSkill ? 'alternativ' : 'main']?.id
              if (skillId) {
                const skill = actor.items.find(d => d.id === skillId)
                this.#actorRolls[actorUuid].tags.push(skill.name)
                this.#actorRolls[actorUuid].isDodge = (skill.system.isDodge ?? false)
                this.#actorRolls[actorUuid].dicePool.threshold = skill.system.value
                this.#actorRolls[actorUuid].isPushable = (skill.system.properties?.push ?? false)
                this.#actorRolls[actorUuid].skillUuid = skill.uuid ?? false
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
      if (this.#actorRolls[actorUuid].dicePool.poolModifier < 0) {
        this.#actorRolls[actorUuid].tags.push(Math.abs(this.#actorRolls[actorUuid].dicePool.poolModifier) + ' ' + game.i18n.localize('CoC7.DiceModifierPenalty'))
      } else if (this.#actorRolls[actorUuid].dicePool.poolModifier > 0) {
        this.#actorRolls[actorUuid].tags.push(this.#actorRolls[actorUuid].dicePool.poolModifier + ' ' + game.i18n.localize('CoC7.DiceModifierBonus'))
      }
      switch (this.#actorRolls[actorUuid].dicePool.difficulty) {
        case CoC7DicePool.difficultyLevel.regular:
          this.#actorRolls[actorUuid].tags.push(game.i18n.localize('CoC7.RollDifficultyRegularTitle'))
          break
        case CoC7DicePool.difficultyLevel.hard:
          this.#actorRolls[actorUuid].tags.push(game.i18n.localize('CoC7.RollDifficultyHardTitle'))
          break
        case CoC7DicePool.difficultyLevel.extreme:
          this.#actorRolls[actorUuid].tags.push(game.i18n.localize('CoC7.RollDifficultyExtremeTitle'))
          break
        case CoC7DicePool.difficultyLevel.critical:
          this.#actorRolls[actorUuid].tags.push(game.i18n.localize('CoC7.RollDifficultyCriticalTitle'))
          break
      }
      this.#actorRolls[actorUuid].dicePool = CoC7DicePool.newPool(this.#actorRolls[actorUuid].dicePool)
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
      advantageAttacker: this.#advantage === CoC7ChatOpposedMessage.participant.attacker,
      advantageDefender: this.#advantage === CoC7ChatOpposedMessage.participant.defender,
      advantageTypes: CoC7ChatOpposedMessage.participant,
      allRollsAssigned: false,
      allRollsComplete: false,
      canAdvantage: false,
      cardOpen: this.#cardOpen,
      defenderIsDodging: false,
      displayResultType: game.settings.get(FOLDER_ID, 'displayResultType'),
      displayCheckSuccessLevel: game.settings.get(FOLDER_ID, 'displayCheckSuccessLevel'),
      foundryGeneration: game.release.generation,
      hasWinner: false,
      isCombat: this.#isCombat,
      isRolling: this.#isRolling,
      isTie: false,
      resultText: '',
      rollActors: {},
      winnerRollsDamage: false
    }
    const rollActors = {}
    let allRollsComplete = true
    let anySuccess = true
    const checks = {
      [CoC7ChatOpposedMessage.participant.attacker]: {
        actorName: '',
        isDodge: false,
        isManeuver: false,
        isWeapon: false,
        isWinner: false,
        result: undefined
      },
      [CoC7ChatOpposedMessage.participant.defender]: {
        actorName: '',
        isDodge: false,
        isManeuver: false,
        isWeapon: false,
        isWinner: false,
        result: undefined
      }
    }
    const rollsAssigned = {
      [CoC7ChatOpposedMessage.participant.attacker]: 0,
      [CoC7ChatOpposedMessage.participant.defender]: 0,
      [CoC7ChatOpposedMessage.participant.none]: 0
    }

    for (const actorUuid in this.#actorRolls) {
      const roll = this.#actorRolls[actorUuid]
      const diceGroup = this.#actorRolls[actorUuid].dicePool.diceGroups.pop() ?? {}
      diceGroup.bonusDice = Math.abs(this.#actorRolls[actorUuid].dicePool.poolModifier)
      diceGroup.bonusType = game.i18n.localize(this.#actorRolls[actorUuid].dicePool.poolModifier < 0 ? 'CoC7.DiceModifierPenalty' : 'CoC7.DiceModifierBonus')
      diceGroup.flavor = game.i18n.format('CoC7.CheckResult', {
        name: (roll.fullName !== '-' ? roll.fullName : (roll.shortName ?? '')),
        value: this.#actorRolls[actorUuid].dicePool.threshold,
        difficulty: CoC7DicePool.difficultyString(this.#actorRolls[actorUuid].dicePool.difficulty)
      })
      diceGroup.isPushed = this.#actorRolls[actorUuid].dicePool.isPushed
      diceGroup.key = roll.key
      diceGroup.luckSpent = this.#actorRolls[actorUuid].dicePool.luckSpent
      diceGroup.pushing = false
      diceGroup.removable = !this.#isRolling
      diceGroup.rollable = this.#isRolling
      diceGroup.rolled = this.#actorRolls[actorUuid].dicePool.isRolled
      diceGroup.tags = roll.tags
      diceGroup.target = this.#actorRolls[actorUuid].dicePool.threshold + this.#actorRolls[actorUuid].dicePool.flatThresholdModifier
      const buttons = {}
      if (this.#cardOpen && diceGroup.rolled) {
        foundry.utils.mergeObject(buttons, this.#actorRolls[actorUuid].dicePool.availableButtons({ luckAvailable: 0, isPushable: false, key: roll.key }))
      }
      diceGroup.buttons = buttons
      rollActors[actorUuid] = {
        portrait: roll.portrait,
        build: roll.build,
        actorName: roll.name,
        isDodge: roll.isDodge,
        isManeuver: roll.isManeuver,
        isWinner: false,
        participant: roll.participant,
        rolls: [diceGroup],
        skillUuid: roll.skillUuid,
        type: roll.type
      }
      if (rollActors[actorUuid].isDodge && rollActors[actorUuid].participant === CoC7ChatOpposedMessage.participant.defender) {
        data.defenderIsDodging = true
      }
      if (diceGroup.rolled) {
        anySuccess = anySuccess && diceGroup.successLevel >= CoC7DicePool.difficultyLevel.regular
        if ([CoC7ChatOpposedMessage.participant.attacker, CoC7ChatOpposedMessage.participant.defender].includes(roll.participant)) {
          checks[roll.participant].result = diceGroup.successLevel
        }
      } else {
        allRollsComplete = false
      }
      rollsAssigned[roll.participant]++
    }
    // Currently only one attacker and one defender (XXXX Physical Human Limits, Know Roll, Idea Roll)
    data.allRollsAssigned = (rollsAssigned[CoC7ChatOpposedMessage.participant.attacker] === 1 && rollsAssigned[CoC7ChatOpposedMessage.participant.defender] === 1 && rollsAssigned[CoC7ChatOpposedMessage.participant.none] === 0)

    if (data.allRollsAssigned && allRollsComplete) {
      data.allRollsComplete = true
      if (checks[CoC7ChatOpposedMessage.participant.attacker].result === checks[CoC7ChatOpposedMessage.participant.defender].result) {
        data.isTie = true
        if (data.isCombat && anySuccess) {
          data.canAdvantage = true
          if (this.#advantage !== CoC7ChatOpposedMessage.participant.none) {
            checks[this.#advantage].isWinner = true
            data.hasWinner = true
          }
        }
      } else if (checks[CoC7ChatOpposedMessage.participant.defender].result < checks[CoC7ChatOpposedMessage.participant.attacker].result) {
        checks[CoC7ChatOpposedMessage.participant.attacker].isWinner = true
        data.hasWinner = true
      } else {
        checks[CoC7ChatOpposedMessage.participant.defender].isWinner = true
        data.hasWinner = true
      }
      for (const actorUuid in rollActors) {
        rollActors[actorUuid].isWinner = checks[rollActors[actorUuid].participant].isWinner
        if (checks[rollActors[actorUuid].participant].actorName === '') {
          checks[rollActors[actorUuid].participant].isDodge = rollActors[actorUuid].isDodge ?? false
          checks[rollActors[actorUuid].participant].isManeuver = rollActors[actorUuid].isManeuver ?? false
          checks[rollActors[actorUuid].participant].actorName = rollActors[actorUuid].actorName
          checks[rollActors[actorUuid].participant].isWeapon = rollActors[actorUuid].type === 'item'
          if (rollActors[actorUuid].isWinner && checks[rollActors[actorUuid].participant].isWeapon) {
            data.winnerRollsDamage = true
          }
        }
      }
      if (data.isCombat) {
        if (checks[CoC7ChatOpposedMessage.participant.attacker].isWinner === checks[CoC7ChatOpposedMessage.participant.defender].isWinner) {
          data.resultText = game.i18n.localize('CoC7.NoWinner')
        } else if (checks[CoC7ChatOpposedMessage.participant.attacker].isWinner) {
          if (checks[CoC7ChatOpposedMessage.participant.attacker].isManeuver) {
            data.resultText = game.i18n.format('CoC7.ManeuverSuccess', {
              name: checks[CoC7ChatOpposedMessage.participant.attacker].actorName
            })
          } else {
            data.resultText = game.i18n.format('CoC7.AttackSuccess', {
              name: checks[CoC7ChatOpposedMessage.participant.attacker].actorName
            })
          }
        } else {
          if (checks[CoC7ChatOpposedMessage.participant.defender].isManeuver) {
            data.resultText = game.i18n.format('CoC7.ManeuverSuccess', {
              name: checks[CoC7ChatOpposedMessage.participant.defender].actorName
            })
          } else if (checks[CoC7ChatOpposedMessage.participant.defender].isDodge) {
            data.resultText = game.i18n.format('CoC7.DodgeSuccess', {
              name: checks[CoC7ChatOpposedMessage.participant.defender].actorName
            })
          } else {
            data.resultText = game.i18n.format('CoC7.AttackSuccess', {
              name: checks[CoC7ChatOpposedMessage.participant.defender].actorName
            })
          }
        }
      }
    }
    if (data.isCombat) {
      const opposedRollTieBreaker = game.settings.get(FOLDER_ID, 'opposedRollTieBreaker')
      const orderedKeys = Object.keys(rollActors).sort((a, b) => {
        const rolledA = rollActors[a].rolls?.reduce((c, r) => c && r.rolled, true) ?? false
        const rolledB = rollActors[b].rolls?.reduce((c, r) => c && r.rolled, true) ?? false
        // First sort by has rolled
        if (rolledA && rolledB) {
          // Second sort by winner
          if (rollActors[a].isWinner === rollActors[b].isWinner) {
            // Third sort by ...
            if (opposedRollTieBreaker) {
              // ... lowest rolled
              const totalA = rollActors[a].rolls?.reduce((c, r) => Math.min(c, r.total), 100) ?? 100
              const totalB = rollActors[b].rolls?.reduce((c, r) => Math.min(c, r.total), 100) ?? 100
              return totalB - totalA
            }
            // ... highest target
            const targetA = rollActors[a].rolls?.reduce((c, r) => Math.min(c, r.target), 100) ?? 100
            const targetB = rollActors[b].rolls?.reduce((c, r) => Math.min(c, r.target), 100) ?? 100
            return targetB - targetA
          } else if (rollActors[a].isWinner) {
            return -1
          }
          return 1
        } else if (rolledA) {
          return -1
        } else if (rolledB) {
          return 1
        }
        return 0
      })
      const isManeuver = Object.values(rollActors).reduce((c, r) => c || r.isManeuver, false) || true
      for (const key of orderedKeys) {
        data.rollActors[key] = foundry.utils.duplicate(rollActors[key])
        if (isManeuver) {
          for (const roll of data.rollActors[key].rolls) {
            roll.tags.push(game.i18n.localize('CoC7.WeaponManeuver') + ' (' + game.i18n.localize('CoC7.Build') + ': ' + rollActors[key].build + ')')
          }
        }
      }
    } else {
      data.rollActors = rollActors
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
            as: 'CoC7ChatOpposedMessage',
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
            actorUuids: Object.keys(this.#actorRolls),
            advantage: this.#advantage,
            cardOpen: this.#cardOpen,
            isCombat: this.#isCombat,
            isRolling: this.#isRolling
          }
        }
      },
      rolls: (this.message?.rolls ?? []).concat(Object.keys(this.#actorRolls).reduce((c, k) => {
        c.concat(this.#actorRolls[k].dicePool.newRolls)
        return c
      }, [])),
      speaker: { alias: game.i18n.localize('CoC7.OpposedRollCard') },
      /* // FoundryVTT V12 */
      content: await (foundry.applications.handlebars?.renderTemplate ?? renderTemplate)('systems/' + FOLDER_ID + '/templates/chat/opposed-roll.hbs', data)
    }

    return chatData
  }

  /**
   * Perform all rolls for Actor
   * @param {string} actorUuid
   */
  async rollForActor (actorUuid) {
    if (this.#actorRolls[actorUuid].dicePool.isRolled === false) {
      await this.#actorRolls[actorUuid].dicePool.roll()
    }
  }

  /**
   * Save changes to existing Chat Message
   */
  async updateMessage () {
    if (this.message) {
      const diff = foundry.utils.diffObject(this.message.toObject(), await this.getChatData())
      if (this.#removeRolls.length) {
        // Set deletion keys on removed rolls
        /* // FoundryVTT V13 */
        for (const actorUuid of this.#removeRolls) {
          /* // FoundryVTT V13 */
          foundry.utils.setProperty(diff, 'flags.' + FOLDER_ID + '.load.actorRolls.-=' + actorUuid, null)
        }
      }
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
   * Flag skills for development for the winner that rolled a skill
   */
  async flagForDevelopment () {
    if (game.settings.get(FOLDER_ID, 'xpEnabled')) {
      const templateData = await this.getTemplateData()
      for (const actorUuid in templateData.rollActors) {
        if (templateData.rollActors[actorUuid].isWinner) {
          for (const roll of templateData.rollActors[actorUuid].rolls) {
            if (roll.isRolledSuccess) {
              if (templateData.rollActors[actorUuid].skillUuid) {
                const item = await fromUuid(templateData.rollActors[actorUuid].skillUuid)
                if (item) {
                  await item.update({ 'system.flags.developement': true })
                }
              }
            }
          }
        }
      }
    }
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
        actorRolls[uuidAsKey] = {
          build: actor?.system.attribs.build.value ?? 0,
          name: actor?.name ?? '?',
          portrait: actor?.img ?? 'icons/svg/mystery-man.svg',
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
          },
          fullName: currentRoll.fullName,
          isDodge: currentRoll.isDodge,
          isManeuver: currentRoll.isManeuver,
          isPushable: currentRoll.isPushable,
          key: currentRoll.key,
          participant: CoC7ChatOpposedMessage.participant.attacker,
          shortName: currentRoll.shortName,
          tags: currentRoll.tags,
          type: currentRoll.type,
          skillUuid: (currentRoll.type === 'skill' ? currentRoll.key : false)
        }
      }
      let rolled = false
      for (const uuidAsKey in actorDecaders) {
        actorRolls[uuidAsKey].dicePool.rolledDice[0].rolled = true
        rolled = true
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
      actorRolls[actorUuid.replace(/\./g, '/')].participant = CoC7ChatOpposedMessage.participant.defender
      const update = {
        /* // FoundryVTT V13 */
        ['flags.' + FOLDER_ID + '.-=type']: null,
        /* // FoundryVTT V13 */
        ['flags.' + FOLDER_ID + '.-=state']: null,
        /* // FoundryVTT V13 */
        ['flags.' + FOLDER_ID + '.-=initiator']: null,
        ['flags.' + FOLDER_ID + '.load.as']: 'CoC7ChatOpposedMessage',
        ['flags.' + FOLDER_ID + '.load.actorRolls']: actorRolls,
        ['flags.' + FOLDER_ID + '.load.actorUuids']: Object.keys(actorRolls).map(k => k.replace(/\//g, '.')),
        ['flags.' + FOLDER_ID + '.load.advantage']: (dataSet._aa === true ? CoC7ChatOpposedMessage.participant.attacker : (dataSet._ad === true ? CoC7ChatOpposedMessage.participant.defender : CoC7ChatOpposedMessage.participant.none)),
        ['flags.' + FOLDER_ID + '.load.cardOpen']: Object.values(actorRolls)[0].dicePool.rolledDice[0].rolled,
        ['flags.' + FOLDER_ID + '.load.isCombat']: (dataSet.combat === true),
        ['flags.' + FOLDER_ID + '.load.isRolling']: rolled
      }
      const merged = foundry.utils.mergeObject(message, update, { inplace: false })
      const check = await CoC7ChatOpposedMessage.loadFromMessage(merged, true)
      if (check) {
        const data = await check.getTemplateData()
        update.content = await (foundry.applications.handlebars?.renderTemplate ?? renderTemplate)('systems/' + FOLDER_ID + '/templates/chat/opposed-roll.hbs', data)
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
    const actorRolls = {}
    const actorDecaders = {}
    let uuidAsKey = ''
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
      let actor
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
        const uuid = match.groups.actor.substring(0, match.groups.actor.length - 1)
        uuidAsKey = uuid.replace(/\./g, '/')
        actor = await fromUuid(uuid)
      } else {
        actor = null
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
      actorRolls[uuidAsKey] = {
        build: actor?.system.attribs.build.value ?? 0,
        name: actor?.name ?? '?',
        portrait: actor?.img ?? 'icons/svg/mystery-man.svg',
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
        },
        fullName: currentRoll.fullName,
        isDodge: message.flags[FOLDER_ID]['group-message'].rollStatuses[rollStatus].isDodging,
        isManeuver: message.flags[FOLDER_ID]['group-message'].rollStatuses[rollStatus].isManeuver,
        isPushable: message.flags[FOLDER_ID]['group-message'].rollStatuses[rollStatus].isPushable,
        key: currentRoll.key,
        participant: (message.flags[FOLDER_ID]['group-message'].rollStatuses[rollStatus].isAttacker ? CoC7ChatOpposedMessage.participant.attacker : CoC7ChatOpposedMessage.participant.defender),
        shortName: currentRoll.shortName,
        tags: currentRoll.tags,
        type: currentRoll.type,
        skillUuid: (currentRoll.type === 'skill' ? currentRoll.key : false)
      }
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
      ['flags.' + FOLDER_ID + '.load.as']: 'CoC7ChatOpposedMessage',
      ['flags.' + FOLDER_ID + '.load.actorRolls']: actorRolls,
      ['flags.' + FOLDER_ID + '.load.actorUuids']: Object.keys(actorRolls).map(k => k.replace(/\//g, '.')),
      ['flags.' + FOLDER_ID + '.load.advantage']: (message.flags[FOLDER_ID]['group-message'].advantageAttacker === true ? CoC7ChatOpposedMessage.participant.attacker : (message.flags[FOLDER_ID]['group-message'].advantageDefender === true ? CoC7ChatOpposedMessage.participant.defender : CoC7ChatOpposedMessage.participant.none)),
      ['flags.' + FOLDER_ID + '.load.cardOpen']: message.flags[FOLDER_ID]['group-message'].isEditable,
      ['flags.' + FOLDER_ID + '.load.isCombat']: message.flags[FOLDER_ID]['group-message'].isCombat,
      ['flags.' + FOLDER_ID + '.load.isRolling']: message.flags[FOLDER_ID]['group-message'].allRollsCompleted
    }
    const merged = foundry.utils.mergeObject(message, update, { inplace: false })
    const check = await CoC7ChatOpposedMessage.loadFromMessage(merged, true)
    if (check) {
      const data = await check.getTemplateData()
      update.content = await (foundry.applications.handlebars?.renderTemplate ?? renderTemplate)('systems/' + FOLDER_ID + '/templates/chat/opposed-roll.hbs', data)
      update.flavor = check.flavor
      update._id = message.id
      updates.push(update)
    }
  }
}
