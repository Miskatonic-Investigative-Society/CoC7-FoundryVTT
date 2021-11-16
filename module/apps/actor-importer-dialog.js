/* global $, CONFIG, Dialog, game, Hooks, renderTemplate, ui */

import { CoC7ActorImporter } from './actor-importer.js'
import { CoC7ActorImporterRegExp } from './actor-importer-regexp.js'

export class CoC7ActorImporterDialog extends Dialog {
  activateListeners (html) {
    super.activateListeners(html)
    html
      .find('option[value=' + game.i18n.lang + ']')
      .attr('selected', 'selected')
    html
      .find('#coc-entity-lang')
      .on('change', function (e) {
        $('#coc-pasted-character-data').prop(
          'placeholder',
          CoC7ActorImporterRegExp.getExampleText($(this).val())
        )
      })
      .trigger('change')
    html.find('#coc-pasted-character-data').on('keyup', function (e) {
      const charactersTooExtended = $(this)
        .val()
        .match(/[\udbc0-\udbfe][\udc00-\udfff]/)
      const prompt = $('#coc-prompt')
      if (charactersTooExtended) {
        prompt
          .html(game.i18n.localize('CoC7.TextFieldInvalidCharacters'))
          .addClass('error')
      } else {
        prompt
          .html(game.i18n.localize('CoC7.PasteTheDataBelow'))
          .removeClass('error')
      }
    })
  }

  /**
   *
   * @returns getInputs extracts the data from the input fields and
   * adds a `.` at the end if it's not already there.
   */
  static async getInputs () {
    const inputs = {}
    inputs.entity = $('#coc-entity-type')
      .val()
      .trim()
    inputs.convertFrom6E = $('#coc-convert-6E')
      .val()
      .trim()
    if (CONFIG.debug.CoC7Importer) {
      console.debug('entity type:', inputs.entity)
    }
    inputs.lang = CoC7ActorImporterRegExp.checkLanguage(
      $('#coc-entity-lang')
        .val()
        .trim()
    )
    inputs.source = $('#source')
      .val()
      .trim()
    let text = $('#coc-pasted-character-data')
      .val()
      .trim()
    if (CONFIG.debug.CoC7Importer) {
      console.debug('received text', '##' + text + '##')
    }
    if (text[text.length] !== '.') {
      text += '.' // Add a dot a the end to help the regex find the end
    }
    inputs.text = text
    return inputs
  }

  /**
   * importActor imports an Actor using the dialog data
   * @param {html} html
   */
  static async importActor (html) {
    if (CONFIG.debug.CoC7Importer) {
      console.debug('html', html)
    }
    const inputs = await CoC7ActorImporterDialog.getInputs()
    const actor = new CoC7ActorImporter()
    const createdActor = await actor.createActor(inputs)
    // Actor created, Notify the user and show the sheet.
    if (CONFIG.debug.CoC7Importer) {
      console.debug('createdActor:', createdActor)
    }
    ui.notifications.info(
      'Created ' +
        createdActor.data?.type?.toUpperCase() +
        ': ' +
        createdActor.data?.name
    )
    await createdActor.sheet.render(true)
    // const updated = await Updater.updateActor(npc)
    // console.debug('updated:', updated)
  }

  submit (button) {
    if(button.cssClass=="getExampleNow"){
      var content = CoC7ActorImporterRegExp.getExampleText(game.i18n.lang);
      navigator.clipboard.writeText(content)
          .then(() => {
            return ui.notifications.warn(
              game.i18n.localize('CoC7.Copied')
            )
      })
          .catch(err => {
          console.log('Something went wrong', err);
      })
      return
    }
    if (
      $('#coc-pasted-character-data')
        .val()
        .trim() !== '' ||
      !button.callback
    ) {
      super.submit(button)
    }
  }

  /**
   * create it's the default web to crate the CoC7ActorImporterDialog
   * @param {} data can include a `title` for the dialog.
   */
  static async create (data = {}) {
    data.languages = CoC7ActorImporterRegExp.getTranslations()
    data.language = CoC7ActorImporterRegExp.checkLanguage(null)
    const html = await renderTemplate(
      'systems/CoC7/templates/apps/actor-importer.html',
      data
    )
    return new Promise(resolve => {
      const dlg = new CoC7ActorImporterDialog(
        {
          title: data.title,
          content: html,
          data: data,
          buttons: {
            import: {
              icon: '<i class="fas fa-file-import"></i>',
              label: game.i18n.localize('CoC7.Import'),
              callback: CoC7ActorImporterDialog.importActor
            },
            no: {
              icon: '<i class="fas fa-times"></i>',
              label: game.i18n.localize('CoC7.Cancel')
            },
            getExampleNow: {
              icon: '<i class="fas fa-info-circle"></i>',
              label: game.i18n.localize('CoC7.getTheExample')
            }
          }
        },
        {
          classes: ['coc7', 'dialog', 'actor-importer'],
          width: 600
        }
      )
      dlg.render(true)
    })
  }
}

Hooks.once('ready', () => {
  if (game.modules.get('CoC7-Importer-Tests')?.active) {
    window.CoC7ActorImporter = CoC7ActorImporter
  }
})
