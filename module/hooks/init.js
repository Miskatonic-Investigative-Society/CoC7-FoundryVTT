/* global Combat, CONFIG, foundry, fromUuid, game, Hooks, TextEditor */
import { configureDocuments } from '../scripts/configure-documents.js'
import { preloadHandlebarsTemplates } from '../scripts/load-templates.js'
import { registerSettings } from '../scripts/register-settings.js'
import { registerSheets } from '../scripts/register-sheets.js'
import { rollInitiative } from '../combat.js'
import { handlebarsHelper } from '../scripts/handlebars-helper.js'
import { compendiumFilter } from '../scripts/compendium-filter.js'
import { COC7 } from '../config.js'
import { CoC7Link } from '../apps/coc7-link.js'
import { CoC7Utilities } from '../utilities.js'
import { CoCID } from '../scripts/coc-id.js'
import DiceSoNiceReadyLast from './dice-so-nice-ready-last.js'
import CoC7ClickableEvents from '../apps/coc7-clickable-events.js'
import { DamageCard } from '../chat/cards/damage.js'

export default function () {
  if (foundry.utils.isNewerVersion(game.version, '13')) {
    const link = document.createElement('link')
    link.setAttribute('href', 'https://fonts.googleapis.com/css?family=Noto%20Sans|Voltaire|Lusitana')
    link.setAttribute('rel', 'stylesheet')
    link.setAttribute('type', 'text/css')
    link.setAttribute('media', 'all')
    document.head.append(link)
  }
  game.CoC7 = {
    macros: {
      skillCheck: CoC7Utilities.skillCheckMacro,
      weaponCheck: CoC7Utilities.weaponCheckMacro,
      check: CoC7Utilities.checkMacro,
      linkMacro: CoC7Link.linkMacro
    },
    cards: {
      DamageCard
    },
    dev: {
      dice: {
        alwaysCrit: false,
        alwaysFumble: false
      }
    },
    eras: (era, name) => {
      COC7.eras[era] = name
    },
    tables: {},
    ClickRegionLeftUuid: CoC7ClickableEvents.ClickRegionLeftUuid,
    ClickRegionRightUuid: CoC7ClickableEvents.ClickRegionRightUuid,
    hasPermissionDocument: CoC7ClickableEvents.hasPermissionDocument,
    InSceneRelativeTeleport: CoC7ClickableEvents.InSceneRelativeTeleport,
    MapPinToggle: CoC7ClickableEvents.MapPinToggle,
    openDocument: CoC7ClickableEvents.openDocument,
    toggleTileJournalPages: CoC7ClickableEvents.toggleTileJournalPages,
    toScene: CoC7ClickableEvents.toScene
  }
  Combat.prototype.rollInitiative = rollInitiative

  configureDocuments()
  preloadHandlebarsTemplates()
  registerSettings()
  registerSheets()
  handlebarsHelper()
  compendiumFilter()
  CoCID.init()
  CoC7Link.init()
  Hooks.once('diceSoNiceReady', DiceSoNiceReadyLast)
  CoC7ClickableEvents.initSelf()

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
          const keyval = i.match(/^(([^:]+):)(.+)?$/)
          if (keyval) {
            c[keyval[2]] = keyval[3]
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
              a.innerHTML = `<img src="${keys.img}" height="16px" style="vertical-align:bottom;border:0;">${data.name}`
              return a
            }
          }
        }
      }

      return TextEditor.createAnchor(data)
    }
  })
}
