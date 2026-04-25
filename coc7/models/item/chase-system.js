/* global canvas CONST foundry fromUuid game PIXI ui */
import { FOLDER_ID } from '../../constants.js'
import CoC7ChaseParticipant from '../chase/participant.js'
import CoC7ChatChaseObstacle from '../../apps/chat-chase-obstacle.js'
import CoC7DicePool from '../../apps/dice-pool.js'
import CoC7ModelsItemChaseSheet from './chase-sheet.js'
import CoC7ModelsItemGlobalSystem from './global-system.js'
import CoC7SystemSocket from '../../apps/system-socket.js'
import CoC7Utilities from '../../apps/utilities.js'

export default class CoC7ModelsItemChaseSystem extends CoC7ModelsItemGlobalSystem {
  /**
   * Default img
   * @returns {string}
   */
  static get defaultImg () {
    return 'systems/' + FOLDER_ID + '/assets/icons/running-solid.svg'
  }

  /**
   * Create Schema
   * @returns {DataSchema}
   */
  static defineSchema () {
    const fields = foundry.data.fields
    return {
      description: new fields.SchemaField({
        keeper: new fields.HTMLField({ initial: '' })
      }),
      locations: new fields.SchemaField({
        total: new fields.NumberField({ initial: 0 }),
        list: new fields.ArrayField(
          new fields.SchemaField({
            uuid: new fields.StringField({
              validate: value => {
                if (!foundry.data.validators.isValidId(value)) {
                  throw new Error('must be a valid 16-character alphanumeric ID')
                }
              }
            }),
            name: new fields.StringField({ initial: '' }),
            obstacleDetails: new fields.SchemaField({
              barrier: new fields.BooleanField({ initial: false }),
              hazard: new fields.BooleanField({ initial: false }),
              name: new fields.StringField({ initial: '' }),
              checkName: new fields.StringField({ initial: '' }),
              hasDamage: new fields.BooleanField({ initial: false }),
              failedCheckDamage: new fields.StringField({ initial: '' }),
              hasHitPoints: new fields.BooleanField({ initial: false }),
              HitPoints: new fields.StringField({ initial: '' }),
              hasActionCost: new fields.BooleanField({ initial: false }),
              failedActionCost: new fields.StringField({ initial: '' })
            }),
            obstacle: new fields.BooleanField({ initial: false }),
            init: new fields.BooleanField({ initial: false }),
            participants: new fields.ArrayField(
              new fields.StringField({
                validate: value => {
                  if (!foundry.data.validators.isValidId(value)) {
                    throw new Error('must be a valid 16-character alphanumeric ID')
                  }
                }
              })
            ),
            active: new fields.BooleanField({ initial: false }),
            coordinates: new fields.SchemaField({
              x: new fields.NumberField({ }),
              y: new fields.NumberField({ }),
              scene: new fields.DocumentUUIDField({ })
            })
          })
        )
      }),
      includeEscaped: new fields.BooleanField({ initial: false }),
      includeLatecomers: new fields.BooleanField({ initial: false }),
      showTokenMovement: new fields.BooleanField({ initial: true }),
      startingRange: new fields.NumberField({ initial: 2 }),
      startingIndex: new fields.NumberField({ initial: 0 }),
      started: new fields.BooleanField({ initial: false }),
      vehicle: new fields.BooleanField({ initial: false }),
      participants: new fields.ArrayField(
        new fields.SchemaField({
          uuid: new fields.StringField({
            validate: value => {
              if (!foundry.data.validators.isValidId(value)) {
                throw new Error('must be a valid 16-character alphanumeric ID')
              }
            }
          }),
          docUuid: new fields.DocumentUUIDField({ }),
          initiative: new fields.StringField({ initial: game.i18n.localize('CHARAC.Dexterity') }),
          dex: new fields.NumberField({ initial: 0 }), // Not actually dex but initiative value
          chaser: new fields.BooleanField({ initial: false }),
          name: new fields.StringField({ initial: '' }),
          mov: new fields.NumberField({ nullable: false, initial: 0 }),
          speedCheck: new fields.SchemaField({
            name: new fields.StringField({ initial: game.i18n.localize('CHARAC.Constitution') }),
            score: new fields.NumberField({ nullable: false, initial: 0 }),
            checkData: new fields.JSONField({ nullable: true })
          }),
          syntheticHp: new fields.NumberField({ initial: 0 }),
          currentMovementActions: new fields.NumberField({ initial: 0 }),
          bonusDice: new fields.NumberField({ initial: 0 }),
          hasAGunReady: new fields.BooleanField({ initial: false }),
          active: new fields.BooleanField({ initial: false })
        })
      )
    }
  }

