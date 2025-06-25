/* global $, CONFIG, FileReader, FormApplication, foundry, game, Hooks, ui */
import { CoC7ActorImporterRegExp } from './actor-importer-regexp.js'
import { CoC7ActorImporter } from './actor-importer.js'
import { CoC7DholeHouseActorImporter } from './dholehouse_importer.js'
import { CoC7Utilities } from '../../shared/utilities.js'

export class CoC7ActorImporterDialog extends FormApplication {
  /** @override */
  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['coc7', 'dialog', 'actor-importer'],
      title: game.i18n.localize('CoC7.ActorImporter'),
      template: 'systems/CoC7/templates/apps/actor-importer.html',
      closeOnSubmit: false,
      width: 600,
      height: 'auto'
    })
  }

  /** @override */
  async getData () {
    const data = await super.getData()

    data.importType = data.object.importType
    data.convert6E = data.object.convert6E
    data.source = data.object.source
    data.characterData = data.object.characterData
    data.canUpload = game.user?.can('FILES_UPLOAD')
    if (['npc', 'creature'].includes(data.importType)) {
      data.languages = CoC7ActorImporterRegExp.getTranslations()
      data.language = CoC7ActorImporterRegExp.checkLanguage(
        data.object.language
      )
      data.placeholder = CoC7ActorImporterRegExp.getExampleText(data.language)
    }

    data.importTypeOptions = [
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

    data.convert6EOptions = [
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

    data.sourceOptions = [
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

    return data
  }

  activateListeners (html) {
    super.activateListeners(html)

    html.find('#dholehouse-character-preview').hide()
    html
      .find('#coc-entity-type,#coc-entity-lang')
      .change(this._onChangeSubmit.bind(this))
    html
      .find('#dholehouse-json-file-picker')
      .change(this._onJSONFileSelected.bind(this))

    html
      .find('#coc-pasted-character-data')
      .on('keyup', function (e) {
        const charactersTooExtended = $(this)
          .val()
          .match(/[\udbc0-\udbfe][\udc00-\udfff]/)
        const prompt = $('#coc-prompt')
        if (prompt.data('extended') && charactersTooExtended) {
          prompt
            .html(game.i18n.localize('CoC7.TextFieldInvalidCharacters'))
            .addClass('error')
        } else {
          prompt.html(prompt.data('text')).removeClass('error')
        }
      })
      .trigger('keyup')

    html.find('.submit-button').click(this._onClickSubmit.bind(this))
    html.find('form').submit(e => {
      e.preventDefault()
    })
  }

  /**
   *
   * @returns getInputs extracts the data from the input fields and
   * adds a `.` at the end if it's not already there.
   */
  static getInputs (form) {
    const inputs = {}
    inputs.entity = form.find('#coc-entity-type').val().trim()
    if (CONFIG.debug.CoC7Importer) {
      console.debug('entity type:', inputs.entity)
    }
    if (form.find('#coc-convert-6E').length > 0) {
      inputs.convertFrom6E = form.find('#coc-convert-6E').val().trim()
    }
    if (form.find('#coc-entity-lang').length > 0) {
      inputs.lang = CoC7ActorImporterRegExp.checkLanguage(
        form.find('#coc-entity-lang').val().trim()
      )
    }
    if (form.find('#source').length > 0) {
      inputs.source = form.find('#source').val().trim()
    }
    if (form.find('#coc-pasted-character-data').length > 0) {
      inputs.text = form.find('#coc-pasted-character-data').val().trim()
    }

    if (CONFIG.debug.CoC7Importer) {
      console.debug('received text', '##' + inputs.text + '##')
    }
    return inputs
  }

  _onJSONFileSelected (event) {
    const jsonFileInput = document.getElementById('dholehouse-json-file-picker')
    const portraitImage = document.getElementById(
      'dholehouse-character-portrait'
    )
    const characterName = document.getElementById('dholehouse-character-name')
    const preview = document.getElementById('dholehouse-character-preview')
    const file = jsonFileInput.files[0]
    const dialog = this
    const fileReader = new FileReader()
    fileReader.onload = function (e) {
      try {
        dialog.characterJSON = JSON.parse(fileReader.result)
      } catch (e) {
        $('#coc-prompt')
          .html(game.i18n.localize('CoC7.TextFieldInvalidJSON'))
          .addClass('error')
        event.preventDefault()
        return
      }
      const personalDetails =
        dialog.characterJSON?.Investigator?.PersonalDetails
      if (!personalDetails) {
        ui.notifications.error(
          game.i18n.localize('CoC7.DholeHouseInvalidActor')
        )
        return
      }
      characterName.textContent = personalDetails.Name
      portraitImage.src = 'data:image/png;base64,' + personalDetails.Portrait
      preview.style.display = 'block'
      $('.dialog.actor-importer').height('auto')
    }
    fileReader.readAsText(file)
  }

  _onChangeSubmit (event) {
    this._onSubmit(event)
  }

  async _onClickSubmit (event) {
    const id = event.currentTarget.dataset.button
    if (id === 'no') {
      this.close()
    } else if (id === 'getExampleNow') {
      const content = CoC7ActorImporterRegExp.getExampleText(
        this.object.language
      )
      CoC7Utilities.copyToClipboard(content).then(() => {
        return ui.notifications.info(game.i18n.localize('CoC7.Copied'))
      })
    } else if (id === 'import') {
      const app = $(event.currentTarget).closest('div.dialog.actor-importer')
      app.hide()
      const form = $(event.currentTarget).closest('form')
      const inputs = CoC7ActorImporterDialog.getInputs(form)
      if (inputs.entity === 'dholehouse' && this.characterJSON) {
        const character =
          await CoC7DholeHouseActorImporter.createNPCFromDholeHouse(
            this.characterJSON,
            { source: inputs.source }
          )
        if (character !== false) {
          if (CONFIG.debug.CoC7Importer) {
            console.debug('character:', character)
          }
          ui.notifications.info(
            game.i18n.format('CoC7.ActorImported', {
              actorType: game.i18n.localize('CoC7.Entities.Character'),
              actorName: character.name
            })
          )
          await character.sheet.render(true)
          this.close()
        } else {
          app.show()
        }
      } else if (inputs.text && inputs.text !== '') {
        CoC7ActorImporterDialog.importActor(inputs)
        this.close()
      } else {
        app.show()
      }
    }
  }

  /** @override
   * A subclass of the FormApplication must implement the _updateObject method.
   */
  async _updateObject (event, formData) {
    this.object.importType = formData['coc-entity-type']
    this.object.characterData = formData['coc-pasted-character-data']?.trim()
    if (typeof formData['coc-convert-6E'] !== 'undefined') {
      this.object.convert6E = formData['coc-convert-6E']
    }
    if (typeof formData['coc-entity-lang'] !== 'undefined') {
      this.object.language = formData['coc-entity-lang']
    }
    if (typeof formData.source !== 'undefined') {
      this.object.source = formData.source
    }
    this.render(true)
  }

  /**
   * importActor imports an Actor using the dialog data
   * @param {html} html
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
    ui.notifications.info(
      game.i18n.format('CoC7.ActorImported', {
        actorType: createdActor.type?.toUpperCase(),
        actorName: createdActor.name
      })
    )
    await createdActor.sheet.render(true)
    // const updated = await Updater.updateActor(npc)
    // console.debug('updated:', updated)
  }

  // /**
  //  * create it's the default web to crate the CoC7ActorImporterDialog
  //  */
  static async create (options = {}) {
    options.importType = options.importType ?? 'npc'
    options.language =
      options.language ?? CoC7ActorImporterRegExp.checkLanguage(null)
    options.convert6E = options.language ?? 'coc-guess'
    options.source = options.source ?? 'iwms'
    options.characterData = options.characterData ?? ''

    new CoC7ActorImporterDialog(options).render(true)
  }
}

Hooks.once('ready', () => {
  if (game.modules.get('CoC7-Importer-Tests')?.active) {
    window.CoC7ActorImporter = CoC7ActorImporter
  }
})
