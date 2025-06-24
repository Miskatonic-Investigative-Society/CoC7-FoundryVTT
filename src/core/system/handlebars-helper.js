/* global game, Handlebars */
import { chatHelper } from '../../shared/dice/helper.js'
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
  Handlebars.registerHelper('calcHard', function (value) {
    if (value.toString().match(/^\d+$/)) {
      return Math.floor(value / 2)
    }
    return 0
  })
  Handlebars.registerHelper('calcExtreme', function (value) {
    if (value.toString().match(/^\d+$/)) {
      return Math.floor(value / 5)
    }
    return 0
  })
  Handlebars.registerHelper('selectValue', function (choices, selected, valueAttr, labelAttr) {
    if (typeof choices !== 'undefined' && typeof choices.find === 'function') {
      const found = choices.find(o => o[valueAttr] === selected && typeof o[labelAttr] !== 'undefined')
      if (found) {
        return found[labelAttr]
      }
    }
    return ''
  })
}
