/* global DragDrop, duplicate, expandObject, flattenObject, FormDataExtended, game, getType, ItemSheet, mergeObject, ui */

import { CoCActor } from '../../actors/actor.js'
import { CoC7Chat } from '../../chat.js'
import { chatHelper } from '../../chat/helper.js'
import { CoC7Check } from '../../check.js'

export class CoC7ChaseSheet extends ItemSheet {
  // constructor( ...args) {
  //  super( ...args);
  // }

  static get flags () {
    return {
      started: 'started'
    }
  }

  /**
   * Extend and override the default options used by the Simple Item Sheet
   * @returns {Object}
   */
  static get defaultOptions () {
    const options = mergeObject(super.defaultOptions, {
      classes: ['coc7', 'sheetV2', 'item', 'chase'],
      width: 550,
      height: 500,
      resizable: true,
      tabs: [
        {
          navSelector: '.sheet-nav',
          contentSelector: '.sheet-body',
          initial: 'participants'
        }
      ]
    })

    return options

    // closeOnSubmit: false,
    // submitOnClose: true,
  }

  /* -------------------------------------------- */

  /** @override */
  get template () {
    return 'systems/CoC7/templates/items/chase.html'
  }

  static get type () {
    return 'coc7ChaseSheet'
  }

  // /** @override */
  // async render(force, options) {
  //   return super.render(force, options);
  // }

  /** @override */

  getData (options = {}) {
    ui.notifications.warn(
      game.i18n.localize('CoC7.ExperimentalFeaturesWarning')
    )
    const data = super.getData(options)
    // if( this.started) options.tabs[0].initial = 'setup'
    if (this.started) this._tabs[0].active = 'setup'

    /** MODIF: 0.8.x **/
    const itemData = data.data
    data.data = itemData.data // MODIF: 0.8.x data.data
    /*****************/

    data.participants = this.participants
    data.preys = this.preys
    data.chasers = this.chasers

    // data.byDex = duplicate(data.participants).sort((a, b) => a.dex - b.dex)

    data.preysMinMov = data.preys.length
      ? data.preys.reduce((prev, current) =>
          prev.adjustedMov < current.adjustedMov ? prev : current
        ).adjustedMov
      : -1

    data.preysMaxMov = data.preys.length
      ? data.preys.reduce((prev, current) =>
          prev.adjustedMov > current.adjustedMov ? prev : current
        ).adjustedMov
      : -1

    data.chasersMinMov = data.chasers.length
      ? data.chasers.reduce((prev, current) =>
          prev.adjustedMov < current.adjustedMov ? prev : current
        ).adjustedMov
      : -1

    data.chasersMaxMov = data.chasers.length
      ? data.chasers.reduce((prev, current) =>
          prev.adjustedMov > current.adjustedMov ? prev : current
        ).adjustedMov
      : -1

    data.chasers.forEach(p => {
      if (p.adjustedMov < data.preysMinMov) p.tooSlow()
      else p.includeInChase()
      p.fastest = p.adjustedMov == data.chasersMaxMov
      p.slowest = p.adjustedMov == data.chasersMinMov
    })

    data.preys.forEach(p => {
      if (p.adjustedMov > data.chasersMaxMov) p.escaped()
      else p.includeInChase()
      p.fastest = p.adjustedMov == data.preysMaxMov
      p.slowest = p.adjustedMov == data.preysMinMov
    })

    data.locations = this.locations
    data.allHaveValidMov = this.allHaveValidMov
    data.activeLocation = this.activeLocation
    data.previousLocation = this.previousLocation
    data.nextLocation = this.nextLocation
    data.started = this.started
    data.dataListCheckOptions = this.allSkillsAndCharacteristics


    data.isKeeper = game.user.isGM
    return data
  }

