/* global canvas CONFIG ContextMenu DragDrop foundry fromUuid game TextEditor TokenDocument ui */
import { FOLDER_ID } from '../../constants.js'
import CoC7ChaseParticipant from '../chase/participant.js'
import CoC7ChaseParticipantDialog from '../../apps/chase-participant-dialog.js'
import CoC7DicePool from '../../apps/dice-pool.js'
import CoC7ModelsItemGlobalSheet from './global-sheet.js'
import CoC7RollNormalize from '../../apps/roll-normalize.js'
import CoC7Utilities from '../../apps/utilities.js'

export default class CoC7ModelsItemChaseSheet extends CoC7ModelsItemGlobalSheet {
  static DEFAULT_OPTIONS = {
    classes: ['chase'],
    position: {
      width: 550,
      height: 580
    }
  }

  static PARTS = {
    header: {
      template: 'systems/' + FOLDER_ID + '/templates/items/chase-header.hbs'
    },
    tabs: {
      template: 'templates/generic/tab-navigation.hbs'
    },
    setup: {
      template: 'systems/' + FOLDER_ID + '/templates/items/chase-setup.hbs',
      scrollable: ['', '.chase-track']
    },
    participants: {
      template: 'systems/' + FOLDER_ID + '/templates/items/chase-participants.hbs',
      scrollable: ['']
    },
    keeper: {
      template: 'systems/' + FOLDER_ID + '/templates/items/common-tab-keeper.hbs',
      scrollable: ['.editor-content']
    }
  }

  /**
   * @inheritdoc
   * @param {RenderOptions} options
   * @returns {Promise<ApplicationRenderContext>}
   */
  async _prepareContext (options) {
    const context = await super._prepareContext(options)

    const tabs = {
      setup: {
        icon: '',
        label: 'CoC7.ChaseSetup'
      },
      participants: {
        icon: '',
        label: 'CoC7.ParticipantsList'
      }
    }
    if (game.user.isGM) {
      tabs.keeper = {
        cssClass: 'icon-only-tab',
        icon: 'game-icon game-icon-tentacles-skull',
        tooltip: 'CoC7.GmNotes'
      }
    }

    context.tabs = this.getTabs('primary', (this.document.system.started || this.document.system.activeLocation ? 'setup' : 'participants'), tabs)

    context.locations = await context.document.system.allLocations()
    const participants = await context.document.system.allParticipants()
    context.participants = participants.all
    context.participants.sort(CoC7Utilities.sortByInitiative)
    const lastOffset = context.locations.length - 1
    for (const offset in context.locations) {
      if (context.locations[offset].participants.length) {
        for (const offset2 in context.locations[offset].participants) {
          const offset3 = context.participants.findIndex(p => p.uuid === context.locations[offset].participants[offset2])
          context.locations[offset].participants[offset2] = context.participants[offset3]
          context.participants[offset3].setFirstLast(Number(offset) === 0, Number(offset) === lastOffset)
        }
        context.locations[offset].participants.sort(CoC7Utilities.sortByRollInitiative)
      }
    }
    context.isKeeper = game.user.isGM

    return context
  }

  /**
   * @inheritdoc
   * @param {string} partId
   * @param {ApplicationRenderContext} context
   * @param {HandlebarsRenderOptions} options
   * @returns {Promise<ApplicationRenderContext>}
   */
  async _preparePartContext (partId, context, options) {
    context = await super._preparePartContext(partId, context, options)

    switch (partId) {
      case 'header':
        context.activeLocation = context.document.system.activeLocation
        if (context.activeLocation) {
          context.activeLocation.title = (context.activeLocation.hasCoordinates
            ? game.i18n.format('CoC7.LocationCoordinate', {
              x: context.activeLocation.coordinates.x,
              y: context.activeLocation.coordinates.y
            })
            : game.i18n.localize('CoC7.DragOnCanvas'))
        }
        context.nextLocation = context.document.system.nextLocation
        context.listOptions = await CONFIG.Actor.documentClass.everyField()
        context.activeParticipantHere = context.activeLocation?.participants.includes(context.document.system.participants.find(p => p.active)?.uuid) === true
        break
      case 'setup':
        context.vehiclesEnabled = !!(game.settings.get(FOLDER_ID, 'experimentalFeatures') || game.actors.find(doc => doc.type === 'vehicle'))
        break
      case 'participants':
        break
      case 'keeper':
        /* // FoundryVTT V12 */
        context.enrichedDescriptionKeeper = await (foundry.applications.ux?.TextEditor.implementation ?? TextEditor).enrichHTML(
          context.document.system.description.keeper,
          {
            async: true,
            secrets: context.editable
          }
        )
        break
    }
    return context
  }

