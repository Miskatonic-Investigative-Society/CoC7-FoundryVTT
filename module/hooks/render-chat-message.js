/* global Hooks */
import { CoC7Chat } from '../chat.js'
import { CoC7GroupMessage } from '../apps/coc7-group-message.js'

export function listen () {
  Hooks.on('renderChatMessage', (app, html, data) => {
    CoC7Chat.renderMessageHook(app, html, data)
    CoC7Chat.renderChatMessageHook(app, html, data)
    if (typeof app.flags?.CoC7?.['group-message'] !== 'undefined') {
      CoC7GroupMessage.renderChatMessage(app, html, data)
    }
  })
}
