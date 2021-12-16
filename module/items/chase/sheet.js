/* global DragDrop, duplicate, expandObject, flattenObject, FormDataExtended, game, getType, ItemSheet, mergeObject, ui */

import { CoCActor } from '../../actors/actor.js'
import { CoC7Chat } from '../../chat.js'
import { chatHelper } from '../../chat/helper.js'
import { CoC7Check } from '../../check.js'
import { _participant } from './participant.js'

export class CoC7ChaseSheet extends ItemSheet {
  constructor (...args) {
    super(...args)
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
    // ui.notifications.warn(
    //   game.i18n.localize('CoC7.ExperimentalFeaturesWarning')
    // )
    const data = super.getData(options)
    // if (this.item.started) this._tabs[0].active = 'setup'

    /** MODIF: 0.8.x **/
    const itemData = data.data
    data.data = itemData.data // MODIF: 0.8.x data.data
    /*****************/

    data.participants = this.item.participantsObject
    data.participantsByInitiative = this.item.participantsByInitiative
    data.preys = this.item.preys
    data.chasers = this.item.chasers

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

    data.locations = this.item.locations
    data.allHaveValidMov = this.allHaveValidMov
    data.activeLocation = this.item.activeLocation
    data.previousLocation = this.item.previousLocation
    data.nextLocation = this.item.nextLocation
    data.started = this.item.started

    data.isKeeper = game.user.isGM
    return data
  }

  // get activeParticipant () {
  //   if (!this.item.data.data.participants) return undefined
  //   const participant = this.item.data.data.participants.find(p => p.active)
  //   if (!participant) return undefined
  //   return new _participant(participant)
  // }

  // get activeParticipantLocation () {
  //   if (!this.item.data.data.participants) return undefined
  //   const participant = this.item.data.data.participants.find(p => p.active)
  // }

