/* global Hooks */
import { CoC7Chat } from '../chat.js'
import { CoC7Parser } from '../apps/parser.js'

export function listen () {
  Hooks.on('renderChatMessage', (app, html, data) => {
    CoC7Chat.renderMessageHook(app, html, data)
    CoC7Chat.renderChatMessageHook(app, html, data)
    CoC7Parser.ParseMessage(app, html, data)
    html
      .find('a.coc7-link')
      .on('click', async event => await CoC7Parser._onCheck(event))
    html
      .find('a.coc7-link')
      .on('dragstart', event => CoC7Parser._onDragCoC7Link(event))
  })
}