  /**
   * @inheritdoc
   * @param {ApplicationRenderContext} context
   * @param {RenderOptions} options
   * @returns {Promise<void>}
   */
  async _onRender (context, options) {
    await super._onRender(context, options)

    this._onTriggeredResize(context, options)

    this.element.querySelectorAll('.open-actor').forEach((element) => {
      element.addEventListener('dblclick', async event => {
        const actor = await fromUuid(element.dataset.actorUuid)
        if (actor) {
          if (actor instanceof TokenDocument) {
            actor.actor.sheet.render({ force: true })
          } else {
            actor.sheet.render({ force: true })
          }
        }
      })
      element.classList.add('clickable')
    })

    this.element.querySelector('.pin-location')?.addEventListener('contextmenu', this.clearActiveLocationCoordinates.bind(this))

    this.element.querySelector('.add-sign')?.addEventListener('click', this._onAddParticipant.bind(this))

    this.element.querySelectorAll('[data-action]').forEach((element) => element.addEventListener('click', this._onButtonClick.bind(this)))

    this.element.querySelectorAll('.name-container').forEach((element) => element.addEventListener('click', this._onLocationClick.bind(this)))

    this.element.querySelectorAll('input').forEach((element) => element.addEventListener('change', this._onElementChange.bind(this)))
    this.element.querySelectorAll('select').forEach((element) => element.addEventListener('change', this._onElementChange.bind(this)))

    this.element.querySelectorAll('.participant-controls .item-control').forEach((element) => element.addEventListener('click', (event) => { this._onParticipantControlClicked(event) }))

    /* // FoundryVTT V12 */
    new (foundry.applications.ux?.DragDrop ?? DragDrop)({
      dragSelector: '.pin-location',
      permissions: {
        dragstart: true
      },
      callbacks: {
        dragstart: this._onPinLocationDragStart.bind(this)
      }
    }).bind(this.element)

    /* // FoundryVTT V12 */
    new (foundry.applications.ux?.DragDrop ?? DragDrop)({
      dropSelector: 'section.tab.participants',
      permissions: {
        drop: true
      },
      callbacks: {
        dragleave: this._onDragLeave.bind(this),
        dragover: this._onDragOver.bind(this),
        drop: this._onAddParticipant.bind(this)
      }
    }).bind(this.element)

    if (context.document.system.started) {
      this.element.querySelectorAll('.chase-location .chase-participant').forEach((element) => element.addEventListener('click', (event) => { this._onChaseParticipantClick(event) }))

      /* // FoundryVTT V12 */
      new (foundry.applications.ux?.DragDrop ?? DragDrop)({
        dragSelector: '.chase-participant',
        dropSelector: '.chase-location',
        permissions: {
          dragstart: game.user.isGM,
          drop: game.user.isGM
        },
        callbacks: {
          dragleave: this._onDragLeave.bind(this),
          dragstart: this._onDragStartParticipant.bind(this),
          dragover: this._onDragOver.bind(this),
          drop: this._onDropParticipant.bind(this)
        }
      }).bind(this.element)

      const groups = context.document.system.participants.reduce((c, p) => { c[p.chaser ? 'chaser' : 'prey'].push({ uuid: p.uuid, name: p.name }); return c }, { chaser: [], prey: [] })
      for (const group of Object.values(groups)) {
        for (const offset in group) {
          const element = this.element.querySelector('[data-uuid="' + group[offset].uuid + '"]')
          if (element) {
            const contextOptions = []
            for (const offset2 in group) {
              if (offset !== offset2) {
                contextOptions.push({
                  name: group[offset2].name,
                  callback: () => {
                    context.document.system.assistParticipant(group[offset].uuid, group[offset2].uuid)
                  }
                })
              }
            }
            new (foundry.applications.ux?.ContextMenu?.implementation ?? ContextMenu)(element, '.assist-dropdown', contextOptions, { // eslint-disable-line no-new, new-cap
              jQuery: false,
              fixed: true,
              eventName: 'click'
            })
          }
        }
      }
    }
  }

