import { CoC7Utilities } from "../utilities"

export class CoC7ChaseParticipantImporter extends Dialog{
    activateListeners (html) {
        super.activateListeners(html)
    }

    static async create (data) {
        let actor = null
        if( data.actorUuid){
            actor = await foundry.utils.fromUuid( data.actorUuid)
        }
    }
}