/* global $, canvas, Dialog, foundry, game, PIXI, Token, TokenDocument, ui */
import { CoCActor } from '../../core/documents/actor.js'
import { ChaseObstacleCard } from './chat/chase-obstacle.js'
import { CoC7Check } from '../../core/check.js'
import { CoC7Utilities } from '../../shared/utilities.js'
import { CoC7Item } from '../../core/documents/item.js'
import { _participant, sortByRoleAndDex } from '../chase/participant.js'

export class CoC7Chase extends CoC7Item {
  constructor (data, context) {
    if (typeof data.img === 'undefined') {
      data.img = 'systems/CoC7/assets/icons/running-solid.svg'
    }
    super(data, context)
    this.context = context
  }

  // Handle participants
  get participants () {
    const pList = []
    const preys = this.system.participants
      .filter(p => !p.chaser)
      .map(p => {
        return new _participant(p)
      })
    const chasers = this.system.participants
      .filter(p => p.chaser)
      .map(p => {
        return new _participant(p)
      })
    this.system.participants.forEach(p => {
      // p.index = pList.length - 1
      p.assist = []
      if (p.chaser) {
        p.assist = chasers
          .filter(c => c.uuid !== p.uuid && !c.hasMaxBonusDice)
          .map(c => {
            return { uuid: c.uuid, name: c.name }
          })
      } else {
        p.assist = preys
          .filter(c => c.uuid !== p.uuid && !c.hasMaxBonusDice)
          .map(c => {
            return { uuid: c.uuid, name: c.name }
          })
      }
      const particpant = new _participant(p)
      // particpant.location = this.getParticipantLocation( particpant.uuid) // Recursivity
      pList.push(particpant)
    })
    return pList
  }

  get participantsObject () {
    const participants = this.participants
    participants.forEach(p => {
      p.location = this.getParticipantLocation(p.uuid)
    })
    return participants
  }

  get activeParticipantData () {
    return this.system.participants.find(p => p.active)
  }

  get activeActor () {
    const p = this.activeParticipantData
    if (!p) return undefined
    if (p.docUuid) {
      return CoC7Utilities.getActorFromKey(p.docUuid)
    }
    return undefined
  }

  get participantsByAdjustedMov () {
    const pList = this.actualParticipants.sort(
      (a, b) => a.adjustedMov - b.adjustedMov
    )
    pList.forEach(p => {
      p.location = this.getParticipantLocation(p.uuid)
    })
    return pList
  }

  get participantsByInitiative () {
    const pList = this.actualParticipants.sort(
      (a, b) => b.initiative - a.initiative
    )
    pList.forEach(p => {
      p.location = this.getParticipantLocation(p.uuid)
    })
    return pList
  }

  get preys () {
    return this.participants.filter(p => !p.isChaser && p.isValid) || []
  }

  get chasers () {
    return this.participants.filter(p => p.isChaser && p.isValid) || []
  }

  get allHaveValidMov () {
    return this.participants.every(e => e.hasValidMov)
  }

  get allHaveSpeedRoll () {
    return this.participants.every(p => p.speedCheck?.rolled)
  }

  getParticipantLocation (participantUuid) {
    if (!this.system.locations?.list?.length) {
      return undefined
    }
    if (!this.started) return undefined
    const locations = this.locations

    const location = locations.find(l => {
      const lp = l.participants?.find(p => participantUuid === p.uuid)
      return !!lp
    })
    if (location) {
      return location
    }
    return undefined
  }

  getParticipantData (participantUuid) {
    const participant = this.system.participants.find(
      p => participantUuid === p.uuid
    )
    if (participant) return foundry.utils.duplicate(participant) // TODO : check if we need to duplicate
    return undefined
  }

  getParticipant (participantUuid) {
    const participantData = this.getParticipantData(participantUuid)
    if (participantData) return new _participant(participantData)
    return undefined
  }

  get nextActiveParticipant () {
    if (!this.started) return undefined
    return this.participantsByInitiative.find(
      p => p.data.currentMovementActions > 0
    )
  }

  get slowestPrey () {
    const preys = this.participants
      .sort((a, b) => a.adjustedMov - b.adjustedMov)
      ?.filter(p => p.isPrey)
    if (preys.length > 0) return preys[0]
    return undefined
  }

  get fastestChaser () {
    const chasers = this.participants
      .sort((a, b) => a.adjustedMov - b.adjustedMov)
      ?.filter(p => p.isChaser)
    if (chasers.length > 0) return chasers.slice(-1).pop()
    return undefined
  }

  get actualParticipants () {
    const slowestPrey = this.slowestPrey
    const fastestChaser = this.fastestChaser
    let pList = this.participants
    if (!this.system.includeLatecomers && slowestPrey) {
      pList = pList.filter(p => {
        return (
          p.isPrey || (p.isChaser && p.adjustedMov >= slowestPrey.adjustedMov)
        )
      })
    }

    if (!this.system.includeEscaped && fastestChaser) {
      pList = pList.filter(p => {
        return (
          p.isChaser || (p.isPrey && p.adjustedMov <= fastestChaser.adjustedMov)
        )
      })
    }

    return pList
  }

  get slowestParticipant () {
    const pList = this.participantsByAdjustedMov
    if (pList.length > 0) return pList[0]
    return undefined
  }

  async updateParticipants (list, { render = true } = {}) {
    const participantsData = this.cleanParticipantList(list)
    return await this.update(
      { 'system.participants': participantsData },
      { render }
    )
  }

  async updateParticipant (particiantUuid, updateData, { render = true } = {}) {
    const participants = foundry.utils.duplicate(this.system.participants)
    const update = foundry.utils.duplicate(updateData)
    const participantIndex = participants.findIndex(
      p => particiantUuid === p.uuid
    )
    if (participantIndex === -1) return undefined
    if (update.uuid) delete update.uuid
    foundry.utils.mergeObject(participants[participantIndex], update, {
      overwrite: true
    })
    await this.updateParticipants(participants, { render })
  }

