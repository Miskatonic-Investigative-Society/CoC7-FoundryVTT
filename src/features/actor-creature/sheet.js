/* global foundry */
import { CoC7NPCSheet } from '../actor-npc/sheet.js'

/**
 * Extend the basic ActorSheet with some very simple modifications
 */
export class CoC7CreatureSheet extends CoC7NPCSheet {
  /**
   * Prepare data for rendering the Actor sheet
   * The prepared data object contains both the actor data as well as additional sheet options
   */
  async getData () {
    const sheetData = await super.getData()
    sheetData.isCreature = true
    return sheetData
  }

  /**
   * Extend and override the default options used by the Actor Sheet
   * @returns {Object}
   */
  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['coc7', 'sheet', 'actor', 'npc', 'creature']
    })
  }
}
