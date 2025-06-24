/* global CONFIG foundry game */
import { CoC7CharacterSheet } from './sheet.js'

export class CoC7CharacterSheetMinimized extends CoC7CharacterSheet {
  constructor (options = {}) {
    super(options)
    this.summarized = true
  }

  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['coc7', 'actor', 'character', 'summarized'],
      height: 200,
      width: 700
    })
  }

  _getHeaderButtons () {
    let buttons = super._getHeaderButtons()
    buttons = [
      {
        label: game.i18n.localize('CoC7.Maximize'),
        class: 'test-extra-icon',
        icon: 'fas fa-window-maximize',
        onclick: event => this.toggleSheetMode(event)
      }
    ].concat(buttons)
    return buttons
  }

  async toggleSheetMode (event) {
    const ClassName = CONFIG.Actor.sheetClasses.character['CoC7.CoC7CharacterSheetV3']?.cls
    if (typeof ClassName !== 'undefined') {
      const token = this.options.token
      await this.close()
      await (new ClassName(this.object, { editable: this.object.isOwner })).render(true, { token })
    }
  }
}
