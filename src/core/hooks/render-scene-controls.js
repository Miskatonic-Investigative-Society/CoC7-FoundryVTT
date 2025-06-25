import { CoC7Menu } from '../menu.js'

export default function (app, html, data) {
  if (typeof html.querySelector === 'function') {
    html.querySelector('button[data-tool="coc7dummy"]')?.closest('li').remove()
  }
  CoC7Menu.renderControls(app, html, data)
}
