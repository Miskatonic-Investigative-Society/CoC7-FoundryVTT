import CoC7Combat from '../apps/combat.js'

/**
 * Render Hook
 * @param {ApplicationV2} application
 * @param {HTMLElement} element
 * @param {ApplicationRenderContext} context
 * @param {ApplicationRenderOptions} options
 */
export default function (application, element, context, options) {
  CoC7Combat.renderCombatTracker(application, element, context, options)
}