  /**
   * Location Click
   * @param {Event} event
   */
  async _onLocationClick (event) {
    const locationId = event.currentTarget.closest('.chase-location').dataset.locationId
    const locations = foundry.utils.duplicate(this.document.system.locations.list)
    const oldLocation = locations.findIndex(l => l.active)
    if (oldLocation > -1) {
      locations[oldLocation].active = false
    }
    const newLocation = locations.findIndex(l => l.uuid === locationId)
    if (newLocation > -1) {
      locations[newLocation].active = true
    }
    await this.document.update({ 'system.locations.list': locations })
  }

  /**
   * Input/Select change event
   * @param {Event} event
   */
  async _onElementChange (event) {
    switch (event.currentTarget.dataset.set) {
      case 'location-name':
        {
          const locations = foundry.utils.duplicate(this.document.system.locations.list)
          const offset = locations.findIndex(l => l.active)
          if (offset > -1) {
            locations[offset].name = event.currentTarget.value
            await this.document.update({ 'system.locations.list': locations })
          }
        }
        break
      case 'location-obstacle-name':
        {
          const locationId = event.currentTarget.closest('.obstacle').dataset.locationId
          const locations = foundry.utils.duplicate(this.document.system.locations.list)
          const offset = locations.findIndex(l => l.uuid === locationId)
          if (offset > -1) {
            locations[offset].obstacleDetails.name = event.currentTarget.value
            await this.document.update({ 'system.locations.list': locations })
          }
        }
        break
      case 'location-obstacle-check-name':
        {
          const locationId = event.currentTarget.closest('.obstacle').dataset.locationId
          const locations = foundry.utils.duplicate(this.document.system.locations.list)
          const offset = locations.findIndex(l => l.uuid === locationId)
          if (offset > -1) {
            locations[offset].obstacleDetails.checkName = event.currentTarget.value
            await this.document.update({ 'system.locations.list': locations })
          }
        }
        break
      case 'obstacle-fail-damage':
        {
          const locationId = event.currentTarget.closest('.obstacle').dataset.locationId
          const locations = foundry.utils.duplicate(this.document.system.locations.list)
          const offset = locations.findIndex(l => l.uuid === locationId)
          if (offset > -1) {
            locations[offset].obstacleDetails.failedCheckDamage = event.currentTarget.value
            await this.document.update({ 'system.locations.list': locations })
          }
        }
        break
      case 'obstacle-hp':
        {
          const locationId = event.currentTarget.closest('.obstacle').dataset.locationId
          const locations = foundry.utils.duplicate(this.document.system.locations.list)
          const offset = locations.findIndex(l => l.uuid === locationId)
          if (offset > -1) {
            locations[offset].obstacleDetails.HitPoints = event.currentTarget.value
            await this.document.update({ 'system.locations.list': locations })
          }
        }
        break
      case 'obstacle-action-cost':
        {
          const locationId = event.currentTarget.closest('.obstacle').dataset.locationId
          const locations = foundry.utils.duplicate(this.document.system.locations.list)
          const offset = locations.findIndex(l => l.uuid === locationId)
          if (offset > -1) {
            locations[offset].obstacleDetails.failedActionCost = event.currentTarget.value
            await this.document.update({ 'system.locations.list': locations })
          }
        }
        break
      case 'participant.speedCheck.name':
        {
          const uuid = event.currentTarget.closest('.participant').dataset.uuid
          const participants = foundry.utils.duplicate(this.document.system.participants)
          const offset = participants.findIndex(l => l.uuid === uuid)
          if (offset > -1) {
            participants[offset].speedCheck.name = event.currentTarget.value
            let actor = null
            if (participants[offset].docUuid) {
              actor = await fromUuid(participants[offset].docUuid)
            }
            const listOptions = await CONFIG.Actor.documentClass.everyField(actor)
            participants[offset].speedCheck.score = await CoC7ChaseParticipant.getPercentValue(actor, listOptions, participants[offset].speedCheck.name)
            await this.document.update({ 'system.participants': participants })
          }
        }
        break
      case 'participant.speedCheck.score':
        {
          const uuid = event.currentTarget.closest('.participant').dataset.uuid
          const participants = foundry.utils.duplicate(this.document.system.participants)
          const offset = participants.findIndex(l => l.uuid === uuid)
          if (offset > -1) {
            participants[offset].speedCheck.score = event.currentTarget.value
            await this.document.update({ 'system.participants': participants })
          }
        }
        break
      case 'participant.name':
        {
          const uuid = event.currentTarget.closest('.participant').dataset.uuid
          const participants = foundry.utils.duplicate(this.document.system.participants)
          const offset = participants.findIndex(l => l.uuid === uuid)
          if (offset > -1) {
            participants[offset].name = event.currentTarget.value
            await this.document.update({ 'system.participants': participants })
          }
        }
        break
      case 'participant.mov':
        {
          const uuid = event.currentTarget.closest('.participant').dataset.uuid
          const participants = foundry.utils.duplicate(this.document.system.participants)
          const offset = participants.findIndex(l => l.uuid === uuid)
          if (offset > -1) {
            participants[offset].mov = event.currentTarget.value
            await this.document.update({ 'system.participants': participants })
          }
        }
        break
      case 'participant.dex':
        {
          const uuid = event.currentTarget.closest('.participant').dataset.uuid
          const participants = foundry.utils.duplicate(this.document.system.participants)
          const offset = participants.findIndex(l => l.uuid === uuid)
          if (offset > -1) {
            participants[offset].dex = event.currentTarget.value
            await this.document.update({ 'system.participants': participants })
          }
        }
        break
      case 'participant.hp':
        {
          const uuid = event.currentTarget.dataset.actorUuid
          if (uuid) {
            const actor = await fromUuid(uuid)
            if (actor) {
              await actor.setHp(parseInt(event.currentTarget.value, 10))
              this.render()
            }
          }
        }
        break
    }
  }

