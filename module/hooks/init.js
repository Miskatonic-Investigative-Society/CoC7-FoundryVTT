/* global game, Hooks */

import { configureDocuments } from '../scripts/configure-documents.js'
import { preloadHandlebarsTemplates } from '../scripts/load-templates.js'
import { registerSettings } from '../scripts/register-settings.js'
import { registerSheets } from '../scripts/register-sheets.js'

export function listen () {
  Hooks.once('init', async () => {
    configureDocuments()
    preloadHandlebarsTemplates()
    registerSettings()
    registerSheets()
  })
}
