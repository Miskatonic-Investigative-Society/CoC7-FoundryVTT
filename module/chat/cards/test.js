export class testCard extends xxxx{
      /**
   * Extend and override the default options
   * @returns {Object}
   */
  static get defaultOptions () {
    return mergeObject(super.defaultOptions, {
      template: 'systems/CoC7/templates/chat/cards/test.html'
    })
  }

  activateListeners (html){
      super.activateListeners(html)
  }
}