  cleanParticipantList (list) {
    const participantsData = list || foundry.utils.duplicate(this.system.participants)
    list.forEach(p => {
      let data
      if (p.constructor.name === '_participant') {
        data = p.data
      } else {
        data = p
      }
      const index = this.findIndex(participantsData, data.uuid)
      if (index === -1) {
        participantsData.push(data)
        ui.notifications.warn(game.i18n.localize('CoC7.ParticipantDataMissing'))
      } else {
        participantsData[index] = data
      }
    })
    return participantsData
  }

  async assistParticipant (
    assistantUuid,
    beneficiaryUuid,
    { useMovementActions = true, render = true } = {}
  ) {
    const assistant = this.getParticipant(assistantUuid)
    const beneficiary = this.getParticipant(beneficiaryUuid)
    const participantsData = foundry.utils.duplicate(
      this.system.participants
    )
    const assistantIndex = participantsData.findIndex(
      p => assistantUuid === p.uuid
    )
    const beneficiaryIndex = participantsData.findIndex(
      p => beneficiaryUuid === p.uuid
    )

    if (!assistant || !beneficiary) {
      ui.notifications.error(game.i18n.localize('CoC7.ParticipantNotFound'))
      return undefined
    }

    if (beneficiary.hasMaxBonusDice) {
      ui.notifications.error(
        game.i18n.format('CoC7.ErrorBeneficiaryAtMaxBonus', {
          name: beneficiary.name
        })
      )
      return undefined
    }

    if (useMovementActions) {
      if (assistant.currentMovementActions < 1) {
        ui.notifications.error(
          game.i18n.format('CoC7.ParticipantNotEnoughMovement', {
            assistantUuid,
            actions: assistant.currentMovementActions
          })
        )
        return undefined
      }
      assistant.alterMovementActions(-1)
      participantsData[assistantIndex] = foundry.utils.duplicate(assistant.data)
    }

    beneficiary.addBonusDice()
    participantsData[beneficiaryIndex] = foundry.utils.duplicate(
      beneficiary.data
    )
    await this.update(
      { 'system.participants': participantsData },
      { render }
    )
  }

  async toggleBonusDice (participantUuid, diceNumber, { render = true } = {}) {
    const participant = this.getParticipant(participantUuid)

    if (!participant) {
      ui.notifications.error(
        game.i18n.format('CoC7.ParticipantUuidNotFound', {
          participantUuid
        })
      )
      return undefined
    }

    const participantsData = foundry.utils.duplicate(
      this.system.participants
    )
    const participantIndex = participantsData.findIndex(
      p => participantUuid === p.uuid
    )
    if (participant.bonusDice >= diceNumber) participant.removeBonusDice()
    else participant.addBonusDice()
    participantsData[participantIndex] = foundry.utils.duplicate(
      participant.data
    )
    await this.update(
      { 'system.participants': participantsData },
      { render }
    )
  }

  async cautiousApproach (
    participantUuid,
    { useMovementActions = true, render = true } = {}
  ) {
    const participant = this.getParticipant(participantUuid)

    if (!participant) {
      ui.notifications.error(
        game.i18n.format('CoC7.ParticipantUuidNotFound', {
          participantUuid
        })
      )
      return undefined
    }

    const participantsData = foundry.utils.duplicate(
      this.system.participants
    )
    const participantIndex = participantsData.findIndex(
      p => participantUuid === p.uuid
    )
    if (participant.hasMaxBonusDice) {
      ui.notifications.error(
        game.i18n.format('CoC7.ErrorParticipantAtMaxBonus', {
          participantUuid
        })
      )
      return
    }
    if (useMovementActions) {
      if (participant.currentMovementActions < 1) {
        ui.notifications.error(
          game.i18n.format('CoC7.ParticipantNotEnoughMovement', {
            assistantUuid: participantUuid,
            actions: participant.currentMovementActions
          })
        )
        return undefined
      }
      participant.alterMovementActions(-1)
    }
    participant.addBonusDice()
    participantsData[participantIndex] = foundry.utils.duplicate(
      participant.data
    )
    await this.update(
      { 'system.participants': participantsData },
      { render }
    )
  }

  async alterParticipantMovementAction (
    participantUuid,
    count,
    { render = true } = {}
  ) {
    const participant = this.getParticipant(participantUuid)

    if (!participant) {
      ui.notifications.error(
        game.i18n.format('CoC7.ParticipantUuidNotFound', {
          participantUuid
        })
      )
      return undefined
    }

    const participantsData = foundry.utils.duplicate(
      this.system.participants
    )
    const participantIndex = participantsData.findIndex(
      p => participantUuid === p.uuid
    )

    participant.alterMovementActions(count)

    participantsData[participantIndex] = foundry.utils.duplicate(
      participant.data
    )
    await this.update(
      { 'system.participants': participantsData },
      { render }
    )
  }

  async activateNextParticipantTurn ({
    scrollToLocation = true,
    activateLocation = true,
    render = true,
    html = null
  } = {}) {
    const activeParticipant = this.nextActiveParticipant
    const options = {
      scrollToLocation,
      activateLocation,
      render,
      html
    }
    if (!activeParticipant) return this.activateParticipant(undefined, options)
    return this.activateParticipant(activeParticipant.uuid, options)
  }

  async activateParticipant (
    participantUuid,
    {
      scrollToLocation = true,
      activateLocation = true,
      render = true,
      html = null
    } = {}
  ) {
    const dataUpdate = this.getActivateParticipantUpdateData(participantUuid, {
      scrollToLocation,
      activeLocation: activateLocation,
      html
    })
    await this.update(dataUpdate, { render })
  }

