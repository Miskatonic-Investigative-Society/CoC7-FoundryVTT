/* global $ */
import { FOLDER_ID } from '../constants.js'

/**
 * Render Hook
 * @deprecated FoundryVTT v12
 * @param {Application} application
 * @param {jQuery} html
 * @param {object} data
 */
export default function (application, html, data) {
  if ((application.object.parent.getFlag(FOLDER_ID, 'css-adventure-entry') ?? false)) {
    if (!html.hasClass('coc7-adventure-entry')) {
      html.addClass('coc7-adventure-entry')
      html.find('section.tmi-toggleable p.toggle').click((event) => {
        const obj = $(event.currentTarget)
        const section = obj.closest('section.tmi-toggleable').find('div.toggle:first')
        if (section.is(':visible')) {
          obj.text('Reveal')
          section.slideUp()
        } else {
          obj.text('Hide')
          section.slideDown()
        }
      })
    }
  }
}