  /**
   * Button Click
   * @param {Event} event
   */
  async _onChaseParticipantClick (event) {
    const uuid = event.currentTarget.dataset?.uuid
    await this.document.system.activateParticipant(uuid)
  }

  /**
   * Button Click
   * @param {Event} event
   */
  async _onParticipantControlClicked (event) {
    if (event.currentTarget.classList.contains('inactive')) {
      return
    }
    const participantUuid = event.currentTarget.closest('.initiative-block')?.dataset?.uuid
    if (!participantUuid) {
      return
    }
    switch (event.currentTarget.dataset.action) {
      case 'drawGun':
        await this.toggleParticipantGun(participantUuid)
        break
      case 'decreaseActions':
        await this._onChangeMovementActions(-1, participantUuid)
        break
      case 'increaseActions':
        await this._onChangeMovementActions(1, participantUuid)
        break
      case 'moveBackward':
        await this.document.system.moveParticipantLocations(participantUuid, -1)
        break
      case 'moveForward':
        await this.document.system.moveParticipantLocations(participantUuid, 1)
        break
      case 'activateParticipant':
        await this.document.system.activateParticipant(participantUuid)
        return
      case 'bonusDice':
        {
          const diceNumber = event.currentTarget.dataset.count
          await this.document.system.toggleBonusDice(participantUuid, diceNumber)
        }
        break
      case 'cautiousApproach':
        await this.document.system.cautiousApproach(participantUuid)
        break
      case 'editParticipant':
        CoC7ChaseParticipantDialog.create({ chaseUuid: this.document.uuid, participant: this.document.system.participants.find(p => p.uuid === participantUuid) })
        return
      case 'removeParticipant':
        await this.document.system.removeParticipant(participantUuid)
        break
    }
    this.document.system.activateNextParticipantTurn()
  }

