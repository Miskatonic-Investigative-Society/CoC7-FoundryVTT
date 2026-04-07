/* global $ */
import { FOLDER_ID } from '../constants.js'

/**
 * Render Hook
 * @param {ApplicationV2} application
 * @param {HTMLElement} element
 * @param {ApplicationRenderContext} context
 * @param {ApplicationRenderOptions} options
 */
export default function (application, element, context, options) {
  if ((application.document.parent.getFlag(FOLDER_ID, 'css-adventure-entry') ?? false)) {
    if (!element.classList.contains('coc7-adventure-entry')) {
      element.classList.add('coc7-adventure-entry')
    }
    element.querySelectorAll('section.tmi-toggleable p.toggle').forEach((element) => element.addEventListener('click', (event) => {
      /* // jQuery */
      const section = $(element.closest('section.tmi-toggleable').querySelector('div.toggle'))
      if (section.is(':visible')) {
        element.innerText = 'Reveal'
        section.slideUp()
      } else {
        element.innerText = 'Hide'
        section.slideDown()
      }
    }))
  }
}
