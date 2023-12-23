/* global Hooks */
import { CoC7Chat } from '../chat.js'

export function listen () {
  Hooks.on('renderChatMessage', (app, html, data) => {
    CoC7Chat.renderMessageHook(app, html, data)
    CoC7Chat.renderChatMessageHook(app, html, data)
  })
}
