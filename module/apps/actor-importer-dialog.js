'use strict'

import { CoC7ActorImporter } from './actor-importer.js';

export class CoC7ActorImporterDialog extends Dialog {

  activateListeners(html) {
    super.activateListeners(html);
    html.on('submit', 'form', this._onSubmit.bind(this));
    html.find('option[value=coc-'+game.i18n.lang+']').attr('selected','selected');
  }

  /**
   * 
   * @returns getInputs extracts the data from the input fields and 
   * adds a `.` at the end if it's not already there. 
   */
  static async getInputs() {
    const inputs = {}
    inputs.entity = $('#coc-entity-type').val().trim()
    inputs.convertFrom6E = $('#coc-convert-6E').val().trim()
    console.debug('entity type:', inputs.entity)
    inputs.lang = $('#coc-entity-lang').val().trim()
    let text = $('#coc-pasted-character-data').val().trim()
    console.debug('received text', '##' + text + '##')
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
  static async importActor(html) {
    console.debug('html', html)
    const inputs = await CoC7ActorImporterDialog.getInputs()
    const actor  = new CoC7ActorImporter();
    const createdActor = await actor.createActor(inputs)
    // Actor created, Notify the user and show the sheet.
    console.debug('createdActor:', createdActor)
    ui.notifications.info('Created ' + createdActor.data?.type?.toUpperCase() + ': ' + createdActor.data?.name)
    await createdActor.sheet.render(true)
    // const updated = await Updater.updateActor(npc)
    // console.debug('updated:', updated)
  }
  async _onSubmit(event) {
    event.preventDefault();
  }

  /**
   * create it's the default web to crate the CoC7ActorImporterDialog
   * @param {} data can include a `title` for the dialog.
   */
  static async create(data) {
    const html = await renderTemplate('systems/CoC7/templates/apps/actor-importer.html', data);
    return new Promise(resolve => {
      const dlg = new CoC7ActorImporterDialog({
        title: data.title,
        content: html,
        data: data,
        buttons: {
          import: {
            icon: '<i class="fas fa-file-import"></i>',
            label: 'Import',
            callback: CoC7ActorImporterDialog.importActor,
          },
          no: {
            icon: '<i class="fas fa-times"></i>',
            label: 'Cancel'
          }
        },
        default: 'import',
        close: console.log("Closing:")
      }, {
        classes: ['coc7', 'dialogue', 'actor-importer'],
        width: 600
      });
      dlg.render(true);
    });
  }
}