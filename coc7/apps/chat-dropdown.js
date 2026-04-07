/* global foundry game renderTemplate */
import { FOLDER_ID } from '../constants.js'

export default class CoC7ChatDropdown {
  /**
   * Make a chat dropdown
   * @param {object} options
   * @param {Document} options.message
   * @param {Array} options.buttons
   * @param {HTMLElement} options.target
   * @param {Function} options.callback
   */
  static async makeDropdown ({ message, buttons, target, callback } = {}) {
    if (!message.id || !buttons || !target || !callback) {
      throw new Error('Invalid dropdown configuration.')
    }
    if (!Array.isArray(buttons) || buttons.length === 0) {
      throw new Error('Invalid dropdown buttons.')
    }
    const elementId = 'dropdown-' + message.id
    if (document.getElementById(elementId)) {
      return
    }
    const data = {
      buttons
    }
    // /* // FoundryV12 */
    const html = await (foundry.applications.handlebars?.renderTemplate ?? renderTemplate)('systems/' + FOLDER_ID + '/templates/chat/parts/dropdown.hbs', data)
    const element = document.createElement('div')
    element.innerHTML = html
    if (element.children.length !== 1) {
      throw new Error('Dropdown must render a single HTML element.')
    }
    const dropdown = element.children[0]
    dropdown.id = elementId
    let container
    // /* // FoundryV12 */
    if (!foundry.utils.isNewerVersion(game.version, 13)) {
      container = target.closest('.chat-sidebar')
    } else {
      container = target.closest('.chat-scroll')
      const ol = container.querySelector('.chat-log')
      if (ol.classList.contains('themed')) {
        dropdown.classList.add('themed')
      }
      if (ol.classList.contains('theme-light')) {
        dropdown.classList.add('theme-light')
      }
      if (ol.classList.contains('theme-dark')) {
        dropdown.classList.add('theme-dark')
      }
    }
    container.append(dropdown)
    dropdown.style.width = (target.closest('.coc7-card-buttons').offsetWidth) + 'px'
    dropdown.style.top = (target.offsetTop - dropdown.offsetHeight) + 'px'
    let onButton = true
    let onDropdown = false
    target.addEventListener('mouseleave', (event) => {
      onButton = false
      setTimeout(() => {
        if (!onButton && !onDropdown) {
          dropdown.remove()
        }
      }, 50)
    })
    target.addEventListener('mouseenter', (e) => {
      onButton = true
    })
    dropdown.addEventListener('mouseleave', (event) => {
      onDropdown = false
      setTimeout(() => {
        if (!onButton && !onDropdown) {
          dropdown.remove()
        }
      }, 50)
    })
    dropdown.addEventListener('mouseenter', (e) => {
      onDropdown = true
    })
    dropdown.querySelectorAll('[data-action]').forEach((element) => {
      element.addEventListener('click', event => callback(event, message))
    })
    target.blur()
    dropdown.focus()
  }
}