  getActivateParticipantUpdateData (
    participantUuid,
    { scrollToLocation = true, activateLocation = true, html = null } = {}
  ) {
    const pUuid = participantUuid
    //   ? participantUuid
    //   : this.participantsByInitiative[0]?.uuid
    const participantsDataUpdate = {}
    const participants = this.system.participants
      ? foundry.utils.duplicate(this.system.participants)
      : []
    participants.forEach(p => {
      delete p.active
      if (pUuid && pUuid === p.uuid) p.active = true
    })
    participantsDataUpdate['system.participants'] = participants

    const participantLocation = this.getParticipantLocation(pUuid)
    let locationsDataUpdate = null
    if (participantLocation) {
      if (activateLocation) {
        locationsDataUpdate = this.getActivateLocationUpdateData(
          participantLocation.uuid,
          { scrollToLocation, html }
        )
      } else if (scrollToLocation) {
        locationsDataUpdate = {}
        locationsDataUpdate['system.scroll.chaseTrack.from'] =
          this.chaseTrackCurrentScrollPosition
        locationsDataUpdate['system.scroll.chaseTrack.to'] =
          this.getChaseTrackLocationScrollPosition(participantLocation.uuid, {
            html
          })
      }
    } else {
      locationsDataUpdate = this.getActivateLocationUpdateData(undefined, {
        scrollToLocation
      })
    }

    if (locationsDataUpdate) {
      return foundry.utils.mergeObject(
        participantsDataUpdate,
        locationsDataUpdate
      )
    } else return participantsDataUpdate
  }

  activeParticipantObstacleCheck (
    locationUuid,
    { moveParticipant = true } = {}
  ) {
    const card = new ChaseObstacleCard({
      chaseUuid: this.uuid,
      locationUuid,
      moveParticipant,
      forward: locationUuid !== this.activeLocation.uuid
    })
    card.toMessage()

    // const test = new testCard()
    // test.initialize({})
    // test.toMessage()
  }

  // Handle rounds

  async progressToNextRound ({ render = true } = {}) {
    const participants = this.system.participants
      ? foundry.utils.duplicate(this.system.participants)
      : []
    participants.forEach(p => {
      if (p.currentMovementActions < p.movementAction) {
        p.currentMovementActions += p.movementAction
        if (p.currentMovementActions > p.movementAction) {
          p.currentMovementActions = p.movementAction
        }
      }
    })
    await this.updateParticipants(participants, { render: false })
    this.activateNextParticipantTurn({ render })
  }

  /** @override */
  async updateRoll (rollString) {
    if (game.user.isGM) {
      const roll = CoC7Check.fromRollString(rollString)
      const participants = this.system.participants
        ? foundry.utils.duplicate(this.system.participants)
        : []
      const index = participants.findIndex(p => p.rollUuid === roll.uuid)
      if (index >= 0) {
        participants[index].speedCheck.rollDataString = roll.JSONRollString
        await this.update({ 'system.participants': participants })
      }
    } else {
      const data = {
        data: rollString,
        type: 'invoke',
        method: 'updateRoll',
        item: this.uuid
      }
      game.socket.emit('system.CoC7', data)
    }
  }

  // handle locations
  get locations () {
    const locations = this.started
      ? this.system.locations.list
        ? foundry.utils.duplicate(this.system.locations.list)
        : []
      : this.initTrack
    this.processLocations(locations)
    return locations
  }

  getLocationData (locationUuid, { duplicateData = true } = {}) {
    const locations = duplicateData
      ? foundry.utils.duplicate(this.locations)
      : this.locations
    return locations.find(l => locationUuid === l.uuid)
  }

  processLocations (locations) {
    if (!locations?.length) return
    locations[0].first = true

    for (let index = 0; index < locations.length; index++) {
      const classes = []
      const location = locations[index]
      if (!location.name) classes.push('empty')
      if (location.active) classes.push('active')
      if (location.init && !this.started) classes.push('init')
      location.cssClasses = classes.join(' ')
    }

    if (locations.length > 1) locations[locations.length - 1].last = true

    locations.forEach(l => {
      if (l.participants && l.participants.length) {
        l.participants = l.participants.filter(p => !(p === null))
        for (let i = 0; i < l.participants.length; i++) {
          const elem = l.participants[i] // Init track = only uuid, update location list change for uuid

          // ui.notifications.error(`Type : ${typeof elem}`)
          let p
          if (typeof elem === 'string' || elem instanceof String) {
            p = this.system.participants.find(p => elem === p.uuid) // Retrieve participant data from list.
          } else if (elem?.constructor?.name === '_participant') {
            p = undefined // participant is already processed.
            ui.notifications.warn(
              game.i18n.localize('CoC7.ParticipantAlreadyProcessed')
            )
          } else p = undefined

          if (typeof p !== 'undefined') {
            l.participants[i] = new _participant(p) // replace uuid with _participant
          } else {
            // participants.push( null)
            console.error(
              'Undefined paticipant while processing participants array'
            )
          }
        }
        l.participants.sort(sortByRoleAndDex) // TODO : test if sorting works
      }
    })
  }

  get initTrack () {
    if (
      !this.system.locations.list ||
      this.system.locations.list.length === 0
    ) {
      return undefined
    }

    const locations = [] // !!!!!!! locations vs init locations !!!

    const init = this.startingLine
    let locationsIndexStart, initIndexStart, locationsLength
    if (init.length <= 0) locationsIndexStart = 0
    else if (this.system.startingIndex >= init.length) {
      locationsIndexStart = 0
    } else locationsIndexStart = init.length - this.system.startingIndex

    if (this.system.startingIndex <= 0) initIndexStart = 0
    else if (this.system.startingIndex <= init.length) initIndexStart = 0
    else initIndexStart = this.system.startingIndex - init.length

    if (locationsIndexStart === 0) {
      locationsLength = this.system.locations.list.length
    } else {
      locationsLength =
        this.system.locations.list.length + locationsIndexStart
    }

    if (init.length !== 0) {
      if (this.system.startingIndex < 0) {
        for (
          let index = 0;
          index < Math.abs(this.system.startingIndex);
          index++
        ) {
          init.push({
            uuid: this.generateNewUuid(),
            init: true,
            participants: []
          })
        }
      }
    }

    const chaseLocations = foundry.utils.duplicate(this.system.locations)
    for (let index = 0; index < locationsLength; index++) {
      let location = {}
      const participants = []
      if (
        index >= locationsIndexStart &&
        index - locationsIndexStart < chaseLocations.list.length
      ) {
        location = foundry.utils.duplicate(
          chaseLocations.list[index - locationsIndexStart]
        )
        location.init = false
        location.participants?.forEach(p => {
          if (p != null) participants.push(p)
        })
      }
      if (index >= initIndexStart && index - initIndexStart < init.length) {
        foundry.utils.mergeObject(location, init[index - initIndexStart], {
          overwrite: false
        })

        init[index - initIndexStart].participants?.forEach(p => {
          if (p != null) participants.push(p)
        })

        location.participants = participants
      }
      location.first = false
      location.end = false
      locations.push(location)
    }

    return locations
  }

