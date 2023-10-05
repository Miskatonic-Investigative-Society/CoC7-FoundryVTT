/* global ChatMessage, game, $ */
export class CoCChatMessage extends ChatMessage {
  /** @inheritdoc */
  async getHTML (...args) {
    const html = await super.getHTML(...args)

    // Localization of titles.
    html.find('[title]').each((i, el) => {
      if (el.title) el.title = game.i18n.localize(el.title)
      // This will transform all titles in tolltips
      // if (!(el.dataset?.description)) {
      //   $(el).tooltipster({
      //     contentAsHTML: true,
      //     content: game.i18n.localize(el.title),
      //     theme: 'coc7-tooltip',
      //     maxWidth: 300
      //   })
      // }
    })

    // Render tooltips in chat messages.
    html.find('.tooltipster-active').each((i, el) => {
      if (el.dataset?.description) {
        $(el).tooltipster({
          contentAsHTML: false,
          content: game.i18n.localize(el.dataset.description),
          animation: 'fall',
          theme: 'coc7-tooltip',
          maxWidth: 300
          // plugins: ['follower'],
          // autoClose: false,
          // trigger: 'click'
        })
      }
    })

    return html
  }
}
