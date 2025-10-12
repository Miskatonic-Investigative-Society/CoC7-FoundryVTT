/* global Actor game */
/**
 * Render Hook
 * @param {ApplicationV2} application
 * @param {HTMLElement} element
 * @param {ApplicationRenderContext} context
 * @param {ApplicationRenderOptions} options
 */
export default function (application, element, context, options) {
  /* // FoundryVTT V12 */
  context = context ?? {}
  options = options ?? {}

  const title = game.i18n.format('DOCUMENT.Create', { type: game.i18n.localize(Actor.metadata.label) })
  if (title === options.window?.title && element.querySelector('input[name="name"]')) {
    const showExperimental = game.settings.get('CoC7', 'experimentalFeatures')
    if (!showExperimental) {
      element.querySelector('select[name="type"]')?.querySelector('option[value="vehicle"]')?.remove()
    }
  }
}
