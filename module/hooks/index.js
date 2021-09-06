import * as Init from './init.js'
import * as Ready from './ready.js'
import * as RenderActorSheet from './render-actor-sheet.js'
import * as RenderChatMessage from './render-chat-message.js'
import * as RenderDialog from './render-dialog.js'
import * as RenderItemSheet from './render-item-sheet.js'

export const CoC7Hooks = {
  listen () {
    Init.listen()
    Ready.listen()
    RenderActorSheet.listen()
    RenderChatMessage.listen()
    RenderDialog.listen()
    RenderItemSheet.listen()
  }
}
