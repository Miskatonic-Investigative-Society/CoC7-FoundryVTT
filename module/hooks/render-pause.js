/* global game, Hooks */

export function listen () {
  Hooks.on('renderPause', async (data, html, options) => {
    if (game.settings.get('CoC7', 'overrideGameArtwork')) {
      if (game.settings.get('CoC7', 'artPauseImage').toLowerCase() === 'null') {
        html.find('img').remove()
      }
      if (game.settings.get('CoC7', 'artPauseImage') !== '') {
        html.find('img').attr('src', game.settings.get('CoC7', 'artPauseImage'))
      }

      if (game.settings.get('CoC7', 'artPauseText') !== '') {
        html.find('h3').html(game.settings.get('CoC7', 'artPauseText'))
      }
    }
  })
}
