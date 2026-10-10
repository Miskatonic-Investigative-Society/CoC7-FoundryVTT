import { FOLDER_ID } from '../constants.js'

export default class CoC7DropCoCID extends foundry.applications.api.DialogV2 {
  /**
   * Process dialog form
   * @param {PointerEvent|SubmitEvent} event
   * @param {HTMLButtonElement} button
   * @param {HTMLDialogElement} dialog
   * @param {Function} resolve
   */
  static processForm (event, button, dialog, resolve) {
    const response = button.dataset.action === 'yes'
    if (button.form.elements.rememberThis.classList.contains('switched-on')) {
      game.settings.set(FOLDER_ID, 'dropCoCID', (response ? 'Y' : 'N'))
    }
    resolve(response)
  }

  /**
   * Get document or key for document
   * @param {boolean} asCocid
   * @param {object} document
   * @returns {object|string}
   */
  static processItem (asCocid, document) {
    if (asCocid && document.flags?.[FOLDER_ID]?.cocidFlag?.id) {
      return document.flags[FOLDER_ID].cocidFlag.id
    }
    return foundry.utils.duplicate(document)
  }

  /**
   * Render an HTMLElement for the Application.
   * An Application subclass must implement this method in order for the Application to be renderable.
   * @param {ApplicationRenderContext} context      Context data for the render operation
   * @param {RenderOptions} options                 Options which configure application rendering behavior
   * @returns {Promise<any>}                        The result of HTML rendering may be implementation specific.
   */
  async _renderHTML (context, options) {
    const html = await super._renderHTML(context, options)

    html.querySelector('button').addEventListener('click', (event) => {
      event.preventDefault()
      event.target.classList.toggle('switched-on')
      event.target.blur()
    })

    return html
  }

  /**
   * Use CoC ID as response?
   * @returns {boolean}
   */
  static async create () {
    const dropCoCID = game.settings.get(FOLDER_ID, 'dropCoCID')
    switch (dropCoCID) {
      case '':
        return new Promise(resolve => {
          new CoC7DropCoCID({
            classes: ['coc7', 'dialog'],
            window: { title: game.i18n.localize('CoC7.Settings.DropCoCID.Name') },
            content: '<p>' + game.i18n.localize('CoC7.Settings.DropCoCID.Dialog') + '</p><div class="toggle-attributes flexrow"><button class="toggle-switch" name="rememberThis">' + game.i18n.localize('CoC7.Settings.DropCoCID.Remember') + '</button></div>',
            position: {
              width: 500
            },
            buttons: [{
              action: 'yes',
              icon: 'fa-solid fa-check',
              label: game.i18n.localize('Yes'),
              default: true,
              callback: (event, button, dialog) => CoC7DropCoCID.processForm(event, button, dialog, resolve)
            }, {
              action: 'no',
              icon: 'fa-solid fa-times',
              label: game.i18n.localize('No'),
              callback: (event, button, dialog) => CoC7DropCoCID.processForm(event, button, dialog, resolve)
            }]
          }).render({ force: true })
        })
      case 'Y':
        return true
      case 'N':
        return false
    }
  }
}
