import { CoCActor } from '../../actors/actor.js'
import { ChaseObstacleCard } from '../../chat/cards/chase-obstacle.js'
import { chatHelper } from '../../chat/helper.js'
import { CoC7Check } from '../../check.js'
import { CoC7Item } from '../item.js'
import { _participant, sortByRoleAndDex } from './participant.js'

export class CoC7Chase extends CoC7Item {
  constructor (data, context) {
    if (typeof data.img === 'undefined') {
      data.img = 'systems/CoC7/assets/icons/running-solid.svg'
    }
    super(data, context)
    this.context = context
  }

  //Handle participants
  get participants () {
    const pList = []
    const preys = this.data.data.participants
      .filter(p => !p.chaser)
      .map(p => {
        return new _participant(p)
      })
    const chasers = this.data.data.participants
      .filter(p => p.chaser)
      .map(p => {
        return new _participant(p)
      })
    this.data.data.participants.forEach(p => {
      // p.index = pList.length - 1
      p.assist = []
      if (p.chaser) {
        p.assist = chasers
          .filter(c => c.uuid != p.uuid && !c.hasMaxBonusDice)
          .map(c => {
            return { uuid: c.uuid, name: c.name }
          })
      } else {
        p.assist = preys
          .filter(c => c.uuid != p.uuid && !c.hasMaxBonusDice)
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

  get activeParticipant () {
    return this.data.data.participants.find(p => p.active)
  }

  get activeActor () {
    const p = this.activeParticipant
    if (!p) return undefined
    if (p.actorKey) {
      return chatHelper.getActorFromKey(p.actorKey)
    }
    return undefined
  }

  get participantsByAdjustedMov () {
    return this.participants.sort((a, b) => a.adjustedMov - b.adjustedMov)
  }

  get participantsByInitiative () {
    return this.participants.sort((a, b) => b.initiative - a.initiative)
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
    if (!this.data.data.locations?.list?.length) {
      return undefined
    }
    if (!this.started) return undefined
    const locations = this.locations

    const location = locations.find(l => {
      const lp = l.participants?.find(p => participantUuid == p.uuid)
      return !!lp
    })
    if (location) {
      return location
    }
    return undefined
  }

  getParticipantData (participantUuid) {
    const participant = this.data.data.participants.find(
      p => participantUuid == p.uuid
    )
    if (participant) return duplicate(participant) //TODO : check if we need to duplicate
    return undefined
  }

  getParticipant (participantUuid) {
    const participantData = this.getParticipantData(participantUuid)
    if (participantData) return new _participant(participantData)
    return undefined
  }

  get nextActiveParticipant () {
    return this.participantsByInitiative.find(
      p => p.data.currentMovementActions > 0
    )
  }

  async updateParticipants (list, { render = true } = {}) {
    const participantsData = this.cleanParticipantList(list)
    return await this.update(
      { 'data.participants': participantsData },
      { render: render }
    )
  }

  cleanParticipantList (list) {
    const participantsData = this.data.data.participants
      ? duplicate(this.data.data.participants)
      : []
    list.forEach(p => {
      let data
      if (p.constructor.name == '_participant') {
        data = p.data
      } else data = p
      const index = this.findIndex(participantsData, data.uuid)
      if (-1 === index) {
        participantsData.push(data)
        ui.notifications.warn('Participant data missing')
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
    const participantsData = duplicate(this.data.data.participants)
    const assistantIndex = participantsData.findIndex(
      p => assistantUuid == p.uuid
    )
    const beneficiaryIndex = participantsData.findIndex(
      p => beneficiaryUuid == p.uuid
    )

    if (!assistant || !beneficiary) {
      ui.notifications.error(`Cannot find participant`)
      return undefined
    }

    if (beneficiary.hasMaxBonusDice) {
      ui.notifications.error(
        `Beneficiary ${beneficiary.name} already has max bonus dice`
      )
      return undefined
    }

    if (useMovementActions) {
      if (assistant.currentMovementActions < 1) {
        ui.notifications.error(
          `Particpant ${assistantUuid} only have ${assistant.currentMovementActions} movement actions`
        )
        return undefined
      }
      assistant.alterMovementActions(-1)
      participantsData[assistantIndex] = duplicate(assistant.data)
    }

    beneficiary.addBonusDice()
    participantsData[beneficiaryIndex] = duplicate(beneficiary.data)
    await this.update(
      { 'data.participants': participantsData },
      { render: render }
    )
  }

  async toggleBonusDice (participantUuid, diceNumber, { render = true } = {}) {
    const participant = this.getParticipant(participantUuid)

    if (!participant) {
      ui.notifications.error(`Cannot find participant ${participantUuid}`)
      return undefined
    }

    const participantsData = duplicate(this.data.data.participants)
    const participantIndex = participantsData.findIndex(
      p => participantUuid == p.uuid
    )
    if (participant.bonusDice >= diceNumber) participant.removeBonusDice()
    else participant.addBonusDice()
    participantsData[participantIndex] = duplicate(participant.data)
    await this.update(
      { 'data.participants': participantsData },
      { render: render }
    )
  }

  async cautiousApproach (
    participantUuid,
    { useMovementActions = true, render = true } = {}
  ) {
    const participant = this.getParticipant(participantUuid)

    if (!participant) {
      ui.notifications.error(`Cannot find participant ${participantUuid}`)
      return undefined
    }

    const participantsData = duplicate(this.data.data.participants)
    const participantIndex = participantsData.findIndex(
      p => participantUuid == p.uuid
    )
    if (participant.hasMaxBonusDice) {
      ui.notifications.error(`${participantUuid} already has max bonus dice`)
      return
    }
    if (useMovementActions) {
      if (participant.currentMovementActions < 1) {
        ui.notifications.error(
          `Particpant ${participantUuid} only have ${participant.currentMovementActions} movement actions`
        )
        return undefined
      }
      participant.alterMovementActions(-1)
    }
    participant.addBonusDice()
    participantsData[participantIndex] = duplicate(participant.data)
    await this.update(
      { 'data.participants': participantsData },
      { render: render }
    )
  }

  async activateNexParticpantTurn ({
    scrollToLocation = true,
    activateLocation = true,
    render = true,
    html = null
  } = {}) {
    const activeParticipant = this.nextActiveParticipant
    const options = {
      scrollToLocation: scrollToLocation,
      activateLocation: activateLocation,
      render: render,
      html: html
    }
    if (!activeParticipant) return this.activateParticipant(null, options)
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
      scrollToLocation: scrollToLocation,
      activeLocation: activateLocation,
      html: html
    })
    await this.update(dataUpdate, { render: render })
  }

  getActivateParticipantUpdateData (
    participantUuid,
    { scrollToLocation = true, activateLocation = true, html = null } = {}
  ) {
    const pUuid = participantUuid
      ? participantUuid
      : this.participantsByInitiative[0].uuid
    const participantsDataUpdate = {}
    const participants = this.data.data.participants
      ? duplicate(this.data.data.participants)
      : []
    participants.forEach(p => {
      delete p.active
      if (pUuid == p.uuid) p.active = true
    })
    participantsDataUpdate['data.participants'] = participants

    const participantLocation = this.getParticipantLocation(pUuid)
    let locationsDataUpdate = null
    if (participantLocation) {
      if (activateLocation) {
        locationsDataUpdate = this.getActivateLocationUpdateData(
          participantLocation.uuid,
          { scrollToLocation: scrollToLocation, html: html }
        )
      } else if (scrollToLocation) {
        if (scrollToLocation) {
          locationsDataUpdate = {}
          locationsDataUpdate[
            'data.scroll.chaseTrack.from'
          ] = this.chaseTrackCurrentScrollPosition
          locationsDataUpdate[
            'data.scroll.chaseTrack.to'
          ] = this.getChaseTrackLocationScrollPosition(
            participantLocation.uuid,
            { html: html }
          )
        }
      }
    }

    if (locationsDataUpdate) {
      return foundry.utils.mergeObject(
        participantsDataUpdate,
        locationsDataUpdate
      )
    } else return participantsDataUpdate
  }

  async activeParticipantObstacleCheck (
    locationUuid,
    { moveParticipant = true } = {}
  ) {
    const card = new ChaseObstacleCard()
    card.toMessage()
  }

  /** @override */
  async updateRoll (rollString) {
    if (game.user.isGM) {
      const roll = CoC7Check.fromRollString(rollString)
      const participants = this.data.data.participants
        ? duplicate(this.data.data.participants)
        : []
      const index = participants.findIndex(p => p.rollUuid === roll.uuid)
      if (index >= 0) {
        participants[index].speedCheck.rollDataString = roll.JSONRollString
        await this.update({ 'data.participants': participants })
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

  //handle locations
  get locations () {
    const locations = this.started
      ? this.data.data.locations.list
        ? duplicate(this.data.data.locations.list)
        : []
      : this.initTrack
    this.processLocations(locations)
    return locations
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
        for (let i = 0; i < l.participants.length; i++) {
          const elem = l.participants[i] // Init track = only uuid, update location list change for uuid

          // ui.notifications.error(`Type : ${typeof elem}`)
          let p
          if (typeof elem === 'string' || elem instanceof String) {
            p = this.data.data.participants.find(p => elem == p.uuid) //Retrieve participant data from list.
          } else if (elem.constructor.name == '_participant') {
            p = undefined // participant is already processed.
            ui.notifications.warn('Participant was already processed.')
          } else p = undefined

          if (undefined != p) {
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
      !this.data.data.locations.list ||
      0 === this.data.data.locations.list.length
    )
      return undefined

    const locations = [] // !!!!!!! locations vs init locations !!!

    const init = this.startingLine
    let locationsIndexStart, initIndexStart, locationsLength
    if (0 >= init.length) locationsIndexStart = 0
    else if (this.data.data.startingIndex >= init.length)
      locationsIndexStart = 0
    else locationsIndexStart = init.length - this.data.data.startingIndex

    if (this.data.data.startingIndex <= 0) initIndexStart = 0
    else if (this.data.data.startingIndex <= init.length) initIndexStart = 0
    else initIndexStart = this.data.data.startingIndex - init.length

    if (0 == locationsIndexStart)
      locationsLength = this.data.data.locations.list.length
    else
      locationsLength =
        this.data.data.locations.list.length + locationsIndexStart

    if (0 != init.length) {
      if (this.data.data.startingIndex < 0) {
        for (
          let index = 0;
          index < Math.abs(this.data.data.startingIndex);
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

    const chaseLocations = duplicate(this.data.data.locations)
    for (let index = 0; index < locationsLength; index++) {
      let location = {}
      const participants = []
      if (
        index >= locationsIndexStart &&
        index - locationsIndexStart < chaseLocations.list.length
      ) {
        location = duplicate(chaseLocations.list[index - locationsIndexStart])
        location.init = false
        location.participants?.forEach(p => {
          if (null != p) participants.push(p)
        })
      }
      if (index >= initIndexStart && index - initIndexStart < init.length) {
        mergeObject(location, init[index - initIndexStart], {
          overwrite: false
        })

        init[index - initIndexStart].participants?.forEach(p => {
          if (null != p) participants.push(p)
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
    //Get preys and check for escaped
    const preys = this.data.data.includeEscaped
      ? this.preys
      : this.preys?.filter(p => !p.data.escaped)
    //Get chasers
    const chasers = this.chasers // Recursivity !! with getParticipantLocation and get participants

    //If no prey or no chasser
    // if (0 == chasers.length) {
    //   ui.notifications.warn('No chasers')
    //   return undefined
    // }
    // if (0 == preys.length) {
    //   ui.notifications.warn('No preys')
    //   return undefined
    // }

    //Build starting track
    const chaseTrack = []

    const chasersMinMov = this.findMinMov(chasers)
    const chasersMaxMov = this.findMaxMov(chasers)
    const preysMinMov = this.findMinMov(preys)
    const preysMaxMov = this.findMaxMov(preys)

    if (-1 != chasersMinMov && -1 != chasersMaxMov) {
      // Add chasers to the track.
      for (let mov = chasersMinMov; mov <= chasersMaxMov; mov++) {
        //Find all with that mov
        const location = {
          uuid: this.generateNewUuid(),
          init: true,
          participants: []
        }
        const locationParticipantsList = chasers
          .filter(p => mov == p.adjustedMov)
          .sort((a, b) => a.dex - b.dex)
        locationParticipantsList.forEach(p =>
          location.participants.push(p.uuid)
        )
        chaseTrack.push(location)
      }

      // Add space between chasers and preys.
      for (let index = 0; index < this.data.data.startingRange; index++) {
        chaseTrack.push({
          uuid: this.generateNewUuid(),
          init: true,
          participants: []
        })
      }
    }

    if (-1 != preysMinMov && -1 != preysMaxMov) {
      // Add preys to the track.
      for (let mov = preysMinMov; mov <= preysMaxMov; mov++) {
        //Find all with that mov
        const location = {
          uuid: this.generateNewUuid(),
          init: true,
          participants: []
        }
        const locationParticipantsList = preys
          .filter(p => mov == p.adjustedMov)
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
    //Remove all unnecessary items (cssClass, )
    const updatedList = this.cleanLocationsList(list)
    await this.update(
      { 'data.locations.list': updatedList },
      { render: render }
    )
  }

  cleanLocationsList (list) {
    const updatedList = duplicate(list)
    const partipantsUuidArray = this.data.data.participants.map(p => p.uuid)

    updatedList.forEach(l => {
      // delete l.active
      delete l.cssClasses
      delete l.first
      delete l.last
      delete l.end
      if (l.participants && l.participants.length) {
        for (let i = 0; i < l.participants.length; i++) {
          //Replace _Participants by uuid
          if (l.participants[i].data?.uuid)
            l.participants[i] = l.participants[i].data.uuid
        }

        //Remove unkown particicpants
        l.participants = l.participants.filter(uuid =>
          partipantsUuidArray.includes(uuid)
        )
      }
    })

    return updatedList
  }

  async activateLocation (
    locationUuid,
    { scrollToLocation = true, render = true } = {}
  ) {
    const updateData = this.getActivateLocationUpdateData(locationUuid, {
      scrollToLocation: scrollToLocation
    })
    await this.update(updateData, { render: render })
  }

  getActivateLocationUpdateData (
    locationUuid,
    { scrollToLocation = true, html = null } = {}
  ) {
    const updateData = {}
    const locations = this.data.data.locations.list
      ? duplicate(this.data.data.locations.list)
      : []
    locations.forEach(l => {
      delete l.active
      if (locationUuid == l.uuid) l.active = true
    })
    updateData['data.locations.list'] = this.cleanLocationsList(locations)
    // await this.updateLocationsList(locations, { render: false })
    if (scrollToLocation) {
      updateData[
        'data.scroll.chaseTrack.from'
      ] = this.chaseTrackCurrentScrollPosition
      updateData[
        'data.scroll.chaseTrack.to'
      ] = this.getChaseTrackLocationScrollPosition(locationUuid, { html: html })
      // await this.setchaseTrackScroll({
      //   from: this.chaseTrackCurrentScrollPosition,
      //   to: this.chaseTrackActiveLocationScrollPosition
      // })
    }
    return updateData
  }

  //Locations navigation
  get activeLocation () {
    if (!this.locations) return undefined
    const location = this.locations.find(l => l.active)
    if (!location) return undefined
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
    if (-1 == activeIndex) return undefined
    if (0 == activeIndex) return undefined
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
    if (-1 == activeIndex) return undefined
    if (activeIndex == this.locations.length - 1) return undefined
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

  // get activeParticipantHaveActiveLocationSkill (){
  //   if( !this.activeActor) return false
  //   if( this.activeActor.find( this.activeLocation.obstacleDetails?.checkName)) return true
  //   return false
  // }

  //Handle mechanics
  async cutToTheChase () {
    if (!this.allHaveSpeedRoll) {
      ui.notifications.warn('Speed roll missing')
      return
    }
    if (this.allHaveValidMov) {
      //TODO : Check for speed roll ??

      //Calculate movement actions
      const participants = this.participants
      const minMov = this.findMinMov(participants)
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
    const participantsData = this.data.data.participants
      ? duplicate(this.data.data.participants)
      : []
    for (let i = 0; i < participantsData.length; i++) {
      if (participantsData[i].active) delete participantsData[i].active
    }
    await this.setchaseTrackScroll(0, 0, { render: false })
    await this.updateLocationsList(locations, { render: false })
    await this.updateParticipants(participantsData, { render: false })
    await this.stop()
  }

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
    const locations = duplicate(this.data.data.locations.list)
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
    const participantsData = duplicate(this.data.data.participants)
    const participantIndex = participantsData.findIndex(
      p => participantUuid == p.uuid
    )

    if (useMovementActions) {
      if (!participant) {
        ui.notifications.error(
          `Particpant ${this.participantUuid} cannot be found`
        )
        return undefined
      }
      if (participant.currentMovementActions < Math.abs(totalMove)) {
        ui.notifications.error(
          `Particpant ${participantUuid} only have ${participant.currentMovementActions} movement actions`
        )
        return undefined
      }
      participant.alterMovementActions(0 - Math.abs(totalMove))
      participantsData[participantIndex] = duplicate(participant.data)
      await this.update(
        { 'data.participants': participantsData },
        { render: false }
      )
      modified = true
    }

    if (0 != totalMove) {
      await this.moveParticipantToLocation(
        participantUuid,
        locations[destinationIndex].uuid,
        { render: false }
      )
      modified = true
    }

    if (activateParticipant) {
      await this.activateParticipant(participantUuid, {
        scrollToLocation: scrollToLocation,
        activateLocation: activateLocation,
        render: false
      })
      modified = true
    }

    if (activateLocation && !activateParticipant) {
      await this.activateLocation(locations[destinationIndex].uuid, {
        scrollToLocation: scrollToLocation,
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
    { scrollToLocation = true, activateLocation = true, render = true } = {}
  ) {
    const locations = duplicate(this.data.data.locations.list)

    //Find destination location.
    const destination = locations.find(l => locationUuid == l.uuid)
    if (!destination) {
      console.error(
        `Failed to move ${participantUuid}. Location ${locationUuid} unknown`
      )
      return
    }

    //Find origin location
    const origin = locations.find(l =>
      l.participants?.includes(participantUuid)
    )

    if (!origin) {
      console.error(`Failed to find ${participantUuid} in locations`)
      return
    }

    if (!destination.participants) destination.participants = []
    destination.participants.push(participantUuid)
    // destination.participants.sort(sortByRoleAndDex)

    const oldParticipantsList = origin.participants.filter(
      p => participantUuid != p
    )
    origin.participants = oldParticipantsList

    await this.updateLocationsList(locations, { render: render })
  }

  //Handle scrolling
  async setchaseTrackScroll ({
    from = undefined,
    to = -1,
    render = true
  } = {}) {
    await this.update(
      {
        'data.scroll.chaseTrack.from':
          undefined === from ? this.chaseTrackCurrentScrollPosition : from,
        'data.scroll.chaseTrack.to':
          undefined === to ? this.chaseTrackCurrentScrollPosition : to
      },
      { render: render }
    )
  }

  get chaseTrackCurrentScrollPosition () {
    const html = this.sheet?.element
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
    const htmlElement = html ? html : this.sheet?.element
    if (!htmlElement) return -1
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

  //Utilities
  findIndex (list, uuid) {
    return list.findIndex(p => p.uuid == uuid)
  }

  get started () {
    return this.getFlag('CoC7', 'started')
  }

  async start () {
    const remString = $(':root').css('font-size')
    const remSize = Number(remString.replace('px', ''))
    const pCount = this.data.data.participants.length
    const width = (pCount * 11.2 + 3) * remSize
    this.sheet._tabs[0].active = 'setup'
    this.sheet.position.width = width
    return this.setFlag('CoC7', 'started', true)
  }

  async stop () {
    return this.unsetFlag('CoC7', 'started')
  }

  generateNewUuid () {
    let unique = false
    let uuid
    while (!unique) {
      uuid = foundry.utils.randomID(16)
      unique =
        0 === this.data.data.participants.filter(p => p.uuid == uuid).length &&
        0 === this.data.data.locations.list.filter(p => p.uuid == uuid).length
    }

    return uuid
  }

  get activeActorSkillsAndCharacteristics () {
    const actor = this.activeActor
    if (!actor) return undefined
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
    actor.skills.forEach(s => list.push(s.fullName))
    return list
  }

  /**
   * Clean the data of all parasite participants in locations.
   * Should never happen
   */
  // async cleanLocations () {
  //   const locations = duplicate(this.data.data.locations.list)
  //   locations.forEach(l => {
  //     const partipantsUuidArray = this.data.data.participants.map(p => p.uuid)
  //     if (l.participants) {
  //       l.participants = l.participants.filter(uuid =>
  //         partipantsUuidArray.includes(uuid)
  //       )
  //     }
  //   })
  //   this.updateLocationsList(locations)
  // }
}
