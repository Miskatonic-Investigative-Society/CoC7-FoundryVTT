import { FOLDER_ID } from '../constants.js'
import deprecated from '../deprecated.js'

/**
 * Render Hook
 * @param {ApplicationV2} application
 * @param {HTMLElement} element
 * @param {ApplicationRenderContext} context
 * @param {ApplicationRenderOptions} options
 */
export default function (application, element, context, options) {
  if (game.user.isGM) {
    const buttonIcon = document.createElement('i')
    buttonIcon.classList.add('fa-solid', 'fa-books')
    const buttonText = document.createTextNode(game.i18n.localize('CoC7.System.Documentation'))
    const button = document.createElement('button')
    button.append(buttonIcon)
    button.append(buttonText)
    button.addEventListener('click', async () => {
      (await fromUuid('Compendium.CoC7.system-doc.JournalEntry.' + game[FOLDER_ID].Manual))?.sheet.render({ force: true })
    })
    element.querySelector('section.documentation').append(button)
  }
  if (game.user.isGM) {
    const buttonIcon = document.createElement('i')
    buttonIcon.classList.add('fa-solid', 'fa-wrench')
    const buttonText = document.createTextNode(game.i18n.localize('CoC7.Migrate.TriggerButton'))
    const button = document.createElement('button')
    button.append(buttonIcon)
    button.append(buttonText)
    button.addEventListener('click', async () => {
      new foundry.applications.api.DialogV2({
        window: { title: 'CoC7.Migrate.TriggerTitle' },
        position: {
          width: 500
        },
        content: game.i18n.localize('CoC7.Migrate.TriggerContents'),
        buttons: [{
          action: 'close',
          icon: 'fa-solid fa-ban',
          default: true,
          label: 'Cancel'
        }, {
          action: 'migrate',
          icon: 'fa-solid fa-check',
          label: 'CoC7.Migrate.TriggerRestart',
          callback: async (event, button, dialog) => {
            await game.settings.set(FOLDER_ID, 'systemUpdateVersion', 0)
            foundry.utils.debouncedReload()
          }
        }]
      }).render({ force: true })
    })
    element.querySelector('section.settings').append(button)
  }
  deprecated.customCss(element)
}
