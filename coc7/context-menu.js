/* global $,game */
export class CoC7ContextMenu {
  bind (menu, html, callback) {
    this._callback = callback
    this._html = html
    this._menu = menu
    try {
      const menuTrigger = html.find(`[data-context-menu=${menu.id}]`) // Find all menu triggers.
      if (menuTrigger.length === 0) return // If there is no trigger, do not continue.
      menuTrigger.contextmenu(this._onContextMenu.bind(this)) // Attach the handler.
      const menuElement = CoC7ContextMenu.CreateMenu(menu) // Build the menu
      menuElement.on('click',
        '.menu-action',
        this._onMenuAction.bind(this))
      // const documentMenu = this.menuContainer.find(`.context-menu-wrapper.${menu.id}`)
      if (this.menu.length !== 0) this.menu.replaceWith(menuElement)
      else this.menuContainer.append(menuElement)
    } catch (error) {
      console.error(error)
    }
  }

  get menuContainer () {
    let menuContainer = this._html.find('.menu-container')
    if (menuContainer.length === 0) {
      this._html.append('<div class="menu-container"></div>')
      menuContainer = this._html.find('.menu-container')
    }
    return menuContainer
  }

  get menu () {
    // const menuContainer = this.menuContainer
    // if (!menuContainer || menuContainer.length === 0) return null
    return this.menuContainer.find(`.context-menu-wrapper.${this._menu.id}`)
  }

  _onMenuAction (event) {
    // const target = event.currentTarget
    // if (target.classList.contains('branch')) return
    return this._callback(event, this.target)
  }

  static closeAll () {
    const menuContainers = $('body').find('.menu-container')
    const menus = menuContainers.find('.context-menu-wrapper')
    menus.each(function (i, m) { m.style.visibility = 'hidden' })
    // body.find('.menu-wrapper').hide()
  }

  _onContextMenu (event) {
    event.preventDefault(true)
    CoC7ContextMenu.closeAll() // Only 1 menu can be open.
    const target = event?.currentTarget
    this.target = target
    if (!target) return
    const menuName = target.dataset?.contextMenu
    if (menuName === this._menu.id) {
      const wrapper = this.menu
      if (wrapper.length > 0) {
        const subMenu = wrapper.find('.sub-menu')
        let left = event.clientX
        let top = event.clientY
        const menuHeight = wrapper.outerHeight()
        const menuWidth = wrapper.outerWidth()
        if (window.innerHeight < menuHeight + top) {
          top = top - menuHeight
        }
        if (window.innerWidth < menuWidth + left) {
          left = window.innerWidth - menuWidth
        }
        if (subMenu.length > 0) {
          if (window.innerWidth < menuWidth + left + subMenu.outerWidth()) {
            subMenu.css({
              right: `${menuWidth - 5}px`,
              left: ''
            })
          } else {
            subMenu.css({
              left: `${menuWidth - 5}px`,
              right: ''
            })
          }
        }
        wrapper.css({
          left: `${left}px`,
          top: `${top}px`,
          visibility: 'visible'
        })
      }
    }
  }

  static canSee (visibility) {
    switch (visibility.toLowerCase()) {
      case 'gm':
        return game.user.isGM
      case 'trusted':
        return game.user.isTrusted
      default:
        return true
    }
  }

  static CreateMenu (menu) {
    const classes = typeof menu.classes === 'string' ? [menu.classes] : menu.classes
    classes.push('context-menu-wrapper')
    const wrapper = $('<div></div>')
    wrapper.addClass(menu.id)
    classes.forEach(c => wrapper.addClass(c))
    if (menu.section) {
      menu.section.forEach(s => {
        const section = CoC7ContextMenu.CreateSection(s, { multi: true })
        if (section) wrapper.append(section)
      })
    } else {
      const section = CoC7ContextMenu.CreateSection(menu)
      if (section) wrapper.append(section)
    }
    return wrapper
  }

  static CreateSection (s, { multi = false, subMenu = false } = {}) {
    if (!s.items) return null
    if (s.visibility && !CoC7ContextMenu.canSee(s.visibility)) return null
    const classes = s.classes ? typeof s.classes === 'string' ? [s.classes] : s.classes : []
    if (multi) classes.push('menu-section')
    if (subMenu) classes.push('sub-menu')
    const section = $('<ul></ul>')
    classes.forEach(c => section.addClass(c))
    s.items.forEach(i => {
      const li = $('<li></li>')
      li.addClass('menu-item')
      if (i.action) {
        li.addClass('menu-action')
        li.attr('data-action', i.action)
      }
      if (typeof i.label === 'string') li.append(`<span>${i.label}</span>`)
      else {
        if (i.label.icon) li.append(`<i class="${i.label.icon}"></i>`)
        if (i.label.text) li.append(`<span>${i.label.text}</span>`)
      }
      if (i.subMenu) {
        li.addClass('sub-menu-button')
        li.append('<i class="fas fa-caret-right"></i>')
        const sub = CoC7ContextMenu.CreateSection(i.subMenu, { subMenu: true })
        if (sub) li.append(sub)
      }
      section.append(li)
    })
    return section
  }
}
