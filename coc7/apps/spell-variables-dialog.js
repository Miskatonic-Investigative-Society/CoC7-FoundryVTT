/* global foundry game Roll */
import { FOLDER_ID } from '../constants.js'

export default class CoC7SpellVariablesDialog extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  /**
   * @inheritdoc
   */
  constructor (...args) {
    const coc7Config = args.pop()
    super(...args)
    this.coc7Config = coc7Config
  }

  static DEFAULT_OPTIONS = {
    tag: 'form',
    classes: ['coc7', 'dialog', 'spell-variables'],
    window: {
      title: 'CoC7.SpellCosts',
      contentClasses: [
        'standard-form'
      ]
    },
    form: {
      closeOnSubmit: false,
      handler: CoC7SpellVariablesDialog.#onSubmit
    },
    position: {
      width: 410
    }
  }

  static PARTS = {
    form: {
      template: 'systems/' + FOLDER_ID + '/templates/apps/spell-variables-dialog.hbs',
      scrollable: ['']
    },
    footer: {
      template: 'templates/generic/form-footer.hbs'
    }
  }

  /**
   * Submit the configuration form.
   * @param {SubmitEvent} event
   * @param {HTMLFormElement} form
   * @param {FormDataExtended} formData
   * @returns {Promise<void>}
   */
  static async #onSubmit (event, form, formData) {
    let valid = true
    const submitting = event.submitter?.dataset.action === 'validate'
    for (const index in this.coc7Config.variables) {
      switch (this.coc7Config.variables[index].type) {
        case 'additionalCasterPromptAdd':
          {
            const contents = foundry.utils.duplicate(this.coc7Config.variables[index].contents)
            for (const index2 in contents) {
              const field = form.elements[this.coc7Config.variables[index].key + '.' + index2 + '.' + 'name']
              contents[index2].name = field?.value ?? ''
              for (const numberSet of this.coc7Config.variables[index].numbers) {
                const field = form.elements[this.coc7Config.variables[index].key + '.' + index2 + '.' + numberSet.key]
                if (field) {
                  const value = field?.value
                  if (!Roll.validate(value)) {
                    if (submitting && valid) {
                      field.focus()
                    }
                    valid = false
                    contents[index2].numbers[numberSet.key] = null
                  } else {
                    contents[index2].numbers[numberSet.key] = value
                  }
                }
              }
            }
            this.coc7Config.variables[index].contents = contents
          }
          break
        case 'number':
          {
            const field = form.elements[this.coc7Config.variables[index].key]
            const value = field?.value
            if (!Roll.validate(value)) {
              if (submitting && valid) {
                field.focus()
              }
              valid = false
              this.coc7Config.variables[index].value = null
            } else {
              this.coc7Config.variables[index].value = value
            }
          }
          break
      }
    }
    if (submitting) {
      if (valid) {
        this.coc7Config.resolve(this.coc7Config.variables)
        this.close()
      }
    } else {
      this.render()
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
        context.variables = this.coc7Config.variables
        break
      case 'footer':
        context.buttons = [{
          type: 'submit',
          action: 'validate',
          label: 'CoC7.Validate',
          icon: 'fa-solid fa-check'
        }]
        break
    }

    return context
  }

  /**
   * @inheritdoc
   * @param {RenderOptions} options
   * @returns {Promise<HTMLElement>}
   */
  async _renderFrame (options) {
    const frame = await super._renderFrame(options)

    /* // FoundryV12 polyfill */
    if (!foundry.utils.isNewerVersion(game.version, 13)) {
      frame.setAttribute('open', true)
    }

    return frame
  }

  /**
   * @inheritdoc
   * @param {ApplicationRenderContext} context
   * @param {RenderOptions} options
   * @returns {Promise<void>}
   */
  async _onRender (context, options) {
    await super._onRender(context, options)

    this.element.querySelectorAll('[data-action]').forEach((element) => {
      element.addEventListener('click', async (event) => {
        switch (event.currentTarget.dataset.action) {
          case 'casters-group-add':
            {
              const index = event.currentTarget.closest('.form-group').dataset.index
              if (this.coc7Config.variables[index].type === 'additionalCasterPromptAdd') {
                this.coc7Config.variables[index].contents = this.coc7Config.variables[index].contents.concat(new Array(Number(this.coc7Config.variables[index].step)).fill({ name: '', numbers: {} }))
                this.submit()
              }
            }
            break
          case 'casters-group-remove':
            {
              const index = event.currentTarget.closest('.form-group').dataset.index
              if (this.coc7Config.variables[index].type === 'additionalCasterPromptAdd' && this.coc7Config.variables[index].contents.length > this.coc7Config.variables[index].min) {
                this.coc7Config.variables[index].contents.splice(this.coc7Config.variables[index].contents.length - this.coc7Config.variables[index].step, this.coc7Config.variables[index].step)
                this.submit()
              }
            }
            break
          case 'toggle':
            {
              const index = event.currentTarget.dataset.index
              if (this.coc7Config.variables[index].type === 'toggle') {
                this.coc7Config.variables[index].value = !this.coc7Config.variables[index].value
                this.submit()
              }
            }
            break
        }
      })
    })
  }

  /**
   * Create popup
   * @param {object} options
   * @param {Array} options.variables
   * @returns {object}
   */
  static async create ({ variables = [] } = {}) {
    return await new Promise(resolve => {
      new CoC7SpellVariablesDialog({}, {}, {
        variables,
        resolve
      }).render({ force: true })
    })
  }
}
