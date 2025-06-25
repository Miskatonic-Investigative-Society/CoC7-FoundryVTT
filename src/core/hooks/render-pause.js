/* global game */
export default function (data, html, options) {
  let imageReplaced = false
  let textReplaced = false
  if (game.settings.get('CoC7', 'overrideGameArtwork')) {
    if (game.settings.get('CoC7', 'artPauseImage').toLowerCase() === 'null') {
      html.find('img').remove()
    }
    if (game.settings.get('CoC7', 'artPauseImage') !== '') {
      html.find('img').attr('src', game.settings.get('CoC7', 'artPauseImage'))
      imageReplaced = true
    }

    if (game.settings.get('CoC7', 'artPauseText') !== '') {
      html.find('h3').html(game.settings.get('CoC7', 'artPauseText'))
      textReplaced = true
    }
  }
  if (!imageReplaced) {
    html.find('img').attr('src', 'systems/CoC7/assets/images/timetrap2.webp')
  }
  if (!textReplaced) {
    html.find('figcaption').html(game.i18n.localize('CoC7.PauseName'))
  }
}
