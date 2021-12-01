import { EnhancedChatCard } from "../../common/chatcardlib/src/chatcardlib";

export class ChaseObstacleCard extends EnhancedChatCard {

    static get defaultOptions () {
        return mergeObject(super.defaultOptions, {
          template: 'systems/CoC7/templates/chat/cards/test.html'
        })
      }
}
