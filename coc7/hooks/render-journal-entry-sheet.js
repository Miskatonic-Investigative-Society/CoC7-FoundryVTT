import { FOLDER_ID } from '../constants.js'
import CoCIDEditor from '../apps/coc-id-editor.js'

/**
 * Render Hook
 * @param {ApplicationV2} application
 * @param {HTMLElement} element
 * @param {ApplicationRenderContext} context
 * @param {ApplicationRenderOptions} options
 */
export default function (application, element, context, options) {
  CoCIDEditor.addCoCIDSheetHeaderButton(application, element)

  if ((application.document.getFlag(FOLDER_ID, 'css-adventure-entry') ?? false)) {
    if (!element.classList.contains('coc7-adventure-entry')) {
      element.classList.add('coc7-adventure-entry')
    }
    if ((application.document.getFlag(FOLDER_ID, 'fixed-adventure-heading') ?? false) && !element.classList.contains('fixed-adventure-heading')) {
      element.classList.add('fixed-adventure-heading')
      if (typeof application.document.pages?.contents?.[0]?.id === 'string') {
        const subheading = application.document.pages.get(application.document.pages.contents[0].id)?.flags?.[FOLDER_ID]?.['fixed-adventure-subheading'] ?? ''
        if (subheading !== '') {
          element.classList.add('fixed-adventure-subheading')
          const short = subheading.trim().length === 0
          const div = document.createElement('div')
          div.classList.add('adventure-heading-section', 'flexrow')
          div.innerHTML = '<div class="bookmark' + (short ? ' short' : '') + '"><img src="systems/' + FOLDER_ID + '/assets/art/' + (short ? 'bookmarks.webp' : 'bookmark.webp') + '"></div><div class="adventure-heading"><div class="heading">' + application.title + '</div>' + (short ? '' : '<div class="subheading">' + subheading + '</div>') + '</div>'
          element.querySelector('article.journal-entry-page')?.before(div)
        }
      }
    }
  }
}
