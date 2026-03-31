import CoC7SceneControls from '../apps/scene-controls.js'

/**
 * Render Hook
 * @param {ApplicationV2} application
 * @param {HTMLElement} element
 * @param {ApplicationRenderContext} context
 * @param {ApplicationRenderOptions} options
 */
export default function (application, element, context, options) {
  /* // FoundryVTT V12 */
  if (typeof element.querySelector === 'function') {
    element.querySelector('button[data-tool="coc7dummy"]')?.closest('li').remove()
  }
  CoC7SceneControls.renderControls(application, element, context, options)
}
