import { CoCActor } from '../actors/actor.js'
import { _participant } from '../items/chase/participant.js'
import { CoC7Utilities } from '../utilities.js'

export class CoC7ChaseParticipantImporter extends FormApplication {
  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
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

    const participantDragDrop = new DragDrop({
      dropSelector: '.form-container',
      permissions: { drop: game.user.isGM },
      callbacks: { drop: this._onDropParticipant.bind(this) }
    })
    participantDragDrop.bind(html[0])

    html.find('.reset-participant').click(async () => {
      this.object = {}
      this._actor = null
      await this.render(true)
    })

    html.find('.food-chain').click(async () => {
      this.object.chaser = !this.object.chaser
      await this.render(true)
    })

    html.find('button').click(this._onButton.bind(this))
  }

  async getData () {
    if (!this.object.initiative) {
      const init = CoCActor.getCharacteristicDefinition().find(
        c => c.key === 'dex'
      )
      this.object.initiative = `${game.i18n.localize(
        'CoC7.Characteristics'
      )} (${init.shortName})`
    }
    if (!this.object.speedCheck) {
      const speedCheck = CoCActor.getCharacteristicDefinition().find(
        c => c.key === 'con'
      )
      this.object.speedCheck = {
        name: `${game.i18n.localize('CoC7.Characteristics')} (${
          speedCheck.shortName
        })`
      }
    }

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

    data.optionsList = {}
    if (this.chase) {
      data.skillsAndCharacteristicsList = this.chase.allSkillsAndCharacteristicsShort
    }

    if (this.actor) {
      data.skillsAndCharacteristicsList = []
      CoCActor.getCharacteristicDefinition().forEach(c =>
        data.skillsAndCharacteristicsList.push(
          `${c.label}`
        )
      )
      data.skillsAndCharacteristicsList.push(
        `${game.i18n.localize( 'CoC7.Luck')}`
      )
      data.skillsAndCharacteristicsList.push(
        `${game.i18n.localize( 'CoC7.SAN')}`
      )
      this.actor.skills.forEach(s =>
        data.skillsAndCharacteristicsList.push(s.fullName)
      )
    }
    return data
  }

  get chase () {
    if (!this._chase)
      this._chase = CoC7Utilities.SfromUuid(this.object.chaseUuid)
    return this._chase
  }

  get actor () {
    if (!this.object.docUuid) return null
    if (!this._actor)
      this._actor = CoC7Utilities.getActorFromKey(this.object.docUuid)
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

    //If actor is controlled by GM only we assume he is a chaser
    this.object.chaser = 0 == this.actor?.owners?.filter(u => !u.isGM).length

    await this.render(true)
  }

  async _onButton (event) {
    const action = event.currentTarget.dataset.action
    switch (action) {
      case 'cancel':
        this.close()
        break
      case 'add':
        {
          const participant = new _participant(this.object)
          await this.chase.addParticipant(participant, {
            locationUuid: this.object.locationUuid
          })
          this.close()
        }
        break

      default:
        break
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
