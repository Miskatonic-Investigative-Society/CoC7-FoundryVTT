/* global game */
import { FOLDER_ID, ERAS } from '../constants.js'

/**
 * Render Hook
 * @param {ApplicationV2} application
 * @param {HTMLElement} element
 * @param {ApplicationRenderContext} context
 * @param {ApplicationRenderOptions} options
 */
export default function (application, element, context, options) {
  if (game.settings.get(FOLDER_ID, 'showWorldEra')) {
    const div = document.createElement('div')
    div.classList.add('world-era', 'flexrow')
    div.innerHTML = '<i class="fa-regular fa-calendar"></i>' + '<div>' + game.i18n.format(ERAS[game.settings.get(FOLDER_ID, 'worldEra')]?.name ?? 'CoC7.CoCIDFlag.error.unknown-era', { era: game.settings.get(FOLDER_ID, 'worldEra') }) + '</div>'
    element.querySelector('#performance-stats').after(div)
  }
}
