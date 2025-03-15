import * as CreateToken from './create-token.js'
import * as DiceSoNiceReady from './dice-so-nice-ready.js'
import * as RenderActorSheet from './render-actor-sheet.js'
import * as RenderChatMessage from './render-chat-message.js'
import * as RenderDialog from './render-dialog.js'
import * as RenderItemSheet from './render-item-sheet.js'
import * as RenderPause from './render-pause.js'
import * as RenderPlayerList from './render-player-list.js'
import * as RenderRealRoll from './render-real-roll.js'

export const CoC7Hooks = {
  listen () {
    CreateToken.listen()
    DiceSoNiceReady.listen()
    RenderActorSheet.listen()
    RenderChatMessage.listen()
    RenderDialog.listen()
    RenderItemSheet.listen()
    RenderPause.listen()
    RenderPlayerList.listen()
    RenderRealRoll.listen()
  }
}