  /**
   * Process and get all participants
   * @returns {object}
   */
  async allParticipants () {
    const participants = await Promise.all(this.participants.map(async (p, offset) => {
      const participant = new CoC7ChaseParticipant(this.participants, offset)
      await participant.loadUuids()
      return participant
    }))
    const groups = participants.reduce((c, p) => { c[p.chaser ? 'chaser' : 'prey'].push(p.adjustedMov); return c }, { chaser: [], prey: [] })
    let maxChaserMov = 0
    let minChaserMov = 0
    let maxPreyMov = 0
    let minPreyMov = 0
    let minimum = 0
    if (groups.chaser.length && groups.prey.length) {
      maxChaserMov = Math.max(...groups.chaser)
      minChaserMov = Math.min(...groups.chaser)
      minPreyMov = Math.min(...groups.prey)
      maxPreyMov = Math.max(...groups.prey)
      minimum = Math.min(minChaserMov, minPreyMov)
    }
    for (const offset in participants) {
      participants[offset].actions = minimum
      participants[offset].setFastSlow({ fastestChaser: maxChaserMov, slowestPrey: minPreyMov, includeEscaped: this.includeEscaped, includeLatecomers: this.includeLatecomers })
    }
    return {
      all: participants,
      maxChaserMov,
      minChaserMov,
      maxPreyMov,
      minPreyMov
    }
  }

  /**
   * Do all participants have speed rolls
   * @returns {boolean}
   */
  get allHaveValidMov () {
    for (const participant of this.participants) {
      if (isNaN(Number(participant.mov))) {
        return false
      }
    }
    return true
  }

  /**
   * Do all participants have speed rolls
   * @returns {boolean}
   */
  get allHaveSpeedRoll () {
    for (const participant of this.participants) {
      if (CoC7DicePool.isValidPool(participant.speedCheck?.checkData?.flags?.[FOLDER_ID]?.load?.dicePool)) {
        const dicePool = CoC7DicePool.fromObject(participant.speedCheck.checkData.flags[FOLDER_ID].load.dicePool)
        if (!dicePool.isRolled) {
          return false
        }
      } else {
        return false
      }
    }
    return true
  }

  /**
   * If next participant activate it
   */
  async activateNextParticipantTurn () {
    const participantUuid = await this.nextActiveParticipant()
    if (participantUuid) {
      await this.activateParticipant(participantUuid)
    } else {
      const participants = foundry.utils.duplicate(this.participants)
      const activeIndex = participants.findIndex(p => p.active)
      if (activeIndex > -1) {
        participants[activeIndex].active = false
        await this.parent.update({ 'system.participants': participants })
      }
    }
  }

  /**
   * Progress to next round
   */
  async progressToNextRound () {
    const participants = foundry.utils.duplicate(this.participants)
    const participantsAll = await this.allParticipants()
    participantsAll.all.sort(CoC7Utilities.sortByInitiative)
    for (const offset in participants) {
      const offset2 = participantsAll.all.findIndex(p => p.uuid === participants[offset].uuid)
      if (offset2 > -1) {
        participants[offset].currentMovementActions = Math.min(participantsAll.all[offset2].actions, parseInt(participants[offset].currentMovementActions, 10) + participantsAll.all[offset2].actions)
        participants[offset].active = (offset2 === 0)
      }
    }
    await this.parent.update({ 'system.participants': participants })
  }

  /**
   * Set next active participant
   * @returns {string|undefined}
   */
  async nextActiveParticipant () {
    if (!this.started) {
      return undefined
    }
    const participants = await this.allParticipants()
    participants.all.sort(CoC7Utilities.sortByInitiative)
    const participantUuid = participants.all.find(p => p.currentMovementActions > 0)
    return participantUuid?.uuid
  }

