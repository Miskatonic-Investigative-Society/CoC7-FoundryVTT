/* global mergeObject */
import { CoC7CharacterSheetV2 } from './character.js'

export class CoC7CharacterSheet extends CoC7CharacterSheetV2 {
  /**
   * Extend and override the default options used by the 5e Actor Sheet
   * @returns {Object}
   */
  static get defaultOptions () {
    return mergeObject(super.defaultOptions, {
      classes: ['coc7', 'sheet', 'actor', 'character'],
      template: 'systems/CoC7/templates/actors/character-sheet.html',
      width: 672,
      height: 765
    })
  }
}
