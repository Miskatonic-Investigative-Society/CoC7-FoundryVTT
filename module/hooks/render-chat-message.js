/* global $ */
import { CoC7Chat } from '../chat.js'
import { CoC7GroupMessage } from '../apps/coc7-group-message.js'

export default function (app, html, data) {
  CoC7Chat.renderMessageHook(app, html, data)
  CoC7Chat.renderChatMessageHook(app, html, data)
  if (typeof app.flags?.CoC7?.['group-message'] !== 'undefined') {
    CoC7GroupMessage.renderChatMessage(app, html, data)
  }
  html.find('div.coc7-chat-toggler').click(function () {
    $(this).next('div.coc7-chat-toggled').slideToggle(200)
  })
}
