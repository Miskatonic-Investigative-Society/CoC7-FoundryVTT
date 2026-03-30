/* global canvas, CONST, FormApplication, foundry, fromUuid, game, TokenDocument, ui */
import { CoC7Utilities } from '../utilities.js'

export class ActorPickerDialog extends FormApplication {
  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['coc7', 'dialog', 'actor-picker'],
      title: game.i18n.localize('CoC7.PickWhichActorTitle'),
      template: 'systems/CoC7/templates/chat/messages/actor-picker.hbs',
      closeOnSubmit: false,
      width: 415,
      height: 375
    })
  }

  /** @inheritdoc */
  activateListeners (html) {
    super.activateListeners(html)

    html.on('click', '.directory-item', this._onPick.bind(this))
    html.find('.can-ping').hover(this._onHoverIn.bind(this), this._onHoverOut.bind(this))
    html.on('click', '.submit-button', this._onSubmitButton.bind(this))
  }

  _onPick (event) {
    const li = event.currentTarget
    for (const l of li.parentElement.children) {
      l.classList.toggle('picked', l === li)
    }
    this.object.selected = li.dataset.entryUuid
  }

  async _onHoverIn (event) {
    event.preventDefault()
    if (!canvas.ready) {
      return
    }
    const li = event.currentTarget
    const token = (await fromUuid(li.dataset.entryUuid))?.object
    if (token?.isVisible) {
      if (!token.controlled) {
        token._onHoverIn(event, { hoverOutOthers: true })
        this._highlighted = token
      }
    }
  }

  _onHoverOut (event) {
    event.preventDefault()
    if (this._highlighted) {
      this._highlighted._onHoverOut(event)
    }
    this._highlighted = null
  }

  async _onSubmitButton (event) {
    this.object.resolve(await fromUuid(this.object.selected))
    this.close()
  }

  static async create () {
    const allowedTypes = ['character', 'npc', 'creature']
    let found = []
    if (game.user.isGM && canvas.ready && canvas.tokens.controlled.length > 0) {
      found = canvas.tokens.controlled.map(t => t.document)
    } else {
      if (canvas.ready) {
        found = canvas.tokens.placeables.filter(t => allowedTypes.includes(t.document.actor.type) && (t.actor.ownership[game.user.id] ?? t.actor.ownership.default) === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER).map(t => t.document)
      }
      const foundIDs = found.map(t => t.actorId)
      found = found.concat(game.actors.filter(a => allowedTypes.includes(a.type) && !foundIDs.includes(a.id) && (a.ownership[game.user.id] ?? a.ownership.default) === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER))
    }
    if (found.length === 1) {
      return found[0]
    }
    if (found.length > 1) {
      const options = []
      for (const option of found) {
        const isTokenDocument = (option instanceof TokenDocument)
        options.push({
          uuid: option.uuid,
          name: option.name,
          img: (isTokenDocument ? option.actor.portrait : option.portrait),
          canPing: isTokenDocument
        })
      }
      options.sort(CoC7Utilities.sortByNameKey)

      let selected = options[1].uuid
      if (game.user.character) {
        const defaultOption = found.find(option => (option.actorId ?? option.id) === game.user.character.id)
        if (defaultOption) {
          selected = defaultOption.uuid
        }
      }

      return new Promise(resolve => {
        new ActorPickerDialog({ options, selected, resolve }).render(true)
      })
    }
    ui.notifications.warn(game.i18n.localize('CoC7.WarnNoControlledActor'))
    return null
  }
}