  /**
   * Change the number of movement actions
   * @param {integer} count
   * @param {string} participantUuid
   */
  async _onChangeMovementActions (count, participantUuid) {
    const participants = foundry.utils.duplicate(this.document.system.participants)
    const offset = participants.findIndex(p => p.uuid === participantUuid)
    if (offset > -1) {
      const actions = (await this.document.system.allParticipants()).all.find(p => p.uuid === participantUuid).actions
      if (actions) {
        const currentMovementActions = parseInt(participants[offset].currentMovementActions, 10) + count
        participants[offset].currentMovementActions = Math.min(actions, currentMovementActions)
        await this.document.update({ 'system.participants': participants })
      }
    }
  }

  /**
   * Button Click
   * @param {Event} event
   */
  async _onButtonClick (event) {
    event.preventDefault()
    switch (event.currentTarget.dataset.action) {
      case 'init':
        if (this.document.system.locations.total > 0) {
          const locations = Array.apply(null, Array(this.document.system.locations.total)).map(l => {
            return {
              uuid: foundry.utils.randomID()
            }
          })
          locations[0].name = 'Start'
          if (locations.length > 1) {
            locations[locations.length - 1].name = 'End'
          }
          await this.document.update({ 'system.locations.list': locations })
        }
        break
      case 'reset':
        new foundry.applications.api.DialogV2({
          window: { title: 'CoC7.ConfirmResetChase' },
          content: '<p>' + game.i18n.localize('CoC7.ConfirmResetChaseHint') + '</p>',
          buttons: [{
            action: 'cancel',
            label: 'No',
            icon: 'fa-solid fa-ban'
          }, {
            action: 'ok',
            label: 'Yes',
            icon: 'fa-solid fa-check',
            callback: () => {
              this.document.update({
                'system.locations.list': [],
                'system.started': false
              })
            }
          }]
        }).render({ force: true })
        break
      case 'cut2chase':
        if (this.document.system.allHaveSpeedRoll) {
          new foundry.applications.api.DialogV2({
            window: { title: 'CoC7.ConfirmCut2Chase' },
            content: '<p>' + game.i18n.localize('CoC7.ConfirmCut2ChaseHint') + '</p>',
            buttons: [{
              action: 'cancel',
              label: 'No',
              icon: 'fa-solid fa-ban'
            }, {
              action: 'ok',
              label: 'Yes',
              icon: 'fa-solid fa-check',
              callback: () => {
                this.document.system.cutToTheChase()
              }
            }]
          }).render({ force: true })
        } else {
          ui.notifications.warn('CoC7.NotAllHaveSpeedRoll', { localize: true })
        }
        break
      case 'remove':
        {
          const locations = foundry.utils.duplicate(this.document.system.locations.list)
          const offset = locations.findIndex(l => l.active)
          if (offset > -1) {
            locations.splice(offset, 1)
            await this.document.update({ 'system.locations.list': locations })
          }
        }
        break
      case 'add-after':
        {
          const locations = foundry.utils.duplicate(this.document.system.locations.list)
          const offset = locations.findIndex(l => l.active)
          if (offset > -1) {
            locations.splice(offset + 1, 0, {
              uuid: foundry.utils.randomID()
            })
            await this.document.update({ 'system.locations.list': locations })
          }
        }
        break
      case 'add-before':
        {
          const locations = foundry.utils.duplicate(this.document.system.locations.list)
          const offset = locations.findIndex(l => l.active)
          if (offset > -1) {
            locations.splice(offset, 0, {
              uuid: foundry.utils.randomID()
            })
            await this.document.update({ 'system.locations.list': locations })
          }
        }
        break
      case 'ping-location':
        if (canvas.ready) {
          const coordinates = this.document.system.activeLocation.coordinates
          if (coordinates.scene === canvas.scene.uuid) {
            canvas.ping({ x: coordinates.x, y: coordinates.y })
          }
        }
        break
      case 'obstacle-has-damage':
        {
          const locationId = event.currentTarget.closest('.obstacle').dataset.locationId
          const locations = foundry.utils.duplicate(this.document.system.locations.list)
          const offset = locations.findIndex(l => l.uuid === locationId)
          if (offset > -1) {
            locations[offset].obstacleDetails.hasDamage = !locations[offset].obstacleDetails.hasDamage
            await this.document.update({ 'system.locations.list': locations })
          }
        }
        break
      case 'obstacle-has-hp':
        {
          const locationId = event.currentTarget.closest('.obstacle').dataset.locationId
          const locations = foundry.utils.duplicate(this.document.system.locations.list)
          const offset = locations.findIndex(l => l.uuid === locationId)
          if (offset > -1) {
            locations[offset].obstacleDetails.hasHitPoints = !locations[offset].obstacleDetails.hasHitPoints
            await this.document.update({ 'system.locations.list': locations })
          }
        }
        break
      case 'obstacle-has-action-cost':
        {
          const locationId = event.currentTarget.closest('.obstacle').dataset.locationId
          const locations = foundry.utils.duplicate(this.document.system.locations.list)
          const offset = locations.findIndex(l => l.uuid === locationId)
          if (offset > -1) {
            locations[offset].obstacleDetails.hasActionCost = !locations[offset].obstacleDetails.hasActionCost
            await this.document.update({ 'system.locations.list': locations })
          }
        }
        break
      case 'participantChaser':
        {
          const uuid = event.currentTarget.closest('.participant').dataset.uuid
          const participants = foundry.utils.duplicate(this.document.system.participants)
          const offset = participants.findIndex(l => l.uuid === uuid)
          if (offset > -1) {
            participants[offset].chaser = !participants[offset].chaser
            await this.document.update({ 'system.participants': participants })
          }
        }
        break
      case 'deleteParticipant':
        {
          const uuid = event.currentTarget.closest('.participant').dataset.uuid
          const participants = foundry.utils.duplicate(this.document.system.participants)
          const offset = participants.findIndex(l => l.uuid === uuid)
          if (offset > -1) {
            participants.splice(offset, 1)
            await this.document.update({ 'system.participants': participants })
          }
        }
        break
      case 'resetRoll':
        {
          const uuid = event.currentTarget.closest('.participant').dataset.uuid
          const participants = foundry.utils.duplicate(this.document.system.participants)
          const offset = participants.findIndex(l => l.uuid === uuid)
          if (offset > -1) {
            participants[offset].speedCheck.checkData = null
            await this.document.update({ 'system.participants': participants })
          }
        }
        break
      case 'rollSpeedCheck':
        {
          const uuid = event.currentTarget.closest('.participant').dataset.uuid
          const participants = foundry.utils.duplicate(this.document.system.participants)
          const offset = participants.findIndex(l => l.uuid === uuid)
          if (offset > -1) {
            const participant = new CoC7ChaseParticipant(participants, offset)
            await participant.loadUuids()
            const listOptions = participant.listOptions
            const value = listOptions.find(row => row.name === participant.speedCheck.name)
            participants[offset].speedCheck.checkData = { rolling: true }
            await this.document.update({ 'system.participants': participants })
            if (value) {
              const config = {
                cardTypeFixed: true,
                cardType: CoC7RollNormalize.CARD_TYPE.NORMAL,
                callbackUuid: this.document.uuid,
                callbackContext: { type: 'speedCheck', participant: participants[offset].uuid },
                actor: participant.actor,
                standby: true,
                standbyRightIcon: 'systems/' + FOLDER_ID + '/assets/icons/running-solid.svg'
              }
              if (value.value) {
                switch (value.type) {
                  case 'attribs':
                    config.rollType = CoC7RollNormalize.ROLL_TYPE.ATTRIBUTE
                    config.attribute = value.key
                    break
                  case 'characteristics':
                    config.rollType = CoC7RollNormalize.ROLL_TYPE.CHARACTERISTIC
                    config.characteristic = value.key
                    break
                  case 'skill':
                    config.rollType = CoC7RollNormalize.ROLL_TYPE.SKILL
                    config.itemUuid = value.uuid
                    break
                }
                CoC7RollNormalize.trigger(config)
              } else {
                config.rollType = CoC7RollNormalize.ROLL_TYPE.MANUAL
                config.threshold = participants[offset].speedCheck.score
                config.runRoll = false
                const modified = await CoC7RollNormalize.trigger(config)
                modified.flavor = game.i18n.format('CoC7.CheckResult', {
                  name: value.name,
                  value: modified.threshold.toString() + (modified.flatThresholdModifier !== 0 ? (modified.flatThresholdModifier > 0 ? '+' : '') + modified.flatThresholdModifier.toString() : ''),
                  difficulty: CoC7DicePool.difficultyString(modified.difficulty)
                })
                CoC7RollNormalize.runRoll(modified)
              }
            }
          }
        }
        break
      case 'restart':
        new foundry.applications.api.DialogV2({
          window: { title: 'CoC7.ConfirmRestartChase' },
          content: '<p>' + game.i18n.localize('CoC7.ConfirmRestartChaseHint') + '</p>',
          buttons: [{
            action: 'cancel',
            label: 'No',
            icon: 'fa-solid fa-ban'
          }, {
            action: 'ok',
            label: 'Yes',
            icon: 'fa-solid fa-check',
            callback: () => {
              this.document.system.restart()
            }
          }]
        }).render({ force: true })
        break
      case 'add-participant':
        {
          const location = this.document.system.locations.list.find(l => l.active)
          if (location) {
            CoC7ChaseParticipantDialog.create({ chaseUuid: this.document.uuid, locationId: location.uuid })
          }
        }
        break
      case 'nextRound':
        if (await this.document.system.nextActiveParticipant()) {
          new foundry.applications.api.DialogV2({
            window: { title: 'CoC7.ConfirmNextChaseRound' },
            content: '<p>' + game.i18n.localize('CoC7.ConfirmNextChaseRoundHint') + '</p>',
            buttons: [{
              action: 'cancel',
              label: 'No',
              icon: 'fa-solid fa-ban'
            }, {
              action: 'ok',
              label: 'Yes',
              icon: 'fa-solid fa-check',
              callback: () => {
                this.document.system.progressToNextRound()
              }
            }]
          }).render({ force: true })
        } else {
          this.document.system.progressToNextRound()
        }
        break
      case 'obstacle-skill-check':
        {
          const locationId = event.currentTarget.closest('.obstacle').dataset.locationId
          if (locationId) {
            this.document.system.activeParticipantObstacleCheck(locationId)
          }
        }
        break
    }
  }

