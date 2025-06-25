/* global game */
export default function (data, html, options) {
  let imageReplaced = false
  let textReplaced = false
  if (game.settings.get('CoC7', 'overrideGameArtwork')) {
    if (game.settings.get('CoC7', 'artPauseImage').toLowerCase() === 'null') {
      html.querySelector('img').remove()
    }
    if (game.settings.get('CoC7', 'artPauseImage') !== '') {
      html.querySelector('img').setAttribute('src', game.settings.get('CoC7', 'artPauseImage'))
      imageReplaced = true
    }
    if (game.settings.get('CoC7', 'artPauseText') !== '') {
      html.querySelector('figcaption').innerHTML = game.settings.get('CoC7', 'artPauseText')
      textReplaced = true
    }
  }
  if (!imageReplaced) {
    html.querySelector('img').setAttribute('src', 'systems/CoC7/assets/images/timetrap2.webp')
  }
  if (!textReplaced) {
    html.querySelector('figcaption').innerHTML = game.i18n.localize('CoC7.PauseName')
  }
}
