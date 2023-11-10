import * as Init from './init.js'
import * as DiceSoNiceReady from './dice-so-nice-ready.js'
import * as DiceSoNiceRollStart from './dice-so-nice-roll-start.js'
import * as Ready from './ready.js'
import * as RenderActorSheet from './render-actor-sheet.js'
import * as RenderChatMessage from './render-chat-message.js'
import * as RenderDialog from './render-dialog.js'
import * as RenderItemSheet from './render-item-sheet.js'
import * as RenderPause from './render-pause.js'
import * as RenderPlayerList from './render-player-list.js'
import * as RenderSettingsConfig from './render-settings-config.js'
import * as TokenCreation from './token-creation.js'

export const CoC7Hooks = {
  listen () {
    Init.listen()
    Ready.listen()
    RenderActorSheet.listen()
    RenderChatMessage.listen()
    RenderDialog.listen()
    RenderItemSheet.listen()
    RenderPause.listen()
    DiceSoNiceReady.listen()
    DiceSoNiceRollStart.listen()
    RenderPlayerList.listen()
    RenderSettingsConfig.listen()
    TokenCreation.listen()
  }
}
