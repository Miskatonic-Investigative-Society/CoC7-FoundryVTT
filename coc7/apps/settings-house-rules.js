/* global DragDrop foundry game */
import { FOLDER_ID } from '../constants.js'

const SETTINGS = {
  opposedRollTieBreaker: {
    name: 'SETTINGS.OpposedRollTieBreaker',
    hint: 'SETTINGS.OpposedRollTieBreakerHint',
    scope: 'world',
    config: false,
    default: false,
    type: Boolean
  },
  allowPushFumbles: {
    name: 'CoC7.Settings.AllowPushFumbles.Name',
    hint: 'CoC7.Settings.AllowPushFumbles.Hint',
    scope: 'world',
    config: false,
    default: false,
    type: Boolean
  },
  characteristicsOrder: {
    name: 'CoC7.Settings.CharacteristicsOrder.Name',
    hint: 'CoC7.Settings.CharacteristicsOrder.Hint',
    scope: 'world',
    config: false,
    type: Array,
    default: ['str', 'con', 'siz', 'dex', 'app', 'int', 'pow', 'edu']
  }
}

export default class CoC7SettingsHouseRules extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: 'rules-settings',
    tag: 'form',
    window: {
      title: 'SETTINGS.TitleRules',
      contentClasses: [
        'standard-form'
      ]
    },
    form: {
      closeOnSubmit: true,
      handler: CoC7SettingsHouseRules.#onSubmit
    },
    position: {
      width: 550
    },
    actions: {
      reset: CoC7SettingsHouseRules.#onReset
    }
  }

  static PARTS = {
    form: {
      template: 'systems/' + FOLDER_ID + '/templates/apps/house-rule-settings.hbs',
      scrollable: ['']
    },
    footer: {
      template: 'templates/generic/form-footer.hbs'
    }
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
      case 'form':
        {
          const fields = foundry.data.fields
          context.fields = {}
          context.values = {
            characteristicsOrder: []
          }
          context.characteristicsOrder = game.settings.get(FOLDER_ID, 'characteristicsOrder').join(',')
          for (const k of game.settings.get(FOLDER_ID, 'characteristicsOrder')) {
            context.values.characteristicsOrder.push({
              name: 'CHARAC.' + k.toUpperCase(),
              value: k
            })
          }
          for (const [k, v] of Object.entries(SETTINGS)) {
            if (k !== 'characteristicsOrder') {
              context.values[k] = game.settings.get(FOLDER_ID, k)
              switch (v.type) {
                case Boolean:
                  context.fields[k] = new fields.BooleanField({
                    label: v.name,
                    hint: v.hint,
                    initial: v.default
                  }, {
                    name: k
                  })
                  break
                case String:
                  context.fields[k] = new fields.StringField({
                    label: v.name,
                    hint: v.hint,
                    initial: v.default,
                    choices: v.choices
                  }, {
                    name: k
                  })
                  break
              }
            }
          }
        }
        break
      case 'footer':
        context.buttons = [
          {
            type: 'reset',
            label: 'Reset',
            icon: 'fa-solid fa-arrow-rotate-left',
            action: 'reset'
          },
          {
            type: 'submit',
            label: 'Save Changes',
            icon: 'fa-solid fa-floppy-disk'
          }
        ]
        break
    }

    return context
  }

  /**
   * Register Settings
   */
  static registerSettings () {
    for (const [k, v] of Object.entries(SETTINGS)) {
      game.settings.register(FOLDER_ID, k, v)
    }
  }

  /**
   * Render an HTMLElement for the Application.
   * An Application subclass must implement this method in order for the Application to be renderable.
   * @param {ApplicationRenderContext} context      Context data for the render operation
   * @param {RenderOptions} options                 Options which configure application rendering behavior
   * @returns {Promise<any>}                        The result of HTML rendering may be implementation specific.
   */
  async _renderHTML (context, options) {
    const parts = await super._renderHTML(context, options)

    new (foundry.applications.ux?.DragDrop ?? DragDrop)({
      dragSelector: '.characteristic',
      permissions: {
        dragstart: true,
        drop: true
      },
      callbacks: {
        dragstart: this._onDragStart.bind(this),
        drop: this._onDragDrop.bind(this)
      }
    }).bind(parts.form)

    return parts
  }

  /**
   * Set drag data
   * @param {DragEvent} event
   */
  _onDragStart (event) {
    if (event.currentTarget.dataset.characteristicValue) {
      const dragData = { type: 'characteristicValue', key: event.currentTarget.dataset.characteristicValue }
      event.dataTransfer.setData('text/plain', JSON.stringify(dragData))
    }
  }

  /**
   * Process dropped characteristic values or skill Items
   * @param {DropEvent} event
   */
  async _onDragDrop (event) {
    const dataList = JSON.parse(event.dataTransfer.getData('text/plain'))
    switch (dataList.type) {
      case 'characteristicValue':
        {
          const input = this.element.querySelector('input[name=characteristicsOrder]')
          const dropCharacteristic = event.target.closest('.characteristic')
          if (dropCharacteristic && input) {
            const characteristicsOrder = input.value.split(',')
            const fromIndex = characteristicsOrder.findIndex(t => t === dataList.key)
            const toIndex = characteristicsOrder.findIndex(t => t === dropCharacteristic.dataset.characteristicValue)
            if (fromIndex > -1 && toIndex > -1 && fromIndex !== toIndex) {
              characteristicsOrder[fromIndex] = dropCharacteristic.dataset.characteristicValue
              characteristicsOrder[toIndex] = dataList.key
              input.value = characteristicsOrder.join(',')
              const boxes = this.element.querySelectorAll('.drop-location .characteristic')
              for (const index in characteristicsOrder) {
                boxes[index].dataset.characteristicValue = characteristicsOrder[index]
                boxes[index].querySelector('div').innerText = game.i18n.localize('CHARAC.' + boxes[index].dataset.characteristicValue.toUpperCase())
              }
            }
          }
        }
        break
    }
  }

  /**
   * Reset the form back to default values.
   * @this {UIConfig}
   * @param {InputEvent} event
   * @returns {Promise<void>}
   */
  static async #onReset (event) {
    await this.render({
      force: false
    })
  }

  /**
   * Submit the configuration form.
   * @param {SubmitEvent} event
   * @param {HTMLFormElement} form
   * @param {FormDataExtended} formData
   * @returns {Promise<void>}
   */
  static async #onSubmit (event, form, formData) {
    const submitData = foundry.utils.expandObject(formData.object)
    for (const [k, v] of Object.entries(submitData)) {
      if (k === 'characteristicsOrder') {
        await game.settings.set(FOLDER_ID, k, v.split(','))
      } else {
        await game.settings.set(FOLDER_ID, k, v)
      }
    }
  }
}
