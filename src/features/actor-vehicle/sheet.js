/* global foundry, game, TextEditor */
import { CoC7ActorSheet } from '../../core/sheets/actor-sheet-base.js'

export class CoC7VehicleSheet extends CoC7ActorSheet {
  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['coc7', 'sheetV2', 'actor', 'item', 'vehicle'],
      width: 555,
      height: 420,
      resizable: true,
      template: 'systems/CoC7/templates/actors/vehicle.html',
      dragDrop: [{ dragSelector: '.actor', dropSelector: '.dropZone' }],
      tabs: [
        {
          navSelector: '.sheet-nav',
          contentSelector: '.sheet-body',
          initial: 'description'
        }
      ]
    })
  }

  async getData () {
    // ui.notifications.warn(
    //   game.i18n.localize('CoC7.ExperimentalFeaturesWarning')
    // )
    const sheetData = await super.getData()

    sheetData.properties = []
    if (this.actor.system.properties.armed) {
      sheetData.properties.push(game.i18n.localize('CoC7.ArmedVehicle'))
    }

    const expanded = this.actor.getFlag('CoC7', 'expanded')
    if (typeof expanded === 'undefined') sheetData.expanded = true
    else sheetData.expanded = expanded
    if (sheetData.expanded) {
      sheetData.options.height = 420
    } else sheetData.options.height = 'auto'

    sheetData.enrichedDescriptionValue = await TextEditor.enrichHTML(
      sheetData.data.system.description.value,
      {
        async: true,
        secrets: sheetData.editable
      }
    )

    sheetData.enrichedDescriptionNotes = await TextEditor.enrichHTML(
      sheetData.data.system.description.notes,
      {
        async: true,
        secrets: sheetData.editable
      }
    )

    // for (let [key, value] of Object.entries(sheetData.data.type)) {
    //   if( value) sheetData.itemProperties.push( COC7.bookType[key]?COC7.bookType[key]:null);
    // }
    return sheetData
  }

  activateListeners (html) {
    super.activateListeners(html)
    html.find('.add-armor').click(async () => await this._onAddArmor())
    html
      .find('.remove-armor')
      .click(async event => await this._onRemoveArmor(event))
    html.find('.expand-button').click(this._onToggleExpand.bind(this))
    // Everything below here is only needed if the sheet is editable
    // if (!this.options.editable) return;
    // html.on('drop', (event) => this._onDrop(event));
    // html.find('.spell .spell-name h4').click(event => this._onSpellSummary(event));
    // html.find('.item-delete').click(this._onSpellDelete.bind(this));
  }

  async _onToggleExpand () {
    const expanded = this.actor.getFlag('CoC7', 'expanded')
    if (expanded) {
      this.oldSize = this.position.height
      this.position.height = 'auto' // Reset the stored position to force to recalculate window size TODO: Store previous position to restore it instead of auto
    } else {
      this.position.height = this.oldSize || 420 // Reset the stored position to force to recalculate window size TODO: Store previous position to restore it instead of auto
    }
    await this.actor.setFlag('CoC7', 'expanded', !expanded)
  }

  async _onAddArmor () {
    const locations = foundry.utils.duplicate(
      this.actor.system.attribs.armor.locations || []
    )
    locations.push({ name: null, value: null })
    await this.actor.update({ 'system.attribs.armor.locations': locations })
  }

  async _onRemoveArmor (event) {
    const button = event.currentTarget
    const location = button.closest('.armor')
    const index = location.dataset.index
    const locations = foundry.utils.duplicate(
      this.actor.system.attribs.armor.locations || null
    )
    if (!locations) return
    locations.splice(index, 1)
    await this.actor.update({ 'system.attribs.armor.locations': locations })
  }

  onCloseSheet () {
    super.onCloseSheet()
    // this.actor.locked = true;
  }

  /* -------------------------------------------- */
  /*  Form Submission                             */
  /* -------------------------------------------- */
  _updateObject (event, formData) {
    const system = foundry.utils.expandObject(formData)?.system
    if (system.attribs.armor.locations) {
      formData['system.attribs.armor.locations'] = Object.values(
        system.attribs.armor.locations || []
      )
    }

    super._updateObject(event, formData)
  }
}
