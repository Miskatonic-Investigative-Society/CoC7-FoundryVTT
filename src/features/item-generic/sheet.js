/* global foundry */
import { CoC7ItemSheetV2 } from './sheet-v2.js'

/**
 * Extend the basic ItemSheet with some very simple modifications
 */
export class CoC7ItemSheet extends CoC7ItemSheetV2 {
  /**
   * Extend and override the default options used by the Simple Item Sheet
   * @returns {Object}
   */
  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 525,
      height: 506
    })
  }
}
