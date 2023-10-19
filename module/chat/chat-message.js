/* global ChatMessage, game, $, fromUuid */
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
    html.find('.tooltipster-active').each(async (i, el) => {
      if (el.dataset?.description) {
        $(el).tooltipster({
          trigger: 'hover',
          delay: [2000, 250],
          contentAsHTML: false,
          content: game.i18n.localize(el.dataset.description),
          animation: 'fall',
          theme: 'coc7-tooltip',
          maxWidth: 300,
          autoClose: true
          // plugins: ['follower'],
          // autoClose: false,
          // trigger: 'click'
        })
      } else if (el.dataset.documentKey) {
        if (el.classList.contains('tooltipster-dynamic')) {
          $(el).tooltipster({
            trigger: 'hover',
            delay: [2000, 250],
            contentAsHTML: false,
            content: 'Dynamic content',
            animation: 'fall',
            updateAnimation: 'fall',
            theme: 'coc7-tooltip',
            maxWidth: 300,
            autoClose: true,
            functionBefore: CoCChatMessage.getDynamicInformation
          })
        } else {
          const document = await fromUuid(el.dataset.documentKey)
          const descrition = await document.getHtmlTooltip()
          $(el).tooltipster({
            trigger: 'hover',
            delay: [2000, 250],
            contentAsHTML: true,
            content: descrition,
            animation: 'fall',
            theme: 'coc7-tooltip',
            maxWidth: 300,
            autoClose: true
          })
        }
      }
    })

    return html
  }

  static async getDynamicInformation (toolTip, helper) {
    const docUuid = helper.origin.dataset.documentKey
    const document = await fromUuid(docUuid)
    const description = await document.getHtmlTooltip()
    toolTip.content(description)
  }
}
