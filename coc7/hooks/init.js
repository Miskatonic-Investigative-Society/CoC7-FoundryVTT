import { FOLDER_ID, ERAS, JOURNAL_STYLES } from '../constants.js'
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

  document.body.classList.add('running-v' + game.release.generation.toString())

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
    journalStyle: (value, label) => {
      JOURNAL_STYLES[value] = label
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

  CONFIG.TextEditor.enrichers.push({
    pattern: /@coc-actor\[([^\]]+)\](?:\{([^}]+)\})?/gi,
    enricher: async (match, { relativeTo } = {}) => {
      const parts = match[1].split(',')
      let actor
      for (const part of parts) {
        if (foundry.utils.parseUuid(part).type === 'Actor') {
          actor = await fromUuid(part)
          if (actor) {
            break
          }
        }
      }
      if (!actor) {
        const a = document.createElement('a')
        a.classList.add('content-link', 'broken')
        const i = document.createElement('i')
        i.classList.add('fa-solid', 'fa-link-slash')
        a.innerText = match[2] ?? game.i18n.localize('COMMON.Unknown')
        a.prepend(i)
        return a
      }


      const context = {
        displayName: match[2] ?? actor.name,
        document: actor,
        hasOccupation: actor.system.infos.occupation.length,
        link: actor.toAnchor().outerHTML,
        occupation: actor.system.infos.occupation,
        short: parts.indexOf('short') > -1,
        showLink: parts.indexOf('no-link') === -1,
        skills: actor.items.filter(doc => doc.type === 'skill').map(doc => { return { label: doc.name, value: doc.system.value } }).sort(CoC7Utilities.sortByLabelKey)
      }

      context.characteristics = {}
      const characteristicsOrder = ['str', 'app', 'con', 'pow', 'siz', 'edu', 'dex', 'san', 'int']
      for (const key of characteristicsOrder) {
        const type = (key === 'san' ? 'attribs' : 'characteristics')
        if (context.document.system[type][key].value !== null) {
          const value = context.document.system.schema.getField(type).getField(key)
          context.characteristics[key] = {
            key,
            short: value.label,
            label: value.hint,
            value: context.document.system[type][key].value
          }
        }
      }

      const occupation = document.occupation
      if (occupation) {
        context.occupation = occupation.name
      }

      if (['creature', 'npc'].includes(context.document.type)) {
        /* // FoundryVTT V12 */
        context.enrichedBiographyPersonalDescription = await (foundry.applications.ux?.TextEditor.implementation ?? TextEditor).enrichHTML(
          context.document.system.biography.personalDescription.value,
          {
            async: true,
            secrets: context.document.editable
          }
        )
      }

      /* // FoundryVTT V12 */
      const html = await (foundry.applications.handlebars?.renderTemplate ?? renderTemplate)('systems/' + FOLDER_ID + '/templates/actors/embed.hbs', context)

      const div = document.createElement('div')
      div.innerHTML = html
      return div.firstElementChild
    }
  })
}
