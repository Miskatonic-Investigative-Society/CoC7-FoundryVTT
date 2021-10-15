Hooks.once('socketlib.ready', initECCSocket)

Hooks.on('renderChatMessage' , (app, html, data) => renderMessageHook)

function initECCSocket(){
    game.enhancedChatCardsSocket = socketlib.registerSystem(game.system.id)  //Socket is attached to current system

    return
}

async function renderMessageHook( app, html, data){
    //check for special tags (gm-only)
    const gmOnly = html.find('.ecc .gm-only')
    for (const zone of gmOnly) {
      if (!game.user.isGM) {
        zone.style.display = 'none'
      }
    }
    return
}


export class EnhancedChatCard {
    static get defaultOptions () {
        return {
          classes: ['enhanced-chat-card'],
          exclude: ['_actor', '_skill', '_item', '_message', '_htmlRoll'],
          excludeStartWith: '_'
        }
      }

      get data () {
        return JSON.parse(this.dataString)
      }
    
      get dataString () {
        return JSON.stringify(this, (key, value) => {
          if (value === null) return undefined
          if (this.options.exclude?.includes(key)) return undefined
          if (key.startsWith(this.options.excludeStartWith)) return undefined
          return value
        })
      }
}