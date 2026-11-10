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

  let hasHeading = false
  if (typeof application.pageId === 'string') {
    const page = application.document.pages.get(application.pageId)
    let headingText = page?.flags?.[FOLDER_ID]?.['fixed-adventure-heading'] ?? ''
    const subheading = page?.flags?.[FOLDER_ID]?.['fixed-adventure-subheading'] ?? ''
    if (headingText !== '' || subheading !== '') {
      element.classList.add('fixed-adventure-subheading')
      const short = subheading.trim().length === 0
      if (headingText.trim().length === 0) {
        headingText = page.name
      }
      const div = document.createElement('div')
      div.classList.add('adventure-heading-section')
      const bookmark = document.createElement('div')
      bookmark.classList.add('bookmark')
      const img = document.createElement('img')
      img.src = 'systems/' + FOLDER_ID + '/assets/art/' + (short ? 'bookmarks.webp' : 'bookmark.webp')
      bookmark.append(img)
      const adventureHeading = document.createElement('div')
      adventureHeading.classList.add('adventure-heading')
      const heading = document.createElement('div')
      heading.classList.add('heading')
      heading.innerHTML = foundry.utils.cleanHTML(headingText)
      adventureHeading.append(heading)
      if (short) {
        bookmark.classList.add('short')
      } else {
        const sub = document.createElement('div')
        sub.classList.add('subheading')
        sub.innerHTML = foundry.utils.cleanHTML(subheading)
        adventureHeading.append(sub)
      }
      div.append(bookmark)
      div.append(adventureHeading)
      element.querySelector('header.journal-header')?.replaceChildren(div)
      hasHeading = true
    } else {
      element.classList.remove('fixed-adventure-subheading')
    }
  }
  if (!hasHeading && (application.document.getFlag(FOLDER_ID, 'fixed-adventure-heading') ?? false)) {
    element.classList.add('fixed-adventure-heading')
  } else {
    element.classList.remove('fixed-adventure-heading')
  }

  const journalCss = (application.document.getFlag(FOLDER_ID, 'journal-css') ?? '')
  if (journalCss !== '') {
    element.classList.add(journalCss)
    element.dataset.undoJournalCss = journalCss
  } else if (element.dataset.undoJournalCss) {
    element.classList.remove(element.dataset.undoJournalCss)
    delete element.dataset.undoJournalCss
  }
}
