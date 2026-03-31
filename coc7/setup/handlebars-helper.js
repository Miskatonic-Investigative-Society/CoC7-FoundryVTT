/* global Handlebars */
export default function () {
  Handlebars.registerHelper('calcHard', function (value) {
    if (typeof value !== 'object' && value.toString().match(/^\d+$/)) {
      return Math.floor(value / 2)
    }
    return 0
  })
  Handlebars.registerHelper('calcExtreme', function (value) {
    if (typeof value !== 'object' && value.toString().match(/^\d+$/)) {
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
  Handlebars.registerHelper('percentValue', function (numerator, denominator, options) {
    if (denominator === 0) {
      return '?'
    }
    return (100 * numerator / denominator).toFixed(options.hash?.dp ?? 0)
  })
  Handlebars.registerHelper('contains', function (needle, haystack) {
    return haystack.includes(needle)
  })
}
