/* global foundry game ItemDirectory */
export default function (directory) {
  /* // FoundryVTT V12 */
  if (directory instanceof (foundry.applications.sidebar?.tabs.ItemDirectory ?? ItemDirectory)) {
    const item = game.items.find(i => i.name === '__CoC7InternalItem__')
    if (item) {
      let itemElement = false
      try {
        itemElement = directory.element.querySelector(`[data-entry-id='${item.id}']`)
      } catch (e) {
        /* // FoundryVTT v12 */
        itemElement = directory.element[0].querySelector(`[data-document-id='${item.id}']`)
      }

      if (itemElement) itemElement.style.display = 'none'
    }
  }
}
