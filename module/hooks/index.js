/* global game, Hooks */

import * as Ready from './ready.js'
import * as RenderChatMessage from './render-chat-message.js'
import * as RenderDialog from './render-dialog.js'

export const CoC7Hooks = {
  listen () {
    Ready.listen()
    RenderChatMessage.listen()
    RenderDialog.listen()
  }
}
