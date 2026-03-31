/* global game */
import { FOLDER_ID } from '../../constants.js'
import CoC7ModelsActorCharacterSheetV2 from './character-sheet-v2.js'

export default class CoC7ModelsActorCharacterSheetSummarizedV2 extends CoC7ModelsActorCharacterSheetV2 {
  static DEFAULT_OPTIONS = {
    classes: ['npc', 'investigator-summarized'],
    position: {
      height: 220
    }
  }

  static PARTS = {
    body: {
      template: 'systems/' + FOLDER_ID + '/templates/actors/investigator-summarized-v2/body.hbs'
    }
  }

  /**
   * @inheritdoc
   * @param {RenderOptions} options
   * @returns {Promise<ApplicationRenderContext>}
   */
  async _prepareContext (options) {
    const context = await super._prepareContext(options)

    context.showIconsOnly = game.settings.get(FOLDER_ID, 'showIconsOnly')

    context.topSkills = [...context.skillsByValue].slice(0, 14)
    context.topWeapons = [...context.meleeWpn, ...context.rangeWpn]
      .sort((a, b) => {
        return a.system.skill.main?.value - b.system.skill.main?.value
      })
      .reverse()
      .slice(0, 3)

    return context
  }
}
