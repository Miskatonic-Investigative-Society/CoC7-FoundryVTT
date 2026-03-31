/* global canvas CONST foundry fromUuid game TokenDocument ui */
import { FOLDER_ID, TARGET_ALLOWED } from '../constants.js'
import CoC7Utilities from './utilities.js'

export default class CoC7ActorPickerDialog extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
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
    classes: ['coc7', 'dialog'],
    window: {
      title: 'CoC7.PickWhichActorTitle',
      contentClasses: [
        'standard-form'
      ]
    },
    form: {
      closeOnSubmit: true,
      handler: CoC7ActorPickerDialog.#onSubmit
    },
    position: {
      width: 430,
      height: 400
    },
    actions: {
      actorPicked: CoC7ActorPickerDialog.#onActorPicked
    }
  }

  static PARTS = {
    header: {
      template: 'systems/' + FOLDER_ID + '/templates/apps/actor-picker-header.hbs'
    },
    body: {
      template: 'systems/' + FOLDER_ID + '/templates/apps/actor-picker-body.hbs',
      scrollable: ['']
    },
    footer: {
      template: 'templates/generic/form-footer.hbs'
    }
  }

  /**
   * Scroll selected element into view
   * @param {ApplicationRenderContext} context
   * @param {RenderOptions} options
   */
  async _onFirstRender (context, options) {
    setTimeout(() => {
      this.element.querySelector('.picked').scrollIntoView()
    }, 50)
  }

  /**
   * @inheritdoc
   * @param {ApplicationRenderContext} context
   * @param {RenderOptions} options
   * @returns {Promise<void>}
   */
  async _onRender (context, options) {
    await super._onRender(context, options)

    this.element.querySelectorAll('li.can-ping').forEach((element) => {
      element.addEventListener('mouseenter', async (event) => {
        event.preventDefault()
        if (!canvas.ready) {
          return
        }
        const li = event.currentTarget
        const token = (await fromUuid(li.dataset.documentUuid))?.object
        if (token?.isVisible) {
          if (!token.controlled) {
            token._onHoverIn(event, { hoverOutOthers: true })
            this.coc7Config.highlighted = token
          }
        }
      })
      element.addEventListener('mouseleave', async (event) => {
        event.preventDefault()
        if (this.coc7Config.highlighted) {
          this.coc7Config.highlighted._onHoverOut(event)
        }
        this.coc7Config.highlighted = null
      })
    })
  }

  /**
   * Select Actor action
   * @param {ClickEvent} event
   * @param {HTMLElement} target
   */
  static #onActorPicked (event, target) {
    this.coc7Config.selected = target.dataset.documentUuid
    this.render({ force: true })
  }

  /**
   * Submit the configuration form.
   * @param {SubmitEvent} event
   * @param {HTMLFormElement} form
   * @param {FormDataExtended} formData
   * @returns {Promise<string|null>}
   */
  static async #onSubmit (event, form, formData) {
    if (event.submitter.dataset.action === 'pick') {
      this.coc7Config.resolve(this.coc7Config.selected)
    } else {
      this.coc7Config.resolve(null)
    }
  }

  /**
   * Create popup
   * @param {object} options
   * @param {boolean} options.allowNoActor
   * @param {string|null} options.notAutomaticUuid
   * @param {string|null} options.selected
   * @returns {string}
   */
  static async create ({ allowNoActor = false, notAutomaticUuid = null, selected = null } = {}) {
    let found = []
    if (game.user.isGM && canvas.ready && canvas.tokens.controlled.length > 0) {
      found = canvas.tokens.controlled.map(t => t.document)
    }
    if (found.length === 1 && (found[0].uuid === notAutomaticUuid || found[0].actor?.uuid === notAutomaticUuid)) {
      found = []
    }
    if (found.length === 0) {
      if (canvas.ready) {
        found = canvas.tokens.placeables.filter(t => TARGET_ALLOWED.includes(t.document.actor.type) && t.actor.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)).map(t => t.document)
      }
      const foundIDs = found.map(t => t.actorId)
      found = found.concat(game.actors.filter(a => TARGET_ALLOWED.includes(a.type) && !foundIDs.includes(a.id) && a.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)))
    }
    if (found.length === 1) {
      return found[0].uuid
    }
    if (found.length > 1) {
      const options = []
      for (const option of found) {
        const isTokenDocument = (option instanceof TokenDocument)
        options.push({
          uuid: option.uuid,
          name: option.name,
          img: (isTokenDocument ? option.texture.src : option.portrait),
          canPing: isTokenDocument
        })
      }
      options.sort(CoC7Utilities.sortByNameKey)

      if (!selected) {
        selected = options[0].uuid
        if (game.user.character) {
          const defaultOption = found.find(option => (option.actorId ?? option.id) === game.user.character.id)
          if (defaultOption) {
            selected = defaultOption.uuid
          }
        }
      }
      return await new Promise(resolve => {
        new CoC7ActorPickerDialog({}, {}, {
          allowNoActor,
          highlighted: null,
          options,
          resolve,
          selected
        }).render({ force: true })
      })
    }
    ui.notifications.warn('CoC7.WarnNoControlledActor', { localize: true })
    return null
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
      case 'body':
        context.selected = this.coc7Config.selected
        context.options = this.coc7Config.options
        break
      case 'footer':
        context.buttons = []
        if (this.coc7Config.allowNoActor) {
          context.buttons.push({
            type: 'submit',
            action: 'clear',
            label: 'CoC7.NoTarget',
            icon: 'fa-solid fa-bullseye'
          })
        }
        context.buttons.push({
          type: 'submit',
          action: 'pick',
          label: 'CoC7.SelectActor',
          icon: 'fa-solid fa-check'
        })
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
}
