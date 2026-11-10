import CoC7ContentLinkDialog from '../apps/content-link-dialog.js'
import CoC7Utilities from '../apps/utilities.js'

/**
 * Render Hook
 * @param {ApplicationV2} application
 * @param {HTMLElement} element
 * @param {ApplicationRenderContext} context
 * @param {ApplicationRenderOptions} options
 */
export default function (application, element, context, options) {
  /* // FoundryVTT V13 */
  element.querySelector('button[data-tool="coc7dummy"]')?.closest('li').remove()

  const keeperMenu = element.querySelector('.game-icon-tentacle-strike')?.parentNode
  if (keeperMenu && !keeperMenu.classList.contains('coc7-menu')) {
    keeperMenu.classList.add('coc7-menu')
    if (game.user.isGM) {
      const menuLi = document.createElement('li')
      const menuButton = document.createElement('button')
      menuButton.classList.add('control', 'ui-control', 'tool', 'icon', 'coc7-menu', 'coc7-create-link', 'fa-solid', 'fa-link')
      menuButton.type = 'button'
      menuButton.dataset.tooltip = 'CoC7.CreateLink'
      menuLi.appendChild(menuButton)
      keeperMenu.insertAdjacentHTML('afterend', menuLi.outerHTML)
      element.querySelector('button.coc7-create-link').addEventListener('click', event => CoC7ContentLinkDialog.create())
    }
    {
      const menuLi = document.createElement('li')
      const menuButton = document.createElement('button')
      menuButton.classList.add('control', 'ui-control', 'tool', 'icon', 'coc7-menu', 'coc7-dice-roll', 'game-icon', 'game-icon-d10')
      menuButton.type = 'button'
      menuButton.dataset.tooltip = 'CoC7.RollDice'
      menuLi.appendChild(menuButton)
      keeperMenu.insertAdjacentHTML('afterend', menuLi.outerHTML)
      element.querySelector('.coc7-menu.coc7-dice-roll').addEventListener('click', event => CoC7Utilities.rollDice(event))
    }
  }
}