  /**
   * Take a movement action from assistant participant and give a bonus die to beneficiary participant
   * @param {string} assistantUuid
   * @param {string} beneficiaryUuid
   */
  async assistParticipant (assistantUuid, beneficiaryUuid) {
    const participants = foundry.utils.duplicate(this.participants)
    const assistantIndex = participants.findIndex(p => p.uuid === assistantUuid)
    const beneficiaryIndex = participants.findIndex(p => p.uuid === beneficiaryUuid)
    if (assistantIndex === -1 || beneficiaryIndex === -1) {
      ui.notifications.error('CoC7.ParticipantNotFound', { localize: true })
      return
    }
    if (participants[beneficiaryIndex].bonusDice >= CoC7DicePool.maxDiceBonus) {
      /* // FoundryVTT V12 */
      ui.notifications.error(game.i18n.format('CoC7.ErrorBeneficiaryAtMaxBonus', { name: participants[beneficiaryIndex].name }))
      return
    }
    if (participants[assistantIndex].currentMovementActions < 1) {
      /* // FoundryVTT V12 */
      ui.notifications.error(game.i18n.format('CoC7.ParticipantNotEnoughMovement', { assistantUuid, actions: participants[assistantIndex].currentMovementActions }))
      return
    }
    participants[beneficiaryIndex].bonusDice++
    participants[assistantIndex].currentMovementActions--
    await this.parent.update({ 'system.participants': participants })
  }

  /**
   * Set participant as active for an action
   * @param {string|undefined} participantUuid
   */
  async activateParticipant (participantUuid) {
    const locations = foundry.utils.duplicate(this.locations.list)
    const participants = foundry.utils.duplicate(this.participants)
    const participantIndex = participants.findIndex(p => p.uuid === participantUuid)
    const activeIndex = participants.findIndex(p => p.active)
    if (participantIndex > -1 || activeIndex > -1) {
      if (activeIndex > -1) {
        participants[activeIndex].active = false
      }
      if (participantIndex > -1) {
        participants[participantIndex].active = true
        const activeIndex = locations.findIndex(p => p.active)
        if (activeIndex > -1) {
          locations[activeIndex].active = false
        }
        const locationIndex = locations.findIndex(l => l.participants.includes(participants[participantIndex].uuid))
        if (locationIndex > -1) {
          locations[locationIndex].active = true
        }
      }
      await this.parent.update({ 'system.participants': participants, 'system.locations.list': locations })
    }
  }

  /**
   * Convert one action into a bonus die
   * @param {string} participantUuid
   */
  async cautiousApproach (participantUuid) {
    const participants = foundry.utils.duplicate(this.participants)
    const offset = participants.findIndex(p => p.uuid === participantUuid)
    if (offset === -1) {
      /* // FoundryVTT V12 */
      ui.notifications.error(game.i18n.format('CoC7.ParticipantUuidNotFound', { participantUuid }))
      return
    }
    if (participants[offset].bonusDice >= CoC7DicePool.maxDiceBonus) {
      /* // FoundryVTT V12 */
      ui.notifications.error(game.i18n.format('CoC7.ErrorBeneficiaryAtMaxBonus', { name: participants[offset].name }))
      return
    }
    if (participants[offset].currentMovementActions < 1) {
      /* // FoundryVTT V12 */
      ui.notifications.error(game.i18n.format('CoC7.ParticipantNotEnoughMovement', { assistantUuid: participantUuid, actions: participants[offset].currentMovementActions }))
      return
    }
    participants[offset].bonusDice++
    participants[offset].currentMovementActions--
    await this.parent.update({ 'system.participants': participants })
  }

  /**
   * Remove a single bonus die?
   * @param {string} participantUuid
   * @param {integer} diceNumber
   */
  async toggleBonusDice (participantUuid, diceNumber) {
    const participants = foundry.utils.duplicate(this.participants)
    const offset = participants.findIndex(p => p.uuid === participantUuid)
    if (offset === -1) {
      /* // FoundryVTT V12 */
      ui.notifications.error(game.i18n.format('CoC7.ParticipantUuidNotFound', { participantUuid }))
      return
    }
    participants[offset].bonusDice--
    await this.parent.update({ 'system.participants': participants })
  }

  /**
   * Trigger Chat Message for selected location
   * @param {string} locationId
   */
  activeParticipantObstacleCheck (locationId) {
    CoC7ChatChaseObstacle.createMessage({ chaseUuid: this.parent.uuid, locationId, participantId: this.participants.find(p => p.active).uuid, forward: locationId !== this.activeLocation.uuid })
  }

