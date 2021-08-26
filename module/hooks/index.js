/* global game, Hooks */

import * as Init from './init.js'
import * as Ready from './ready.js'
import * as RenderChatMessage from './render-chat-message.js'
import * as RenderDialog from './render-dialog.js'

export const CoC7Hooks = {
  listen () {
    Init.listen()
    Ready.listen()
    RenderChatMessage.listen()
    RenderDialog.listen()
  }
}
