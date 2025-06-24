/* global $, Dialog, DragDrop, FormDataExtended, foundry, game, TextEditor, ui */
import { _participant } from './participant.js'
import { addCoCIDSheetHeaderButton } from '../coc-id-system/coc-id-button.js'
import { CoC7ChaseParticipantImporter } from '../chase/apps/chase-participant-importer.js'
import { CoC7Chat } from '../../core/chat.js'
import { CoC7Check } from '../../core/check.js'
import { chatHelper } from '../../shared/dice/helper.js'

export class CoC7ChaseSheet extends foundry.appv1.sheets.ItemSheet {
  /**
   * Extend and override the default options used by the Simple Item Sheet
   * @returns {Object}
   */
  static get defaultOptions () {
    const options = foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['coc7', 'sheetV2', 'item', 'chase'],
      template: 'systems/CoC7/templates/items/chase.html',
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
  }

  /* -------------------------------------------- */

  static get type () {
    return 'coc7ChaseSheet'
  }

  _getHeaderButtons () {
    const headerButtons = super._getHeaderButtons()
    addCoCIDSheetHeaderButton(headerButtons, this)
    return headerButtons
  }

  async getData (options = {}) {
    const sheetData = super.getData(options)

    sheetData.participants = this.item.participantsObject
    sheetData.participantsByInitiative = this.item.participantsByInitiative
    sheetData.preys = this.item.preys
    sheetData.chasers = this.item.chasers

    sheetData.preysMinMov = sheetData.preys.length ? sheetData.preys.reduce((prev, current) => prev.adjustedMov < current.adjustedMov ? prev : current).adjustedMov : -1

    sheetData.preysMaxMov = sheetData.preys.length ? sheetData.preys.reduce((prev, current) => prev.adjustedMov > current.adjustedMov ? prev : current).adjustedMov : -1

    sheetData.chasersMinMov = sheetData.chasers.length ? sheetData.chasers.reduce((prev, current) => prev.adjustedMov < current.adjustedMov ? prev : current).adjustedMov : -1

    sheetData.chasersMaxMov = sheetData.chasers.length ? sheetData.chasers.reduce((prev, current) => prev.adjustedMov > current.adjustedMov ? prev : current).adjustedMov : -1

    sheetData.chasers.forEach(p => {
      if (p.adjustedMov < sheetData.preysMinMov) {
        p.tooSlow()
      } else {
        p.includeInChase()
      }
      p.fastest = p.adjustedMov === sheetData.chasersMaxMov
      p.slowest = p.adjustedMov === sheetData.chasersMinMov
    })

    sheetData.preys.forEach(p => {
      if (p.adjustedMov > sheetData.chasersMaxMov) {
        p.escaped()
      } else {
        p.includeInChase()
      }
      p.fastest = p.adjustedMov === sheetData.preysMaxMov
      p.slowest = p.adjustedMov === sheetData.preysMinMov
    })

    sheetData.locations = this.item.locations
    sheetData.allHaveValidMov = this.allHaveValidMov
    sheetData.activeLocation = this.item.activeLocation
    if (sheetData.activeLocation) {
      sheetData.activeLocation.title = sheetData.activeLocation.coordinates
        ? game.i18n.format('CoC7.LocationCoordinate', {
          x: sheetData.activeLocation.coordinates.x,
          y: sheetData.activeLocation.coordinates.y
        })
        : game.i18n.localize('CoC7.DragOnCanvas')
    }
    sheetData.previousLocation = this.item.previousLocation
    sheetData.nextLocation = this.item.nextLocation
    sheetData.started = this.item.started

    sheetData.isKeeper = game.user.isGM

    sheetData.enrichedDescriptionKeeper = await TextEditor.enrichHTML(
      sheetData.data.system.description.keeper,
      {
        async: true,
        secrets: sheetData.editable
      }
    )

    return sheetData
  }

  // get activeParticipant () {
  //   if (!this.item.system.participants) return undefined
  //   const participant = this.item.system.participants.find(p => p.active)
  //   if (!participant) return undefined
  //   return new _participant(participant)
  // }

