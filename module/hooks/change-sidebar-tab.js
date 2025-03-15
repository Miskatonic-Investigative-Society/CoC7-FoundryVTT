/* global game ItemDirectory */
export default function (directory) {
  if (directory instanceof ItemDirectory) {
    const item = game.items.find(i => i.name === '__CoC7InternalItem__')
    if (item) {
      const html = directory._element
      const itemElement = html.find(`[data-document-id='${item.id}']`)
      if (itemElement) itemElement[0].style.display = 'none'
    }
  }
}
