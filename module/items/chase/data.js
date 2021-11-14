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
    this.data.data.participants.forEach(p => {
      pList.push(new _participant(p))
      p.index = pList.length - 1
    })
    return pList
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

  async updateParticipants (list) {
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
    await this.update({ 'data.participants': participantsData })
    return
  }

  async activateParticipant (
    participantUuid,
    { scrollToLocation = true, activateLocation = true } = {}
  ) {
    const participants = this.data.data.participants
      ? duplicate(this.data.data.participants)
      : []
    participants.forEach(p => {
      delete p.active
      if (participantUuid == p.uuid) p.active = true
    })
    await this.updateParticipants(participants)
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
    const chasers = this.chasers

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

  async updateLocationsList (list) {
    //Remove all unnecessary items (cssClass, )
    const updatedList = this.cleanLocationsList(list)
    await this.update({ 'data.locations.list': updatedList })
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

  async activateLocation (locationUuid, { scrollToLocation = true } = {}) {
    const updateData = {}
    const locations = this.data.data.locations.list
      ? duplicate(this.data.data.locations.list)
      : []
    locations.forEach(l => {
      delete l.active
      if (locationUuid == l.uuid) l.active = true
    })
    updateData['data.locations.list'] = this.cleanLocationsList( locations)
    // await this.updateLocationsList(locations, { render: false })
    if (scrollToLocation){
      updateData['data.scroll.chaseTrack.from'] = this.chaseTrackCurrentScrollPosition
      updateData['data.scroll.chaseTrack.to'] = this.getChaseTrackLocationScrollPosition(locationUuid)
      // await this.setchaseTrackScroll({
      //   from: this.chaseTrackCurrentScrollPosition,
      //   to: this.chaseTrackActiveLocationScrollPosition
      // })
    }
    await this.update( updateData)
  }

  //Locations navigation
  get activeLocation () {
    if (!this.locations) return undefined
    return this.locations.find(l => l.active)
  }

  get previousLocation () {
    if (!this.locations) return undefined
    const activeIndex = this.locations.findIndex(l => l.active)
    if (-1 == activeIndex) return undefined
    if (0 == activeIndex) return undefined
    return this.locations[activeIndex - 1]
  }

  get nextLocation () {
    if (!this.locations) return undefined
    const activeIndex = this.locations.findIndex(l => l.active)
    if (-1 == activeIndex) return undefined
    if (activeIndex == this.locations.length - 1) return undefined
    return this.locations[activeIndex + 1]
  }

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
        p.data.movementAction = 1 + (p.adjustedMov - minMov)
      })
      await this.updateParticipants(participants)
      await this.updateLocationsList(this.locations)
      await this.start()
    }
  }

  async restart () {
    // await this.cleanLocations() //Transferred in updateLocationList
    const locations = this.locations.filter(l => !l.init)
    for (let i = 0; i < locations.length; i++) {
      if (locations[i].participants) locations[i].participants = []
    }
    await this.updateLocationsList(locations)
    await this.stop()
  }

  async moveParticipant (
    participantUuid,
    locationMoved,
    { checkMovementActions = true } = {}
  ) {
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

    if (0 != totalMove) {
      await this.moveParticipantToLocation(
        participantUuid,
        locations[destinationIndex].uuid
      )
    }
    return totalMove
  }

  async moveParticipantToLocation (participantUuid, locationUuid) {
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

    await this.updateLocationsList(locations)
  }

  //Handle scrolling
  async setchaseTrackScroll ({ from = -1, to = -1 } = {}) {
    await this.update({
      'data.scroll.chaseTrack.from': from,
      'data.scroll.chaseTrack.to': to
    }, { render: true })
  }

  get chaseTrackCurrentScrollPosition () {
    const html = this.sheet?.element
    if (!html) return -1
    const chaseTrack = html[0].querySelector('.chase-track')
    if (!chaseTrack) return -1
    return chaseTrack.scrollLeft
  }

  /**
   * Return the offset position of the active location
   * the center of the active location will be centered
   * in the parent.
   */
  get chaseTrackActiveLocationScrollPosition () {
    if (!this.activeLocation) return -1
    return this.getChaseTrackLocationScrollPosition( this.activeLocation.uuid)
  }

  getChaseTrackLocationScrollPosition( locationUuid){
    const html = this.sheet?.element
    if (!html) return -1
    const chaseTrack = html[0].querySelector('.chase-track')
    if (!chaseTrack) return -1
    const activeLocationElement = chaseTrack.querySelector(
      `.chase-location[data-uuid="${locationUuid}"]`
    )
    if (!activeLocationElement) return -1
    const leftScroll =
      activeLocationElement.offsetLeft
      + activeLocationElement.clientWidth / 2
      - chaseTrack.clientWidth / 2
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
