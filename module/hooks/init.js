/* global game, Hooks */

import { configureDocuments } from '../scripts/configure-documents.js'
import { loadTemplates } from '../scripts/load-templates.js'
import { registerSettings } from '../scripts/register-settings.js'
import { registerSheets } from '../scripts/register-sheets.js'

export function listen () {
  Hooks.once('init', async () => {
    configureDocuments()
    loadTemplates()
    registerSettings()
    registerSheets()
  })
}
