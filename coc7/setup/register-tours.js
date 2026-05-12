/* global game */
import { FOLDER_ID } from '../constants.js'
import CoC7EnableVariantRulesEn from '../tours/enable-variant-rules-en.js'
import CoC7EnableVariantRulesEs from '../tours/enable-variant-rules-es.js'
import CoC7EnableVariantRulesFr from '../tours/enable-variant-rules-fr.js'

export default function () {
  let lang = game.i18n.lang
  const tours = {
    en: {
      'enable-variant-rules': CoC7EnableVariantRulesEn
    },
    es: {
      'enable-variant-rules': CoC7EnableVariantRulesEs
    },
    fr: {
      'enable-variant-rules': CoC7EnableVariantRulesFr
    }
  }
  if (typeof tours[lang] === 'undefined') {
    lang = 'en'
  }
  for (const tourName in tours[lang]) {
    game.tours.register(FOLDER_ID, tourName, new tours[lang][tourName]())
  }
  if (lang !== 'en') {
    for (const tourName in tours.en) {
      if (typeof tours[lang][tourName] === 'undefined') {
        game.tours.register(FOLDER_ID, tourName, new tours.en[tourName]())
      }
    }
  }
}
