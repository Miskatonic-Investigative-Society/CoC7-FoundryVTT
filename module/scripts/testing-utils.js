/* global game, CONFIG */
import { SkillNameParts } from '../items/skill/utils/skill-name-parts.js'

// Make the following classes accessible for Quench testing module
export function registerTestingUtils () {
  CONFIG.testingUtils = {
    i18n: game.i18n,
    Item: {
      SkillNameParts
    }
  }
}
