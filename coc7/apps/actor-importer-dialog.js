/* global CONFIG FileReader foundry game Hooks ui */
// cSpell:words iwms wmis
import { FOLDER_ID } from '../constants.js'
import CoC7ActorImporter from './actor-importer.js'
import CoC7ActorImporterRegExp from './actor-importer-regexp.js'
import CoC7DholeHouseActorImporter from './dholehouse-importer.js'

export default class CoC7ActorImporterDialog extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  /**
   * @inheritdoc
   */
  constructor (...args) {
    const coc7Config = args.pop()
    super(...args)
    this.coc7Config = coc7Config
  }

  static DEFAULT_OPTIONS = {
    id: 'actor-importer-dialog',
    tag: 'form',
    classes: ['coc7', 'dialog'],
    window: {
      title: 'CoC7.ActorImporter',
      contentClasses: [
        'standard-form'
      ]
    },
    form: {
      closeOnSubmit: false,
      handler: CoC7ActorImporterDialog.#onSubmit
    },
    position: {
      width: 600
    }
  }

  static PARTS = {
    form: {
      template: 'systems/' + FOLDER_ID + '/templates/apps/actor-importer.hbs',
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
        context.importType = this.coc7Config.importType
        context.convert6E = this.coc7Config.convert6E
        context.source = this.coc7Config.source
        context.characterData = this.coc7Config.characterData
        context.canUpload = game.user?.can('FILES_UPLOAD')
        switch (context.importType) {
          case 'npc':
          case 'creature':
            context.languages = CoC7ActorImporterRegExp.getTranslations()
            context.language = CoC7ActorImporterRegExp.checkLanguage(this.coc7Config.language)
            context.placeholder = CoC7ActorImporterRegExp.getExampleText(context.language)
            break
          case 'dholehouse':
            {
              const personalDetails = this.coc7Config.characterJSON?.Investigator?.PersonalDetails
              if (personalDetails) {
                context.characterName = personalDetails.Name
                context.characterImage = 'data:image/png;base64,' + personalDetails.Portrait
              }
            }
            break
        }
        context.importTypeOptions = [
          {
            key: 'npc',
            label: 'CoC7.NonPlayingCharacter'
          },
          {
            key: 'creature',
            label: 'CoC7.Creature'
          },
          {
            key: 'dholehouse',
            label: 'CoC7.DholeHouseActorImporter'
          }
        ]
        context.convert6EOptions = [
          {
            key: 'coc-guess',
            label: 'CoC7.Guess'
          },
          {
            key: 'coc-convert',
            label: 'CoC7.Convert'
          },
          {
            key: 'coc-no-convert',
            label: 'CoC7.NoConvert'
          }
        ]
        context.sourceOptions = [
          {
            key: '',
            label: 'CoC7.ImportActorItemsNone'
          },
          {
            key: 'i',
            label: 'CoC7.ImportActorItemsItem'
          },
          {
            key: 'iwms',
            label: 'CoC7.ImportActorItemsItemWorldModuleSystem'
          },
          {
            key: 'wmis',
            label: 'CoC7.ImportActorItemsWorldModuleItemSystem'
          }
        ]
        break
      case 'footer':
        context.buttons = [{
          type: 'submit',
          action: 'close',
          label: 'CoC7.Cancel',
          icon: 'fa-solid fa-times'
        }]
        if (['npc', 'creature'].includes(this.coc7Config.importType)) {
          context.buttons.push({
            type: 'submit',
            action: 'getExampleNow',
            label: 'CoC7.getTheExample',
            icon: 'fa-solid fa-info-circle'
          })
        }
        context.buttons.push({
          type: 'submit',
          action: 'import',
          label: 'CoC7.Import',
          icon: 'fa-solid fa-file-import'
        })
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

    this.element.querySelector('select[name=coc-entity-type]')?.addEventListener('change', (event) => {
      this.coc7Config.importType = event.currentTarget.value
      this.render({ force: true })
    })
    this.element.querySelector('select[name=coc-entity-lang]')?.addEventListener('change', (event) => {
      this.coc7Config.language = event.currentTarget.value
      this.render({ force: true })
    })
    this.element.querySelector('input[name=dholehouse-json-file-picker]')?.addEventListener('change', (event) => {
      const files = event.currentTarget.files
      if (typeof files[0] !== 'undefined') {
        const application = this
        const fileReader = new FileReader()
        fileReader.onload = function (e) {
          try {
            application.coc7Config.characterJSON = JSON.parse(fileReader.result)
          } catch (e) {
            application.coc7Config.characterJSON = {}
            const prompt = application.element.querySelector('#coc-prompt')
            prompt.innerHTML = game.i18n.localize('CoC7.TextFieldInvalidJSON')
            prompt.classList.add('warning')
            return
          }
          const personalDetails = application.coc7Config.characterJSON?.Investigator?.PersonalDetails
          if (!personalDetails) {
            application.coc7Config.characterJSON = {}
            ui.notifications.error('CoC7.DholeHouseInvalidActor', { localize: true })
            return
          }
          application.render({ force: true })
        }
        fileReader.readAsText(files[0])
      }
    })
    const pastedData = this.element.querySelector('textarea[name=coc-pasted-character-data]')
    if (pastedData) {
      pastedData.addEventListener('keyup', (event) => {
        const prompt = this.element.querySelector('#coc-prompt')
        if (event.currentTarget.value.match(/[\udbc0-\udbfe][\udc00-\udfff]/)) {
          prompt.innerHTML = game.i18n.localize('CoC7.TextFieldInvalidCharacters')
          prompt.classList.add('warning')
        } else {
          prompt.innerHTML = prompt.dataset.text
          prompt.classList.remove('warning')
        }
      })
      pastedData.dispatchEvent(new Event('keyup'))
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
    switch (event.submitter.dataset.action) {
      case 'getExampleNow':
        {
          const content = CoC7ActorImporterRegExp.getExampleText(this.coc7Config.language)
          game.clipboard.copyPlainText(content).then(() => {
            ui.notifications.info('CoC7.Copied', { localize: true, console: false })
          })
        }
        break
      case 'import':
        this.coc7Config.characterData = formData.object['coc-pasted-character-data']
        this.coc7Config.convert6E = formData.object['coc-convert-6E']
        this.coc7Config.source = formData.object.source
        if (this.coc7Config.importType === 'dholehouse' && typeof this.coc7Config.characterJSON?.Investigator?.PersonalDetails !== 'undefined') {
          const app = document.getElementById('actor-importer-dialog')
          app.style.display = 'none'
          const character = await CoC7DholeHouseActorImporter.createNPCFromDholeHouse(this.coc7Config.characterJSON, { source: this.coc7Config.source })
          if (character !== false) {
            if (CONFIG.debug.CoC7Importer) {
              console.debug('character:', character)
            }
            /* // FoundryVTT V12 */
            ui.notifications.info(game.i18n.format('CoC7.ActorImported', {
              actorType: game.i18n.localize('TYPES.Actor.character'),
              actorName: character.name
            }), { console: false })
            await character.sheet.render({ force: true })
            this.close()
          } else {
            app.style.display = ''
          }
        } else if (this.coc7Config.characterData !== '') {
          this.close()
          CoC7ActorImporterDialog.importActor({
            convertFrom6E: this.coc7Config.convert6E,
            entity: this.coc7Config.importType,
            lang: this.coc7Config.language,
            source: this.coc7Config.source,
            // testMode: true,
            text: this.coc7Config.characterData
          })
        }
        break
    }
  }

  /**
   * importActor imports an Actor using the dialog data
   * @param {object} inputs
   * @param {object} inputs.convertFrom6E
   * @param {object} inputs.entity
   * @param {object} inputs.lang
   * @param {object} inputs.source
   * @param {object} inputs.text
   */
  static async importActor (inputs) {
    if (inputs.text[inputs.text.length] !== '.') {
      inputs.text += '.' // Add a dot a the end to help the regex find the end
    }
    const actor = new CoC7ActorImporter()
    const createdActor = await actor.createActor(inputs)
    // Actor created, Notify the user and show the sheet.
    if (CONFIG.debug.CoC7Importer) {
      console.debug('createdActor:', createdActor)
    }
    /* // FoundryVTT V12 */
    ui.notifications.info(game.i18n.format('CoC7.ActorImported', {
      actorType: game.i18n.localize('TYPES.Actor.' + createdActor.type),
      actorName: createdActor.name
    }), { console: false })
    await createdActor.sheet.render({ force: true })
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
   * Create dialog
   * @param {object} options
   * @param {string} options.characterData
   * @param {string} options.convert6E
   * @param {string} options.importType
   * @param {string|null} options.language
   * @param {string} options.source
   */
  static async create ({ characterData = '', convert6E = 'coc-guess', importType = 'npc', language = null, source = 'iwms' } = {}) {
    new CoC7ActorImporterDialog({}, {}, {
      characterData,
      characterJSON: {},
      convert6E,
      importType,
      language: CoC7ActorImporterRegExp.checkLanguage(language),
      source
    }).render({ force: true })
  }
}

Hooks.once('ready', () => {
  if (game.modules.get('CoC7-Importer-Tests')?.active) {
    game.CoC7.actorImporter = CoC7ActorImporter
  }
})
