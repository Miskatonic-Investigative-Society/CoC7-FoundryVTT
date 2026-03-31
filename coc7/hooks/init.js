/* global Combat CONFIG foundry fromUuid game Hooks TextEditor */
import { ERAS } from '../constants.js'
import CoC7ClickableEvents from '../apps/clickable-events.js'
import CoC7Combat from '../apps/combat.js'
import CoC7CompendiumFilter from '../setup/compendium-filter.js'
import CoC7DiceSoNiceReadyLast from './dice-so-nice-ready-last.js'
import CoC7HandlebarsHelper from '../setup/handlebars-helper.js'
import CoC7Link from '../apps/link.js'
import CoC7LoadTemplates from '../setup/load-templates.js'
import CoC7MessageResults from '../apps/message-results.js'
import CoC7ModelsConfigureDocuments from '../setup/configure-documents.js'
import CoC7ModelsRegisterSheets from '../setup/register-sheets.js'
import CoC7RegisterDice from '../setup/register-dice.js'
import CoC7RegisterSettings from '../setup/register-settings.js'
import CoC7Utilities from '../apps/utilities.js'
import CoCID from '../apps/coc-id.js'
import CoCIDSkillCache from '../setup/coc-id-skill-cache.js'
import deprecated from '../deprecated.js'

export default function () {
  // FoundryVTT v13 @import escapes href
  const link = document.createElement('link')
  link.setAttribute('href', 'https://fonts.googleapis.com/css?family=Noto%20Sans|Voltaire|Lusitana')
  link.setAttribute('rel', 'stylesheet')
  link.setAttribute('type', 'text/css')
  link.setAttribute('media', 'all')
  document.head.append(link)

  if (!foundry.utils.isNewerVersion(game.version, 13)) {
    /* // FoundryVTT V12 */
    document.body.classList.add('running-v12')
  }

  game.CoC7 = {
    macros: {
      skillCheck: CoC7Utilities.skillCheckMacro,
      weaponCheck: CoC7Utilities.weaponCheckMacro,
      check: CoC7Utilities.checkMacro,
      linkMacro: CoC7Link.linkMacro
    },
    dev: {
      dice: {
        alwaysCrit: false,
        alwaysFumble: false
      }
    },
    eras: (era, name, icon = 'fa-solid fa-info-circle') => {
      ERAS[era] = {
        name,
        icon
      }
    },
    skillNames: new CoCIDSkillCache(),
    // Manual,
    messageResults: CoC7MessageResults.loadMessage,
    messagePermissionQueue: [],
    ClickRegionLeftUuid: CoC7ClickableEvents.ClickRegionLeftUuid,
    ClickRegionRightUuid: CoC7ClickableEvents.ClickRegionRightUuid,
    hasPermissionDocument: CoC7ClickableEvents.hasPermissionDocument,
    InSceneRelativeTeleport: CoC7ClickableEvents.InSceneRelativeTeleport,
    MapPinToggle: CoC7ClickableEvents.MapPinToggle,
    openDocument: CoC7ClickableEvents.openDocument,
    toggleTileJournalPages: CoC7ClickableEvents.toggleTileJournalPages,
    toScene: CoC7ClickableEvents.toScene
  }
  Combat.prototype.rollInitiative = CoC7Combat.rollInitiative

  CoC7ModelsConfigureDocuments()
  CoC7LoadTemplates()
  CoC7RegisterSettings()
  CoC7ModelsRegisterSheets()
  CoC7HandlebarsHelper()
  CoC7CompendiumFilter()
  CoCID.init()
  CoC7RegisterDice()
  CoC7Link.init()
  Hooks.once('diceSoNiceReady', CoC7DiceSoNiceReadyLast)
  CoC7ClickableEvents.initSelf()

  deprecated.CoCID()
  deprecated.init()

  CONFIG.TextEditor.enrichers.push({
    pattern: /@chaosiumUUID\[([^#\]]+)(?:#([^\]]+))?](?:{([^}]+)})?/gi,
    enricher: async (match, { relativeTo } = {}) => {
      const [selectors, hash, name] = match.slice(1, 4)
      let data = {
        name,
        classes: ['content-link', 'broken'],
        icon: 'fas fa-unlink'
      }
      const parts = selectors?.split(/\s*,\s*/)
      if (parts) {
        const keys = parts.reduce((c, i) => {
          const keyVal = i.match(/^(([^:]+):)(.+)?$/)
          if (keyVal) {
            c[keyVal[2]] = keyVal[3]
          } else {
            c.uuid = i
          }
          return c
        }, {})
        if (keys.uuid) {
          const doc = await fromUuid(keys.uuid, { relative: relativeTo })
          if (doc) {
            data = {
              name: name || doc.name || keys.uuid,
              classes: ['content-link'],
              dataset: {
                link: '',
                uuid: doc.uuid,
                id: doc.id,
                type: doc.documentName
              },
              icon: keys.icon ?? CONFIG[doc.documentName].sidebarIcon
            }
            if (hash) {
              data.dataset.hash = hash
            }
            if (keys.img) {
              const a = document.createElement('a')
              a.classList.add(data.classes)
              for (const [k, v] of Object.entries(data.dataset)) {
                if ((v !== null) && (typeof v !== 'undefined')) {
                  a.dataset[k] = v
                }
              }
              a.innerHTML = `<img src="${keys.img}" style="border:0;display:inline-block;height:16px;margin-right:2px;vertical-align:text-top;">${data.name}`
              return a
            }
          }
        }
      }

      return (foundry.applications.ux?.TextEditor.implementation ?? TextEditor).createAnchor(data)
    }
  })
}
