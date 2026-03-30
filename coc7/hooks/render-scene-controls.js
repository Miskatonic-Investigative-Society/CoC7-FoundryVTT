import CoC7SceneControls from '../apps/scene-controls.js'

export default function (app, html, data) {
  if (typeof html.querySelector === 'function') {
    html.querySelector('button[data-tool="coc7dummy"]')?.closest('li').remove()
  }
  CoC7SceneControls.renderControls(app, html, data)
}
