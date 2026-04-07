/* global $ game */
import { FOLDER_ID, ERAS } from '../constants.js'

/**
 * Render Hook
 * @deprecated FoundryVTT v12
 * @param {Application} application
 * @param {jQuery} html
 * @param {object} data
 */
export default function (application, html, data) {
  if (game.settings.get(FOLDER_ID, 'showWorldEra')) {
    $('<h4>').append('<div><i class="fa-regular fa-calendar"></i><div style="margin-left: 0.4rem;display: inline-block;">' + game.i18n.format(ERAS[game.settings.get(FOLDER_ID, 'worldEra')]?.name ?? 'CoC7.CoCIDFlag.error.unknown-era', { era: game.settings.get(FOLDER_ID, 'worldEra') }) + '</div></div>').insertAfter($('h3', html))
  }
}
