/* global $, game, Hooks */
import { COC7 } from '../config.js'

export function listen () {
  Hooks.on('renderPlayerList', (playerList, html, data) => {
    $('<h4>').append('<div><i class="fa-regular fa-calendar"></i>' + game.i18n.format(COC7.eras[game.settings.get('CoC7', 'worldEra')] ?? 'CoC7.CoCIDFlag.error.unknown-era', { era: game.settings.get('CoC7', 'worldEra') }) + '</div>').insertAfter($('h3', html))
  })
}
