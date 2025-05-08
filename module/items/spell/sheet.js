/* global $, foundry, game, TextEditor */
import { addCoCIDSheetHeaderButton } from '../../scripts/coc-id-button.js'

export class CoC7SpellSheet extends foundry.appv1.sheets.ItemSheet {
  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: 'systems/CoC7/templates/items/spell/main.html',
      classes: ['coc7', 'item', 'spell'],
      width: 500,
      height: 'auto',
      resizable: false,
      scrollY: ['.body'],
      tabs: [
        {
          navSelector: '.navigation',
          contentSelector: '.body',
          initial: 'description'
        }
      ]
    })
  }

  _getHeaderButtons () {
    const headerButtons = super._getHeaderButtons()
    addCoCIDSheetHeaderButton(headerButtons, this)
    return headerButtons
  }

  async getData () {
    const sheetData = super.getData()
    sheetData.hasOwner = this.item.isEmbedded === true
    sheetData.isKeeper = game.user.isGM
    sheetData.isOwner = this.item.isOwner

    sheetData.enrichedDescriptionValue = await TextEditor.enrichHTML(
      sheetData.data.system.description.value,
      {
        async: true,
        secrets: sheetData.editable
      }
    )

    sheetData.enrichedDescriptionKeeper = await TextEditor.enrichHTML(
      sheetData.data.system.description.keeper,
      {
        async: true,
        secrets: sheetData.editable
      }
    )

    sheetData.enrichedDescriptionAlternativeNames = await TextEditor.enrichHTML(
      sheetData.data.system.description.alternativeNames,
      {
        async: true,
        secrets: sheetData.editable
      }
    )

    return sheetData
  }

  activateListeners (html) {
    super.activateListeners(html)
    html.find('.option').click(event => this.modifyType(event))
    html.find('#cast-spell').click(event => {
      event.preventDefault()
      this.item.cast(false)
    })
    html.find('#cast-spell-hidden').click(event => {
      event.preventDefault()
      this.item.cast(true)
    })
  }

  /**
   * Toggle the checkboxes for type when user clicks on the corresponding
   * label, not sure if this works on engines other than V8
   * @param {jQuery} event @see activateListeners
   * @returns {jQuery.Event} click
   */
  modifyType (event) {
    event.preventDefault()
    /** Prevents propagation of the same event from being called */
    event.stopPropagation()
    const toggleSwitch = $(event.currentTarget)
    return toggleSwitch.prev().trigger('click')
  }
}
