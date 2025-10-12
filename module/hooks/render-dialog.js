/* global Actor game */

/**
 * Render Hook
 * @deprecated FoundryVTT v12
 * @param {Application} application
 * @param {jQuery} html
 * @param {object} data
 */
export default function (application, html, data) {
  const form = html.find('form')
  if (form.is('#document-create') && form.find('input[name="name"]') && form.find('select').length !== 0) {
    const title = game.i18n.format('DOCUMENT.Create', { type: game.i18n.localize(Actor.metadata.label) })
    if (title === application.title) {
      const showExperimental = game.settings.get('CoC7', 'experimentalFeatures')
      if (!showExperimental) {
        form.find('select[name="type"] option[value="vehicle"]').remove()
      }
    }
  }
}