  /**
   * Drag Location Locator
   * @param {DragEvent} event
   */
  async _onPinLocationDragStart (event) {
    const dragIcon = event.currentTarget.querySelector('.pin-image')
    event.dataTransfer.setDragImage(dragIcon, 0, dragIcon.height)
    const data = {
      type: 'CoC7Locator',
      appId: this.id,
      callback: 'locatorDropped',
      locationId: this.document.system.activeLocation.uuid
    }
    event.dataTransfer.setData('text/plain', JSON.stringify(data))
  }

  /**
   * Drag Location Locator
   * @param {DragEvent} event
   */
  async _onDragStartParticipant (event) {
    const data = {
      type: 'CoC7MoveLocation',
      id: event.currentTarget.dataset.uuid
    }
    event.dataTransfer.setData('text/plain', JSON.stringify(data))
  }

  /**
   * Move Participant To Location
   * @param {Event} event
   */
  async _onDropParticipant (event) {
    const locationId = event.currentTarget.dataset.locationId
    const dataString = event.dataTransfer.getData('text/plain')
    const dropData = JSON.parse(dataString)
    if (dropData?.type === 'CoC7MoveLocation') {
      this.document.system.moveParticipantToLocation(dropData.id, locationId)
    }
  }

  /**
   * Show Participant Dialog
   * @param {Event} event
   */
  async _onAddParticipant (event) {
    event.preventDefault()
    const data = { chaseUuid: this.document.uuid }
    if (event.dataTransfer) {
      const dataString = event.dataTransfer.getData('text/plain')
      data.dropData = JSON.parse(dataString)
    }
    CoC7ChaseParticipantDialog.create(data)
  }

