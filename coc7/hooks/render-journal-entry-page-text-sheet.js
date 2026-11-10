/**
 * Render Hook
 * @param {ApplicationV2} application
 * @param {HTMLElement} element
 * @param {ApplicationRenderContext} context
 * @param {ApplicationRenderOptions} options
 */
export default function (application, element, context, options) {
  element.querySelectorAll('.actor-embed-name-link').forEach((element) => element.addEventListener('click', async (event) => {
    event.preventDefault()
    const uuid = event.currentTarget.dataset.uuid
    if (uuid) {
      const doc = await fromUuid(uuid)
      if (doc && doc.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED)) {
        doc.sheet.render({ force: true })
      }
    }
  }))
}