  get startingLine () {
    // Get preys and check for escaped
    const preys = this.system.includeEscaped
      ? this.preys
      : this.preys?.filter(p => !p.data.escaped)
    // Get chasers
    const chasers = this.system.includeLatecomers
      ? this.chasers
      : this.chasers?.filter(c => !c.data.excluded)

    // Recursivity !! with getParticipantLocation and get participants

    // If no prey or no chasser
    // if (0 == chasers.length) {
    //   ui.notifications.warn('No chasers')
    //   return undefined
    // }
    // if (0 == preys.length) {
    //   ui.notifications.warn('No preys')
    //   return undefined
    // }

    // Build starting track
    const chaseTrack = []

    const chasersMinMov = this.findMinMov(chasers)
    const chasersMaxMov = this.findMaxMov(chasers)
    const preysMinMov = this.findMinMov(preys)
    const preysMaxMov = this.findMaxMov(preys)

    if (chasersMinMov !== -1 && chasersMaxMov !== -1) {
      // Add chasers to the track.
      for (let mov = chasersMinMov; mov <= chasersMaxMov; mov++) {
        // Find all with that mov
        const location = {
          uuid: this.generateNewUuid(),
          init: true,
          participants: []
        }
        const locationParticipantsList = chasers
          .filter(p => mov === p.adjustedMov)
          .sort((a, b) => a.dex - b.dex)
        locationParticipantsList.forEach(p =>
          location.participants.push(p.uuid)
        )
        chaseTrack.push(location)
      }

      // Add space between chasers and preys.
      for (let index = 0; index < this.system.startingRange; index++) {
        chaseTrack.push({
          uuid: this.generateNewUuid(),
          init: true,
          participants: []
        })
      }
    }

    if (preysMinMov !== -1 && preysMaxMov !== -1) {
      // Add preys to the track.
      for (let mov = preysMinMov; mov <= preysMaxMov; mov++) {
        // Find all with that mov
        const location = {
          uuid: this.generateNewUuid(),
          init: true,
          participants: []
        }
        const locationParticipantsList = preys
          .filter(p => mov === p.adjustedMov)
          .sort((a, b) => a.dex - b.dex)
        locationParticipantsList.forEach(p =>
          location.participants.push(p.uuid)
        )
        chaseTrack.push(location)
      }
    }

    return chaseTrack
  }

  async updateLocationsList (list, { render = true } = {}) {
    // Remove all unnecessary items (cssClass, )
    const updatedList = this.cleanLocationsList(list)
    await this.update(
      { 'system.locations.list': updatedList },
      { render }
    )
  }

  async updateLocation (locationUuid, updateData, { render = true } = {}) {
    const locations = foundry.utils.duplicate(this.system.locations.list)
    const update = foundry.utils.duplicate(updateData)
    const locationIndex = locations.findIndex(l => locationUuid === l.uuid)
    if (locationIndex === -1) return undefined
    if (update.uuid) delete update.uuid
    foundry.utils.mergeObject(locations[locationIndex], update, {
      overwrite: true
    })
    await this.updateLocationsList(locations, { render })
  }

  cleanLocationsList (list) {
    const updatedList = foundry.utils.duplicate(list)
    const partipantsUuidArray = this.system.participants.map(p => p.uuid)

    updatedList.forEach(l => {
      // delete l.active
      delete l.cssClasses
      delete l.first
      delete l.last
      delete l.end
      if (l.participants && l.participants.length) {
        for (let i = 0; i < l.participants.length; i++) {
          l.participants = l.participants.filter(p => !(p === null)) // Remove null elements
          // Replace _Participants by uuid
          if (l.participants[i].data?.uuid) {
            l.participants[i] = l.participants[i].data.uuid
          }
        }

        // Remove unkown particicpants
        l.participants = l.participants.filter(uuid =>
          partipantsUuidArray.includes(uuid)
        )
      }
    })

    return updatedList
  }

  async insertLocation (
    insertAtUuid,
    { shift = 0, locData = {}, render = true } = {}
  ) {
    const locations = foundry.utils.duplicate(this.system.locations.list)
    locations.forEach(l => {
      delete l.active
    })
    const locationIndex = locations.findIndex(l => insertAtUuid === l.uuid)
    if (locationIndex === -1) {
      return false
    }
    const newLocationIndex = locationIndex + shift
    if (newLocationIndex > locations.length) return false
    const newLocation = foundry.utils.duplicate(locData)
    newLocation.uuid = this.generateNewUuid()
    newLocation.init = locations[locationIndex].init
    newLocation.active = true
    locations.splice(newLocationIndex, 0, newLocation)
    return await this.updateLocationsList(locations, { render })
  }

  async removeLocation (uuid, { render = true } = {}) {
    const locations = foundry.utils.duplicate(this.system.locations.list)
    const locationIndex = locations.findIndex(l => uuid === l.uuid)
    locations.splice(locationIndex, 1)
    locations.forEach(l => {
      delete l.active
    })
    if (locations.length > 0) {
      let index = locationIndex - 1
      if (index < 0) index = 0
      locations[index].active = true
    }
    return await this.updateLocationsList(locations, { render })
  }

