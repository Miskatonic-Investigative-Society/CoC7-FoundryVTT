/* global DragDrop foundry game TextEditor */
import { FOLDER_ID } from '../../constants.js'
import CoC7ModelsItemGlobalSheet from './global-sheet.js'
import deprecated from '../../deprecated.js'

export default class CoC7ModelsItemOccupationSheet extends CoC7ModelsItemGlobalSheet {
  static DEFAULT_OPTIONS = {
    position: {
      width: 525,
      height: 480
    }
  }

  static PARTS = {
    header: {
      template: 'systems/' + FOLDER_ID + '/templates/items/occupation-header.hbs'
    },
    tabs: {
      template: 'templates/generic/tab-navigation.hbs'
    },
    description: {
      template: 'systems/' + FOLDER_ID + '/templates/items/common-tab-properties-description.hbs',
      scrollable: ['.editor-content']
    },
    details: {
      template: 'systems/' + FOLDER_ID + '/templates/items/occupation-tab-details.hbs',
      scrollable: ['']
    },
    skills: {
      template: 'systems/' + FOLDER_ID + '/templates/items/occupation-tab-skills.hbs',
      scrollable: ['']
    },
    keeper: {
      template: 'systems/' + FOLDER_ID + '/templates/items/common-tab-keeper.hbs',
      scrollable: ['.editor-content']
    }
  }

  /**
   * @inheritdoc
   * @param {ApplicationRenderContext} context
   * @param {RenderOptions} options
   * @returns {Promise<void>}
   */
  async _onRender (context, options) {
    await super._onRender(context, options)

    if (context.document.isEmbedded) {
      /* // FoundryVTT V12 */
      if (!this._toggleDisabled) {
        deprecated.disableForm(this.options.window.frame, this.element)
      } else {
        this._toggleDisabled(true)
      }
    }

    this.element.querySelectorAll('.item div.summary').forEach((element) => element.addEventListener('click', this._onItemSummary.bind(this)))

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return

    this.element.querySelectorAll('.item-control').forEach((element) => element.addEventListener('click', (event) => {
      switch (event.currentTarget.dataset.action) {
        case 'group-add':
          this.scrollToNewLast('fieldset.skill-group')
          this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes
          this.document.update({
            'system.groups': this.document.system.groups.concat([{}])
          })
          break
        case 'group-remove':
          {
            this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes
            const group = event.target.closest('fieldset[data-group]')
            if (group) {
              const groups = foundry.utils.duplicate(this.document.system.groups)
              groups.splice(Number(group.dataset.group), 1)
              this.document.update({ 'system.groups': groups })
            }
          }
          break
        case 'item-delete':
          this._onItemDelete(event)
          break
      }
    }))

    /* // FoundryVTT V12 */
    new (foundry.applications.ux?.DragDrop ?? DragDrop)({
      dropSelector: '.drop-item',
      permissions: {
        drop: true
      },
      callbacks: {
        drop: this._onItemDrop.bind(this)
      }
    }).bind(this.element)
  }

  /**
   * Drop
   * @param {ClickEvent} event
   */
  async _onItemDrop (event) {
    const group = event.target.closest('fieldset[data-group]')
    const source = (group ? 'system.groups.' + group.dataset.group : 'system')
    this._onItemDropEvent(event, source, ['skill'])
  }

  /**
   * Toggle embedded item description
   * @param {ClickEvent} event
   */
  async _onItemSummary (event) {
    const group = event.currentTarget.closest('fieldset[data-group]')
    const source = (group ? 'system.groups.' + group.dataset.group : 'system')
    this._onItemSummaryEvent(event, source)
  }

  /**
   * Delete embedded item
   * @param {ClickEvent} event
   */
  async _onItemDelete (event) {
    const group = event.currentTarget.closest('fieldset[data-group]')
    const source = (group ? 'system.groups.' + group.dataset.group : 'system')
    this._onItemDeleteEvent(event, source)
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
    if (!context.document.isEmbedded) {
      tabs.details = {
        icon: '',
        label: 'CoC7.Details'
      }
      tabs.skills = {
        icon: '',
        label: 'CoC7.Skills'
      }
    }
    if (game.user.isGM) {
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
        context.occupationPointsString = context.document.system.occupationPointsString
        break
      case 'description':
        context._properties = []
        for (const [key, value] of context.document.system.schema.getField('type').entries()) {
          if (context.document.system.type[key] === true) {
            context._properties.push(value.label)
          }
        }
        /* // FoundryVTT V12 */
        context.enrichedDescriptionValue = await (foundry.applications.ux?.TextEditor.implementation ?? TextEditor).enrichHTML(
          context.document.system.description.value,
          {
            async: true,
            secrets: context.editable
          }
        )
        break
      case 'details':
        context._type = []
        for (const [key, value] of context.document.system.schema.getField('type').entries()) {
          context._type.push({
            id: key,
            name: value.label,
            tooltip: value.hint,
            isEnabled: context.document.system.type[key] === true
          })
        }
        context._occupationSkillPoints = []
        for (const [key, value] of context.document.system.schema.getField('occupationSkillPoints').entries()) {
          context._occupationSkillPoints.push({
            id: key,
            label: value.label,
            selected: context.document.system.occupationSkillPoints[key].selected,
            optional: context.document.system.occupationSkillPoints[key].optional,
            multiplier: context.document.system.occupationSkillPoints[key].multiplier
          })
        }
        break
      case 'skills':
        context.skills = await context.document.system.items()
        context.skillListEmpty = context.skills.length === 0
        context.groups = await context.document.system.skillGroups()
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
   * @param {SubmitEvent|null} event
   * @param {HTMLFormElement} form
   * @param {FormDataExtended} formData
   * @returns {object}
   */
  _processFormData (event, form, formData) {
    const object = super._processFormData(event, form, formData)

    this._mergeFormData(object, 'groups')

    return object
  }
}
