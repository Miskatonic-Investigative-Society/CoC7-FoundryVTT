/* global mergeObject */

import { CoC7ItemSheetV2 } from './item-sheetV2.js'

/**
 * Extend the basic ItemSheet with some very simple modifications
 */
export class CoC7ItemSheet extends CoC7ItemSheetV2 {
  /**
   * Extend and override the default options used by the Simple Item Sheet
   * @returns {Object}
   */
  static get defaultOptions () {
    return mergeObject(super.defaultOptions, {
      width: 520,
      height: 480
    })
  }
}