  /** @override */
  activateListeners (html) {
    super.activateListeners(html)

    // html.find('.chase-track').ready(async html => await this._onSheetReady(html))

    //Handle Droprown
    html
      .find('.dropdown-element')
      .on('click', event => this._onDropDownElementSelected(event))

    html.find('.dropbtn').click(event => {
      event.preventDefault()
      event.stopPropagation()
      const target = event.currentTarget
      const dropdown = target.closest('.dropdown')
      const dropdownContent = dropdown.querySelector('.dropdown-content')
      dropdownContent.classList.toggle('show')
    })
    html
      .find('.dropdown')
      .mouseleave(event =>
        event.currentTarget
          .querySelector('.dropdown-content')
          .classList.remove('show')
      )

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
    html
      .find('.participant-control')
      .click(this._onParticipantControlClicked.bind(this))

    html.find('.chase-control').click(this._onChaseControlClicked.bind(this))
    // html
    //   .find('.movement-action .decrease')
    //   .click(this._onChangeMovementActions.bind(this, -1))
    // html
    //   .find('.movement-action .increase')
    //   .click(this._onChangeMovementActions.bind(this, 1))

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

    if (this.item.started) {
      html
        .find('.chase-location .chase-participant')
        .click(this._onChaseParticipantClick.bind(this))

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
    if( target?.name?.includes('.hp')){
      const [, , uuid, data] = target.name.split('.')
      const participant = this.item.getParticipant(uuid)
      if( participant && participant.actor){
        if( !isNaN(Number( target.value))) await participant.actor.setHp( Number( target.value))
      }
    }
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

  static async setScroll (app, html, data) {
    const initialOpening = html[0].classList.contains('window-app')
    const chaseTrack = html[0].querySelector('.chase-track')
    if (!chaseTrack) return

    let start = data.data.scroll?.chaseTrack.from
    let end = data.data.scroll?.chaseTrack.to
    if (undefined == start) start = 0
    if (undefined == end) end = -1

    if (initialOpening) {
      if (app.item.started) {
        const remString = $(':root').css('font-size')
        const remSize = Number(remString.replace('px', ''))
        const pCount = data.participants.length
        const width = (pCount * 11.2 + 3) * remSize
        app._tabs[0].active = 'setup'
        app.position.width = width
        // html.css('width', `${width}px`)
      }
      return await app.item.activateNexParticpantTurn({ html: html }) //html is not rendered, element have size = 0
      // if (end > 0) {
      //   start = 0
      // } else if (start > 0) {
      //   end = start
      //   start = 0
      // }
    }

    if (start && -1 != start) {
      chaseTrack.scrollTo({
        top: 0,
        left: start,
        behavior: 'instant'
      })
    }

    if (-1 != end) {
      chaseTrack.scrollTo({
        top: 0,
        left: end,
        behavior: 'smooth'
      })
    }

    // await app.item.update({ 'data.trackScrollPosition': elementCenterRelativeLeft })
  }

  static onClose (app, html) {
    app.item.update({ 'data.trackScrollPosition': -1 })
  }

  // async _onSheetReady (html) {
  //   const track = html.find('.chase-track')
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

  findLocation (uuid) {
    return this.item.data.data.locations.list.find(p => p.uuid == uuid)
  }

  findIndex (list, uuid) {
    return list.findIndex(p => p.uuid == uuid)
  }

  async saveScrollLocation () {
    if (!this._element) return
    const chaseTrack = this._element.find('.chase-track')
  }

  async _onDropDownElementSelected (event) {
    event.preventDefault()
    event.stopPropagation()
    const target = event.currentTarget
    target.closest('.dropdown-content')?.classList.toggle('show')
    const assistantUuid = target.closest('.initiative-block')?.dataset?.uuid
    const beneficiaryUuid = target.dataset.beneficiaryUuid
    await this.item.assistParticipant(assistantUuid, beneficiaryUuid)
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
      await this.item.updateLocationsList(locations)
    }
  }

  async _onObstacleToggleClick (event) {
    const target = event.currentTarget
    const locationElement = target.closest('.obstacle')
    const uuid = locationElement.dataset.uuid
    const locations = duplicate(this.item.data.data.locations.list)
    const locationIndex = this.findIndex(locations, uuid)
    locations[locationIndex].obstacle = !locations[locationIndex].obstacle
    if (!locations[locationIndex].obstacleDetails) {
      locations[locationIndex].obstacleDetails = {
        barrier: true
      }
    }
    await this.item.updateLocationsList(locations)
  }

  async _onObstacleTypeClick (event) {
    const target = event.currentTarget
    const locationElement = target.closest('.obstacle')
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
    await this.item.updateLocationsList(locations)
  }

  async _onLocationClick (event) {
    const target = event.currentTarget
    const locationElement = target.closest('.chase-location')
    const lUuid = locationElement.dataset.uuid
    await this.item.activateLocation(lUuid)
  }

  async _onChaseParticipantClick (event) {
    const target = event.currentTarget
    const pUuid = event.currentTarget.dataset?.uuid
    await this.item.activateParticipant(pUuid)
  }

  async _onParticipantControlClicked (event) {
    event.preventDefault()
    const target = event.currentTarget
    if (target.classList.contains('inactive')) return
    if (target.classList.contains('dropdown')) return
    event.stopPropagation()

    const participantUuid = target.closest('.initiative-block')?.dataset?.uuid
    if (!participantUuid) return
    switch (target.dataset.control) {
      case 'drawGun':
        return await this.toggleParticipantGun(participantUuid)
      case 'decreaseActions':
        return await this._onChangeMovementActions(-1, event)
      case 'increaseActions':
        return await this._onChangeMovementActions(1, event)
      case 'moveBackward':
        return await this.item.moveParticipant(participantUuid, -1)
      case 'moveForward':
        return await this.item.moveParticipant(participantUuid, 1)
      case 'activateParticipant':
        return await this.item.activateParticipant(participantUuid)
      case 'bonusDice':
        const diceNumber = target.dataset.count
        return await this.item.toggleBonusDice(participantUuid, diceNumber)
      case 'cautiousApproach':
        return await this.item.cautiousApproach(participantUuid)
    }
  }

  async _onChaseControlClicked (event) {
    event.preventDefault()
    const target = event.currentTarget
    event.stopPropagation()

    const locationUuid = target.closest('.obstacle')?.dataset?.uuid
    if (!locationUuid) return
    switch (target.dataset.control) {
      case 'obstacle-skill-check':
        return await this.item.activeParticipantObstacleCheck(locationUuid)
    }
  }

  async _onChangeMovementActions (count, event) {
    event.preventDefault()
    event.stopPropagation()
    const target = event.currentTarget
    const participantUuid = target.closest('.initiative-block')?.dataset?.uuid
    if (!participantUuid) return
    const participants = this.item.participants
    const participant = participants.find(p => participantUuid == p.uuid)
    if (participant.hasMaxMvtActions && count > 0) return
    participant.alterMovementActions(count)

    // const sheet = target.closest('.coc7.item.chase')
    // const chaseTrack = sheet.querySelector('.chase-track')
    // if (chaseTrack)
    //   await this.item.update({
    //     'data.trackScrollPosition': chaseTrack.scrollLeft
    //   })
    await this.item.setchaseTrackScroll({ render: false })
    await this.item.updateParticipants(participants)
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
          await this.item.updateLocationsList(locations)
        }

        break
      case 'reset':
        Dialog.confirm({
          title: `${game.i18n.localize('CoC7.ConfirmResetChase')}`,
          content: `<p>${game.i18n.localize('CoC7.ConfirmResetChaseHint')}</p>`,
          yes: async () => {
            await this.item.updateLocationsList([])
            await this.item.stop()
          }
        })
        break

      case 'cut2chase':
        Dialog.confirm({
          title: `${game.i18n.localize('CoC7.ConfirmCut2Chase')}`,
          content: `<p>${game.i18n.localize('CoC7.ConfirmCut2ChaseHint')}</p>`,
          yes: () => this.item.cutToTheChase()
        })
        break

      case 'restart':
        Dialog.confirm({
          title: `${game.i18n.localize('CoC7.ConfirmRestartChase')}`,
          content: `<p>${game.i18n.localize(
            'CoC7.ConfirmRestartChaseHint'
          )}</p>`,
          yes: () => this.item.restart()
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
    // ui.notifications.info('Dropped')
    this._onDragLeave(dragEvent)

    const target = dragEvent.currentTarget
    const chaseTrack = target.closest('.chase-track')
    const locationUuid = target.dataset.uuid
    const dataString = dragEvent.dataTransfer.getData('text/plain')
    const data = JSON.parse(dataString)
    const oldLocation = this.findLocation(locationUuid)
    if (oldLocation) {
      if (oldLocation.participants?.includes(data.uuid)) return
    }
    // ui.notifications.info(
    //   `dragged particpant ${data.uuid} onto location ${locationUuid}`
    // )

    // await this.item.update({
    //   'data.trackScrollPosition': chaseTrack.scrollLeft
    // })
    await this.item.setchaseTrackScroll({ render: false })
    await this.item.moveParticipantToLocation(data.uuid, locationUuid)
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

  async toggleParticipantGun (participantUuid) {
    const participants = this.item.data.data.participants
      ? duplicate(this.item.data.data.participants)
      : []
    const participant = participants.find(p => participantUuid == p.uuid)
    if (!participant) return
    participant.hasAGunReady = !participant.hasAGunReady
    await this.item.setchaseTrackScroll({ render: false })
    await this.item.updateParticipants(participants)
  }
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
