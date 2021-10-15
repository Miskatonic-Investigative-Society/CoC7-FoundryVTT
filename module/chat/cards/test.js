import { EnhancedChatCard } from "../../../lib/chatcardlib/src/chatcardlib.js";

export class testCard extends EnhancedChatCard{
      /**
   * Extend and override the default options
   * @returns {Object}
   */
  static get defaultOptions () {
    return mergeObject(super.defaultOptions, {
      template: 'systems/CoC7/templates/chat/cards/test.html'
    })
  }
}