/* global ui */
export class CoC7ContextMenu {
  static bindTo (html) {
    html.on('contextmenu',
      '[data-menu]',
      this._onContextMenu.bind(this)
    )
  }

  static async _onContextMenu (event) {
    event.preventDefault(true)
    const target = event?.currentTarget
    if (!target) return
    const menuName = target.dataset?.menu
    if (menuName) {
      const wrapper = target.closest('.menu-wrapper')
      if (wrapper) {
        const menu = wrapper.querySelector(`.${menuName}-menu`)
        ui.notifications.info('Menu found: ' + menu)
      }
    }
  }
}
