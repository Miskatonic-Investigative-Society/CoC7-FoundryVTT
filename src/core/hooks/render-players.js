/* global game */
import { COC7 } from '../config.js'

export default function (playerList, html, data) {
  if (game.settings.get('CoC7', 'showWorldEra')) {
    const div = document.createElement('div')
    div.classList.add('world-era', 'flexrow')
    div.innerHTML = '<i class="fa-regular fa-calendar"></i>' + '<div>' + game.i18n.format(COC7.eras[game.settings.get('CoC7', 'worldEra')] ?? 'CoC7.CoCIDFlag.error.unknown-era', { era: game.settings.get('CoC7', 'worldEra') }) + '</div>'
    html.querySelector('#performance-stats').after(div)
  }
}