  async activateLocation (
    locationUuid,
    { scrollToLocation = true, render = true } = {}
  ) {
    const updateData = this.getActivateLocationUpdateData(locationUuid, {
      scrollToLocation
    })
    await this.update(updateData, { render })
  }

  getClearActiveLocationUpdateData ({
    scrollToLocation = true,
    html = null
  } = {}) {
    const updateData = {}
    const locations = this.system.locations.list
      ? foundry.utils.duplicate(this.system.locations.list)
      : []
    locations.forEach(l => {
      delete l.active
    })
    updateData['system.locations.list'] = this.cleanLocationsList(locations)

    if (scrollToLocation) {
      updateData['system.scroll.chaseTrack.from'] = 0
      updateData['system.scroll.chaseTrack.to'] = -1
    }
    return updateData
  }

  getActivateLocationUpdateData (
    locationUuid,
    { scrollToLocation = true, html = null } = {}
  ) {
    if (!locationUuid) {
      return this.getClearActiveLocationUpdateData({
        scrollToLocation
      })
    }
    const updateData = {}
    const locations = this.system.locations.list
      ? foundry.utils.duplicate(this.system.locations.list)
      : []
    locations.forEach(l => {
      delete l.active
      if (locationUuid === l.uuid) l.active = true
    })
    updateData['system.locations.list'] = this.cleanLocationsList(locations)
    // await this.updateLocationsList(locations, { render: false })
    if (scrollToLocation) {
      updateData['system.scroll.chaseTrack.from'] =
        this.chaseTrackCurrentScrollPosition
      updateData['system.scroll.chaseTrack.to'] =
        this.getChaseTrackLocationScrollPosition(locationUuid, { html })
      // await this.setchaseTrackScroll({
      //   from: this.chaseTrackCurrentScrollPosition,
      //   to: this.chaseTrackActiveLocationScrollPosition
      // })
    }
    return updateData
  }

  // Locations navigation
  get activeLocation () {
    if (!this.locations) return undefined
    const location = this.locations.find(l => l.active)
    if (!location) return undefined
    if (location.participants?.length) location.hasParticipant = true
    const actor = this.activeActor
    if (actor) {
      const test = actor.find(location.obstacleDetails?.checkName)
      if (test) {
        location.activeActorHasSkill = true
        location.activeActorTest = test
      }
    }
    return location
  }

  get previousLocation () {
    if (!this.locations) return undefined
    const activeIndex = this.locations.findIndex(l => l.active)
    if (activeIndex === -1) return undefined
    if (activeIndex === 0) return undefined
    const location = this.locations[activeIndex - 1]
    const actor = this.activeActor
    if (actor) {
      const test = actor.find(location.obstacleDetails?.checkName)
      if (test) {
        location.activeActorHasSkill = true
        location.activeActorTest = test
      }
    }
    return location
  }

  get nextLocation () {
    if (!this.locations) return undefined
    const activeIndex = this.locations.findIndex(l => l.active)
    if (activeIndex === -1) return undefined
    if (activeIndex === this.locations.length - 1) return undefined
    const location = this.locations[activeIndex + 1]
    const actor = this.activeActor
    if (actor) {
      const test = actor.find(location.obstacleDetails?.checkName)
      if (test) {
        location.activeActorHasSkill = true
        location.activeActorTest = test
      }
    }
    return location
  }

  async locatorDropped (data) {
    await this.setLocationCoordinates(
      data.locationUuid,
      data.x,
      data.y,
      data.scene
    )
  }

  async setLocationCoordinates (
    locationUuid,
    x,
    y,
    sceneId,
    { render = true } = {}
  ) {
    const locations = foundry.utils.duplicate(this.system.locations.list)
    const locationIndex = locations.findIndex(l => locationUuid === l.uuid)
    locations[locationIndex].coordinates = { x, y, scene: sceneId }

    return await this.updateLocationsList(locations, { render })
  }

  async clearActiveLocationCoordinates ({ render = true } = {}) {
    if (this.activeLocation) {
      return await this.clearLocationCoordinates(this.activeLocation.uuid, {
        render
      })
    }
  }

  async clearLocationCoordinates (locationUuid, { render = true } = {}) {
    const locations = foundry.utils.duplicate(this.system.locations.list)
    const locationIndex = locations.findIndex(l => locationUuid === l.uuid)
    delete locations[locationIndex].coordinates

    return await this.updateLocationsList(locations, { render })
  }

  // get activeParticipantHaveActiveLocationSkill (){
  //   if( !this.activeActor) return false
  //   if( this.activeActor.find( this.activeLocation.obstacleDetails?.checkName)) return true
  //   return false
  // }

  // Handle mechanics
  async cutToTheChase () {
    if (!this.allHaveSpeedRoll) {
      ui.notifications.warn(game.i18n.localize('CoC7.NotAllHaveSpeedRoll'))
      return
    }
    if (this.actualParticipants?.length < 2) {
      ui.notifications.warn(game.i18n.localize('CoC7.NeedMin2Participants'))
      return
    }
    if (this.allHaveValidMov) {
      // TODO : Check for speed roll ??

      // Calculate movement actions
      const participants = this.participants
      const minMov = this.findMinMov(this.actualParticipants)
      participants.forEach(p => {
        // p.data.movementAction = 1 + (p.adjustedMov - minMov)
        p.calculateMovementActions(minMov)
        p.currentMovementActions = p.movementAction
        p.bonusDice = 0
      })
      await this.updateParticipants(participants, { render: false })
      await this.updateLocationsList(this.locations, { render: false })
      await this.start()
    }
  }

