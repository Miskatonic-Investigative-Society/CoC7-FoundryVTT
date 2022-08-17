/* global Hooks */
import { CoC7DirectoryPicker } from '../scripts/coc7-directory-picker.js'

export function listen () {
  Hooks.on('renderSettingsConfig', (app, html, user) => {
    CoC7DirectoryPicker.processHtml(html)
  })
}
