/* global game, Handlebars */
import { chatHelper } from '../chat/helper.js'
import { CoC7Check } from '../check.js'

export const handlebarsHelper = function () {
  Handlebars.registerHelper('rollActorImg', function (actorKey) {
    const img = chatHelper.getActorImgFromKey(actorKey)
    if (img) return img
    return '../icons/svg/mystery-man-black.svg'
  })
  Handlebars.registerHelper('localizeRollName', function (options) {
    const difficulty = options.hash.difficulty === CoC7Check.difficultyLevel.regular ? false : CoC7Check.difficultyString(options.hash.difficulty)
    const modifier = (options.hash.modifier > 0 ? `+${options.hash.modifier}` : options.hash.modifier < 0 ? options.hash.modifier.toString() : false)
    return game.i18n.format('CoC7.LinkCheck' + (!difficulty ? '' : 'Diff') + (!modifier ? '' : 'Modif') + (!options.hash.pushing ? '' : 'Pushing'), { difficulty, modifier, name: options.hash.name })
  })
}
