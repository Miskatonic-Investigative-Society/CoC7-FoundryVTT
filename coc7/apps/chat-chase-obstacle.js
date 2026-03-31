/* global ChatMessage foundry fromUuid game renderTemplate Roll ui */
import { FOLDER_ID } from '../constants.js'
import CoC7DicePool from './dice-pool.js'
import CoC7SystemSocket from './system-socket.js'
import CoC7Utilities from './utilities.js'

export default class CoC7ChatChaseObstacle {
  #asyncChase
  #breakOrNegotiateDefined
  #cardOpen
  #cardResolved
  #checkThreshold
  #closed
  #consumeBonusDice
  #dicePool
  #failedConsequencesRolled
  #forward
  #hasBonusDice
  #ignoreArmor
  #locationId
  #movementActionArray
  #movePlayer
  #obstacle
  #obstacleDamageRolled
  #obstacleDestroyed
  #obstacleDefined
  #participantId
  #playerActionDefined
  #reflectObstacleChanges
  #targetArmor
  #totalActionCost
  #totalCautiousApproach
  #totalObstacleDamage
  #totalPlayerDamageTaken
  #tryToBreak
  #tryToNegotiate
  #weaponKey
  #weaponOtherDamage

  /**
   * Constructor
   */
  constructor () {
    this.#breakOrNegotiateDefined = false
    this.#cardOpen = true
    this.#cardResolved = false
    this.#checkThreshold = 1
    this.#closed = false
    this.#consumeBonusDice = true
    this.#dicePool = CoC7DicePool.newPool({ })
    this.#failedConsequencesRolled = false
    this.#forward = false
    this.#hasBonusDice = false
    this.#ignoreArmor = false
    this.#locationId = ''
    this.#movementActionArray = []
    this.#movePlayer = false
    this.#obstacle = {
      checkName: '',
      failedActionCost: 0,
      failedCheckDamage: 0,
      hasActionCost: false,
      hasDamage: false,
      hasHitPoints: false,
      HitPoints: 0,
      isBarrier: true,
      name: ''
    }
    this.#obstacleDamageRolled = false
    this.#obstacleDefined = false
    this.#obstacleDestroyed = false
    this.#participantId = ''
    this.#playerActionDefined = false
    this.#reflectObstacleChanges = true
    this.#targetArmor = 0
    this.#totalActionCost = 0
    this.#totalCautiousApproach = 0
    this.#totalObstacleDamage = 0
    this.#totalPlayerDamageTaken = 0
    this.#tryToBreak = false
    this.#tryToNegotiate = false
    this.#weaponKey = ''
    this.#weaponOtherDamage = ''
  }

  /**
   * Create melee initiator message
   * @param {object} options
   * @param {string} options.chaseUuid
   * @param {string} options.locationId
   * @param {string} options.participantId
   * @param {boolean} options.forward
   */
  static async createMessage ({ chaseUuid, locationId, participantId, forward } = {}) {
    if (chaseUuid && locationId && typeof forward === 'boolean') {
      const chase = await fromUuid(chaseUuid)
      if (chase) {
        const location = chase.system.locations.list.find(l => l.uuid === locationId)
        const allParticipants = (await chase.system.allParticipants()).all
        const participant = allParticipants.find(l => l.uuid === participantId)
        if (location && participant) {
          const check = new CoC7ChatChaseObstacle()
          check.chase = chaseUuid
          check.#breakOrNegotiateDefined = false
          check.#dicePool.poolModifier = participant.bonusDice
          check.#forward = forward
          check.#hasBonusDice = participant.bonusDice !== 0
          check.#locationId = locationId
          check.#movementActionArray = participant.movementActionArray
          check.#obstacle = {
            checkName: location.obstacleDetails.checkName,
            failedActionCost: location.obstacleDetails.failedActionCost,
            failedCheckDamage: location.obstacleDetails.failedCheckDamage,
            hasActionCost: location.obstacleDetails.hasActionCost,
            hasDamage: location.obstacleDetails.hasDamage,
            hasHitPoints: location.obstacleDetails.hasHitPoints,
            HitPoints: location.obstacleDetails.HitPoints,
            isBarrier: location.obstacleDetails.barrier,
            name: location.obstacleDetails.name
          }
          check.#obstacleDefined = false
          check.#participantId = participantId
          check.#targetArmor = (participant.actor?.isToken ? participant.actor.token.actor : participant.actor)?.system?.attribs.armor.value ?? '0'
          const chatData = await check.getChatData()
          await ChatMessage.create(chatData)
          return
        }
      }
    }
    ui.notifications.warn('CoC7.Errors.UnparsableRoll', { localize: true })
  }

  /**
   * Get chase item promise
   * @returns {Promise<Document>} async Actor
   */
  get chase () {
    return this.#asyncChase
  }

  /**
   * Set chase item from uuid
   * @param {string} value
   */
  set chase (value) {
    this.#asyncChase = (typeof value === 'string' ? fromUuid(value) : undefined)
  }

  /**
   * Is armor formula
   * @returns {boolean}
   */
  get #isArmorFormula () {
    return (!this.#targetArmor.toString().match(/^\d+$/))
  }

  /**
   * Roll Armor
   * @param {string} messageId
   */
  async rollArmor (messageId) {
    const chase = (await this.chase)
    const allParticipants = (await chase.system.allParticipants()).all
    const participant = allParticipants.find(l => l.uuid === this.#participantId)
    if (participant) {
      const newValue = document.querySelector('[data-message-id="' + messageId + '"] input[type=text]')?.value
      if (typeof newValue !== 'undefined') {
        this.#targetArmor = newValue
      }
      this.#targetArmor = (await new Roll(this.#targetArmor, (participant.actor?.isToken ? participant.actor.token.actor : participant.actor)?.parsedValues() ?? {}).roll()).total
    }
  }

  /**
   * Add luck to existing pool
   * @param {integer} luckSpend
   * @returns {boolean}
   */
  async addLuck (luckSpend) {
    const chase = (await this.chase)
    const allParticipants = (await chase.system.allParticipants()).all
    const participant = allParticipants.find(l => l.uuid === this.#participantId)
    if (participant) {
      const newLuck = parseInt(participant.actor?.system.attribs.lck.value ?? 0, 10) - parseInt(luckSpend, 10)
      if (newLuck >= 0) {
        if (await participant.actor.spendLuck(luckSpend) !== false) {
          this.#dicePool.luckSpent = this.#dicePool.luckSpent + parseInt(luckSpend, 10)
          return true
        }
      }
    }
    return false
  }

  /**
   * Click Event
   * @param {ClickEvent} event
   * @param {Document} message
   */
  static async _onClickEvent (event, message) {
    switch (event.currentTarget?.dataset?.action) {
      case 'setValue':
        {
          const check = await CoC7ChatChaseObstacle.loadFromMessage(message)
          if (check) {
            switch (event.currentTarget.dataset.set) {
              case 'obstacle.barrier':
                check.#obstacle.isBarrier = true
                break
              case 'obstacle.hazard':
                check.#obstacle.isBarrier = false
                break
              case 'obstacle.hasHitPoints':
                check.#obstacle.hasHitPoints = !check.#obstacle.hasHitPoints
                break
              case 'consumeBonusDice':
                check.#consumeBonusDice = !check.#consumeBonusDice
                break
              case 'reflectObstacleChanges':
                check.#reflectObstacleChanges = !check.#reflectObstacleChanges
                break
              case 'obstacleDestroyed':
                check.#obstacleDestroyed = !check.#obstacleDestroyed
                break
              case 'ignoreArmor':
                check.#ignoreArmor = !check.#ignoreArmor
                break
              case 'obstacle.hasActionCost':
                check.#obstacle.hasActionCost = !check.#obstacle.hasActionCost
                break
              case 'obstacle.hasDamage':
                check.#obstacle.hasDamage = !check.#obstacle.hasDamage
                break
              case 'movePlayer':
                check.#movePlayer = !check.#movePlayer
                break
            }
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
          }
        }
        break
      case 'defineObstacle':
        {
          const check = await CoC7ChatChaseObstacle.loadFromMessage(message)
          if (check) {
            const name = document.querySelector('li.chat-message.message[data-message-id="' + message.id + '"] input[data-set="obstacle.name"]')
            if (name) {
              check.#obstacle.name = name.value
            }
            check.#obstacleDefined = true
            if (!check.#obstacle.isBarrier || (check.#obstacle.isBarrier && !check.#obstacle.hasHitPoints)) {
              check.#tryToNegotiate = true
              check.#tryToBreak = false
              check.#breakOrNegotiateDefined = true
            }
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
          }
        }
        break
      case 'tryToBreakDownObstacle':
        {
          const check = await CoC7ChatChaseObstacle.loadFromMessage(message)
          if (check) {
            check.#tryToNegotiate = false
            check.#tryToBreak = true
            check.#breakOrNegotiateDefined = true
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
          }
        }
        break
      case 'tryToNegotiateObstacle':
        {
          const check = await CoC7ChatChaseObstacle.loadFromMessage(message)
          if (check) {
            check.#tryToNegotiate = true
            check.#tryToBreak = false
            check.#breakOrNegotiateDefined = true
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
          }
        }
        break
      case 'cancelObstacleDefinition':
        {
          const check = await CoC7ChatChaseObstacle.loadFromMessage(message)
          if (check) {
            check.#obstacleDefined = false
            check.#tryToNegotiate = false
            check.#tryToBreak = false
            check.#breakOrNegotiateDefined = false
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
          }
        }
        break
      case 'takeCautiousApproach':
        {
          const check = await CoC7ChatChaseObstacle.loadFromMessage(message)
          if (check) {
            const chase = (await check.chase)
            const allParticipants = (await chase.system.allParticipants()).all
            const participant = allParticipants.find(l => l.uuid === check.#participantId)
            if (participant) {
              check.#totalCautiousApproach++
              check.#dicePool.poolModifier++
              check.#totalActionCost++
              check.#hasBonusDice = true
              if (participant.actions <= check.#totalActionCost) {
                check.#consumeBonusDice = false
                check.#cardResolved = true
                check.#movePlayer = false
              } else {
                check.#consumeBonusDice = true
              }
              check.updateMessage()
            } else {
              ui.notifications.warn('CoC7.Errors.UnparsableActor', { localize: true })
            }
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
          }
        }
        break
      case 'requestRoll':
        {
          const check = await CoC7ChatChaseObstacle.loadFromMessage(message)
          if (check) {
            check.#playerActionDefined = true
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
          }
        }
        break
      case 'askRollObstacleDamage':
        {
          const check = await CoC7ChatChaseObstacle.loadFromMessage(message)
          if (check) {
            check.#playerActionDefined = true
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
          }
        }
        break
      case 'rollObstacleDamage':
        {
          const check = await CoC7ChatChaseObstacle.loadFromMessage(message)
          if (check) {
            const chase = (await check.chase)
            const allParticipants = (await chase.system.allParticipants()).all
            const participant = allParticipants.find(l => l.uuid === check.#participantId)
            const listWeapons = participant.actorWeapons(check.#weaponOtherDamage)
            const weapon = listWeapons.find(w => w.value === check.#weaponKey)
            if (weapon) {
              const roll = await new Roll(weapon.damage.toString(), {}, { reason: 'obstacleDamage' }).roll()
              check.#obstacleDamageRolled = true
              check.message.rolls.push(roll)
              check.#totalActionCost++
              check.#cardResolved = true
              check.#totalObstacleDamage = roll.total
              check.#obstacleDestroyed = check.#obstacle.HitPoints <= check.#totalObstacleDamage
            }
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
          }
        }
        break
      case 'rollSkillCheck':
        if (!event.currentTarget.classList.contains('disabled')) {
          event.currentTarget.classList.add('disabled')
          const check = await CoC7ChatChaseObstacle.loadFromMessage(message)
          if (check) {
            await check.#dicePool.roll()
            check.#totalActionCost++
            if (check.#dicePool.isSuccess) {
              check.#movePlayer = true
              check.#cardResolved = true
            }
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
          }
        }
        break
      case 'rollArmor':
        {
          const check = await CoC7ChatChaseObstacle.loadFromMessage(message)
          if (check) {
            await check.rollArmor(message.id)
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableMessage', { localize: true })
          }
        }
        break
      case 'rollFailConsequences':
        {
          const check = await CoC7ChatChaseObstacle.loadFromMessage(message)
          if (check) {
            if (check.#obstacle.hasDamage && !check.#dicePool.isSuccess) {
              const roll = await new Roll(check.#obstacle.failedCheckDamage.toString(), {}, { reason: 'failedCheckDamage' }).roll()
              check.message.rolls.push(roll)
              check.#totalPlayerDamageTaken = Math.max(0, parseInt(roll.total, 10) - check.#targetArmor)
            }
            if (!check.#obstacle.isBarrier && check.#obstacle.hasActionCost && !check.#dicePool.isSuccess) {
              const roll = await new Roll(check.#obstacle.failedActionCost.toString(), {}, { reason: 'failedActionCost' }).roll()
              check.message.rolls.push(roll)
              check.#totalActionCost += (roll.total - 1) // 1 action already spend for skill check
            }
            check.#failedConsequencesRolled = true
            check.#cardResolved = true
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableMessage', { localize: true })
          }
        }
        break
      case 'luck':
        {
          const luckSpend = event.currentTarget?.dataset?.luckSpend
          if (luckSpend) {
            const check = await CoC7ChatChaseObstacle.loadFromMessage(message)
            if (await check.addLuck(parseInt(luckSpend, 10))) {
              check.updateMessage()
            }
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
          }
        }
        break
      case 'validateCard':
        {
          const check = await CoC7ChatChaseObstacle.loadFromMessage(message)
          if (check) {
            const chase = (await check.chase)
            const allParticipants = (await chase.system.allParticipants()).all
            const participant = allParticipants.find(l => l.uuid === check.#participantId)
            if (participant) {
              const obstacleUpdates = {
                obstacleDetails: {}
              }
              const participantUpdates = {}
              if (check.#reflectObstacleChanges) {
                const location = chase.system.locations.list.find(l => l.uuid === check.#locationId)
                if (location) {
                  const obstacle = foundry.utils.duplicate(check.#obstacle)
                  if (obstacle.isBarrier) {
                    obstacleUpdates.obstacleDetails.barrier = true
                    obstacleUpdates.obstacleDetails.hazard = false
                  } else {
                    obstacleUpdates.obstacleDetails.barrier = false
                    obstacleUpdates.obstacleDetails.hazard = true
                  }
                  delete obstacle.isBarrier
                  for (const k in obstacle) {
                    if (location.obstacleDetails[k] !== obstacle[k]) {
                      obstacleUpdates.obstacleDetails[k] = obstacle[k]
                    }
                  }
                }
              }
              if (check.#obstacleDestroyed) {
                obstacleUpdates.obstacle = false
                obstacleUpdates.obstacleDetails.hazard = false
                obstacleUpdates.obstacleDetails.barrier = false
              }

              if (check.#totalObstacleDamage > 0 && check.#obstacle.hasHitPoints) {
                obstacleUpdates.obstacleDetails.HitPoints = Math.max(0, parseInt(obstacleUpdates.obstacleDetails.HitPoints, 10) - check.#totalObstacleDamage)
              }

              if (check.#totalPlayerDamageTaken > 0) {
                if (participant.actor) {
                  await participant.actor.dealDamage(check.#totalPlayerDamageTaken, { ignoreArmor: true })
                } else {
                  participantUpdates.syntheticHp = Math.max(0, parseInt(participant.syntheticHp, 10) - check.#totalPlayerDamageTaken)
                }
              }

              if (check.#totalActionCost > 0) {
                participantUpdates.currentMovementActions = parseInt(participant.currentMovementActions, 10) - check.#totalActionCost
              }

              if (check.#consumeBonusDice) {
                participantUpdates.bonusDice = 0
              } else {
                participantUpdates.bonusDice = check.#dicePool.poolModifier
              }

              if (check.#movePlayer) {
                chase.system.moveParticipantToLocation(participant.uuid, check.#locationId, { render: false })
              }

              const changes = {
                system: {}
              }
              if (Object.keys(participantUpdates).length > 0) {
                changes.system.participants = foundry.utils.duplicate(chase.system.participants)
                const found = changes.system.participants.findIndex(p => p.uuid === participant.uuid)
                if (found > -1) {
                  changes.system.participants[found] = foundry.utils.mergeObject(changes.system.participants[found], participantUpdates)
                }
              }
              if (Object.keys(obstacleUpdates.obstacleDetails).length > 0 || Object.keys(obstacleUpdates).length > 1) {
                changes.system.locations = {
                  list: foundry.utils.duplicate(chase.system.locations.list)
                }
                const found = changes.system.locations.list.findIndex(p => p.uuid === check.#locationId)
                if (found > -1) {
                  changes.system.locations.list[found] = foundry.utils.mergeObject(changes.system.locations.list[found], obstacleUpdates)
                }
              }
              if (Object.keys(changes.system).length) {
                chase.update(changes, { render: false })
              }
              check.#closed = true
              await chase.system.activateNextParticipantTurn() // Render will be done there !
              check.updateMessage()
            }
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableMessage', { localize: true })
          }
        }
        break
    }
  }

  /**
   * Change Event
   * @param {ClickEvent} event
   * @param {Document} message
   */
  static async _onChangeEvent (event, message) {
    switch (event.currentTarget?.dataset?.changeSet) {
      case 'check-name':
        {
          const check = await CoC7ChatChaseObstacle.loadFromMessage(message)
          if (check) {
            check.#obstacle.checkName = event.currentTarget.value
            if (check.#obstacle.checkName !== event.currentTarget.value) {
              check.#checkThreshold = 1
            }
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
          }
        }
        break
      case 'bonusDice':
        {
          const check = await CoC7ChatChaseObstacle.loadFromMessage(message)
          if (check) {
            check.#dicePool.poolModifier = event.target.value
            CoC7Utilities.messageUpdatedThen(message.id, () => {
              setTimeout(() => {
                document.querySelector('[data-message-id="' + message.id + '"] input[type=range][name=bonusDice]').focus()
              }, 50)
            })
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableMessage', { localize: true })
          }
        }
        break
      case 'checkThreshold':
        {
          const check = await CoC7ChatChaseObstacle.loadFromMessage(message)
          if (check) {
            check.#checkThreshold = event.target.value
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
          }
        }
        break
      case 'weapon-key':
        {
          const check = await CoC7ChatChaseObstacle.loadFromMessage(message)
          if (check) {
            check.#weaponKey = event.target.value
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
          }
        }
        break
      case 'weaponOtherDamage':
        {
          const check = await CoC7ChatChaseObstacle.loadFromMessage(message)
          if (check) {
            check.#weaponOtherDamage = event.target.value
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
          }
        }
        break
      case 'targetArmor':
        {
          const check = await CoC7ChatChaseObstacle.loadFromMessage(message)
          if (check) {
            check.#targetArmor = event.target.value
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
          }
        }
        break
      case 'obstacle.failedActionCost':
        {
          const check = await CoC7ChatChaseObstacle.loadFromMessage(message)
          if (check) {
            check.#obstacle.failedActionCost = event.target.value
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
          }
        }
        break
      case 'obstacle.failedCheckDamage':
        {
          const check = await CoC7ChatChaseObstacle.loadFromMessage(message)
          if (check) {
            check.#obstacle.failedCheckDamage = event.target.value
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
          }
        }
        break
      case 'totalActionCost':
        {
          const check = await CoC7ChatChaseObstacle.loadFromMessage(message)
          if (check) {
            check.#obstacle.totalActionCost = event.target.value
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
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
    if (game.user.isGM) {
      html.querySelectorAll('[data-action]').forEach((element) => {
        element.addEventListener('click', event => CoC7ChatChaseObstacle._onClickEvent(event, message))
      })
      html.querySelectorAll('[data-change-set]').forEach((element) => {
        element.addEventListener('change', event => CoC7ChatChaseObstacle._onChangeEvent(event, message))
      })
      html.querySelectorAll('input[type=range]').forEach((element) => {
        element.addEventListener('change', event => CoC7ChatChaseObstacle._onChangeEvent(event, message))
      })
    }
  }

  /**
   * Create Message Data object
   * @returns {object}
   */
  async getTemplateData () {
    const chase = (await this.chase)
    const allParticipants = (await chase.system.allParticipants()).all
    const participant = allParticipants.find(l => l.uuid === this.#participantId)
    const actor = participant.actor
    const getRollableValue = await participant.getRollableValue(this.#obstacle.checkName)
    this.#dicePool.threshold = (getRollableValue.exiting ? getRollableValue.value : this.#checkThreshold)
    const data = {
      actionLost: false,
      actionLostText: '',
      actorImg: (actor ? (actor.isToken ? actor.token.texture.src : actor.img) : ''),
      actorName: (actor ? (actor.isToken ? actor.token.name : actor.name) : ''),
      actorUuid: CoC7Utilities.getActorUuid(actor),
      bonusDice: Math.abs(this.#dicePool.poolModifier),
      bonusType: game.i18n.localize(this.#dicePool.poolModifier < 0 ? 'CoC7.DiceModifierPenalty' : 'CoC7.DiceModifierBonus'),
      breakOrNegotiateDefined: this.#breakOrNegotiateDefined,
      buttons: this.#dicePool.availableButtons({ luckAvailable: (actor?.isToken ? actor.token.actor : actor)?.system.attribs.lck.value ?? 0, isPushable: false }),
      canTakeCautiousApproach: false,
      cardOpen: this.#cardOpen,
      cardResolved: this.#cardResolved,
      cautiousApproachType: '',
      chaseUuid: chase.uuid,
      checkFailed: '',
      checkRolled: this.#dicePool.isRolled,
      checkRollRequest: '',
      checkThreshold: this.#dicePool.threshold,
      closed: this.#closed,
      consumeBonusDice: this.#consumeBonusDice,
      damageTaken: '',
      diceGroups: this.#dicePool.diceGroups,
      displayActorOnCard: (actor ? game.settings.get(FOLDER_ID, 'displayActorOnCard') : false),
      displayResultType: game.settings.get(FOLDER_ID, 'displayResultType'),
      displayCheckSuccessLevel: game.settings.get(FOLDER_ID, 'displayCheckSuccessLevel'),
      existingCheckName: getRollableValue.exiting,
      failedActionCostRoll: '',
      failedConsequencesRolled: this.#failedConsequencesRolled,
      failedCheckDamageRoll: '',
      finalOutcome: '',
      flatDiceModifier: this.#dicePool.flatDiceModifier,
      flatThresholdModifier: this.#dicePool.flatThresholdModifier,
      foundryGeneration: game.release.generation,
      hasBonusDice: this.#hasBonusDice,
      ignoreArmor: this.#ignoreArmor,
      isArmorFormula: this.#isArmorFormula,
      isSuccess: this.#dicePool.isSuccess,
      listOptions: participant.listOptions,
      listWeapons: participant.actorWeapons(this.#weaponOtherDamage),
      luckSpent: this.#dicePool.luckSpent,
      movementActionArray: this.#movementActionArray,
      movePlayer: this.#movePlayer,
      obstacle: this.#obstacle,
      obstacleDamage: '',
      obstacleDamageRoll: '',
      obstacleDamageRolled: this.#obstacleDamageRolled,
      obstacleDamageTotal: 0,
      obstacleDefinedText: '',
      obstacleDefined: this.#obstacleDefined,
      obstacleDefinitionChanged: false,
      obstacleDestroyed: this.#obstacleDestroyed,
      obstaclePassed: '',
      playerActionDefined: this.#playerActionDefined,
      playerIntentions: '',
      poolModifier: this.#dicePool.poolModifier,
      reflectObstacleChanges: this.#reflectObstacleChanges,
      statuses: [{
        name: game.i18n.localize('CoC7.ActionCost') + ' :' + this.#totalActionCost
      }],
      targetArmor: this.#targetArmor,
      totalActionCost: this.#totalActionCost,
      totalCautiousApproach: this.#totalCautiousApproach,
      totalObstacleDamage: this.#totalObstacleDamage,
      totalPlayerDamageTaken: this.#totalPlayerDamageTaken,
      tryToBreak: this.#tryToBreak,
      tryToNegotiate: this.#tryToNegotiate,
      validCheck: false,
      validFailedRolls: false,
      validObstacleDamage: false,
      weaponKey: '',
      weaponName: '',
      weaponOtherDamage: this.#weaponOtherDamage
    }
    if (data.buttons.addBonus2 === true) {
      data.buttons.addBonus2 = false
    }
    if (data.buttons.addBonus1 === true) {
      data.buttons.addBonus1 = false
    }
    if (data.buttons.addPenalty1 === true) {
      data.buttons.addPenalty1 = false
    }
    if (data.buttons.addPenalty2 === true) {
      data.buttons.addPenalty2 = false
    }
    const weaponIndex = data.listWeapons.findIndex(w => w.value === this.#weaponKey)
    if (weaponIndex === -1) {
      this.#weaponKey = data.listWeapons[0].value
    } else {
      data.weaponName = data.listWeapons[weaponIndex].name + (data.listWeapons[weaponIndex].value === 'other' ? ' (' + data.listWeapons[weaponIndex].damage + ')' : '')
      data.validObstacleDamage = (this.#obstacle.hasHitPoints && !isNaN(Number(this.#obstacle.HitPoints)) && Number(this.#obstacle.HitPoints) > 0 && Roll.validate(data.listWeapons[weaponIndex].damage))
    }
    data.weaponKey = this.#weaponKey
    if (this.#dicePool.poolModifier < CoC7DicePool.maxDiceBonus && this.#totalActionCost < participant.actions) {
      data.canTakeCautiousApproach = true
    }
    if (this.#checkThreshold !== '' && !isNaN(Number(this.#checkThreshold))) {
      data.validCheck = true
    }
    if (this.#obstacleDefined) {
      if (this.#obstacle.isBarrier) {
        data.statuses.push({
          name: game.i18n.localize('CoC7.Barrier')
        })
        if (this.#obstacle.hasHitPoints) {
          data.statuses.push({
            name: game.i18n.localize('CoC7.Breakable')
          })
        }
      } else {
        data.statuses.push({
          name: game.i18n.localize('CoC7.Hazard')
        })
      }
      if (this.#tryToBreak) {
        let name = game.i18n.localize('CoC7.BreakDown')
        if (this.#obstacleDamageRolled) {
          const roll = this.message.rolls.find(r => r.options.reason === 'obstacleDamage')
          if (roll) {
            if (roll.total <= 0) {
              data.obstacleDamage = game.i18n.localize('CoC7.NoDamageDealt')
            } else {
              data.obstacleDamageRoll = roll.toAnchor().outerHTML
              data.obstacleDamage = game.i18n.format('CoC7.DamageDealt', {
                value: data.obstacleDamageRoll
              })
              data.obstacleDamageTotal = roll.total
              name += ': ' + roll.total
            }
          }
        }
        data.statuses.push({
          name
        })
      }
      if (this.#tryToNegotiate) {
        data.statuses.push({
          name: game.i18n.localize('CoC7.Negotiate')
        })
      }
      const location = chase.system.locations.list.find(l => l.uuid === this.#locationId)
      if (location) {
        const obstacle = foundry.utils.duplicate(this.#obstacle)
        if (obstacle.isBarrier) {
          obstacle.barrier = true
          obstacle.hazard = false
        } else {
          obstacle.barrier = false
          obstacle.hazard = true
        }
        delete obstacle.isBarrier
        data.obstacleDefinitionChanged = !Object.keys(this.#obstacle).every(k => location.obstacleDetails[k] === obstacle[k])
      }
      data.validFailedRolls = (this.#obstacle.isBarrier || !this.#obstacle.hasActionCost || Roll.validate(this.#obstacle.failedActionCost.toString())) && (!this.#obstacle.hasDamage || Roll.validate(this.#obstacle.failedCheckDamage.toString()))
      data.obstacleDefinedText = game.i18n.format('CoC7.FacingObstacle', { type: game.i18n.localize(this.#obstacle.isBarrier ? 'CoC7.ABarrier' : 'CoC7.AHazard') })
      if (this.#obstacle.name) {
        data.obstacleDefinedText += ' (' + this.#obstacle.name + ')'
      }
      if (this.#playerActionDefined) {
        if (!this.#obstacle.isBarrier) {
          data.playerIntentions = game.i18n.localize('CoC7.TryToNegotiateHazard')
        } else if (this.#tryToNegotiate) {
          data.playerIntentions = game.i18n.localize('CoC7.TryToGetPastBarriers')
        } else if (this.#tryToBreak) {
          data.playerIntentions = game.i18n.localize('CoC7.TryToBreak')
        }
      }

      if (this.#totalCautiousApproach) {
        const cautiousStatus = {
          name: game.i18n.localize('CoC7.Cautious'),
          css: ''
        }
        if (this.#totalCautiousApproach > 1) {
          cautiousStatus.css = 'strong'
          data.cautiousApproachType = game.i18n.localize('CoC7.BeingVeryCautious')
        } else {
          data.cautiousApproachType = game.i18n.localize('CoC7.BeingCautious')
        }
        if (this.#consumeBonusDice) {
          cautiousStatus.css += ' consume'
        }
        data.statuses.push(cautiousStatus)
      }
      if (this.#playerActionDefined && !data.checkRolled && !this.#tryToBreak) {
        data.checkRollRequest = game.i18n.format('CoC7.AskRoll', {
          name: this.#obstacle.checkName,
          value: data.checkThreshold
        })
        if (this.#dicePool.poolModifier > 0) {
          data.checkRollRequest += ' (+' + this.#dicePool.poolModifier + ')'
        } else if (this.#dicePool.poolModifier < 0) {
          data.checkRollRequest += ' (' + this.#dicePool.poolModifier + ')'
        }
      }
      if (data.checkRolled) {
        if (!this.#obstacle.isBarrier) {
          this.#movePlayer = true // On hazard, you pass even if you fail your roll
        }
        if (this.#dicePool.isSuccess) {
          this.#movePlayer = true
          data.obstaclePassed = game.i18n.localize('CoC7.ObstaclePassed')
          if (this.#dicePool.luckSpent) {
            data.obstaclePassed += ' (' + game.i18n.localize('CoC7.GotLucky') + ')'
          }
          data.statuses.push({
            name: game.i18n.localize('CoC7.Success'),
            css: 'success'
          })
        } else {
          if (this.#dicePool.isFumble) {
            data.checkFailed = game.i18n.localize('CoC7.ObstacleFumble')
            data.statuses.push({
              name: game.i18n.localize('CoC7.Fumble'),
              css: 'fumble'
            })
          } else {
            data.checkFailed = game.i18n.localize('CoC7.ObstacleFail')
            data.statuses.push({
              name: game.i18n.localize('CoC7.Failure'),
              css: 'failure'
            })
          }
          const roll = this.message.rolls.find(r => r.options.reason === 'failedCheckDamage')
          if (roll) {
            data.failedCheckDamageRoll = roll.toAnchor().outerHTML
            if (this.#totalPlayerDamageTaken === 0) {
              data.damageTaken = game.i18n.localize('CoC7.YouTakeNoDamage')
            } else {
              data.damageTaken = game.i18n.format('CoC7.YouTakeSomeDamage', { amount: this.#totalPlayerDamageTaken })
            }
            data.statuses.push({
              name: game.i18n.localize('CoC7.TotalDamage') + ' :' + this.#totalPlayerDamageTaken
            })
          }
          if (!this.#obstacle.isBarrier && this.#obstacle.hasActionCost) {
            const roll = this.message.rolls.find(r => r.options.reason === 'failedActionCost')
            if (roll) {
              data.failedActionCostRoll = roll.toAnchor().outerHTML
              data.actionLost = true
              data.actionLostText = game.i18n.localize('CoC7.YouLostTime')
            }
          }
        }
      }
      if (this.#cardResolved) {
        data.statuses.push({
          name: game.i18n.localize('CoC7.CardResolved')
        })
      }
      if (this.#closed) {
        if (this.#movePlayer) {
          data.finalOutcome = game.i18n.localize('CoC7.MoveToLocation')
        } else {
          data.finalOutcome = game.i18n.localize('CoC7.NotMovingToLocation')
        }
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
    let chatData = {
      flags: {
        [FOLDER_ID]: {
          load: {
            as: 'CoC7ChatChaseObstacle',
            actorUuid: data.actorUuid,
            breakOrNegotiateDefined: this.#breakOrNegotiateDefined,
            cardOpen: this.#cardOpen,
            cardResolved: this.#cardResolved,
            chaseUuid: data.chaseUuid,
            checkThreshold: this.#checkThreshold,
            closed: this.#closed,
            consumeBonusDice: this.#consumeBonusDice,
            dicePool: this.#dicePool.toObject(),
            failedConsequencesRolled: this.#failedConsequencesRolled,
            forward: this.#forward,
            hasBonusDice: this.#hasBonusDice,
            ignoreArmor: this.#ignoreArmor,
            locationId: this.#locationId,
            movementActionArray: this.#movementActionArray,
            movePlayer: this.#movePlayer,
            obstacle: this.#obstacle,
            obstacleDamageRolled: this.#obstacleDamageRolled,
            obstacleDefined: this.#obstacleDefined,
            obstacleDestroyed: this.#obstacleDestroyed,
            participantId: this.#participantId,
            playerActionDefined: this.#playerActionDefined,
            reflectObstacleChanges: this.#reflectObstacleChanges,
            targetArmor: this.#targetArmor,
            totalActionCost: this.#totalActionCost,
            totalCautiousApproach: this.#totalCautiousApproach,
            totalObstacleDamage: this.#totalObstacleDamage,
            totalPlayerDamageTaken: this.#totalPlayerDamageTaken,
            tryToBreak: this.#tryToBreak,
            tryToNegotiate: this.#tryToNegotiate,
            weaponKey: this.#weaponKey,
            weaponOtherDamage: this.#weaponOtherDamage
          }
        }
      },
      rolls: (this.message?.rolls ?? []).concat(this.#dicePool.newRolls),
      /* // FoundryVTT V12 */
      content: await (foundry.applications.handlebars?.renderTemplate ?? renderTemplate)('systems/' + FOLDER_ID + '/templates/chat/chase-obstacle.hbs', data)
    }
    chatData = ChatMessage.applyRollMode(chatData, game.settings.get('core', 'rollMode'))
    return chatData
  }

  /**
   * Create CoC7ChatCombatMelee from message
   * @param {Document} message
   * @returns {CoC7ChatCombatMelee}
   */
  static async loadFromMessage (message) {
    const keys = [
      'breakOrNegotiateDefined',
      'cardOpen',
      'cardResolved',
      'chaseUuid',
      'checkThreshold',
      'closed',
      'consumeBonusDice',
      'failedConsequencesRolled',
      'forward',
      'locationId',
      'hasBonusDice',
      'ignoreArmor',
      'movementActionArray',
      'movePlayer',
      'obstacle',
      'obstacleDamageRolled',
      'obstacleDefined',
      'obstacleDestroyed',
      'participantId',
      'playerActionDefined',
      'reflectObstacleChanges',
      'targetArmor',
      'totalActionCost',
      'totalCautiousApproach',
      'totalObstacleDamage',
      'tryToBreak',
      'tryToNegotiate',
      'weaponKey',
      'weaponOtherDamage'
    ]
    if (message.id && message.flags[FOLDER_ID]?.load?.as === 'CoC7ChatChaseObstacle' && keys.every(k => typeof message.flags[FOLDER_ID]?.load?.[k] !== 'undefined') && CoC7DicePool.isValidPool(message.flags[FOLDER_ID]?.load?.dicePool)) {
      const check = new CoC7ChatChaseObstacle()
      check.message = message
      const load = foundry.utils.duplicate(message.flags[FOLDER_ID].load)
      check.chase = load.chaseUuid
      check.#breakOrNegotiateDefined = load.breakOrNegotiateDefined
      check.#cardOpen = load.cardOpen
      check.#cardResolved = load.cardResolved
      check.#checkThreshold = load.checkThreshold
      check.#closed = load.closed
      check.#consumeBonusDice = load.consumeBonusDice
      check.#dicePool = CoC7DicePool.fromObject(load.dicePool)
      check.#failedConsequencesRolled = load.failedConsequencesRolled
      check.#forward = load.forward
      check.#locationId = load.locationId
      check.#hasBonusDice = load.hasBonusDice
      check.#ignoreArmor = load.ignoreArmor
      check.#movementActionArray = load.movementActionArray
      check.#movePlayer = load.movePlayer
      check.#obstacle = load.obstacle
      check.#obstacleDamageRolled = load.obstacleDamageRolled
      check.#obstacleDefined = load.obstacleDefined
      check.#obstacleDestroyed = load.obstacleDestroyed
      check.#participantId = load.participantId
      check.#playerActionDefined = load.playerActionDefined
      check.#reflectObstacleChanges = load.reflectObstacleChanges
      check.#targetArmor = load.targetArmor
      check.#totalActionCost = load.totalActionCost
      check.#totalCautiousApproach = load.totalCautiousApproach
      check.#totalObstacleDamage = load.totalObstacleDamage
      check.#tryToBreak = load.tryToBreak
      check.#tryToNegotiate = load.tryToNegotiate
      check.#weaponKey = load.weaponKey
      check.#weaponOtherDamage = load.weaponOtherDamage
      return check
    }
    ui.notifications.warn('CoC7.Errors.UnableToLoadMessage', { localize: true })
    throw new Error('CoC7.Errors.UnableToLoadMessage')
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
      const chase = await fromUuid(dataSet.data.chaseUuid)
      const participant = chase.participants?.find(p => p.uuid === dataSet.data.participantUuid)
      const update = {
        ['flags.' + FOLDER_ID + '.load.as']: 'CoC7ChatChaseObstacle',
        ['flags.' + FOLDER_ID + '.load.actorUuid']: participant?.docUuid ?? '',
        ['flags.' + FOLDER_ID + '.load.breakOrNegotiateDefined']: dataSet.data.states?.breakOrNegotiateDefined ?? false,
        ['flags.' + FOLDER_ID + '.load.cardOpen']: true,
        ['flags.' + FOLDER_ID + '.load.cardResolved']: dataSet.data.states?.cardResolved ?? false,
        ['flags.' + FOLDER_ID + '.load.chaseUuid']: dataSet.data.chaseUuid,
        ['flags.' + FOLDER_ID + '.load.checkThreshold']: dataSet.data.checkThreshold ?? 1,
        ['flags.' + FOLDER_ID + '.load.closed']: dataSet.data.states?.cardResolved ?? false,
        ['flags.' + FOLDER_ID + '.load.consumeBonusDice']: dataSet.data.flags?.consumeBonusDice ?? false,
        ['flags.' + FOLDER_ID + '.load.dicePool.bonusCount']: 0, //
        ['flags.' + FOLDER_ID + '.load.dicePool.currentPoolModifier']: 0, //
        ['flags.' + FOLDER_ID + '.load.dicePool.difficulty']: 1, //
        ['flags.' + FOLDER_ID + '.load.dicePool.flatDiceModifier']: 0, //
        ['flags.' + FOLDER_ID + '.load.dicePool.flatThresholdModifier']: 0, //
        ['flags.' + FOLDER_ID + '.load.dicePool.luckSpent']: 0, //
        ['flags.' + FOLDER_ID + '.load.dicePool.groups']: [], //
        ['flags.' + FOLDER_ID + '.load.dicePool.penaltyCount']: 0, //
        ['flags.' + FOLDER_ID + '.load.dicePool.rolledDice']: [{
          rolled: true, //
          baseDie: 9, //
          bonusDice: [], //
          penaltyDice: [], //
          unitDie: 10 //
        }],
        ['flags.' + FOLDER_ID + '.load.dicePool.suppressRollData']: false,
        ['flags.' + FOLDER_ID + '.load.dicePool.threshold']: dataSet.data.checkThreshold ?? 1,
        ['flags.' + FOLDER_ID + '.load.failedConsequencesRolled']: dataSet.data.states?.failedConsequencesRolled ?? false,
        ['flags.' + FOLDER_ID + '.load.forward']: dataSet.data.forward ?? false,
        ['flags.' + FOLDER_ID + '.load.hasBonusDice']: dataSet.data.flags?.hasBonusDice ?? false,
        ['flags.' + FOLDER_ID + '.load.ignoreArmor']: dataSet.data.flags?.ignoreArmor ?? false,
        ['flags.' + FOLDER_ID + '.load.locationId']: dataSet.data.locationUuid ?? '',
        ['flags.' + FOLDER_ID + '.load.movementActionArray']: dataSet.data.movementActionArray ?? [],
        ['flags.' + FOLDER_ID + '.load.movePlayer']: dataSet.data.movePlayer ?? [],
        ['flags.' + FOLDER_ID + '.load.obstacle.checkName']: dataSet.data.obstacle?.checkName ?? '',
        ['flags.' + FOLDER_ID + '.load.obstacle.failedActionCost']: dataSet.data.obstacle?.failedActionCost ?? '0',
        ['flags.' + FOLDER_ID + '.load.obstacle.failedCheckDamage']: dataSet.data.obstacle?.failedCheckDamage ?? '0',
        ['flags.' + FOLDER_ID + '.load.obstacle.hasActionCost']: dataSet.data.obstacle?.hasActionCost ?? false,
        ['flags.' + FOLDER_ID + '.load.obstacle.hasDamage']: dataSet.data.obstacle?.hasDamage ?? false,
        ['flags.' + FOLDER_ID + '.load.obstacle.hasHitPoints']: dataSet.data.obstacle?.hasHitPoints ?? false,
        ['flags.' + FOLDER_ID + '.load.obstacle.HitPoints']: dataSet.data.obstacle?.HitPoints ?? 0,
        ['flags.' + FOLDER_ID + '.load.obstacle.isBarrier']: dataSet.data.obstacle?.barrier ?? false,
        ['flags.' + FOLDER_ID + '.load.obstacle.name']: dataSet.data.obstacle?.name ?? '',
        ['flags.' + FOLDER_ID + '.load.obstacleDamageRolled']: dataSet.data.states?.obstacleDamageRolled ?? false,
        ['flags.' + FOLDER_ID + '.load.obstacleDefined']: dataSet.data.states?.obstacleDefined ?? false,
        ['flags.' + FOLDER_ID + '.load.obstacleDestroyed']: false,
        ['flags.' + FOLDER_ID + '.load.participantId']: dataSet.data.participantUuid,
        ['flags.' + FOLDER_ID + '.load.playerActionDefined']: dataSet.data.states?.playerActionDefined ?? false,
        ['flags.' + FOLDER_ID + '.load.reflectObstacleChanges']: false,
        ['flags.' + FOLDER_ID + '.load.targetArmor']: dataSet.data.armor ?? 0,
        ['flags.' + FOLDER_ID + '.load.totalActionCost']: dataSet.data.totalActionCost ?? 0,
        ['flags.' + FOLDER_ID + '.load.totalCautiousApproach']: dataSet.data.totalCautiousApproach ?? 0,
        ['flags.' + FOLDER_ID + '.load.totalObstacleDamage']: dataSet.data.totalObstacleDamage ?? 0,
        ['flags.' + FOLDER_ID + '.load.closed']: dataSet.data.totalPlayerDamageTaken ?? 0,
        ['flags.' + FOLDER_ID + '.load.tryToBreak']: dataSet.data.states?.tryToBreak ?? false,
        ['flags.' + FOLDER_ID + '.load.tryToNegotiate']: dataSet.data.states?.tryToNegotiate ?? false,
        ['flags.' + FOLDER_ID + '.load.weaponKey']: dataSet.data.weaponChoice ?? '',
        ['flags.' + FOLDER_ID + '.load.weaponOtherDamage']: dataSet.data.customWeaponDamage ?? ''
      }
      const merged = foundry.utils.mergeObject(message, update, { inplace: false })
      const check = await CoC7ChatChaseObstacle.loadFromMessage(merged)
      const data = await check.getTemplateData()
      update.content = await (foundry.applications.handlebars?.renderTemplate ?? renderTemplate)('systems/' + FOLDER_ID + '/templates/chat/chase-obstacle.hbs', data)
      update._id = message.id
      updates.push(update)
    }
  }
}
