/* global game */
import { EnableVariantRulesEn } from '../../features/tours/enable-variant-rules-en.js'
import { EnableVariantRulesFr } from '../../features/tours/enable-variant-rules-fr.js'

export async function registerTours () {
  try {
    let lang = game.i18n.lang
    const tours = {
      en: {
        'enable-variant-rules': EnableVariantRulesEn
      },
      fr: {
        'enable-variant-rules': EnableVariantRulesFr
      }
    }
    if (typeof tours[lang] === 'undefined') {
      lang = 'en'
    }
    for (const tourName in tours[lang]) {
      game.tours.register('CoC7', tourName, new tours[lang][tourName]())
    }
  } catch (err) {
    console.error('TOUR ERROR', err)
  }
}