  /**
   * Process callback
   * @param {CoC7Check} check
   */
  async updateRoll (check) {
    if (check.isRolled) {
      if (this.parent.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)) {
        switch (check.callbackContext.type) {
          case 'speedCheck':
            {
              const participants = foundry.utils.duplicate(this.participants)
              const offset = participants.findIndex(l => l.uuid === check.callbackContext.participant)
              if (offset > -1) {
                const chatData = await check.getChatData()
                delete chatData.content
                for (const offset in chatData.rolls) {
                  chatData.rolls[offset] = JSON.stringify(chatData.rolls[offset])
                }
                participants[offset].speedCheck.checkData = chatData
                await this.parent.update({ 'system.participants': participants })
              }
            }
            break
        }
      } else {
        CoC7SystemSocket.requestKeeperAction({
          type: 'callbackCheck',
          messageId: check.message.id
        })
      }
    }
  }

  /**
   * Process and get all locations
   * @returns {object}
   */
  async allLocations () {
    const locations = foundry.utils.duplicate(this.locations.list)
    if (locations.length && !this.started && this.startingRange > 0) {
      locations.unshift(...Array.apply(null, Array(this.startingRange)).map(l => {
        return {
          uuid: foundry.utils.randomID(),
          initialLocation: true,
          participants: []
        }
      }))
      const participants = await this.allParticipants()
      for (const participant of participants.all) {
        if (participant.chaser) {
          locations[participant.adjustedMov - participants.minChaserMov].participants.push(participant.uuid)
        } else {
          locations[participant.adjustedMov - participants.minPreyMov + this.startingRange + this.startingIndex].participants.push(participant.uuid)
        }
      }
    }
    return locations
  }

  /**
   * Set dynamic options on location
   * @param {integer} offset
   * @returns {object}
   */
  #processLocation (offset) {
    const location = foundry.utils.duplicate(this.locations.list[offset] ?? false)
    if (location) {
      location.hasCoordinates = location.coordinates.x && location.coordinates.y
      location.hasPrevious = offset > 0
      location.hasNext = offset < this.locations.list.length
    }
    return location
  }

  /**
   * Get new location
   * @returns {object}
   */
  get activeLocation () {
    const offset = this.locations.list.findIndex(l => l.active)
    if (offset === -1) {
      return undefined
    }
    return this.#processLocation(offset)
  }

  /**
   * Get new location
   * @returns {object}
   */
  get nextLocation () {
    const offset = this.locations.list.findIndex(l => l.active)
    if (offset === -1) {
      return undefined
    }
    return this.#processLocation(offset + 1)
  }

  /**
   * Set scene position information for location
   * @param {object} options
   * @param {string} options.locationId
   * @param {integer} options.x
   * @param {integer} options.y
   * @param {string} options.sceneUuid
   */
  async setLocationCoordinates ({ locationId, x, y, sceneUuid } = {}) {
    const locations = foundry.utils.duplicate(this.locations.list)
    const offset = locations.findIndex(l => l.uuid === locationId)
    if (offset === -1) {
      return
    }
    locations[offset].coordinates = { x, y, scene: sceneUuid }
    await this.parent.update({ 'system.locations.list': locations })
  }

  /**
   * Clear scene position information for active location
   */
  async clearActiveLocationCoordinates () {
    const locations = foundry.utils.duplicate(this.locations.list)
    const offset = locations.findIndex(l => l.active)
    if (offset === -1) {
      return
    }
    locations[offset].coordinates = { x: null, y: null, scene: null }
    await this.parent.update({ 'system.locations.list': locations })
  }

  /**
   * Start the chase
   */
  async cutToTheChase () {
    if (!this.allHaveSpeedRoll) {
      ui.notifications.warn('CoC7.NotAllHaveSpeedRoll', { localize: true })
      return
    }
    const participants = await this.allParticipants()
    const hasChaserAndPrey = {
      chaser: false,
      prey: false
    }
    const movementActions = {}
    for (const participant of participants.all) {
      movementActions[participant.uuid] = participant.actions
      hasChaserAndPrey[participant.chaser ? 'chaser' : 'prey'] = true
    }
    participants.all.sort(CoC7Utilities.sortByInitiative)
    const firstParticipantId = participants.all[0].uuid
    if (!Object.values(hasChaserAndPrey).reduce((c, b) => c && b, true)) {
      ui.notifications.warn('CoC7.NeedMin2Participants', { localize: true })
      return
    }
    if (this.allHaveValidMov) {
      const locations = await this.allLocations()
      const participants = foundry.utils.duplicate(this.participants)
      for (const offset in participants) {
        participants[offset].active = participants[offset].uuid === firstParticipantId
        participants[offset].currentMovementActions = movementActions[participants[offset].uuid]
      }
      await this.parent.update({ 'system.started': true, 'system.locations.list': locations, 'system.participants': participants })
      // Resize and select tab for this sheet
      for (const instances of foundry.applications.instances) {
        if (instances[1] instanceof CoC7ModelsItemChaseSheet && instances[1].document.uuid === this.parent.uuid) {
          const currentWidth = instances[1].position.width
          const minWidth = CoC7Utilities.remToPx(40)
          const participantWidth = CoC7Utilities.remToPx(participants.length * 12.25 + (participants.length - 1) * 0.5 + 1 + 1) + 1 // initiative-block each + each gap + padding on tab + 1px
          const maxWidth = document.body.clientWidth
          instances[1].render({ tab: { primary: 'setup' }, position: { width: Math.min(maxWidth, Math.max(currentWidth, minWidth, participantWidth)) } })
        }
      }
    }
  }

  /**
   * Stop the chase
   */
  async restart () {
    const locations = foundry.utils.duplicate(this.locations.list)
    const participants = foundry.utils.duplicate(this.participants)
    locations.splice(0, locations.length - this.locations.total)
    for (const offset in locations) {
      locations[offset].participants = []
      locations[offset].active = false
    }
    for (const offset in participants) {
      participants[offset].bonusDice = 0
      participants[offset].currentMovementActions = 0
      participants[offset].hasAGunReady = false
      participants[offset].active = false
    }
    await this.parent.update({ 'system.started': false, 'system.locations.list': locations, 'system.participants': participants })
    // Resize and select tab for this sheet
    for (const instances of foundry.applications.instances) {
      if (instances[1] instanceof CoC7ModelsItemChaseSheet && instances[1].document.uuid === this.parent.uuid) {
        instances[1].render({ position: { width: instances[1].options.position.width } })
      }
    }
  }

  /**
   * Remove participant from list
   * @param {string} participantUuid
   */
  async removeParticipant (participantUuid) {
    const participants = foundry.utils.duplicate(this.participants)
    const offset = participants.findIndex(p => p.uuid === participantUuid)
    if (offset > -1) {
      new foundry.applications.api.DialogV2({
        window: { title: 'CoC7.RemoveParticipant' },
        content: '<p>' + game.i18n.format('CoC7.RemoveParticipantHint', { name: participants[offset].name }) + '</p>',
        buttons: [{
          action: 'cancel',
          label: 'No',
          icon: 'fa-solid fa-ban'
        }, {
          action: 'ok',
          label: 'Yes',
          icon: 'fa-solid fa-check',
          callback: async () => {
            const newActive = (participants[offset].active)
            participants.splice(offset, 1)
            const locations = foundry.utils.duplicate(this.locations.list)
            const offset2 = locations.findIndex(l => l.participants.includes(participantUuid))
            if (offset2 > -1) {
              const offset3 = locations[offset2].participants.findIndex(p => participantUuid)
              if (offset2 > -1) {
                locations[offset2].participants.splice(offset3, 1)
              }
            }
            await this.parent.update({ 'system.participants': participants, 'system.locations.list': locations }).then(async (chase) => {
              if (newActive) {
                const participantUuid = await chase.system.nextActiveParticipant()
                await this.activateParticipant(participantUuid)
              }
            })
          }
        }]
      }).render({ force: true })
    }
  }

  /**
   * Add/Edit participant to chase optionally at location
   * @param {object} participant
   * @param {object} options
   * @param {string|null} options.locationId
   */
  async addParticipant (participant, { locationId = null } = {}) {
    const locations = foundry.utils.duplicate(this.locations.list)
    const participants = foundry.utils.duplicate(this.participants)
    if (participant.uuid) {
      const participantIndex = participants.findIndex(p => p.uuid === participant.uuid)
      if (participantIndex > -1) {
        foundry.utils.mergeObject(participants[participantIndex], participant)
      }
    } else {
      participant.uuid = foundry.utils.randomID()
      participants.push(participant)
      if (locationId) {
        const locationsIndex = locations.findIndex(l => l.uuid === locationId)
        locations[locationsIndex].participants.push(participant.uuid)
      }
    }
    await this.parent.update({ 'system.participants': participants, 'system.locations.list': locations })
  }

  /**
   * Move a participant for a number of locations.
   * @param {string} participantId
   * @param {integer} locationsMoved
   * @returns {integer}
   */
  async moveParticipantLocations (participantId, locationsMoved) {
    const locations = foundry.utils.duplicate(this.locations.list)
    const offset = locations.findIndex(l => l.participants.includes(participantId))
    if (offset === -1) {
      /* // FoundryVTT V12 */
      ui.notifications.error(game.i18n.format('CoC7.ParticipantUuidNotFound', { participantUuid: participantId }))
      return
    }
    const newLocation = Math.min(Math.max(0, offset + locationsMoved), locations.length - 1)
    const totalMove = Math.abs(newLocation - offset)
    if (totalMove > 0) {
      const participants = foundry.utils.duplicate(this.participants)
      const participantIndex = participants.findIndex(p => p.uuid === participantId)
      if (participants[participantIndex].currentMovementActions < totalMove) {
        /* // FoundryVTT V12 */
        ui.notifications.error(game.i18n.format('CoC7.ParticipantNotEnoughMovement', { assistantUuid: participantId, actions: participants[participantIndex].currentMovementActions }))
        return
      }
      const offset2 = locations[offset].participants.findIndex(p => participantId)
      locations[offset].participants.splice(offset2, 1)
      locations[newLocation].participants.push(participantId)
      participants[participantIndex].currentMovementActions -= totalMove
      if (typeof locations[newLocation].coordinates.x && typeof locations[newLocation].coordinates.y === 'number') {
        await this.moveTokenToLocation(participantId, locations[newLocation].coordinates)
      }
      await this.parent.update({ 'system.participants': participants, 'system.locations.list': locations })
    }
    return totalMove
  }

  /**
   * Move participant to location
   * @param {string} participantId
   * @param {string} locationId
   * @param {object} options
   * @param {boolean} options.render
   */
  async moveParticipantToLocation (participantId, locationId, { render = true } = {}) {
    const locations = foundry.utils.duplicate(this.locations.list)
    const oldLocation = locations.findIndex(l => l.participants.includes(participantId))
    const newLocation = locations.findIndex(l => l.uuid === locationId)
    if (oldLocation > -1 && newLocation > -1) {
      const offset = locations[oldLocation].participants.findIndex(p => p === participantId)
      if (offset > -1) {
        locations[oldLocation].participants.splice(offset, 1)
        locations[newLocation].participants.push(participantId)
        if (typeof locations[newLocation].coordinates.x && typeof locations[newLocation].coordinates.y === 'number') {
          await this.moveTokenToLocation(participantId, locations[newLocation].coordinates)
        }
        await this.parent.update({ 'system.locations.list': locations }, { render })
      }
    }
  }

  /**
   * Move token to location
   * @param {string} participantId
   * @param {object} coordinates
   */
  async moveTokenToLocation (participantId, coordinates) {
    const participantIndex = this.participants.findIndex(p => p.uuid === participantId)
    if (participantIndex > -1) {
      const doc = await fromUuid(this.participants[participantIndex].docUuid)
      let token
      if (doc.token) {
        token = doc.token
      } else {
        token = doc.getDependentTokens({ scene: canvas.scene }).find(doc => doc.object)
      }
      if (token) {
        if (coordinates.scene !== canvas.scene.uuid) {
          console.warn('Caution the scene is not the active scene')
          return
        }
        if (token.parent.uuid !== canvas.scene.uuid) {
          ui.notifications.error('CoC7.ErrorTokenNotOnScene', { localize: true })
          return
        }
        const targetRect = new PIXI.Rectangle(
          coordinates.x,
          coordinates.y,
          Math.floor(token.object.width),
          Math.floor(token.object.height)
        ).normalize()
        let overlappingToken
        do {
          overlappingToken = canvas.scene.tokens.find(t => {
            if (t.uuid === token.uuid) {
              return false
            }
            return t.object.bounds.overlaps(targetRect)
          })
          if (overlappingToken) {
            targetRect.x = targetRect.right
          }
        } while (overlappingToken)
        await token.parent.updateEmbeddedDocuments(
          'Token',
          [{
            _id: token.id,
            x: targetRect.x,
            y: targetRect.y
          }],
          { animate: this.showTokenMovement }
        )
      }
    }
  }

  /**
   * Migrate old style data to new
   * @param {object} source
   * @returns {object}
   */
  static migrateData (source) {
    // Migrate description to object
    if (typeof source.description === 'string') {
      foundry.utils.setProperty(source, 'description.value', source.description)
    }
    return super.migrateData(source)
  }
}
