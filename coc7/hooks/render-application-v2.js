/**
 * Render Hook
 * @param {ApplicationV2} application
 * @param {HTMLElement} element
 * @param {ApplicationRenderContext} context
 * @param {ApplicationRenderOptions} options
 */
export default function (application, element, context, options) {
  if (application instanceof CONFIG.JournalEntry.sheetClasses.base['core.JournalEntrySheet'].cls) {
    // Prevent calling this twice on journals
    return
  }
  element.querySelectorAll('section.tmi-toggleable p.toggle').forEach((element) => element.addEventListener('click', (event) => {
    /* // jQuery */
    const section = $(element.closest('section.tmi-toggleable').querySelector('div.toggle'))
    if (section.is(':visible')) {
      element.innerText = element.dataset.oldText ?? 'Reveal'
      section.slideUp()
    } else {
      element.dataset.oldText = element.innerText
      element.innerText = 'Hide'
      section.slideDown()
    }
  }))
}