  // get activeParticipantLocation () {
  //   if (!this.item.system.participants) return undefined
  //   const participant = this.item.system.participants.find(p => p.active)
  // }

  /** @override */
  activateListeners (html) {
    super.activateListeners(html)

    // html.find('.chase-track').ready(async html => await this._onSheetReady(html))

    // Handle Droprown
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
      .find('.pin-location')
      .contextmenu(this.clearActiveLocationCoordinates.bind(this))

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
    // html.find('.obstacle-toggle').click(this._onObstacleToggleClick.bind(this))
    html.find('.toggle').click(this._onToggle.bind(this))
    html
      .find('.participant-control')
      .click(this._onParticipantControlClicked.bind(this))

    html.find('.chase-control').click(this._onChaseControlClicked.bind(this))

    html
      .find('.location-control')
      .click(this._onLocationControlClick.bind(this))
    // html
    //   .find('.movement-action .decrease')
    //   .click(this._onChangeMovementActions.bind(this, -1))
    // html
    //   .find('.movement-action .increase')
    //   .click(this._onChangeMovementActions.bind(this, 1))

    // html
    // .find('.pin-location')
    // .on('dragstart', event => this._onPinLocationDragStart(event))

    /* // FoundryVTT V12 */
    const pinLocationSelectorDragDrop = new (foundry.applications.ux?.DragDrop ?? DragDrop)({
      dragSelector: '.pin-location',
      permissions: {
        dragstart: this._canPinLocationDragStart.bind(this)
      },
      callbacks: {
        dragstart: this._onPinLocationDragStart.bind(this)
      }
    })
    pinLocationSelectorDragDrop.bind(html[0])

    /* // FoundryVTT V12 */
    const participantDragDrop = new (foundry.applications.ux?.DragDrop ?? DragDrop)({
      dropSelector: '.participant',
      callbacks: { drop: this._onDropParticipant.bind(this) }
    })
    participantDragDrop.bind(html[0])

    /* // FoundryVTT V12 */
    const newParticipantDragDrop = new (foundry.applications.ux?.DragDrop ?? DragDrop)({
      dropSelector: '.new-participant',
      callbacks: { drop: this._onAddParticipant.bind(this) }
    })
    newParticipantDragDrop.bind(html[0])

    if (this.item.started) {
      html
        .find('.chase-location .chase-participant')
        .click(this._onChaseParticipantClick.bind(this))

      /* // FoundryVTT V12 */
      const chaseParticipantDragpDrop = new (foundry.applications.ux?.DragDrop ?? DragDrop)({
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
    /* // FoundryVTT V12 */
    const fd = new (foundry.applications.ux?.FormDataExtended ?? FormDataExtended)(this.form, { editors: this.editors })
    let data = fd.object
    if (updateData) {
      data = foundry.utils.mergeObject(data, updateData)
    } else {
      data = foundry.utils.expandObject(data)
    }

    // Check that starting position is not outside of chase range.
    if (
      this.item.system.locations?.list?.length &&
      data.system.startingIndex > this.item.system.locations.list.length
    ) {
      data.system.startingIndex = this.item.system.locations.list.length
    }

    if (data.system.participants) {
      const participants = foundry.utils.duplicate(this.item.system.participants)
      // Handle participants array
      for (const [k, v] of Object.entries(data.system.participants)) {
        const index = participants.findIndex(p => p.uuid === k)
        if (index === -1) ui.notifications.error('Participant table corrupted')
        else {
          const original = participants[index]
          const cleaned = clean(v)
          foundry.utils.mergeObject(original, cleaned)
          participants[index] = original
        }
      }

      data.system.participants = participants
    }

    if (data.locations) {
      const locations = foundry.utils.duplicate(this.item.system.locations.list)
      // Handle locations list
      for (const [key, value] of Object.entries(data.locations)) {
        const locationIndex = locations.findIndex(l => l.uuid === key)
        if (locationIndex === -1) {
          ui.notifications.error('Locations table corrupted')
        } else {
          const originalLocation = locations[locationIndex]
          const cleaned = clean(value)
          foundry.utils.mergeObject(originalLocation, cleaned)
          locations[locationIndex] = originalLocation
        }
      }

      delete data.locations
      data.system.locations = { list: locations }
    }
    // const participants = data.system?.participants;
    // if( participants) data.system.participants = Object.values( participants).map( p => clean(p));

    // Return the flattened submission data
    return foundry.utils.flattenObject(data)
  }

  /** @override */
  // async _onSubmit(...args) {
  //  await super._onSubmit(...args);
  // }

  async _updateObject (event, formData) {
    const target = event.currentTarget
    const override = target?.dataset?.override === 'true'
    if (target?.name?.includes('.hp')) {
      const [, , uuid] = target.name.split('.')
      const participant = this.item.getParticipant(uuid)
      if (participant && participant.actor) {
        if (!isNaN(Number(target.value))) {
          await participant.actor.setHp(Number(target.value))
        }
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
          const participants = this.item.system.participants
            ? foundry.utils.duplicate(this.item.system.participants)
            : []
          if (participants[index].speedCheck) {
            delete participants[index].speedCheck.id
            delete participants[index].speedCheck.type
          } else participants[index].speedCheck = {}
          participants[index].speedCheck.name = target.value
          await this.item.update({ 'system.participants': participants })
          return
        }
      }
    }
    super._updateObject(event, formData)
  }

  static async setScroll (app, html, data) {
    if (!data.editable) {
      return
    }
    const initialOpening = html[0].classList.contains('window-app')
    const chaseTrack = html[0].querySelector('.chase-track')
    if (!chaseTrack) return

    let start = data.data.scroll?.chaseTrack.from
    let end = data.data.scroll?.chaseTrack.to
    if (typeof start === 'undefined') {
      start = 0
    }
    if (typeof end === 'undefined') {
      end = -1
    }

    if (initialOpening) {
      const remString = $(':root').css('font-size')
      const remSize = Number(remString.replace('px', ''))
      if (app.item.started) {
        const pCount = app.item.actualParticipants?.length
        const width = (pCount * 11.2 + 3) * remSize
        app.activateTab('setup')
        // app._tabs[0].active = 'setup'
        app.position.width = Math.max(width, 40 * remSize)
        // html.css('width', `${width}px`)
      } else {
        app.position.width = 45 * remSize
      }
      return await app.item.activateNextParticipantTurn({ html }) // html is not rendered, element have size = 0
      // if (end > 0) {
      //   start = 0
      // } else if (start > 0) {
      //   end = start
      //   start = 0
      // }
    }

    if (start && start !== -1) {
      chaseTrack.scrollTo({
        top: 0,
        left: start,
        behavior: 'instant'
      })
    }

    if (end !== -1) {
      chaseTrack.scrollTo({
        top: 0,
        left: end,
        behavior: 'smooth'
      })
    }

    // await app.item.update({ 'data.trackScrollPosition': elementCenterRelativeLeft })
  }

  static onClose (app, html) {
    app.item.update({ 'system.trackScrollPosition': -1 })
  }

  // async _onSheetReady (html) {
  //   const track = html.find('.chase-track')
  //   const element = $(track).find('.active')

  //   const elementleft = element[0].offsetLeft
  //   const divWidth = track[0].clientWidth
  //   let elementCenterRelativeLeft = elementleft - divWidth / 2
  //   if (elementCenterRelativeLeft < 0) elementCenterRelativeLeft = 0

  //   const scrollPosition = this.item.system.trackScrollPosition
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
    return this.item.system.participants.findIndex(p => p.uuid === uuid)
  }

  findLocationIndex (uuid) {
    return this.item.system.locations.list.findIndex(p => p.uuid === uuid)
  }

  findLocation (uuid) {
    return this.item.system.locations.list.find(p => p.uuid === uuid)
  }

  findIndex (list, uuid) {
    return list.findIndex(p => p.uuid === uuid)
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
    // const locations = foundry.utils.duplicate(this.item.system.locations.list)
    // const locationIndex = this.findIndex(locations, uuid)
    const toggle = target.getAttribute('toggle')
    const data = foundry.utils.expandObject({
      [toggle]: !target.classList.contains('switched-on')
    })
    if (data.locations) {
      const locations = foundry.utils.duplicate(this.item.system.locations.list)
      for (const [key, value] of Object.entries(data.locations)) {
        const locationIndex = locations.findIndex(l => l.uuid === key)
        if (locationIndex === -1) {
          ui.notifications.error('Locations table corrupted')
        } else {
          const originalLocation = locations[locationIndex]
          const cleaned = clean(value)
          foundry.utils.mergeObject(originalLocation, cleaned)
          locations[locationIndex] = originalLocation
        }
      }
      await this.item.updateLocationsList(locations)
    }
  }

  // async _onObstacleToggleClick (event) {
  //   const target = event.currentTarget
  //   const locationElement = target.closest('.obstacle')
  //   const uuid = locationElement.dataset.uuid
  //   const locations = foundry.utils.duplicate(this.item.system.locations.list)
  //   const locationIndex = this.findIndex(locations, uuid)
  //   locations[locationIndex].obstacle = !locations[locationIndex].obstacle
  //   if (!locations[locationIndex].obstacleDetails) {
  //     locations[locationIndex].obstacleDetails = {
  //       barrier: true
  //     }
  //   }
  //   await this.item.updateLocationsList(locations)
  // }

  async _onObstacleTypeClick (event) {
    const target = event.currentTarget
    const locationElement = target.closest('.obstacle')
    const uuid = locationElement.dataset.uuid
    const locations = foundry.utils.duplicate(this.item.system.locations.list)
    const locationIndex = this.findIndex(locations, uuid)
    if (!locations[locationIndex].obstacleDetails) {
      locations[locationIndex].obstacleDetails = {}
    }
    const obstacle = locations[locationIndex].obstacleDetails
    const type = target.classList.contains('barrier') ? 'barrier' : 'hazard'
    const active = obstacle[type]
    obstacle.barrier = false
    obstacle.hazard = false
    obstacle[type] = !active
    locations[locationIndex].obstacle = !active
    // if (target.classList.contains('barrier')) {
    //   locations[locationIndex].obstacleDetails.barrier = !locations[
    //     locationIndex
    //   ].obstacleDetails.barrier
    //   locations[locationIndex].obstacleDetails.hazard = !locations[
    //     locationIndex
    //   ].obstacleDetails.barrier
    // } else if (target.classList.contains('hazard')) {
    //   locations[locationIndex].obstacleDetails.hazard = !locations[
    //     locationIndex
    //   ].obstacleDetails.hazard
    //   locations[locationIndex].obstacleDetails.barrier = !locations[
    //     locationIndex
    //   ].obstacleDetails.hazard
    // }
    await this.item.updateLocationsList(locations)
  }

  async _onLocationClick (event) {
    const target = event.currentTarget
    const locationElement = target.closest('.chase-location')
    const lUuid = locationElement.dataset.uuid
    await this.item.activateLocation(lUuid)
  }

  async _onLocationControlClick (event) {
    event.preventDefault()
    const target = event.currentTarget
    if (target.classList.contains('inactive')) return
    const action = target.dataset.action
    const locationElement = target.closest('.chase-location')
    const lUuid = locationElement.dataset.uuid
    switch (action) {
      case 'remove':
        await this.item.removeLocation(lUuid)
        break
      case 'add-after':
        await this.item.insertLocation(lUuid, { shift: 1 })
        break

      case 'add-before':
        await this.item.insertLocation(lUuid, { shift: 0 })
        break

      case 'add-participant':
        CoC7ChaseParticipantImporter.create({
          chaseUuid: this.item.uuid,
          locationUuid: lUuid,
          dropData: {}
        })
        break

      default:
        break
    }
    // ui.notifications.info(`Location ${lUuid} Clicked. Action: ${action}`)
  }

  async _onChaseParticipantClick (event) {
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
    switch (target.dataset.action) {
      case 'drawGun':
        await this.toggleParticipantGun(participantUuid)
        break
      case 'decreaseActions':
        await this._onChangeMovementActions(-1, event)
        break
      case 'increaseActions':
        await this._onChangeMovementActions(1, event)
        break
      case 'moveBackward':
        await this.item.moveParticipant(participantUuid, -1, { render: true })
        break
      case 'moveForward':
        await this.item.moveParticipant(participantUuid, 1, { render: true })
        break
      case 'activateParticipant':
        return await this.item.activateParticipant(participantUuid)
      case 'bonusDice':
        {
          const diceNumber = target.dataset.count
          await this.item.toggleBonusDice(participantUuid, diceNumber)
          this.item.activateNextParticipantTurn()
        }
        break
      case 'cautiousApproach':
        await this.item.cautiousApproach(participantUuid)
        break
      case 'editParticipant':
        {
          const participant = this.item.getParticipant(participantUuid)
          const location = this.item.getParticipantLocation(participantUuid)
          participant.data.chaseUuid = this.item.uuid
          participant.data.locationUuid = location.uuid
          participant.data.update = true
          CoC7ChaseParticipantImporter.create(participant.data)
        }
        break
      case 'removeParticipant':
        await this.item.removeParticipant(participantUuid)
        break
    }
    this.item.activateNextParticipantTurn()
  }

  async _onChaseControlClicked (event) {
    event.preventDefault()
    const target = event.currentTarget
    event.stopPropagation()

    const locationUuid = target.closest('.obstacle')?.dataset?.uuid
    if (!locationUuid) return
    switch (target.dataset.action) {
      case 'obstacle-skill-check':
        return this.item.activeParticipantObstacleCheck(locationUuid)
    }
  }

  async _onChangeMovementActions (count, event) {
    event.preventDefault()
    event.stopPropagation()
    const target = event.currentTarget
    const participantUuid = target.closest('.initiative-block')?.dataset?.uuid
    if (!participantUuid) return
    const participants = this.item.participants
    const participant = participants.find(p => participantUuid === p.uuid)
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
          !isNaN(this.item.system.locations.total) &&
          this.item.system.locations.total > 0
        ) {
          const locations = Array.apply(
            null,
            Array(this.item.system.locations.total)
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
        if (this.item.allHaveSpeedRoll) {
          Dialog.confirm({
            title: `${game.i18n.localize('CoC7.ConfirmCut2Chase')}`,
            content: `<p>${game.i18n.localize(
              'CoC7.ConfirmCut2ChaseHint'
            )}</p>`,
            yes: () => this.item.cutToTheChase()
          })
        } else {
          ui.notifications.warn(game.i18n.localize('CoC7.NotAllHaveSpeedRoll'))
        }
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

      case 'nextRound':
        if (this.item.nextActiveParticipant) {
          Dialog.confirm({
            title: `${game.i18n.localize('CoC7.ConfirmNextChaseRound')}`,
            content: `<p>${game.i18n.localize(
              'CoC7.ConfirmNextChaseRoundHint'
            )}</p>`,
            yes: () => this.item.progressToNextRound()
          })
        } else this.item.progressToNextRound()
        break

      default:
        break
    }
  }

  _canPinLocationDragStart (selector) {
    if (game.user.isGM) return true
    return false
  }

  async _onPinLocationDragStart (event) {
    const a = event.currentTarget
    const i = a.querySelector('i.icon')
    const dragIcon = a.querySelector('.pin-image')

    event.dataTransfer.setDragImage(dragIcon, 0, dragIcon.height)

    const locationElement = a.closest('.chase-location')
    const data = {}

    data.type = 'locator'
    data.CoC7Type = 'chase'
    data.icon = i.dataset.linkIcon
    data.locationUuid = locationElement.dataset.uuid
    data.docUuid = this.item.uuid
    data.callBack = 'locatorDropped'
    event.dataTransfer.setData('text/plain', JSON.stringify(data))

    // const dragData = { uuid: locationElement.dataset.uuid, chaseUuid: this.item.uuid }
    // dragEvent.dataTransfer.setData('text/plain', JSON.stringify(dragData))
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
    const dragData = { uuid: target.dataset.uuid, type: 'participant' }
    dragEvent.dataTransfer.setData('text/plain', JSON.stringify(dragData))
  }

  async _onChaseParticipantDragDrop (dragEvent) {
    const dataString = dragEvent.dataTransfer.getData('text/plain')
    const data = JSON.parse(dataString)

    // ui.notifications.info('Dropped')
    this._onDragLeave(dragEvent)

    const target = dragEvent.currentTarget
    const locationUuid = target.dataset.uuid

    if (data.type === 'participant') {
      const oldLocation = this.findLocation(locationUuid)
      if (oldLocation) {
        if (oldLocation.participants?.includes(data.uuid)) return
      }
      await this.item.setchaseTrackScroll({ render: false })
      await this.item.moveParticipantToLocation(data.uuid, locationUuid)
    } else {
      CoC7ChaseParticipantImporter.create({
        chaseUuid: this.item.uuid,
        locationUuid,
        dropData: data
      })
    }
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
    event.preventDefault()
    const data = { chaseUuid: this.item.uuid }
    if (event.dataTransfer) {
      const dataString = event.dataTransfer.getData('text/plain')
      data.dropData = JSON.parse(dataString)
    }
    CoC7ChaseParticipantImporter.create(data)
  }

  async _onRollParticipant (event) {
    const target = event.currentTarget
    const participantElement = target.closest('.participant')
    const uuid = participantElement.dataset.uuid
    const index = this.findParticipantIndex(uuid)
    const participants = this.item.system.participants
      ? foundry.utils.duplicate(this.item.system.participants)
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

    await this.item.update({ 'system.participants': participants })
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
    const participants = this.item.system.participants
      ? foundry.utils.duplicate(this.item.system.participants)
      : []
    participants[index].chaser = !participants[index].chaser
    await this.item.update({ 'system.participants': participants })
  }

  async _onDeleteDriver (event) {
    const target = event.currentTarget
    const driver = target.closest('.driver')
    const uuid = driver.dataset.uuid
    const index = this.findParticipantIndex(uuid)
    const participants = this.item.system.participants
      ? foundry.utils.duplicate(this.item.system.participants)
      : []
    const participant = participants[index]
    delete participant.docUuid
    await this.item.update({ 'system.participants': participants })
  }

  async _onDeleteParticipant (event) {
    const target = event.currentTarget
    const participant = target.closest('.participant')
    const uuid = participant.dataset.uuid
    const index = this.findParticipantIndex(uuid)
    const participants = this.item.system.participants
      ? foundry.utils.duplicate(this.item.system.participants)
      : []
    participants.splice(index, 1)
    await this.item.update({ 'system.participants': participants })
  }

  async _onResetRoll (event) {
    const target = event.currentTarget
    const participant = target.closest('.participant')
    const uuid = participant.dataset.uuid
    const index = this.findParticipantIndex(uuid)
    const participants = this.item.system.participants
      ? foundry.utils.duplicate(this.item.system.participants)
      : []
    delete participants[index].speedCheck.rollDataString
    await this.item.update({ 'system.participants': participants })
  }

  async alterParticipant (data, uuid) {
    let docUuid, actor
    if (data.tokenUuid) docUuid = data.tokenUuid
    else {
      docUuid =
        data.sceneId && data.tokenId
          ? `Scene.${data.sceneId}.Token.${data.tokenId}`
          : data.actorId || data.actorKey || data.id
    }

    if (data.type === 'Token') {
      docUuid = data.uuid
    } else if (docUuid) {
      actor = chatHelper.getActorFromKey(docUuid)
      if (!actor && data.type === 'Item') docUuid = null
    }

    if (actor && docUuid !== actor.uuid) {
      docUuid = actor.uuid
    }

    const participant = {}
    if (docUuid) participant.docUuid = docUuid

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

    // TODO:Check for speed check, if none add speedcheck
    // speedCheck = {
    //   id: 'str'
    //   type: 'characteristic'
    // }
    const participants = this.item.system.participants
      ? foundry.utils.duplicate(this.item.system.participants)
      : []
    const index = this.findParticipantIndex(uuid)
    const oldParticipant = participants[index]
    if (oldParticipant.mov) delete oldParticipant.mov
    foundry.utils.mergeObject(oldParticipant, participant)
    await this.item.update({ 'system.participants': participants })
  }

  async clearActiveLocationCoordinates () {
    await this.item.clearActiveLocationCoordinates()
  }

  async addParticipant (data) {
    // let prout = chatHelper.getActorFromKey(
    //   'Scene.wh7SLuvIOpcQyb8S.Token.QyFTiiEZiX9vTfiC'
    // )
    // prout = chatHelper.getActorFromKey(
    //   'Scene.wh7SLuvIOpcQyb8S.Token.ubLzhe57JOTHMIr9'
    // )
    // prout = chatHelper.getActorFromKey('Actor.uiY3capSUeLLvSLi')
    // prout = CoC7Utilities.getDocumentFromKey( 'Scene.wh7SLuvIOpcQyb8S.Token.QyFTiiEZiX9vTfiC.Item.GrOHeLXfeEphsRMZ')
    // prout = CoC7Utilities.getDocumentFromKey( "Scene.wh7SLuvIOpcQyb8S.Token.YqsNQPDhFCPlSRqJ")
    // prout = CoC7Utilities.getDocumentFromKey( "Scene.wh7SLuvIOpcQyb8S.Token.YqsNQPDhFCPlSRqJ.Item.8JEnTjJOGFXml4wk")

    // try to find a valid document
    let docUuid, actor
    if (data.tokenUuid) docUuid = data.tokenUuid
    else {
      docUuid =
        data.sceneId && data.tokenId
          ? `Scene.${data.sceneId}.Token.${data.tokenId}`
          : data.actorId || data.actorKey || data.id
    }

    if (data.type === 'Token') {
      docUuid = data.uuid
    } else if (docUuid) {
      actor = chatHelper.getActorFromKey(docUuid)
      if (!actor && data.type === 'Item') docUuid = null
    }

    if (actor && docUuid !== actor.uuid) {
      docUuid = actor.uuid
    }

    const participant = {}
    if (docUuid) participant.docUuid = docUuid

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

    // TODO:Check for speed check, if none add speedcheck con non vehicle, drive auto for vehicle
    // speedCheck = {
    //   id: 'con'
    //   type: 'characteristic'
    // }

    if (!participant.speedCheck) {
      if (!this.item.system.vehicle) {
        participant.speedCheck = {
          id: 'con',
          type: 'characteristic',
          name: game.i18n.localize('CHARAC.Constitution')
        }
      } else {
        participant.speedCheck = {
          type: 'item',
          name: game.i18n.localize('CoC7.CoCIDFlag.keys.i.skill.drive-auto')
        }
      }
    }
    const participants = this.item.system.participants
      ? foundry.utils.duplicate(this.item.system.participants)
      : []

    let unique = false
    while (!unique) {
      participant.uuid = foundry.utils.randomID(16)
      unique =
        participants.filter(p => p.uuid === participant.uuid).length === 0
    }

    participants.push(participant)
    await this.item.update({ 'system.participants': participants })
  }

  async toggleParticipantGun (participantUuid) {
    const participants = this.item.system.participants
      ? foundry.utils.duplicate(this.item.system.participants)
      : []
    const participant = participants.find(p => participantUuid === p.uuid)
    if (!participant) return
    participant.hasAGunReady = !participant.hasAGunReady
    await this.item.setchaseTrackScroll({ render: false })
    await this.item.updateParticipants(participants)
  }
}

export function clean (obj) {
  for (const propName in obj) {
    const tp = foundry.utils.getType(obj[propName])
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
