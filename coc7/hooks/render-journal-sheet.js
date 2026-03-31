import { FOLDER_ID } from '../constants.js'

/**
 * Render Hook
 * @deprecated FoundryVTT v12
 * @param {Application} application
 * @param {jQuery} html
 * @param {object} data
 */
export default function (application, html, data) {
  if ((application.document.getFlag(FOLDER_ID, 'css-adventure-entry') ?? false)) {
    if (!html.hasClass('coc7-adventure-entry')) {
      html.addClass('coc7-adventure-entry')
    }
    if ((application.document.getFlag(FOLDER_ID, 'fixed-adventure-heading') ?? false) && !html.hasClass('fixed-adventure-heading')) {
      html.addClass('fixed-adventure-heading')
      const subheading = data.pages?.[0]?.flags?.[FOLDER_ID]?.['fixed-adventure-subheading'] ?? ''
      if (subheading !== '') {
        html.addClass('fixed-adventure-subheading')
        const short = subheading.trim().length === 0
        html.find('article.journal-entry-page')?.before('<div class="adventure-heading-section flexrow"><div class="bookmark' + (short ? ' short' : '') + '"><img src="systems/' + FOLDER_ID + '/assets/art/' + (short ? 'bookmarks.webp' : 'bookmark.webp') + '"></div><div class="adventure-heading"><div class="heading">' + data.title + '</div>' + (short ? '' : '<div class="subheading">' + subheading + '</div>') + '</div></div>')
      }
    }
  }
}
