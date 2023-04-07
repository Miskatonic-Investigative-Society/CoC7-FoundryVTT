/* global Hooks */
import { configureDocuments } from '../scripts/configure-documents.js'
import { preloadHandlebarsTemplates } from '../scripts/load-templates.js'
import { registerSettings } from '../scripts/register-settings.js'
import { registerSheets } from '../scripts/register-sheets.js'
import { handlebarsHelper } from '../scripts/handlebars-helper.js'
import { compendiumFilter } from '../scripts/compendium-filter.js'
import { registerTestingUtils } from '../scripts/testing-utils.js'
import { CoCID } from '../scripts/coc-id.js'
import { CoC7Link } from '../apps/coc7-link.js'

export function listen () {
  Hooks.once('init', async () => {
    configureDocuments()
    preloadHandlebarsTemplates()
    registerSettings()
    registerSheets()
    handlebarsHelper()
    compendiumFilter()
    registerTestingUtils()
    CoCID.init()
    CoC7Link.init()
  })
}