  /**
   * Set class on drag over
   * @param {DragEvent} event
   */
  _onDragOver (event) {
    event.currentTarget?.classList.add('drag-over')
  }

  /**
   * Remove class on drag away
   * @param {DragEvent} event
   */
  _onDragLeave (event) {
    event.currentTarget?.classList.remove('drag-over')
  }

  /**
   * Clear scene position information for active location
   */
  async clearActiveLocationCoordinates () {
    await this.document.system.clearActiveLocationCoordinates()
  }

  /**
   * Toggle bonus to initiative
   * @param {string} participantUuid
   */
  async toggleParticipantGun (participantUuid) {
    const participants = foundry.utils.duplicate(this.document.system.participants)
    const offset = participants.findIndex(p => p.uuid === participantUuid)
    if (offset > -1) {
      participants[offset].hasAGunReady = !participants[offset].hasAGunReady
      await this.document.update({ 'system.participants': participants })
    }
  }

  /**
   * Callback from DropEvent
   * @param {object} data
   */
  async locatorDropped (data) {
    await this.document.system.setLocationCoordinates({
      locationId: data.locationId,
      x: Math.floor(data.x),
      y: Math.floor(data.y),
      sceneUuid: data.sceneUuid
    })
  }

  /**
   * Toggle property
   * @param {SubmitEvent|null} event
   */
  async _onClickToggle (event) {
    const property = event.currentTarget.closest('.toggle-attributes').dataset.set
    switch (property) {
      case 'location-obstacle-type':
        {
          const locationId = event.currentTarget.closest('.obstacle').dataset.locationId
          const property = event.currentTarget.dataset.property
          const locations = foundry.utils.duplicate(this.document.system.locations.list)
          const offset = locations.findIndex(l => l.uuid === locationId)
          if (offset === -1) {
            return
          }
          const current = locations[offset].obstacleDetails[property]
          if (current) {
            locations[offset].obstacleDetails[property] = false
            locations[offset].obstacle = false
          } else {
            locations[offset].obstacleDetails[property] = true
            locations[offset].obstacleDetails[(property === 'barrier' ? 'hazard' : 'barrier')] = false
            locations[offset].obstacle = true
          }
          await this.document.update({ 'system.locations.list': locations })
        }
        break
      default:
        super._onClickToggle(event)
        break
    }
  }

