/* global CONFIG foundry game TextEditor */
import { CoC7CharacterSheet } from './sheet.js'

export class CoC7CharacterSheetV3 extends CoC7CharacterSheet {
  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['coc7', 'sheetV3', 'actor', 'character'],
      template: 'systems/CoC7/templates/actors/character-sheet-v3.hbs',
      width: 980,
      height: 810,
      scrollY: ['.sheet-body']
    })
  }

  _getHeaderButtons () {
    let buttons = super._getHeaderButtons()
    buttons = [
      {
        label: game.i18n.localize('CoC7.Summarize'),
        class: 'test-extra-icon',
        icon: 'fas fa-window-minimize',
        onclick: event => this.toggleSheetMode(event)
      }
    ].concat(buttons)
    return buttons
  }

  async toggleSheetMode (event) {
    const ClassName = CONFIG.Actor.sheetClasses.character['CoC7.CoC7CharacterSheetMinimized']?.cls
    if (typeof ClassName !== 'undefined') {
      const token = this.options.token
      await this.close()
      await (new ClassName(this.object, { editable: this.object.isOwner })).render(true, { token })
    }
  }

  async getData () {
    const sheetData = await super.getData()
    const hp = this.actor.system.attribs.hp
    sheetData.imgSaturation = hp.value / hp.max

    sheetData.biographySections = []
    if (sheetData.data.system.biography instanceof Array && sheetData.data.system.biography.length) {
      for (const biography of sheetData.data.system.biography) {
        sheetData.biographySections.push({
          title: biography.title,
          value: biography.value,
          enriched: await TextEditor.enrichHTML(
            biography.value,
            {
              async: true,
              secrets: sheetData.editable
            }
          )
        })
      }
      sheetData.biographySections[0].isFirst = true
      sheetData.biographySections[sheetData.biographySections.length - 1].isLast = true
    }

    sheetData.showPartValues = !game.settings.get('CoC7', 'hidePartValues')

    return sheetData
  }

  activateListeners (html) {
    super.activateListeners(html)

    if (!this.object.sheet.isEditable) return

    html.find('.add-new-section-scroll').click(() => {
      this.actor.createBioSection()
      html.find('.sheet-body').each((i, el) => { el.scrollTop = el.scrollHeight - el.clientHeight })
      this.render()
    })
    html.find('.portrait-frame').click(() => {
      this._tabs.find(t => t._navSelector === '.sheet-nav')?.activate('portrait-frame')
    })
    html.find('.optionbox .photo-frame').click((event) => {
      const objectFit = event.currentTarget.dataset.objectFit
      this.actor.update({
        'flags.CoC7.portraitFrame': objectFit
      })
    })
  }
}
