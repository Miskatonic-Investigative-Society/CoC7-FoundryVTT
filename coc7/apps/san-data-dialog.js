/* global foundry renderTemplate */
import { FOLDER_ID } from '../constants.js'

export default class CoC7SanDataDialog extends foundry.applications.api.DialogV2 {
  /**
   * Prompt for Sanity Check details
   * @param {object} options
   * @returns {object}
   */
  static async create (options = {}) {
    const data = {
      sanMin: '',
      sanMax: '',
      sanReason: ''
    }
    await this.prompt({
      classes: ['coc7', 'dialog', 'bonus-selection'],
      window: {
        title: 'CoC7.SanDataSelectionWindow'
      },
      content: await (foundry.applications.handlebars?.renderTemplate ?? renderTemplate)('systems/' + FOLDER_ID + '/templates/apps/san-data-dialog.hbs', data),
      ok: {
        callback: (event, button, dialog) => {
          if (typeof button.form.elements.sanMin !== 'undefined') {
            data.sanMin = button.form.elements.sanMin.value
          }
          if (typeof button.form.elements.sanMax !== 'undefined') {
            data.sanMax = button.form.elements.sanMax.value
          }
          if (typeof button.form.elements.sanReason !== 'undefined') {
            data.sanReason = button.form.elements.sanReason.value
          }
        }
      }
    })
    return data
  }
}
