/* global game */
import { FOLDER_ID } from '../constants.js'

/**
 * Render Hook
 * @deprecated FoundryVTT v12
 * @param {Application} application
 * @param {jQuery} html
 * @param {object} data
 */
export default function (application, html, data) {
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
    html.find('img').remove()
  } else {
    html.find('img').attr('src', imageReplacement)
  }
  html.find('figcaption').html(textReplacement)
}
