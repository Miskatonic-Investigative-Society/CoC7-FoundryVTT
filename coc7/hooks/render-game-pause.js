/* global foundry game */
import { FOLDER_ID } from '../constants.js'

/**
 * Render Hook
 * @param {ApplicationV2} application
 * @param {HTMLElement} element
 * @param {ApplicationRenderContext} context
 * @param {ApplicationRenderOptions} options
 */
export default function (application, element, context, options) {
  let imageReplacement = 'systems/' + FOLDER_ID + '/assets/images/timetrap2.webp'
  let textReplacement = game.i18n.localize('CoC7.PauseName')
  if (game.settings.get(FOLDER_ID, 'overrideGameArtwork')) {
    if (game.settings.get(FOLDER_ID, 'artPauseImage').toLowerCase() === 'null') {
      imageReplacement = ''
    } else if (game.settings.get(FOLDER_ID, 'artPauseImage') !== '') {
      imageReplacement = game.settings.get(FOLDER_ID, 'artPauseImage')
    }
    if (game.settings.get(FOLDER_ID, 'artPauseText') !== '') {
      textReplacement = game.settings.get(FOLDER_ID, 'artPauseText')
    }
  }
  if (imageReplacement === '') {
    element.querySelector('img').remove()
  } else {
    element.querySelector('img').setAttribute('src', imageReplacement)
  }
  element.querySelector('figcaption').innerHTML = foundry.utils.cleanHTML(textReplacement)
}
