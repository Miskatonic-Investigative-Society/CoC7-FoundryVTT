/* global foundry game TextEditor */
import { FOLDER_ID } from '../../constants.js'
import CoC7ModelsActorGlobalSheet from './global-sheet.js'

export default class CoC7ModelsActorVehicleSheetV2 extends CoC7ModelsActorGlobalSheet {
  static DEFAULT_OPTIONS = {
    classes: ['dialog', 'item', 'vehicle'],
    position: {
      width: 650,
      height: 420
    }
  }

  static PARTS = {
    header: {
      template: 'systems/' + FOLDER_ID + '/templates/actors/vehicle-v2/header.hbs'
    },
    tabs: {
      template: 'templates/generic/tab-navigation.hbs'
    },
    description: {
      template: 'systems/' + FOLDER_ID + '/templates/items/common-tab-description.hbs',
      scrollable: ['.editor-content']
    },
    details: {
      template: 'systems/' + FOLDER_ID + '/templates/actors/vehicle-v2/details.hbs',
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
      description: {
        icon: '',
        label: 'CoC7.Description'
      }
    }
    if (game.user.isGM) {
      tabs.details = {
        icon: '',
        label: 'CoC7.Details'
      }
      tabs.keeper = {
        cssClass: 'icon-only-tab',
        icon: 'game-icon game-icon-tentacles-skull',
        tooltip: 'CoC7.GmNotes'
      }
    }

    context.tabs = this.getTabs('primary', 'description', tabs)

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
        context._properties = []
        if (context.document.system.properties.armed) {
          context._properties.push(game.i18n.localize('CoC7.ArmedVehicle'))
        }
        break
      case 'description':
        /* // FoundryVTT V12 */
        context.enrichedDescriptionValue = await (foundry.applications.ux?.TextEditor.implementation ?? TextEditor).enrichHTML(
          context.document.system.description.value,
          {
            async: true,
            secrets: context.editable
          }
        )
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

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return
    this.element.querySelectorAll('.item-control').forEach((element) => element.addEventListener('click', async (event) => {
      switch (event.currentTarget.dataset.action) {
        case 'armor-add':
          await this._onAddArmor()
          break
        case 'armor-remove':
          await this._onRemoveArmor(event)
          break
      }
    }))
  }

  /**
   * Add armor location
   */
  async _onAddArmor () {
    const locations = foundry.utils.duplicate(this.document.system.stats.armor.locations || [])
    locations.push({})
    await this.document.update({ 'system.stats.armor.locations': locations })
  }

  /**
   * Remove armor location row
   * @param {ClickEvent|null} event
   */
  async _onRemoveArmor (event) {
    const offset = event.currentTarget.dataset.offset
    if (typeof offset !== 'undefined') {
      const locations = foundry.utils.duplicate(this.document.system.stats.armor.locations || [])
      locations.splice(Number(offset), 1)
      await this.document.update({ 'system.stats.armor.locations': locations })
    }
  }

  /**
   * Toggle property
   * @param {SubmitEvent|null} event
   */
  async _onClickToggle (event) {
    event.preventDefault()
    const property = event.currentTarget.closest('.toggle-attributes').dataset.set
    const key = event.currentTarget.dataset.property
    if (property && key) {
      const field = 'system.' + property + '.' + key
      this.document.update({ [field]: !foundry.utils.getProperty(this.document, field) })
      this.render()
    }
  }
}