  async restart () {
    // await this.cleanLocations() //Transferred in updateLocationList
    const locations = this.locations.filter(l => !l.init)
    for (let i = 0; i < locations.length; i++) {
      if (locations[i].participants) locations[i].participants = []
      if (locations[i].active) delete locations[i].active
    }
    const participantsData = this.system.participants
      ? foundry.utils.duplicate(this.system.participants)
      : []
    for (let i = 0; i < participantsData.length; i++) {
      if (participantsData[i].active) delete participantsData[i].active
    }
    await this.setchaseTrackScroll(0, 0, { render: false })
    await this.updateLocationsList(locations, { render: false })
    await this.updateParticipants(participantsData, { render: false })
    await this.stop()
  }

  getLocationShift (locationUuid, { skip = 1 } = {}) {
    const locations = foundry.utils.duplicate(this.system.locations.list)
    const originIndex = locations.findIndex(l => locationUuid === l.uuid)
    const destinationIndex = originIndex + skip
    if (locations.length === 0) return null
    if (destinationIndex >= locations.length) {
      return locations[locations.length - 1]
    }
    if (destinationIndex < 0) return locations[0]
    return locations[destinationIndex] // ERROR MOVE 2 FOR SKIP +1
  }

  async removeParticipant (participantUuid, { render = true } = {}) {
    const p = this.getParticipant(participantUuid)
    await Dialog.confirm({
      title: game.i18n.localize('CoC7.RemoveParticipant'),
      content: `<p>${game.i18n.format('CoC7.RemoveParticipantHint', {
        name: p.name
      })}</p>`,
      yes: async () => {
        const participantsData = foundry.utils.duplicate(
          this.system.participants
        )
        const newParticipantsData = participantsData.filter(
          p => participantUuid !== p.uuid
        )
        const locationsData = foundry.utils.duplicate(
          this.system.locations.list
        )
        locationsData.forEach(l => {
          if (l.participants && l.participants.length) {
            l.participants = l.participants.filter(
              uuid => participantUuid !== uuid
            )
          }
        })
        await this.updateParticipants(newParticipantsData, { render: false })
        await this.updateLocationsList(locationsData, { render })
      }
    })
  }

  async addParticipant (
    participant,
    {
      render = true,
      locationUuid = null,
      recalculateMovementActions = true,
      update = false
    } = {}
  ) {
    const participantsData = this.system.participants
      ? foundry.utils.duplicate(this.system.participants)
      : []

    if (participant.data.chaseUuid) delete participant.data.chaseUuid
    if (participant.data.locationUuid) delete participant.data.locationUuid
    if (participant.data.update) delete participant.data.update

    if (!participant.uuid) {
      let unique = false
      while (!unique) {
        participant.data.uuid = foundry.utils.randomID(16)
        unique =
          participantsData.filter(p => p.uuid === participant.uuid).length === 0
      }
    }

    if (update) {
      if (participant.currentMovementActions > participant.movementAction) {
        participant.currentMovementActions = participant.movementAction
      }
      const index = participantsData.findIndex(p => p.uuid === participant.uuid)
      participantsData[index] = participant.data
    } else participantsData.push(participant.data)

    await this.updateParticipants(participantsData, {
      render: render && !this.started && !this.recalculateMovementActions
    })

    if (recalculateMovementActions) {
      const slowest = this.slowestParticipant?.adjustedMov
      const participants = this.participants
      participants.forEach(p => p.calculateMovementActions(slowest))
      await this.updateParticipants(participants, {
        render: render && !this.started
      })
    }

    if (
      this.started &&
      !(participant.data.escaped || participant.data.excluded)
    ) {
      const locationsData = this.system.locations.list
        ? foundry.utils.duplicate(this.system.locations.list)
        : []

      if (locationsData.length === 0) {
        ui.notifications.error(
          game.i18n.localize('CoC7.ErrorEmptyLocationsList')
        )
      }

      let locationIndex = locationsData.findIndex(l => locationUuid === l.uuid)
      if (locationIndex === -1) locationIndex = 0
      if (!locationsData[locationIndex].participants) {
        locationsData[locationIndex].participants = []
      }
      if (
        locationsData[locationIndex].participants.findIndex(
          p => p === participant.uuid
        ) === -1
      ) {
        locationsData[locationIndex].participants.push(participant.uuid)
      }
      await this.updateLocationsList(locationsData, { render })
    }
  }

  async editParticipant (
    participantUuid,
    {
      useMovementActions = true,
      scrollToLocation = true,
      activateLocation = true,
      activateParticipant = true,
      render = true
    } = {}
  ) {}

  /**
   * Move a participant for a number of locations.
   * @param {string|null} participantUuid     Uuid of participant
   * @param {*} locationMoved                 Number of locations movred
   * @returns {number}                        Total number of locations crossed
   */
  async moveParticipant (
    participantUuid,
    locationMoved,
    {
      useMovementActions = true,
      scrollToLocation = true,
      activateLocation = true,
      activateParticipant = true,
      render = true
    } = {}
  ) {
    // const selector = `#item-${this.id} .chase-track`
    // ui.notifications.info( `moveParticipant : Jquery root: ${$(':root').find(selector).scrollLeft()}`)
    let modified = false
    const locations = foundry.utils.duplicate(this.system.locations.list)
    const originIndex = locations.findIndex(l =>
      l.participants?.includes(participantUuid)
    )
    let destinationIndex = originIndex + locationMoved
    if (destinationIndex > locations.length - 1) {
      destinationIndex = locations.length - 1
    }

    if (destinationIndex < 0) {
      destinationIndex = 0
    }

    const totalMove = destinationIndex - originIndex
    const participant = this.getParticipant(participantUuid)
    const participantsData = foundry.utils.duplicate(
      this.system.participants
    )
    const participantIndex = participantsData.findIndex(
      p => participantUuid === p.uuid
    )

    if (useMovementActions) {
      if (!participant) {
        ui.notifications.error(
          game.i18n.format('CoC7.ParticipantUuidNotFound', {
            participantUuid: this.participantUuid
          })
        )
        return undefined
      }
      if (participant.currentMovementActions < Math.abs(totalMove)) {
        ui.notifications.error(
          game.i18n.format('CoC7.ParticipantNotEnoughMovement', {
            assistantUuid: participantUuid,
            actions: participant.currentMovementActions
          })
        )
        return undefined
      }
      participant.alterMovementActions(0 - Math.abs(totalMove))
      participantsData[participantIndex] = foundry.utils.duplicate(
        participant.data
      )
      await this.update(
        { 'system.participants': participantsData },
        { render: false }
      )
      modified = true
    }

    if (totalMove !== 0) {
      await this.moveParticipantToLocation(
        participantUuid,
        locations[destinationIndex].uuid,
        { render: false }
      )
      modified = true
    }

    if (activateParticipant) {
      await this.activateParticipant(participantUuid, {
        scrollToLocation,
        activateLocation,
        render: false
      })
      modified = true
    }

    if (activateLocation && !activateParticipant) {
      await this.activateLocation(locations[destinationIndex].uuid, {
        scrollToLocation,
        render: false
      })
      modified = true
    }

    if (modified && render) await this.sheet.render(true)
    return totalMove
  }