  get participants () {
    const pList = []
    this.item.data.data.participants.forEach(p => {
      pList.push(new _participant(p))
      p.index = pList.length - 1
    })
    pList.sort((a, b) => a.adjustedMov - b.adjustedMov)
    return pList
    // return this.item.data.data.participants
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
        !list.includes(s.fullName) &&
        !s.fullName
          .toLowerCase()
          .includes(`(${game.i18n.localize('CoC7.AnySpecName')})`.toLowerCase())
      )
        list.push(s.fullName)
    }) // TODO: Remove ??
    this.participants.forEach(p => {
      if (p.actor) {
        p.actor.skills.forEach(s => {
          if (!list.includes(s.fullName)) list.push(s.fullName)
        })
      }
    })
    return list.sort(Intl.Collator().compare)
  }

  get preys () {
    return (
      this.participants
        .filter(p => !p.isChaser && p.isValid)
        .sort((a, b) => a.adjustedMov - b.adjustedMov) || []
    )
  }

  get chasers () {
    return (
      this.participants
        .filter(p => p.isChaser && p.isValid)
        .sort((a, b) => a.adjustedMov - b.adjustedMov) || []
    )
  }

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
        // ui.notifications.error(`Length : ${l.participants.length}`)

        for (let i = 0; i < l.participants.length; i++) {
          const elem = l.participants[i] // Init track = only uuid, update location list change for uuid

          // ui.notifications.error(`Type : ${typeof elem}`)
          let p
          if (typeof elem === 'string' || elem instanceof String) {
            p = this.item.data.data.participants.find(p => elem == p.uuid) //Retrieve participant data from list.
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

  get locations () {
    const locations = this.started
      ? this.item.data.data.locations.list
        ? duplicate(this.item.data.data.locations.list)
        : []
      : this.initTrack
    this.processLocations(locations)
    return locations
  }

  get initTrack () {
    if (
      !this.item.data.data.locations.list ||
      0 === this.item.data.data.locations.list.length
    )
      return undefined

    const locations = [] // !!!!!!! locations vs init locations !!!

    const init = this.startingLine
    let locationsIndexStart, initIndexStart, locationsLength
    if (0 >= init.length) locationsIndexStart = 0
    else if (this.item.data.data.startingIndex >= init.length)
      locationsIndexStart = 0
    else locationsIndexStart = init.length - this.item.data.data.startingIndex

    if (this.item.data.data.startingIndex <= 0) initIndexStart = 0
    else if (this.item.data.data.startingIndex <= init.length)
      initIndexStart = 0
    else initIndexStart = this.item.data.data.startingIndex - init.length

    if (0 == locationsIndexStart)
      locationsLength = this.item.data.data.locations.list.length
    else
      locationsLength =
        this.item.data.data.locations.list.length + locationsIndexStart

    if (0 != init.length) {
      if (this.item.data.data.startingIndex < 0) {
        for (
          let index = 0;
          index < Math.abs(this.item.data.data.startingIndex);
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

    const chaseLocations = duplicate(this.item.data.data.locations)
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

  get allHaveValidMov () {
    return this.participants.every(e => e.hasValidMov)
  }

  get allHaveSpeedRoll () {
    return this.participants.every(p => p.speedCheck?.rolled)
  }

  get started () {
    return this.item.getFlag('CoC7', CoC7ChaseSheet.flags.started)
  }

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
      await this.item.setFlag('CoC7', CoC7ChaseSheet.flags.started, true)
    }
  }

  get startingLine () {
    //Get preys and check for escaped
    const preys = this.item.data.data.includeEscaped
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
    const track = []

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
        track.push(location)
      }

      // Add space between chasers and preys.
      for (let index = 0; index < this.item.data.data.startingRange; index++) {
        track.push({
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
        track.push(location)
      }
    }

    return track
  }

  generateNewUuid () {
    let unique = false
    let uuid
    while (!unique) {
      uuid = foundry.utils.randomID(16)
      unique =
        0 ===
          this.item.data.data.participants.filter(p => p.uuid == uuid).length &&
        0 ===
          this.item.data.data.locations.list.filter(p => p.uuid == uuid).length
    }

    return uuid
  }

  /** @override */
  activateListeners (html) {
    super.activateListeners(html)

    // html.find('.track').ready(async html => await this._onSheetReady(html))

    html.on('dblclick', '.open-actor', CoC7Chat._onOpenActor.bind(this))

    html
      .find('.participant')
      .on('dragenter', event => this._onDragEnterParticipant(event))
    html
      .find('.participant')
      .on('dragover', event => this._onDragEnterParticipant(event))
    html
      .find('.participant')
      .on('dragleave', event => this._onDragLeaveParticipant(event))
    html
      .find('.participant')
      .on('drop', event => this._onDragLeaveParticipant(event))

    html.find('.p-side').click(this._onChangeSide.bind(this))
    html.find('.delete-participant').click(this._onDeleteParticipant.bind(this))
    html.find('.reset-roll').click(this._onResetRoll.bind(this))
    html.find('.delete-driver').click(this._onDeleteDriver.bind(this))

    html
      .find('.new-participant')
      .on('dragenter', event => this._onDragEnterParticipant(event))
    html
      .find('.new-participant')
      .on('dragover', event => this._onDragEnterParticipant(event))
    html
      .find('.new-participant')
      .on('dragleave', event => this._onDragLeaveParticipant(event))
    html
      .find('.new-participant')
      .on('drop', event => this._onDragLeaveParticipant(event))

    html.find('.add-sign').click(this._onAddParticipant.bind(this))

    html.find('.roll-participant').click(this._onRollParticipant.bind(this))

    html.find('.button').click(this._onButtonClick.bind(this))

    html.find('.name-container').click(this._onLocationClick.bind(this))

    html.find('.obstacle-type').click(this._onObstacleTypeClick.bind(this))
    html.find('.obstacle-toggle').click(this._onObstacleToggleClick.bind(this))
    html.find('.toggle').click(this._onToggle.bind(this))

    const participantDragDrop = new DragDrop({
      dropSelector: '.participant',
      callbacks: { drop: this._onDropParticipant.bind(this) }
    })
    participantDragDrop.bind(html[0])

    const newParticipantDragDrop = new DragDrop({
      dropSelector: '.new-participant',
      callbacks: { drop: this._onAddParticipant.bind(this) }
    })
    newParticipantDragDrop.bind(html[0])

    if (this.started) {
      const chaseParticipantDragpDrop = new DragDrop({
        dragSelector: '.chase-participant',
        dropSelector: '.chase-location',
        permissions: {
          dragstart: this._canChaseParticipantDragStart.bind(this),
          drop: this._canChaseParticipantDragDrop.bind(this)
        },
        callbacks: {
          dragstart: this._onChaseParticipantDragStart.bind(this),
          drop: this._onChaseParticipantDragDrop.bind(this),
          dragover: this._onDragEnter.bind(this)
        }
      })
      chaseParticipantDragpDrop.bind(html[0])

      html
        .find('.chase-location')
        .on('dragleave', event => this._onDragLeave(event))
    }
  }

  /* -------------------------------------------- */
  /*  Form Submission                             */
  /* -------------------------------------------- */

  /** @override */
  _getSubmitData (updateData = {}) {
    // Create the expanded update data object
    const fd = new FormDataExtended(this.form, { editors: this.editors })
    let data = fd.toObject()
    if (updateData) data = mergeObject(data, updateData)
    else data = expandObject(data)

    //Check that starting position is not outside of chase range.
    if (
      this.item.data.data.locations?.list?.length &&
      data.data.startingIndex > this.item.data.data.locations.list.length
    ) {
      data.data.startingIndex = this.item.data.data.locations.list.length
    }

    if (data.data.participants) {
      const participants = duplicate(this.item.data.data.participants)
      // Handle participants array
      for (const [k, v] of Object.entries(data.data.participants)) {
        const index = participants.findIndex(p => p.uuid == k)
        if (-1 == index) ui.notifications.error('Participant table corrupted')
        else {
          const original = participants[index]
          const cleaned = clean(v)
          mergeObject(original, cleaned)
          participants[index] = original
        }
      }

      data.data.participants = participants
    }

    if (data.locations) {
      const locations = duplicate(this.item.data.data.locations.list)
      //Handle locations list
      for (const [key, value] of Object.entries(data.locations)) {
        const locationIndex = locations.findIndex(l => l.uuid == key)
        if (-1 == locationIndex)
          ui.notifications.error('Locations table corrupted')
        else {
          const originalLocation = locations[locationIndex]
          const cleaned = clean(value)
          mergeObject(originalLocation, cleaned)
          locations[locationIndex] = originalLocation
        }
      }

      delete data.locations
      data.data.locations = { list: locations }
    }
    // const participants = data.data?.participants;
    // if( participants) data.data.participants = Object.values( participants).map( p => clean(p));

    // Return the flattened submission data
    return flattenObject(data)
  }

  /** @override */
  // async _onSubmit(...args) {
  //  await super._onSubmit(...args);
  // }

  async _updateObject (event, formData) {
    const target = event.currentTarget
    const override = target?.dataset?.override === 'true'
    if (override) {
      const [, type, uuid, subType, data] = target.name.split('.')
      const index = this.findParticipantIndex(uuid)
      if (
        type === 'participants' &&
        !isNaN(index) &&
        subType === 'speed-check'
      ) {
        if (data === 'name') {
          // Changing name will remove all other ref !
          const participants = this.item.data.data.participants
            ? duplicate(this.item.data.data.participants)
            : []
          if (participants[index].speedCheck) {
            delete participants[index].speedCheck.id
            delete participants[index].speedCheck.type
          } else participants[index].speedCheck = {}
          participants[index].speedCheck.name = target.value
          await this.item.update({ 'data.participants': participants })
          return
        }
      }
    }
    super._updateObject(event, formData)
  }

  static /**async */ setScroll (app, html, data) {
    const track = html.find('.track')
    if (!track.length) return
    const element = $(track).find('.active')
    if (!element.length) return

    const originalPosition = data.data.trackScrollPosition

    const elementleft = element[0].offsetLeft
    const divWidth = track[0].clientWidth
    let elementCenterRelativeLeft = elementleft - divWidth / 2
    if (elementCenterRelativeLeft < 0) elementCenterRelativeLeft = 0

    const trackElement = track[0]

    if (-1 != originalPosition) {
      trackElement.scrollTo({
        top: 0,
        left: originalPosition,
        behavior: 'instant'
      })
    }

    trackElement.scrollTo({
      top: 0,
      left: elementCenterRelativeLeft,
      behavior: 'smooth'
    })

    // await app.item.update({ 'data.trackScrollPosition': elementCenterRelativeLeft })
  }

  static onClose (app, html) {
    app.item.update({ 'data.trackScrollPosition': -1 })
  }

  // async _onSheetReady (html) {
  //   const track = html.find('.track')
  //   const element = $(track).find('.active')

  //   const elementleft = element[0].offsetLeft
  //   const divWidth = track[0].clientWidth
  //   let elementCenterRelativeLeft = elementleft - divWidth / 2
  //   if (elementCenterRelativeLeft < 0) elementCenterRelativeLeft = 0

  //   const scrollPosition = this.item.data.data.trackScrollPosition
  //   if (!track.length) return
  //   if (!scrollPosition) return
  //   const trackElement = track[0]
  //   trackElement.scrollTo({
  //     top: 0,
  //     left: elementCenterRelativeLeft,
  //     behavior: 'instant'
  //   })

  //   //TODO : couldd use parent.offsetTop et child.offsetTop to center the active element

  //   // const active = html.find('.name-container.active')
  //   // if( active){
  //   //   const element = active[0]
  //   //   element.scrollIntoView({behavior: "smooth", block: "end", inline: "center"})
  //   // element.scrollIntoView(false)
  //   // }
  //   // })
  // }

  findParticipantIndex (uuid) {
    return this.item.data.data.participants.findIndex(p => p.uuid == uuid)
  }

  findLocationIndex (uuid) {
    return this.item.data.data.locations.list.findIndex(p => p.uuid == uuid)
  }

  findIndex (list, uuid) {
    return list.findIndex(p => p.uuid == uuid)
  }

  async updateLocationsList (list) {
    //Remove all unnecessary items (cssClass, )
    const updatedList = duplicate(list)
    updatedList.forEach(l => {
      // delete l.active
      delete l.cssClasses
      delete l.first
      delete l.last
      delete l.end
      if (l.participants && l.participants.length) {
        for (let i = 0; i < l.participants.length; i++) {
          if (l.participants[i].data?.uuid)
            l.participants[i] = l.participants[i].data.uuid
        }
      }
    })
    await this.item.update({ 'data.locations.list': updatedList })
  }

  async updateParticipants (list) {
    const participantsData = this.item.data.data.participants
      ? duplicate(this.item.data.data.participants)
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
    await this.item.update({ 'data.participants': participantsData })
    return
  }

  async _onToggle (event) {
    const target = event.currentTarget
    // const locationElement = target.closest('.location.obstacle')
    // const uuid = locationElement.dataset.uuid
    // const locations = duplicate(this.item.data.data.locations.list)
    // const locationIndex = this.findIndex(locations, uuid)
    const toggle = target.getAttribute('toggle')
    const data = expandObject({
      [toggle]: !target.classList.contains('switched-on')
    })
    if (data.locations) {
      const locations = duplicate(this.item.data.data.locations.list)
      for (const [key, value] of Object.entries(data.locations)) {
        const locationIndex = locations.findIndex(l => l.uuid == key)
        if (-1 == locationIndex)
          ui.notifications.error('Locations table corrupted')
        else {
          const originalLocation = locations[locationIndex]
          const cleaned = clean(value)
          mergeObject(originalLocation, cleaned)
          locations[locationIndex] = originalLocation
        }
      }
      await this.updateLocationsList(locations)
    }
  }

  async _onObstacleToggleClick (event) {
    const target = event.currentTarget
    const locationElement = target.closest('.location.obstacle')
    const uuid = locationElement.dataset.uuid
    const locations = duplicate(this.item.data.data.locations.list)
    const locationIndex = this.findIndex(locations, uuid)
    locations[locationIndex].obstacle = !locations[locationIndex].obstacle
    if (!locations[locationIndex].obstacleDetails) {
      locations[locationIndex].obstacleDetails = {
        barrier: true
      }
    }
    await this.updateLocationsList(locations)
  }

  async _onObstacleTypeClick (event) {
    const target = event.currentTarget
    const locationElement = target.closest('.location.obstacle')
    const uuid = locationElement.dataset.uuid
    const locations = duplicate(this.item.data.data.locations.list)
    const locationIndex = this.findIndex(locations, uuid)
    if (!locations[locationIndex].obstacleDetails)
      locations[locationIndex].obstacleDetails = {}
    if (target.classList.contains('barrier')) {
      locations[locationIndex].obstacleDetails.barrier = !locations[
        locationIndex
      ].obstacleDetails.barrier
      locations[locationIndex].obstacleDetails.hazard = !locations[
        locationIndex
      ].obstacleDetails.barrier
    } else if (target.classList.contains('hazard')) {
      locations[locationIndex].obstacleDetails.hazard = !locations[
        locationIndex
      ].obstacleDetails.hazard
      locations[locationIndex].obstacleDetails.barrier = !locations[
        locationIndex
      ].obstacleDetails.hazard
    }
    await this.updateLocationsList(locations)
  }

  async _onLocationClick (event) {
    const target = event.currentTarget
    const track = target.closest('.track')
    await this.item.update({ 'data.trackScrollPosition': track.scrollLeft })
    const active = target.classList.contains('active')
    const locations = duplicate(this.item.data.data.locations.list)
    locations.forEach(l => (l.active = false))
    const locationElement = target.closest('.chase-location')
    const uuid = locationElement.dataset.uuid
    const locationIndex = this.findIndex(locations, uuid)
    if (-1 != locationIndex) {
      if (!active) locations[locationIndex].active = true
      await this.updateLocationsList(locations)
    }
  }

  async _onButtonClick (event) {
    const target = event.currentTarget
    const action = target.dataset?.action
    if (!action) return
    switch (action) {
      case 'init':
        if (
          !isNaN(this.item.data.data.locations.total) &&
          this.item.data.data.locations.total > 0
        ) {
          const locations = Array.apply(
            null,
            Array(this.item.data.data.locations.total)
          ).map(function () {
            return { uuid: foundry.utils.randomID(16) }
          })
          locations[0].name = 'Start'
          if (locations.length > 1) locations[locations.length - 1].name = 'End'
          await this.updateLocationsList(locations)
        }

        break
      case 'reset':
        Dialog.confirm({
          title: `${game.i18n.localize('CoC7.ConfirmResetChase')}`,
          content: `<p>${game.i18n.localize('CoC7.ConfirmResetChaseHint')}</p>`,
          yes: async () => {
            await this.updateLocationsList([])
            await this.item.unsetFlag('CoC7', CoC7ChaseSheet.flags.started)
          }
        })
        break

      case 'cut2chase':
        Dialog.confirm({
          title: `${game.i18n.localize('CoC7.ConfirmCut2Chase')}`,
          content: `<p>${game.i18n.localize('CoC7.ConfirmCut2ChaseHint')}</p>`,
          yes: () => this.cutToTheChase()
        })
        break

      case 'restart':
        Dialog.confirm({
          title: `${game.i18n.localize('CoC7.ConfirmRestartChase')}`,
          content: `<p>${game.i18n.localize(
            'CoC7.ConfirmRestartChaseHint'
          )}</p>`,
          yes: async () => {
            const locations = this.locations.filter(l => !l.init)
            for (let i = 0; i < locations.length; i++) {
              if (locations[i].participants) locations[i].participants = []
            }
            await this.updateLocationsList(locations)
            await this.item.unsetFlag('CoC7', CoC7ChaseSheet.flags.started)
          }
        })
        break

      default:
        break
    }
  }

  _canChaseParticipantDragStart (selector) {
    if (game.user.isGM) return true
    return false
  }

  _canChaseParticipantDragDrop (selector) {
    if (game.user.isGM) return true
    return false
  }

  async _onChaseParticipantDragStart (dragEvent) {
    const target = dragEvent.currentTarget
    const dragData = { uuid: target.dataset.uuid }
    dragEvent.dataTransfer.setData('text/plain', JSON.stringify(dragData))
  }

  async _onChaseParticipantDragDrop (dragEvent) {
    ui.notifications.info('Dropped')
    this._onDragLeave(dragEvent)

    const target = dragEvent.currentTarget
    const locationUuid = target.dataset.uuid
    const dataString = dragEvent.dataTransfer.getData('text/plain')
    const data = JSON.parse(dataString)
    ui.notifications.info(
      `dragged particpant ${data.uuid} onto location ${locationUuid}`
    )
    await this.moveParticipant(data.uuid, locationUuid)
  }

  _onDragOver (dragEvent) {
    this._onDragEnter(dragEvent)
  }

  _onDragEnter (dragEvent) {
    const target = dragEvent.currentTarget
    target.classList.add('drag-over')
  }

  _onDragLeave (dragEvent) {
    const target = dragEvent.currentTarget
    target.classList?.remove('drag-over')
  }

  async _onDropParticipant (event) {
    const target = event.currentTarget
    const uuid = target.dataset?.uuid
    const dataString = event.dataTransfer.getData('text/plain')
    const data = JSON.parse(dataString)
    await this.alterParticipant(data, uuid)
  }

  async _onAddParticipant (event) {
    let data = {}
    if (event.dataTransfer) {
      const dataString = event.dataTransfer.getData('text/plain')
      data = JSON.parse(dataString)
    }
    await this.addParticipant(data)
  }

  async _onRollParticipant (event) {
    const target = event.currentTarget
    const participantElement = target.closest('.participant')
    const uuid = participantElement.dataset.uuid
    const index = this.findParticipantIndex(uuid)
    const participants = this.item.data.data.participants
      ? duplicate(this.item.data.data.participants)
      : []

    const participant = new _participant(participants[index])
    if (participant.speedCheck.refSet) {
      const roll = new CoC7Check()
      roll.parent = this.item.uuid
      participant.data.rolled = true
      participant.data.rollUuid = roll.uuid
      roll.actor = participant.actor.actorKey
      if (!event.shiftKey && participant.actor.player) {
        roll.standby = true
        roll.standbyText = 'CoC7.Chase'
        roll.standbyRightIcon = 'systems/CoC7/assets/icons/running-solid.svg'
      }

      if (participant.speedCheck.isCharacteristic) {
        await roll.rollCharacteristic(participant.speedCheck.ref.key)
        await roll.toMessage()
        participant.data.speedCheck.rollDataString = roll.JSONRollString
      } else if (participant.speedCheck.isSkill) {
        roll.skill = participant.speedCheck.ref
        await roll.roll()
        await roll.toMessage()
        participant.data.speedCheck.rollDataString = roll.JSONRollString
      } else if (participant.speedCheck.isAttribute) {
        await roll.rollAttribute(participant.speedCheck.ref.key)
        await roll.toMessage()
        participant.data.speedCheck.rollDataString = roll.JSONRollString
      }
    } else if (participant.speedCheck.score) {
      const rollData = {
        rawValue: participant.speedCheck.score,
        displayName: participant.speedCheck.name,
        actorName: participant.name ? participant.name : undefined
      }
      if (participant.hasActor) rollData.actor = participant.actor.actorKey
      const roll = CoC7Check.create(rollData)
      roll.parent = this.item.uuid
      await roll.roll()
      await roll.toMessage()
      participant.data.speedCheck.rollDataString = roll.JSONRollString
      participant.data.rolled = true
      participant.data.rollUuid = roll.uuid
    }

    await this.item.update({ 'data.participants': participants })
  }

  _onDragEnterParticipant (event) {
    const target = event.currentTarget
    target.classList.add('drag-over')
  }

  _onDragLeaveParticipant (event) {
    const target = event.currentTarget
    target.classList.remove('drag-over')
  }

  async _onChangeSide (event) {
    // const test = await fromUuid( 'Scene.wh7SLuvIOpcQyb8S.Token.nCdoCyoiudtjrNku');
    // const itemTest = await fromUuid( 'Item.plIEmNRP6O7PveNv.roll.q2sAzsHt4FsqsdfD');

    const target = event.currentTarget
    const participant = target.closest('.participant')
    const uuid = participant.dataset.uuid
    const index = this.findParticipantIndex(uuid)
    const participants = this.item.data.data.participants
      ? duplicate(this.item.data.data.participants)
      : []
    participants[index].chaser = !participants[index].chaser
    await this.item.update({ 'data.participants': participants })
  }

  async _onDeleteDriver (event) {
    const target = event.currentTarget
    const driver = target.closest('.driver')
    const uuid = driver.dataset.uuid
    const index = this.findParticipantIndex(uuid)
    const participants = this.item.data.data.participants
      ? duplicate(this.item.data.data.participants)
      : []
    const participant = participants[index]
    delete participant.actorKey
    await this.item.update({ 'data.participants': participants })
  }

  async _onDeleteParticipant (event) {
    const target = event.currentTarget
    const participant = target.closest('.participant')
    const uuid = participant.dataset.uuid
    const index = this.findParticipantIndex(uuid)
    const participants = this.item.data.data.participants
      ? duplicate(this.item.data.data.participants)
      : []
    participants.splice(index, 1)
    await this.item.update({ 'data.participants': participants })
  }

  async _onResetRoll (event) {
    const target = event.currentTarget
    const participant = target.closest('.participant')
    const uuid = participant.dataset.uuid
    const index = this.findParticipantIndex(uuid)
    const participants = this.item.data.data.participants
      ? duplicate(this.item.data.data.participants)
      : []
    delete participants[index].speedCheck.rollDataString
    await this.item.update({ 'data.participants': participants })
  }

  async alterParticipant (data, uuid) {
    const actorKey =
      data.sceneId && data.tokenId
        ? `${data.sceneId}.${data.tokenId}`
        : data.type === 'Actor'
        ? data.id
        : data.actorId || data.actorKey
    const participant = {}
    const actor = chatHelper.getActorFromKey(actorKey)
    if (actor) {
      if (actor.data.type === 'vehicle') participant.vehicleKey = actorKey
      else participant.actorKey = actorKey
    }

    switch (data.type?.toLowerCase()) {
      case 'actor':
        break
      case 'item':
        participant.speedCheck = {
          id: data.data?._id || data.id,
          type: 'item'
        }
        break
      case 'characteristic':
        participant.speedCheck = {
          id: data.name,
          type: 'characteristic'
        }
        break
      case 'attribute':
        participant.speedCheck = {
          id: data.name,
          type: 'attribute'
        }
        break

      default:
        break
    }

    //TODO:Check for speed check, if none add speedcheck
    //speedCheck = {
    //   id: 'str'
    //   type: 'characteristic'
    // }
    const participants = this.item.data.data.participants
      ? duplicate(this.item.data.data.participants)
      : []
    const index = this.findParticipantIndex(uuid)
    const oldParticipant = participants[index]
    if (oldParticipant.mov) delete oldParticipant.mov
    mergeObject(oldParticipant, participant)
    await this.item.update({ 'data.participants': participants })
  }

  async addParticipant (data) {
    const actorKey =
      data.sceneId && data.tokenId
        ? `${data.sceneId}.${data.tokenId}`
        : data.actorId || data.actorKey || data.id
    const participant = {}
    const actor = chatHelper.getActorFromKey(actorKey)
    if (actor) {
      if (actor.data.type === 'vehicle') participant.vehicleKey = actorKey
      else participant.actorKey = actorKey
    }

    // const participant = {
    //  actorKey : (data.sceneId && data.tokenId)?`${data.sceneId}.${data.tokenId}`:data.actorId||data.actorKey||data.id
    // };
    // const actor = chatHelper.getActorFromKey( participant.actorKey);
    // if( !actor) delete participant.actorKey;

    switch (data.type?.toLowerCase()) {
      case 'actor':
        break
      case 'item':
        if (data.id) {
          const item = game.items.get(data.id)
          if (item?.data?.type !== 'skill') return
        }

        participant.speedCheck = {
          id: data.data?._id || data.id,
          type: 'item'
        }
        break
      case 'characteristic':
        participant.speedCheck = {
          id: data.name,
          type: 'characteristic'
        }
        break
      case 'attribute':
        participant.speedCheck = {
          id: data.name,
          type: 'attribute'
        }
        break

      default:
        break
    }

    //TODO:Check for speed check, if none add speedcheck con non vehicule, drive auto for vehicule
    //speedCheck = {
    //   id: 'con'
    //   type: 'characteristic'
    // }

    if (!participant.speedCheck) {
      if (!this.item.data.data.vehicule) {
        participant.speedCheck = {
          id: 'con',
          type: 'characteristic',
          name: game.i18n.localize('CHARAC.Constitution')
        }
      } else {
        participant.speedCheck = {
          type: 'item',
          name: game.i18n.localize('CoC7.DriveAutoSkillName')
        }
      }
    }
    const participants = this.item.data.data.participants
      ? duplicate(this.item.data.data.participants)
      : []

    let unique = false
    while (!unique) {
      participant.uuid = foundry.utils.randomID(16)
      unique = 0 === participants.filter(p => p.uuid == participant.uuid).length
    }

    participants.push(participant)
    await this.item.update({ 'data.participants': participants })
  }

  async updateRoll (rollString) {
    if (game.user.isGM) {
      const roll = CoC7Check.fromRollString(rollString)
      const participants = this.item.data.data.participants
        ? duplicate(this.item.data.data.participants)
        : []
      const index = participants.findIndex(p => p.rollUuid === roll.uuid)
      if (index >= 0) {
        participants[index].speedCheck.rollDataString = roll.JSONRollString
        await this.item.update({ 'data.participants': participants })
      }
    } else {
      const data = {
        data: rollString,
        type: 'invoke',
        method: 'updateRoll',
        item: this.item.uuid
      }
      game.socket.emit('system.CoC7', data)
    }
  }

  async moveParticipant (participantUuid, locationUuid) {
    const locations = duplicate(this.item.data.data.locations.list)

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
    // if (l.participants) {
    //   if (-1 != l.participants.findIndex(p => participantUuid == p.uuid || p == participantUuid))
    //     return true
    // }
    // return false
    // })
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
}

export function sortByRoleAndDex (a, b) {
  //Put chasers first
  if (b.chaser && !a.chaser) return 1
  if (a.chaser && !b.chaser) return -1
  //If sametype sort by dex
  return a.dex - b.dex
}

export function clean (obj) {
  for (const propName in obj) {
    const tp = getType(obj[propName])
    if (tp === 'Object') {
      obj[propName] = clean(obj[propName])
    }

    if (tp === 'Object' && !Object.entries(obj[propName]).length) {
      obj[propName] = null
    } else if (tp === 'string' && !obj[propName].length) {
      obj[propName] = null
    } else if (tp === 'string' && !isNaN(Number(obj[propName]))) {
      obj[propName] = Number(obj[propName])
    }
  }
  return obj
}

export class _participant {
  constructor (data = {}) {
    this.data = data
  }

  get actor () {
    if (!this._actor) {
      this._actor = chatHelper.getActorFromKey(this.data.actorKey)
    }
    return this._actor
  }

  get isActor () {
    return this.hasActor || this.hasVehicle
  }

  get key () {
    if (this.hasVehicle) return this.vehicle.actorKey
    if (this.hasActor) return this.actor.actorKey
    return undefined
  }

  get icon () {
    if (!this.isActor) {
      return 'systems/CoC7/assets/icons/question-circle-regular.svg'
    }
    if (this.hasVehicle) return this.vehicle.img
    if (this.hasActor) return this.actor.img
    return undefined
  }

  get driver () {
    if (!this._driver) {
      this._driver = chatHelper.getActorFromKey(this.data.actorKey)
    }
    return this._driver
  }

  get vehicle () {
    if (this.data.vehicleKey) {
      this._vehicle = chatHelper.getActorFromKey(this.data.vehicleKey)
    }
    return this._vehicle
  }

  get hasActor () {
    return !!this.actor
  }

  get hasVehicle () {
    return !!this.vehicle
  }

  get name () {
    if (this.hasVehicle) return this.vehicle.name
    if (this.hasActor) return this.actor.name
    return this.data.name || undefined
  }

  get mov () {
    if (!this.data.mov) {
      if (this.hasVehicle) this.data.mov = this.vehicle.mov
      else if (this.hasActor) this.data.mov = this.actor.mov
    }

    if (this.data.mov) {
      if (!isNaN(Number(this.data.mov))) this.data.hasValidMov = true
      else {
        this.data.hasValidMov = false
        this.data.mov = undefined
      }
    }

    return this.data.mov
  }

  get uuid () {
    return this.data.uuid
  }

  get dex () {
    if (!this.data.dex) {
      if (this.hasVehicle && this.hasDriver) {
        this.data.dex = this.driver.characteristics.dex.value
      } else if (this.hasActor) {
        this.data.dex = this.actor.characteristics.dex.value
      }
    }

    if (this.data.dex) {
      if (!isNaN(Number(this.data.dex))) this.data.hasValidDex = true
      else {
        this.data.hasValidDex = false
        this.data.dex = 0
      }
    }

    return this.data.dex
  }

  get isChaser () {
    return !!this.data.chaser
  }

  get isValid () {
    return this.hasValidDex && this.hasValidMov
  }

  get hasValidDex () {
    return !isNaN(Number(this.data.dex))
  }

  get hasValidMov () {
    return !isNaN(Number(this.data.mov))
  }

  get hasDriver () {
    return this.hasVehicle && this.hasActor
  }

  get movAdjustment () {
    if (this.data.speedCheck?.rollDataString) {
      const roll = CoC7Check.fromRollString(this.data.speedCheck.rollDataString)
      if (roll) {
        if (!roll.standby) {
          if (roll.successLevel >= CoC7Check.successLevel.extreme) return 1
          else if (roll.failed) return -1
        }
      }
    }
    return 0
  }

  get adjustedMov () {
    if (typeof this.mov === 'undefined') return undefined
    if (isNaN(Number(this.mov))) return undefined
    return Number(this.mov) + this.movAdjustment
  }

  get hasMovAdjustment () {
    return this.hasBonusMov || this.hasMalusMov
  }

  get hasBonusMov () {
    if (this.data.movAdjustment > 0) return true
    return false
  }

  get hasMalusMov () {
    if (this.data.movAdjustment < 0) return true
    return false
  }

  // get options(){
  //  return {
  //    exclude: [],
  //    excludeStartWith: '_'
  //  };
  // }

  // get dataString(){
  //  return JSON.stringify(this, (key,value)=>{
  //    if( null === value) return undefined;
  //    if( this.options.exclude?.includes(key)) return undefined;
  //    if( key.startsWith(this.options.excludeStartWith)) return undefined;
  //    return value;
  //  });
  // }

  tooSlow () {
    this.data.excluded = true
  }

  includeInChase () {
    this.data.excluded = false
    this.data.escaped = false
  }

  escaped () {
    this.data.escaped = true
  }

  set slowest (x) {
    this.data.slowest = x
  }

  set fastest (x) {
    this.data.fastest = x
  }

  set movementAction (x) {
    this.data.movementAction = x
  }

  get cssClass () {
    const cssClasses = []
    if (this.isChaser) cssClasses.push('chaser')
    else cssClasses.push('prey')
    if (this.data.excluded) cssClasses.push('excluded', 'too_slow')
    if (this.data.escaped) cssClasses.push('escaped')
    if (this.data.fastest) cssClasses.push('fastest')
    if (this.data.slowest) cssClasses.push('slowest')
    return cssClasses.join(' ')
  }

  get speedCheck () {
    const check = {}
    if (this.data.speedCheck?.name) check.name = this.data.speedCheck.name
    if (this.data.speedCheck?.score) check.score = this.data.speedCheck.score
    check.cssClasses = ''
    if (this.data.speedCheck?.rollDataString) {
      check.roll = CoC7Check.fromRollString(this.data.speedCheck.rollDataString)
      if (check.roll) {
        if (!check.roll.standby || check.roll.hasCard) {
          check.rolled = true
          check.inlineRoll = check.roll.inlineCheck.outerHTML
          check.cssClasses += 'rolled'
          if (!check.roll.standby) {
            if (check.roll.successLevel >= CoC7Check.successLevel.extreme) {
              check.modifierCss = 'upgrade'
            } else if (check.roll.failed) check.modifierCss = 'downgrade'
            if (
              check.roll.successLevel >= CoC7Check.successLevel.extreme ||
              check.roll.failed
            ) {
              check.hasModifier = true
            }
          }
        }
      }
    }
    if (this.hasActor) {
      check.options = []
      for (const c of ['con']) {
        const characterisitc = this.actor.getCharacteristic(c)
        if (characterisitc?.value) check.options.push(characterisitc.label)
      }

      for (const s of this.actor.driveSkills) {
        check.options.push(s.name)
      }

      for (const s of this.actor.pilotSkills) {
        check.options.push(s.name)
      }
      check.hasOptions = !!check.options.length

      if (this.data.speedCheck?.id) {
        let item = this.actor.find(this.data.speedCheck.id)
        if (!item) {
          const gameItem = game.items.get(this.data.speedCheck.id)
          if (gameItem) item = this.actor.find(gameItem.name)
        }

        if (item) {
          if (item.type === 'item' && item.value.data?.type === 'skill') {
            check.ref = item.value
            check.name = item.value.name
            check.type = 'skill'
            check.isSkill = true
            check.refSet = true
            check.score = item.value.value
          }
          if (item.type === 'characteristic') {
            check.ref = item.value
            check.name = item.value.label
            check.type = 'characteristic'
            check.isCharacteristic = true
            check.refSet = true
            check.score = item.value.value
          }
          if (item.type === 'attribute') {
            check.ref = item.value
            check.name = item.value.label
            check.type = 'attribute'
            check.isAttribute = true
            check.refSet = true
            check.score = item.value.value
          }
        }
      } else if (this.data.speedCheck?.name) {
        const item = this.actor.find(this.data.speedCheck.name)
        if (item) {
          if (item.type === 'item' && item.value.data?.type === 'skill') {
            check.ref = item.value
            check.name = item.value.name
            check.type = 'skill'
            check.isSkill = true
            check.refSet = true
            check.score = item.value.value
          }
          if (item.type === 'characteristic') {
            check.ref = item.value
            check.name = item.value.label
            check.type = 'characteristic'
            check.isCharacteristic = true
            check.refSet = true
            check.score = item.value.value
          }
          if (item.type === 'attribute') {
            check.ref = item.value
            check.name = item.value.label
            check.type = 'attribute'
            check.isAttribute = true
            check.refSet = true
            check.score = item.value.value
          }
        }
      }
    } else if (this.data.speedCheck?.id) {
      const item = game.items.get(this.data.speedCheck.id)
      if (item) {
        if (item.data?.type === 'skill') {
          check.ref = item
          check.name = item.name
          check.type = 'skill'
          check.isSkill = true
          check.refSet = false
          check.score = item.base
        }
      }
    }

    if (!check.rolled && !check.score) check.cssClasses += ' invalid'
    check.isValid = check.rolled && !isNaN(check.score)

    return check
  }
}
