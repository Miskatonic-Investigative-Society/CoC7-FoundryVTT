/* global Hooks */
import { CoC7Chat } from '../chat.js'
import { CoC7Link } from '../apps/coc7-link.js'
import { CoC7Parser } from '../apps/coc7-parser.js'

export function listen () {
  Hooks.on('renderChatMessage', (app, html, data) => {
    CoC7Chat.renderMessageHook(app, html, data)
    CoC7Chat.renderChatMessageHook(app, html, data)
    CoC7Parser.ParseMessage(app, html, data)
    CoC7Link.bindEventsHandler(html)
  })
}