  async moveParticipantToLocation (
    participantUuid,
    locationUuid,
    {
      scrollToLocation = true,
      activateLocation = true,
      animate = null,
      moveToken = true,
      render = true
    } = {}
  ) {
    const locations = foundry.utils.duplicate(this.system.locations.list)

    // Find destination location.
    const destination = locations.find(l => locationUuid === l.uuid)
    if (!destination) {
      console.error(
        `Failed to move ${participantUuid}. Location ${locationUuid} unknown`
      )
      return
    }

    // Find origin location
    const origin = locations.find(l =>
      l.participants?.includes(participantUuid)
    )

    if (!origin) {
      console.error(`Failed to find ${participantUuid} in locations`)
      return
    }

    if (!destination.participants) destination.participants = []
    if (destination.participants.includes(participantUuid)) return // moving particpant to a location he already occupies
    destination.participants.push(participantUuid)
    // destination.participants.sort(sortByRoleAndDex)

    const oldParticipantsList = origin.participants.filter(
      p => participantUuid !== p
    )
    origin.participants = oldParticipantsList

    if (moveToken && destination.coordinates) {
      const participant = this.getParticipant(participantUuid)
      let particpantDocument = CoC7Utilities.getDocumentFromKey(
        participant?.data?.docUuid
      )
      // Find token
      if (particpantDocument && !(particpantDocument instanceof TokenDocument || particpantDocument?.object instanceof Token)) {
        const foundTokens = canvas.scene.tokens.filter(d => d.actorLink && d.actor?.id === particpantDocument.id)
        if (foundTokens.length === 1) {
          particpantDocument = foundTokens[0]
        }
      }
      if (
        particpantDocument &&
        !(
          /* particpantDocument.isToken || */ (
            particpantDocument instanceof TokenDocument ||
            particpantDocument?.object instanceof Token
          )
        )
      ) {
        console.warn('No token associated with this actor')
      } else {
        if (destination.coordinates.scene !== game.scenes.viewed.uuid) {
          console.warn('Caution the scene is not the active scene')
        }
        if (particpantDocument.parent?.uuid !== destination.coordinates.scene) {
          ui.notifications.error(
            game.i18n.localize('CoC7.ErrorTokenNotOnScene')
          )
        } else {
          const scene = CoC7Utilities.getDocumentFromKey(
            destination.coordinates.scene
          )
          let x = destination.coordinates.x
          const y = destination.coordinates.y
          let targetRect = new PIXI.Rectangle(
            x,
            y,
            particpantDocument.object.width,
            particpantDocument.object.height
          ).normalize()
          const update = []
          let foundFreeSpace = false
          while (!foundFreeSpace) {
            const overlapingToken = scene.tokens.find(t => {
              if (t.id === particpantDocument.id) return false // You can't overlap with yourself
              return t.object.bounds.intersects(targetRect)
            })
            if (overlapingToken) {
              x = overlapingToken.object.bounds.right + 1
              targetRect = new PIXI.Rectangle(
                x,
                y,
                particpantDocument.object.width,
                particpantDocument.object.height
              ).normalize()
            } else foundFreeSpace = true
          }

          update.push({
            _id: particpantDocument.id,
            x,
            y
          })

          // destination.participants?.forEach( pUuid =>{
          //   const p = this.getParticipant(pUuid)
          //   const pDoc = CoC7Utilities.getDocumentFromKey( p?.data?.docUuid)
          //   if( pDoc instanceof TokenDocument && pDoc.object instanceof Token){
          //     updates = true
          //     update.push({
          //       _id: pDoc.id,
          //       x:x,
          //       y:y
          //     })
          //     if( pDoc.object.width) x += pDoc.object.width
          //   }
          // })
          const showTokenMovement =
            typeof animate === 'boolean'
              ? animate
              : this.system.showTokenMovement
          await particpantDocument.parent.updateEmbeddedDocuments(
            'Token',
            update,
            { animate: showTokenMovement }
          )
        }
      }
    }

    await this.updateLocationsList(locations, { render })
  }

  // Handle scrolling
  async setchaseTrackScroll ({
    from = undefined,
    to = -1,
    render = true
  } = {}) {
    await this.update(
      {
        'system.scroll.chaseTrack.from':
          undefined === from ? this.chaseTrackCurrentScrollPosition : from,
        'system.scroll.chaseTrack.to':
          undefined === to ? this.chaseTrackCurrentScrollPosition : to
      },
      { render }
    )
  }

  get chaseTrackCurrentScrollPosition () {
    const html = this.sheet?._element
    if (!html) return -1
    const chaseTrack = html[0].querySelector('.chase-track')
    if (!chaseTrack) return -1
    // const selector = `#item-${this.id} .chase-track`
    // ui.notifications.info( `DATA : Jquery root: ${$(':root').find(selector).scrollLeft()}`)
    // return $(':root').find(selector).scrollLeft()

    // ui.notifications.info( `DATA : Jquery root: ${$(':root').find('#item-VNhtqxA2wJJnWStT .chase-track').scrollLeft()}.Chase track offset: ${chaseTrack.scrollLeft}, Document offset:${document.querySelector('#item-VNhtqxA2wJJnWStT').querySelector('.chase-track').scrollLeft}`)
    return chaseTrack.scrollLeft
  }

