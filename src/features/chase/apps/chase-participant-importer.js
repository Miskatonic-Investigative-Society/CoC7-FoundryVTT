/* global DragDrop, FormApplication, foundry, game, ui */
import { CoCActor } from '../../../core/documents/actor.js'
import { CoC7Check } from '../../../core/check.js'
import { _participant } from '../participant.js'
import { CoC7Utilities } from '../../../shared/utilities.js'

export class CoC7ChaseParticipantImporter extends FormApplication {
  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
      title: game.i18n.localize('CoC7.AddActorToChase'),
      template: 'systems/CoC7/templates/apps/chase-participant-importer.html',
      classes: ['coc7', 'dialog', 'chase-participant-importer'],
      editable: true,
      resizable: false,
      submitOnChange: true,
      closeOnSubmit: false,
      width: 300,
      height: 'auto'
    })
  }

  activateListeners (html) {
    super.activateListeners(html)

    /* // FoundryVTT V12 */
    const participantDragDrop = new (foundry.applications.ux?.DragDrop ?? DragDrop)({
      dropSelector: '.form-container',
      permissions: { drop: game.user.isGM },
      callbacks: { drop: this._onDropParticipant.bind(this) }
    })
    participantDragDrop.bind(html[0])

    /* // FoundryVTT V12 */
    const tokenSelectorDragDrop = new (foundry.applications.ux?.DragDrop ?? DragDrop)({
      dragSelector: '.chase-token',
      permissions: {
        dragstart: game.user.isGM
      },
      callbacks: {
        dragstart: this._onTokenSelectorDragStart.bind(this)
      }
    })
    tokenSelectorDragDrop.bind(html[0])

    html.find('.reset-participant').click(async () => {
      this.object = {}
      this._actor = null
      await this.render(true)
    })

    html.find('.food-chain').click(async () => {
      this.object.chaser = !this.object.chaser
      await this.render(true)
    })

    html.find('[data-action]').click(this._onAction.bind(this))

    // html.find('button').click(this._onButton.bind(this))
  }

  async _onTokenSelectorDragStart (event) {
    const data = {
      type: 'getToken',
      appId: this.appId,
      callBack: 'addTokenToChase'
    }
    event.dataTransfer.setData('text/plain', JSON.stringify(data))
  }

  async getData () {
    if (!this.object.initiative) {
      const init = CoCActor.getCharacteristicDefinition().find(
        c => c.key === 'dex'
      )
      this.object.initiative = init.label
      // this.object.initiative = `${game.i18n.localize(
      //   'CoC7.Characteristics'
      // )} (${init.shortName})`
    }
    if (!this.object.speedCheck) {
      const speedCheck = CoCActor.getCharacteristicDefinition().find(
        c => c.key === 'con'
      )
      this.object.speedCheck = {
        name: speedCheck.label
      }
      // this.object.speedCheck = {
      //   name: `${game.i18n.localize('CoC7.Characteristics')} (${
      //     speedCheck.shortName
      //   })`
      // }
    }

    this.validateParticipant()

    // const speedCheck = this.actor?.find( this.object.speedCheck?.name)
    // if( speedCheck){
    //   this.object.speedCheck = speedCheck
    // }

    const data = await super.getData()

    data.participant = new _participant(this.object)
    if (data.object.speedCheck.name && this.actor) {
      const speedCheck = this.actor.find(data.object.speedCheck.name)
      if (speedCheck) {
        data.object.speedCheck.score = speedCheck.value.value
        data.speedCheckReadOnly = true
      } else if (
        data.participant.speedCheck.score &&
        !this.object.speedCheck?.score
      ) {
        data.object.speedCheck.score = data.participant.speedCheck.score
      }
    }

    if (data.object.initiative && this.actor) {
      const initiative = this.actor.find(data.object.initiative)
      if (initiative) {
        data.object.dex = initiative.value.value
        data.initReadOnly = true
      } else data.object.dex = data.participant.initiative
    }

    data.actor = this.actor
    data.chase = this.chase
    data.data = this.data

    data.optionsList = {}
    if (this.chase) {
      data.skillsAndCharacteristicsList =
        this.chase.allSkillsAndCharacteristicsShort
    }

    if (this.actor) {
      data.skillsAndCharacteristicsList = []
      CoCActor.getCharacteristicDefinition().forEach(c =>
        data.skillsAndCharacteristicsList.push(`${c.label}`)
      )
      data.skillsAndCharacteristicsList.push(
        `${game.i18n.localize('CoC7.Luck')}`
      )
      data.skillsAndCharacteristicsList.push(
        `${game.i18n.localize('CoC7.SAN')}`
      )
      this.actor.skills.forEach(s =>
        data.skillsAndCharacteristicsList.push(s.name)
      )
    }

    return data
  }

  get chase () {
    if (!this._chase) {
      this._chase = CoC7Utilities.SfromUuid(this.object.chaseUuid)
    }
    return this._chase
  }

  get actor () {
    if (!this.object.docUuid) return null
    if (!this._actor) {
      this._actor = CoC7Utilities.getActorFromKey(this.object.docUuid)
    }
    return this._actor
  }

  async _updateObject (event, formData) {
    foundry.utils.mergeObject(this, formData)
    await this.render(true)
  }

  async _onDropParticipant (event) {
    const dropString = event.dataTransfer.getData('text/plain')
    const dropData = JSON.parse(dropString)

    const docUuid = CoC7Utilities.getActorDocumentFromDropData(dropData)

    this.object.docUuid = docUuid

    // If actor is controlled by GM only we assume he is a chaser
    this.object.chaser = this.actor?.owners?.filter(u => !u.isGM).length === 0
    if (this.object.speedCheck.rollDataString) {
      delete this.object.speedCheck.rollDataString
    }

    await this.render(true)
  }

  async addTokenToChase (tokens) {
    if (tokens.length === 1) {
      this.object.docUuid = tokens[0].document?.uuid
      // If actor is controlled by GM only we assume he is a chaser
      this.object.chaser = this.actor?.owners?.filter(u => !u.isGM).length === 0
      if (this.object.speedCheck.rollDataString) {
        delete this.object.speedCheck.rollDataString
      }
      await this.render(true)
    } else {
      ui.notifications.warn(game.i18n.localize('CoC7.ErrorTokenIncorrect'))
    }
  }

  async _onAction (event) {
    event.preventDefault()

    const action = event.currentTarget.dataset.action
    switch (action) {
      case 'chase-cancel':
        this.close()
        break
      case 'chase-add':
        {
          const participant = new _participant(this.object)

          if (this.chase.started) {
            if (
              !(participant.movementAction && participant.movementAction > 0)
            ) {
              ui.notifications.warn(
                game.i18n.localize('CoC7.DoesNotMeetMinimumReqToBeAdded')
              )
              return
            }
            if (this.data.overrideMovementAction) {
              const slowest = this.chase.slowestParticipant
              if (isNaN(participant.adjustedMov)) {
                participant.mov = slowest.adjustedMov
              } /** else {
                participant.data.mov =
                  slowest.adjustedMov + participant.movementAction - 1
              } */
              this.data.recalculationNeeded = false
            }
          }

          await this.chase.addParticipant(participant, {
            locationUuid: this.object.locationUuid,
            recalculateMovementActions: this.data.recalculationNeeded,
            update: this.object.update
          })
          this.close()
        }
        break

      case 'roll-speed-check':
        {
          const participant = new _participant(this.object)
          if (participant.speedCheck.refSet) {
            const roll = new CoC7Check()
            participant.data.rolled = true
            roll.actor = participant.actor.actorKey
            if (participant.speedCheck.isCharacteristic) {
              await roll.rollCharacteristic(participant.speedCheck.ref.key)
              participant.data.speedCheck.rollDataString = roll.JSONRollString
            } else if (participant.speedCheck.isSkill) {
              roll.skill = participant.speedCheck.ref
              await roll.roll()
              participant.data.speedCheck.rollDataString = roll.JSONRollString
            } else if (participant.speedCheck.isAttribute) {
              await roll.rollAttribute(participant.speedCheck.ref.key)
              participant.data.speedCheck.rollDataString = roll.JSONRollString
            }
          } else if (participant.speedCheck.score) {
            const rollData = {
              rawValue: participant.speedCheck.score,
              displayName: participant.speedCheck.name,
              actorName: participant.name ? participant.name : undefined
            }
            if (participant.hasActor) {
              rollData.actor = participant.actor.actorKey
            }
            const roll = CoC7Check.create(rollData)
            await roll.roll()
            participant.data.speedCheck.rollDataString = roll.JSONRollString
            participant.data.rolled = true
          }

          foundry.utils.mergeObject(this.object, participant.data)
          this.render(true)
        }

        break

      default:
        break
    }
  }

  validateParticipant () {
    const participant = new _participant(this.object)
    if (!this.data) this.data = {}
    this.object.excluded = false
    this.object.escaped = false
    this.data.recalculationNeeded = false
    this.data.participantExcluded = false
    this.data.movementActionDelta = 0

    if (!this.data.overrideMovementAction) {
      const slowestPrey = this.chase.slowestPrey
      const fastestChaser = this.chase.fastestChaser
      const slowest = this.chase.slowestParticipant

      if (participant.adjustedMov < slowest?.adjustedMov) {
        this.data.recalculationNeeded = true
        participant.movementAction = 1
      } else {
        this.data.recalculationNeeded = false
        participant.calculateMovementActions(slowest?.adjustedMov)
      }
      if (participant.isChaser) {
        if (
          slowestPrey &&
          !this.chase.system.includeLastCommers &&
          participant.adjustedMov < slowestPrey.adjustedMov
        ) {
          this.object.excluded = true
          this.data.participantExcluded = true
          this.data.excludedBecause = game.i18n.localize('CoC7.TooSlow')
          this.data.recalculationNeeded = false
        }
      }

      if (participant.isPrey) {
        if (
          fastestChaser &&
          !this.chase.system.includeEscaped &&
          participant.adjustedMov > fastestChaser.adjustedMov
        ) {
          this.object.escaped = true
          this.data.participantExcluded = true
          this.data.excludedBecause = game.i18n.localize('CoC7.TooFast')
          this.data.recalculationNeeded = false
        }
      }
    }
  }

  static async create (data) {
    if (data.dropData) {
      const docUuid = CoC7Utilities.getActorDocumentFromDropData(data.dropData)
      if (docUuid) data.docUuid = docUuid
      delete data.dropData
    }
    return new CoC7ChaseParticipantImporter(data).render(true)
  }
}
