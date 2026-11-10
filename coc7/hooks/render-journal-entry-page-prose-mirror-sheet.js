import { FOLDER_ID } from '../constants.js'

/**
 * Render Hook
 * @param {ApplicationV2} application
 * @param {HTMLElement} element
 * @param {ApplicationRenderContext} context
 * @param {ApplicationRenderOptions} options
 */
export default function (application, element, context, options) {
  if (application instanceof CONFIG.JournalEntryPage.sheetClasses.text['core.JournalEntryPageProseMirrorSheet'].cls) {
    if ((application.document.parent.getFlag(FOLDER_ID, 'journal-css') ?? '') !== '') {
      element.classList.add(application.document.parent.getFlag(FOLDER_ID, 'journal-css'))
    }
    switch (game.settings.get('core', 'sheetThemes').documents?.[application.document.parent.uuid]) {
      case 'dark':
        element.classList.add('themed', 'theme-dark')
        element.classList.remove('theme-light')
        break
      case 'light':
        element.classList.add('themed', 'theme-light')
        element.classList.remove('theme-dark')
        break
    }
  }
}