  /**
   * Return the offset position of the active location
   * the center of the active location will be centered
   * in the parent.
   */
  get chaseTrackActiveLocationScrollPosition () {
    if (!this.activeLocation) return -1
    return this.getChaseTrackLocationScrollPosition(this.activeLocation.uuid)
  }

  getChaseTrackLocationScrollPosition (locationUuid, { html = null }) {
    const htmlElement = html || this.sheet?._element
    if (!htmlElement || !htmlElement[0]) return -1
    const chaseTrack = htmlElement[0].querySelector('.chase-track')
    if (!chaseTrack) return -1
    const activeLocationElement = chaseTrack.querySelector(
      `.chase-location[data-uuid="${locationUuid}"]`
    )
    if (!activeLocationElement) return -1
    const leftScroll =
      activeLocationElement.offsetLeft +
      activeLocationElement.clientWidth / 2 -
      chaseTrack.clientWidth / 2
    return leftScroll < 0 ? 0 : Math.floor(leftScroll)
  }

  // Should be removed
  findMinMov (list) {
    if (!list?.length) return -1
    return list.reduce((prev, current) =>
      prev.adjustedMov < current.adjustedMov ? prev : current
    ).adjustedMov
  }

  findMaxMov (list) {
    if (!list?.length) return -1
    return list.reduce((prev, current) =>
      prev.adjustedMov > current.adjustedMov ? prev : current
    ).adjustedMov
  }

  // Utilities
  findIndex (list, uuid) {
    return list.findIndex(p => p.uuid === uuid)
  }

  get started () {
    return this.getFlag('CoC7', 'started')
  }

  async start () {
    const remString = $(':root').css('font-size')
    const remSize = Number(remString.replace('px', ''))
    const pCount = this.actualParticipants.length
    const width = Math.max((pCount * 11.2 + 3) * remSize, 40 * remSize)
    this.sheet._tabs[0].active = 'setup'
    this.sheet.position.width = width
    await this.setFlag('CoC7', 'started', true)
    await this.activateNextParticipantTurn()
  }

  async stop () {
    return this.unsetFlag('CoC7', 'started')
  }

  generateNewUuid () {
    return foundry.utils.randomID(16)
  }

  getActorSkillsAndCharacteristics (participantUuid) {
    const participant = this.getParticipant(participantUuid)
    if (!participant.actor) return undefined
    const list = []
    CoCActor.getCharacteristicDefinition().forEach(c =>
      list.push(
        `${game.i18n.localize('CoC7.Characteristics')} (${c.shortName})`
      )
    )
    list.push(
      `${game.i18n.localize('CoC7.Attribute')} (${game.i18n.localize(
        'CoC7.Luck'
      )})`
    )
    list.push(
      `${game.i18n.localize('CoC7.Attribute')} (${game.i18n.localize(
        'CoC7.SAN'
      )})`
    )
    participant.actor.skills.forEach(s => list.push(s.name))
    return list
  }

  get activeActorSkillsAndCharacteristics () {
    const particicpantData = this.activeParticipantData
    if (!particicpantData) return undefined
    return this.getActorSkillsAndCharacteristics(particicpantData.uuid)
  }

  get allSkillsAndCharacteristics () {
    const list = []
    CoCActor.getCharacteristicDefinition().forEach(c =>
      list.push(
        `${game.i18n.localize('CoC7.Characteristics')} (${c.shortName})`
      )
    )
    list.push(
      `${game.i18n.localize('CoC7.Attribute')} (${game.i18n.localize(
        'CoC7.Luck'
      )})`
    )
    list.push(
      `${game.i18n.localize('CoC7.Attribute')} (${game.i18n.localize(
        'CoC7.SAN'
      )})`
    )

    game.CoC7.skillList?.forEach(s => {
      if (
        !list.includes(s.name) &&
        !s.name
          .toLowerCase()
          .includes(`(${game.i18n.localize('CoC7.AnySpecName')})`.toLowerCase())
      ) {
        list.push(s.name)
      }
    }) // TODO: Remove ??
    this.participants.forEach(p => {
      if (p.actor) {
        p.actor.skills.forEach(s => {
          if (!list.includes(s.name)) list.push(s.name)
        })
      }
    })
    return list.sort(Intl.Collator().compare)
  }

  get allSkillsAndCharacteristicsShort () {
    const list = []
    CoCActor.getCharacteristicDefinition().forEach(c => list.push(`${c.label}`))
    list.push(`${game.i18n.localize('CoC7.Luck')}`)
    list.push(`${game.i18n.localize('CoC7.SAN')}`)

    game.CoC7.skillList?.forEach(s => {
      if (
        !list.includes(s.name) &&
        !s.name
          .toLowerCase()
          .includes(`(${game.i18n.localize('CoC7.AnySpecName')})`.toLowerCase())
      ) {
        list.push(s.name)
      }
    }) // TODO: Remove ??
    this.participants.forEach(p => {
      if (p.actor) {
        p.actor.skills.forEach(s => {
          if (!list.includes(s.name)) list.push(s.name)
        })
      }
    })
    return list.sort(Intl.Collator().compare)
  }

  /**
   * Clean the data of all parasite participants in locations.
   * Should never happen
   */
  // async cleanLocations () {
  //   const locations = foundry.utils.duplicate(this.system.locations.list)
  //   locations.forEach(l => {
  //     const partipantsUuidArray = this.system.participants.map(p => p.uuid)
  //     if (l.participants) {
  //       l.participants = l.participants.filter(uuid =>
  //         partipantsUuidArray.includes(uuid)
  //       )
  //     }
  //   })
  //   this.updateLocationsList(locations)
  // }
}