  /**
   * Scroll selected element into view
   * @param {ApplicationRenderContext} context
   * @param {RenderOptions} options
   */
  async _onFirstRender (context, options) {
    this._onTriggeredResize(context, options)
    await super._onFirstRender(context, options)
    setTimeout(() => {
      this.element.querySelector('.name-container.active')?.scrollIntoView({ inline: 'center' })
    }, 50)
  }

  /**
   * Resize triggered
   * @param {object} context
   * @param {object} options
   */
  _onTriggeredResize (context, options) {
    if (context.document.system.started) {
      let currentWidth = 0
      if (typeof options.position?.width !== 'undefined') {
        currentWidth = options.position.width
      } else {
        currentWidth = Number(context.document.sheet.element.style.width.replace('px', ''))
      }
      const minWidth = CoC7Utilities.remToPx(40)
      const participantWidth = CoC7Utilities.remToPx(context.document.system.participants.length * 12.25 + (context.document.system.participants.length - 1) * 0.5 + 1 + 1) // initiative-block each + each gap + padding on tab
      const maxWidth = document.body.clientWidth
      const newWidth = Math.min(maxWidth, Math.max(currentWidth, minWidth, participantWidth))
      if (typeof options.position?.width !== 'undefined') {
        options.position.width = newWidth
      } else if (currentWidth !== newWidth) {
        context.document.sheet.element.style.width = (newWidth + 1) + 'px'
      }
    }
    if (typeof options.position?.width === 'undefined') {
      setTimeout(() => {
        this.element.querySelector('.name-container.active')?.scrollIntoView({ inline: 'center' })
      }, 50)
    }
  }
}
