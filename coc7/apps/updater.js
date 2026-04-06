/* global ChatMessage CONFIG foundry fromUuid game ui */
// cSpell:words Uniki Unik
import { FOLDER_ID } from '../constants.js'
import CoC7ChatChaseObstacle from './chat-chase-obstacle.js'
import CoC7ChatCombatMelee from './chat-combat-melee.js'
import CoC7ChatCombatRanged from './chat-combat-ranged.js'
import CoC7ChatCombinedMessage from './chat-combined-message.js'
import CoC7ChatDamage from './chat-damage.js'
import CoC7ChatOpposedMessage from './chat-opposed-message.js'
import CoC7Check from './check.js'
import CoC7ConCheck from '../apps/con-check.js'
import CoC7SanCheckCard from '../apps/san-check-card.js'
import CoC7Utilities from './utilities.js'
import CoCIDBatch from './coc-id-batch.js'

export default class CoC7Updater {
  /**
   * Check if update is needed for world including compendium for modules
   */
  static async checkForUpdate () {
    let systemUpdateVersion = game.settings.get(FOLDER_ID, 'systemUpdateVersion')
    if (game.actors.size + game.scenes.size + game.items.size + game.journal.size + game.tables.size === 0) {
      // If there are no actors, items, journals, roll tables, or scenes skip world update
      systemUpdateVersion = game.system.version
      await game.settings.set(FOLDER_ID, 'systemUpdateVersion', systemUpdateVersion)
    }
    const runMigrate = foundry.utils.isNewerVersion(game.system.version, systemUpdateVersion ?? '0')
    const updatedModules = game.settings.get(FOLDER_ID, 'systemUpdatedModuleVersion') || {}
    const currentModules = {}
    const knownModuleVersions = {
      'call-of-cthulhu-foundryvtt-investigator-wizard': '1.0.5', // cspell:disable-line
      'cha-coc-fvtt-en-keeperitems': '1.3.5', // cspell:disable-line
      'cha-coc-fvtt-en-notimetoscream': '1.0.7', // cspell:disable-line
      'cha-coc-fvtt-en-quickstart': '5.0.5', // cspell:disable-line
      'cha-coc-fvtt-en-starterset': '5.0.5' // cspell:disable-line
    }
    for (const pack of game.packs) {
      if (![FOLDER_ID, 'world'].includes(pack.metadata.packageName) && ['Actor', 'Item', 'Scene'].includes(pack.metadata.type)) {
        if (typeof currentModules[pack.metadata.packageName] === 'undefined') {
          // Only need to check each module once
          const module = game.modules.get(pack.metadata.packageName)
          if (module) {
            if (runMigrate || typeof updatedModules[module.id] === 'undefined' || String(updatedModules[module.id]) !== String(module.version)) {
              // A migration is required, module has not been updated before, or the version number has changed, check against known good values
              if (typeof knownModuleVersions[module.id] === 'string') {
                if (foundry.utils.isNewerVersion(module.version, knownModuleVersions[module.id])) {
                  currentModules[module.id] = module.version
                }
              } else {
                currentModules[module.id] = module.version
              }
            }
          }
        }
      }
    }
    if (runMigrate || Object.keys(currentModules).length > 0) {
      if (game.user.isGM) {
        new foundry.applications.api.DialogV2({
          window: { title: 'CoC7.Migrate.Title' },
          content: game.i18n.format(Object.keys(currentModules).length === 0 ? 'CoC7.Migrate.Message' : 'CoC7.Migrate.WithModulesMessage', {
            version: game.system.version,
            modules: '<ul style="margin: 0"><li>' + Object.keys(currentModules).map(mod => game.modules.get(mod).title).join('</li><li>') + '</li></ul>'
          }),
          buttons: [{
            action: 'cancel',
            label: 'CoC7.Migrate.ButtonSkip',
            icon: 'fa-solid fa-ban'
          }, {
            action: 'ok',
            label: 'CoC7.Migrate.ButtonUpdate',
            icon: 'fa-solid fa-check',
            callback: (event, button, dialog) => CoC7Updater.update({ runMigrate, updatedModules, currentModules })
          }]
        }).render({ force: true })
      } else {
        foundry.applications.api.DialogV2.prompt({
          window: { title: 'CoC7.Migrate.Title' },
          content: game.i18n.format('CoC7.Migrate.GMRequired', {
            version: game.system.version
          }),
          rejectClose: false,
          modal: true
        })
      }
    }
  }

  /**
   * Update documents
   * @param {object} options
   * @param {boolean} options.runMigrate
   * @param {object} options.updatedModules
   * @param {object} options.currentModules
   */
  static async update ({ runMigrate, updatedModules, currentModules } = {}) {
    await CoC7Updater.updateDocuments()

    if (runMigrate) {
      // Migrate Settings if Pulp Rules is enabled turn on all rules
      if (game.settings.get(FOLDER_ID, 'pulpRules')) {
        game.settings.set(FOLDER_ID, 'pulpRuleDoubleMaxHealth', true)
        game.settings.set(FOLDER_ID, 'pulpRuleDevelopmentRollLuck', true)
        game.settings.set(FOLDER_ID, 'pulpRuleArchetype', true)
        game.settings.set(FOLDER_ID, 'pulpRuleOrganization', true)
        game.settings.set(FOLDER_ID, 'pulpRuleTalents', true)
        game.settings.set(FOLDER_ID, 'pulpRuleFasterRecovery', true)
        game.settings.set(FOLDER_ID, 'pulpRuleIgnoreMajorWounds', true)
        game.settings.set(FOLDER_ID, 'pulpRuleIgnoreAgePenalties', true)
      }
      await CoC7Updater.migrateChatMessages()
    }

    await CoCIDBatch.create('skill')

    const settings = foundry.utils.mergeObject(updatedModules || {}, currentModules)
    game.settings.set(FOLDER_ID, 'systemUpdatedModuleVersion', settings)
    game.settings.set(FOLDER_ID, 'systemUpdateVersion', game.system.version)

    ui.notifications.info('CoC7.Migrate.Complete', { localize: true, permanent: true })
  }

  /**
   * Make one time changes that are not part of migrateData
   */
  static async updateDocuments () {
    const documentUpdates = []

    // Migrate World Actors
    for (const document of game.actors.contents) {
      CoC7Updater.migrateActorData({ document, documentUpdates, packId: '', parentUuid: '' })
    }

    // Migrate World Items
    for (const document of game.items.contents) {
      CoC7Updater.migrateItemData({ document, documentUpdates, packId: '', parentUuid: '' })
    }

    // Migrate World Macro
    for (const document of game.macros.contents) {
      CoC7Updater.migrateMacroData({ document, documentUpdates, packId: '', parentUuid: '' })
    }

    // Migrate World Tables
    for (const document of game.tables.contents) {
      CoC7Updater.migrateTableData({ document, documentUpdates, packId: '', parentUuid: '' })
    }

    // Migrate World Scenes [Token] Actors
    for (const document of game.scenes.contents) {
      CoC7Updater.migrateSceneData({ document, documentUpdates, packId: '', parentUuid: '' })
    }

    // Migrate World and Module Compendium Packs
    for (const pack of game.packs) {
      if (pack.metadata.packageName !== FOLDER_ID) {
        const documents = await pack.getDocuments()
        for (const document of documents) {
          switch (pack.metadata.type) {
            case 'Actor':
              CoC7Updater.migrateActorData({ document, documentUpdates, packId: pack.collection, parentUuid: '' })
              break
            case 'Item':
              CoC7Updater.migrateItemData({ document, documentUpdates, packId: pack.collection, parentUuid: '' })
              break
            case 'Macro':
              CoC7Updater.migrateMacroData({ document, documentUpdates, packId: pack.collection, parentUuid: '' })
              break
            case 'RollTable':
              CoC7Updater.migrateTableData({ document, documentUpdates, packId: pack.collection, parentUuid: '' })
              break
            case 'Scene':
              CoC7Updater.migrateSceneData({ document, documentUpdates, packId: pack.collection, parentUuid: '' })
              break
          }
        }
      }
    }

    // Make updates
    if (documentUpdates.length) {
      for (const documentUpdate of documentUpdates) {
        const options = {}
        let wasLocked = false
        if (documentUpdate.packId !== '') {
          wasLocked = game.packs.get(documentUpdate.packId).locked
          options.pack = documentUpdate.packId
        }
        if (documentUpdate.parentUuid !== '') {
          options.parent = await fromUuid(documentUpdate.parentUuid)
        }
        console.log('Migrating ' + (documentUpdate.updates.length) + ' ' + (documentUpdate.packId === '' ? 'World ' : 'Pack(' + documentUpdate.packId + ') ') + documentUpdate.type + (documentUpdate.parentUuid === '' ? '' : '(' + documentUpdate.parentUuid + ') embedded') + ' document(s)')
        if (wasLocked) {
          await game.packs.get(documentUpdate.packId).configure({ locked: false })
        }
        await CONFIG[documentUpdate.type].documentClass.updateDocuments(documentUpdate.updates, options)
        if (wasLocked) {
          await game.packs.get(documentUpdate.packId).configure({ locked: true })
        }
      }
    }
  }

  /**
   * Merge or add update document
   * @param {object} document
   * @param {object} documentUpdates
   * @param {string} type
   * @param {string} packId
   * @param {string} parentUuid
   * @param {object} newData
   */
  static mergeEmbeddedDocuments (document, documentUpdates, type, packId, parentUuid, newData) {
    const existing = documentUpdates.findIndex(r => r.type === type && r.packId === packId && r.parentUuid === parentUuid)
    for (const key in newData) {
      foundry.utils.setProperty(document, key, newData[key])
    }
    newData._id = document._id
    if (existing === -1) {
      documentUpdates.push({
        type,
        packId,
        parentUuid,
        updates: [newData]
      })
    } else {
      const updateIndex = documentUpdates[existing].updates.findIndex(r => r._id === document._id)
      if (updateIndex === -1) {
        documentUpdates[existing].updates.push(newData)
      } else {
        foundry.utils.mergeObject(documentUpdates[existing].updates[updateIndex], newData)
      }
    }
  }

  /**
   * Migrate Actor Data
   * @param {object} options
   * @param {object} options.document
   * @param {object} options.documentUpdates
   * @param {string} options.packId
   * @param {string} options.parentUuid
   */
  static migrateActorData ({ document, documentUpdates, packId = '', parentUuid = '' } = {}) {
    CoC7Updater._migrateActorArtwork({ document, documentUpdates, packId, parentUuid })
    CoC7Updater._migrateActorSheetClasses({ document, documentUpdates, packId, parentUuid })
    CoC7Updater._migrateActorFlags({ document, documentUpdates, packId, parentUuid })
    CoC7Updater._migrateActorVehicleAttributes({ document, documentUpdates, packId, parentUuid })
    CoC7Updater._migrateActorBooks({ document, documentUpdates, packId, parentUuid })

    for (const offset in document.items.contents ?? []) {
      CoC7Updater.migrateItemData({ document: document.items.contents[offset], documentUpdates, packId, parentUuid: document.uuid })
    }
  }

  /**
   * Migrate Item Data
   * @param {object} options
   * @param {object} options.document
   * @param {object} options.documentUpdates
   * @param {string} options.packId
   * @param {string} options.parentUuid
   */
  static migrateItemData ({ document, documentUpdates, packId = '', parentUuid = '' } = {}) {
    CoC7Updater._migrateItemArtwork({ document, documentUpdates, packId, parentUuid })
    CoC7Updater._migrateItemEmbeddedV10({ document, documentUpdates, packId, parentUuid })
    CoC7Updater._migrateItemSkillName({ document, documentUpdates, packId, parentUuid })
    CoC7Updater._migrateItemEmbeddedDocuments({ document, documentUpdates, packId, parentUuid })
    CoC7Updater._migrateItemChases({ document, documentUpdates, packId, parentUuid })

    for (const offset in document.effects?.contents ?? []) {
      const image = String(document.effects.contents[offset].img).match(/systems\/CoC7\/artwork\/icons\/(.+)/)
      if (image) {
        CoC7Updater.mergeEmbeddedDocuments(document.effects.contents[offset], documentUpdates, 'ActiveEffect', packId, document.uuid, {
          img: 'systems/CoC7/assets/icons/' + image[1]
        })
      }
    }
  }

  /**
   * Migrate Item Data
   * @param {object} options
   * @param {object} options.document
   * @param {object} options.documentUpdates
   * @param {string} options.packId
   * @param {string} options.parentUuid
   */
  static migrateMacroData ({ document, documentUpdates, packId = '', parentUuid = '' } = {}) {
    CoC7Updater._migrateMacroArtwork({ document, documentUpdates, packId, parentUuid })
  }

  /**
   * Migrate Table Data
   * @param {object} options
   * @param {object} options.document
   * @param {object} options.documentUpdates
   * @param {string} options.packId
   * @param {string} options.parentUuid
   */
  static migrateTableData ({ document, documentUpdates, packId = '', parentUuid = '' } = {}) {
    CoC7Updater._migrateTableArtwork({ document, documentUpdates, packId, parentUuid })
  }

  /**
   * Migrate Scene Data
   * @param {object} options
   * @param {object} options.document
   * @param {object} options.documentUpdates
   * @param {string} options.packId
   * @param {string} options.parentUuid
   */
  static migrateSceneData ({ document, documentUpdates, packId = '', parentUuid = '' } = {}) {
    for (const token of document.tokens) {
      if (!token.actorLink && token.object?.actor) {
        CoC7Updater._migrateTokenArtwork({ document: token, documentUpdates, packId, parentUuid })
        CoC7Updater.migrateActorData({ document: token.object.actor, documentUpdates, packId, parentUuid: token.uuid })
      }
    }
  }

  /**
   * Migrate Item artwork to assets
   * @param {object} options
   * @param {object} options.document
   * @param {object} options.documentUpdates
   * @param {string} options.packId
   * @param {string} options.parentUuid
   */
  static _migrateItemArtwork ({ document, documentUpdates, packId = '', parentUuid = '' } = {}) {
    const image = String(document.img).match(/systems\/CoC7\/artwork\/icons\/(.+)/)
    if (image) {
      CoC7Updater.mergeEmbeddedDocuments(document, documentUpdates, 'Item', packId, parentUuid, {
        img: 'systems/CoC7/assets/icons/' + image[1]
      })
    }
    switch (document.type) {
      case 'archetype':
      case 'book':
      case 'occupation':
      case 'setup':
        {
          let changed = false
          for (const offset in document.system.itemDocuments) {
            if (typeof document.system.itemDocuments[offset] === 'string') {
              document.system.itemDocuments[offset] = JSON.parse(document.system.itemDocuments[offset])
            }
            const image = String(document.system.itemDocuments[offset].img).match(/systems\/CoC7\/artwork\/icons\/(.+)/)
            if (image) {
              document.system.itemDocuments[offset].img = 'systems/CoC7/assets/icons/' + image[1]
              changed = true
            }
            document.system.itemDocuments[offset] = JSON.stringify(document.system.itemDocuments[offset])
          }
          if (changed) {
            CoC7Updater.mergeEmbeddedDocuments(document, documentUpdates, 'Item', packId, parentUuid, {
              'system.itemDocuments': foundry.utils.duplicate(document.system.itemDocuments)
            })
          }
        }
        break
    }
    switch (document.type) {
      case 'occupation':
        {
          let changed = false
          for (const offset2 in document.system.groups) {
            for (const offset in document.system.groups[offset2].itemDocuments) {
              if (typeof document.system.groups[offset2].itemDocuments[offset] === 'string') {
                document.system.groups[offset2].itemDocuments[offset] = JSON.parse(document.system.groups[offset2].itemDocuments[offset])
              }
              const image = String(document.system.groups[offset2].itemDocuments[offset].img).match(/systems\/CoC7\/artwork\/icons\/(.+)/)
              if (image) {
                document.system.groups[offset2].itemDocuments[offset].img = 'systems/CoC7/assets/icons/' + image[1]
                changed = true
              }
              document.system.groups[offset2].itemDocuments[offset] = JSON.stringify(document.system.groups[offset2].itemDocuments[offset])
            }
          }
          if (changed) {
            CoC7Updater.mergeEmbeddedDocuments(document, documentUpdates, 'Item', packId, parentUuid, {
              'system.groups': foundry.utils.duplicate(document.system.groups)
            })
          }
        }
        break
    }
  }

  /**
   * Migrate Item old data. to system.
   * @param {object} options
   * @param {object} options.document
   * @param {object} options.documentUpdates
   * @param {string} options.packId
   * @param {string} options.parentUuid
   */
  static _migrateItemEmbeddedV10 ({ document, documentUpdates, packId = '', parentUuid = '' } = {}) {
    switch (document.type) {
      case 'archetype':
      case 'book':
      case 'occupation':
      case 'setup':
        {
          let changed = false
          for (const offset in document.system.itemDocuments) {
            if (typeof document.system.itemDocuments[offset] === 'string') {
              document.system.itemDocuments[offset] = JSON.parse(document.system.itemDocuments[offset])
            }
            if (typeof document.system.itemDocuments[offset].data !== 'undefined' && typeof document.system.itemDocuments[offset].system === 'undefined') {
              document.system.itemDocuments[offset].system = foundry.utils.duplicate(document.system.itemDocuments[offset].data)
              delete document.system.itemDocuments[offset].data
              changed = true
            }
            document.system.itemDocuments[offset] = JSON.stringify(document.system.itemDocuments[offset])
          }
          if (changed) {
            CoC7Updater.mergeEmbeddedDocuments(document, documentUpdates, 'Item', packId, parentUuid, {
              'system.itemDocuments': foundry.utils.duplicate(document.system.itemDocuments)
            })
          }
        }
        break
    }
    switch (document.type) {
      case 'occupation':
        {
          let changed = false
          for (const offset2 in document.system.groups) {
            for (const offset in document.system.groups[offset2].itemDocuments) {
              if (typeof document.system.groups[offset2].itemDocuments[offset] === 'string') {
                document.system.groups[offset2].itemDocuments[offset] = JSON.parse(document.system.groups[offset2].itemDocuments[offset])
              }
              if (typeof document.system.groups[offset2].itemDocuments[offset].data !== 'undefined' && typeof document.system.groups[offset2].itemDocuments[offset].system === 'undefined') {
                document.system.groups[offset2].itemDocuments[offset].system = foundry.utils.duplicate(document.system.groups[offset2].itemDocuments[offset].data)
                delete document.system.groups[offset2].itemDocuments[offset].data
                changed = true
              }
              document.system.groups[offset2].itemDocuments[offset] = JSON.stringify(document.system.groups[offset2].itemDocuments[offset])
            }
          }
          if (changed) {
            CoC7Updater.mergeEmbeddedDocuments(document, documentUpdates, 'Item', packId, parentUuid, {
              'system.groups': foundry.utils.duplicate(document.system.groups)
            })
          }
        }
        break
    }
  }

  /**
   * Migrate Skill Name from name into parts
   * @param {object} options
   * @param {object} options.document
   * @param {object} options.documentUpdates
   * @param {string} options.packId
   * @param {string} options.parentUuid
   */
  static _migrateItemSkillName ({ document, documentUpdates, packId = '', parentUuid = '' } = {}) {
    // Migrate old skill name function to multiple parts
    if (document.type === 'skill') {
      const parts = CONFIG.Item.dataModels.skill.getNamePartsSpec(
        // Update Polish dodge translation from Uniki to Unik to match update to lang/pl.json
        (document.name === 'Uniki' ? 'Unik' : document.name),
        typeof document.system?.specialization?.group === 'string' ? document.system.specialization.group : (document.system?.specialization ?? '')
      )
      CoC7Updater.mergeEmbeddedDocuments(document, documentUpdates, 'Item', packId, parentUuid, {
        name: parts.name,
        'system.skillName': parts.skillName,
        'system.specialization': parts.specialization
      })
    } else if (['archetype', 'occupation', 'setup'].includes(document.type)) {
      const itemDocuments = foundry.utils.duplicate(document.system.itemDocuments)
      for (const offset in itemDocuments) {
        if (typeof itemDocuments[offset] === 'string') {
          itemDocuments[offset] = JSON.parse(itemDocuments[offset])
        }
        const parts = CONFIG.Item.dataModels.skill.getNamePartsSpec(
          // Update Polish dodge translation from Uniki to Unik to match update to lang/pl.json
          (itemDocuments[offset].name === 'Uniki' ? 'Unik' : itemDocuments[offset].name),
          typeof itemDocuments[offset].system?.specialization?.group === 'string' ? itemDocuments[offset].system.specialization.group : (itemDocuments[offset].system?.specialization ?? '')
        )
        foundry.utils.setProperty(itemDocuments[offset], 'name', parts.name)
        foundry.utils.setProperty(itemDocuments[offset], 'system.skillName', parts.skillName)
        foundry.utils.setProperty(itemDocuments[offset], 'system.specialization', parts.specialization)
        itemDocuments[offset] = JSON.stringify(itemDocuments[offset])
      }
      CoC7Updater.mergeEmbeddedDocuments(document, documentUpdates, 'Item', packId, parentUuid, {
        'system.itemDocuments': itemDocuments
      })
      if (document.type === 'occupation') {
        const groups = foundry.utils.duplicate(document.system.groups)
        for (const offset2 in groups) {
          for (const offset in groups[offset2].itemDocuments) {
            if (typeof groups[offset2].itemDocuments[offset] === 'string') {
              groups[offset2].itemDocuments[offset] = JSON.parse(groups[offset2].itemDocuments[offset])
            }
            const parts = CONFIG.Item.dataModels.skill.getNamePartsSpec(
              // Update Polish dodge translation from Uniki to Unik to match update to lang/pl.json
              (groups[offset2].itemDocuments[offset].name === 'Uniki' ? 'Unik' : groups[offset2].itemDocuments[offset].name),
              typeof groups[offset2].itemDocuments[offset].system?.specialization?.group === 'string' ? groups[offset2].itemDocuments[offset].system.specialization.group : (groups[offset2].itemDocuments[offset].system?.specialization ?? '')
            )
            foundry.utils.setProperty(groups[offset2].itemDocuments[offset], 'name', parts.name)
            foundry.utils.setProperty(groups[offset2].itemDocuments[offset], 'system.skillName', parts.skillName)
            foundry.utils.setProperty(groups[offset2].itemDocuments[offset], 'system.specialization', parts.specialization)
            groups[offset2].itemDocuments[offset] = JSON.stringify(groups[offset2].itemDocuments[offset])
          }
        }
        CoC7Updater.mergeEmbeddedDocuments(document, documentUpdates, 'Item', packId, parentUuid, {
          'system.groups': groups
        })
      }
    }
  }

  /**
   * Migrate Item Embedded Documents
   * @param {object} options
   * @param {object} options.document
   * @param {object} options.documentUpdates
   * @param {string} options.packId
   * @param {string} options.parentUuid
   */
  static _migrateItemEmbeddedDocuments ({ document, documentUpdates, packId = '', parentUuid = '' } = {}) {
    if (['archetype', 'experiencePackage', 'occupation'].includes(document.type)) {
      CoC7Updater.mergeEmbeddedDocuments(document, documentUpdates, 'Item', packId, parentUuid, {
        /* // FoundryVTT V13 */
        'system.-=skills': null
      })
    }
    if (['book'].includes(document.type)) {
      CoC7Updater.mergeEmbeddedDocuments(document, documentUpdates, 'Item', packId, parentUuid, {
        /* // FoundryVTT V13 */
        'system.-=spells': null
      })
    }
    if (['setup'].includes(document.type)) {
      CoC7Updater.mergeEmbeddedDocuments(document, documentUpdates, 'Item', packId, parentUuid, {
        /* // FoundryVTT V13 */
        'system.-=items': null
      })
    }
    if (['experiencePackage', 'occupation'].includes(document.type)) {
      const groups = foundry.utils.duplicate(document.system.groups)
      for (const index in groups) {
        groups[index]['-=skills'] = null
      }
      CoC7Updater.mergeEmbeddedDocuments(document, documentUpdates, 'Item', packId, parentUuid, {
        /* // FoundryVTT V13 */
        'system.groups': groups
      })
    }
  }

  /**
   * Migrate Item Embedded Documents
   * @param {object} options
   * @param {object} options.document
   * @param {object} options.documentUpdates
   * @param {string} options.packId
   * @param {string} options.parentUuid
   */
  static _migrateItemChases ({ document, documentUpdates, packId = '', parentUuid = '' } = {}) {
    if (document.type === 'chase') {
      // Migrate Actor flag to dataModel field
      if (typeof document.flags?.[FOLDER_ID]?.started !== 'undefined') {
        CoC7Updater.mergeEmbeddedDocuments(document, documentUpdates, 'Item', packId, parentUuid, {
          'system.system.started': document.flags[FOLDER_ID].started === true,
          /* // FoundryVTT V13 */
          ['flags.' + FOLDER_ID + '.-=started']: null
        })
      }
      // Migrate Participant roll RollString to Check Message Data
      let changed = false
      const participants = foundry.utils.duplicate(document.system.participants)
      for (const offset in participants) {
        if (typeof participants[offset].speedCheck?.checkData === 'undefined' && typeof participants[offset].speedCheck?.rollDataString !== 'undefined') {
          try {
            const json = JSON.parse(participants[offset].speedCheck.rollDataString)
            const rolledDice = json.dices.tens.reduce((c, d) => {
              if (d.value === 0) {
                c.push(10)
              } else {
                c.push(Math.floor(d.value / 10))
              }
              return c
            }, [])
            const baseDie = rolledDice.shift()
            const checkData = {
              flags: {
                [FOLDER_ID]: {
                  load: {
                    as: 'CoC7Check',
                    actorUuid: CoC7Utilities.oldStyleToUuid(json.actorKey),
                    allowPush: json.canBePushed === 'true',
                    appliedDevelopment: json.flaggedForDevelopment === 'true',
                    cardOpen: false,
                    customFlavor: false,
                    dicePool: {
                      bonusCount: Math.max(0, json.dices.bonus),
                      currentPoolModifier: json.dices.bonus,
                      difficulty: json.dices.difficulty,
                      flatDiceModifier: json.flatDiceModifier,
                      flatThresholdModifier: json.flatThresholdModifier,
                      luckSpent: Number(json.luckSpent || 0),
                      groups: [],
                      penaltyCount: Math.min(0, json.dices.bonus),
                      rolledDice: [
                        {
                          rolled: true,
                          baseDie,
                          bonusDice: (json.dices.bonus > 0 ? rolledDice : []),
                          penaltyDice: (json.dices.bonus < 0 ? rolledDice : []),
                          unitDie: (json.dices.unit.value === 0 ? 10 : json.dices.unit.value)
                        }
                      ],
                      suppressRollData: false,
                      threshold: json._rawValue
                    },
                    isCombat: false,
                    isForced: json.forced === 'true',
                    isForcedFailure: json.forcedFailure === 'true',
                    isForcedSuccess: json.forcedSuccess === 'true',
                    isStandby: json.standby || false,
                    key: '',
                    rollMode: json.dice.rollMode,
                    type: '',
                    standbyRightIcon: ''
                  }
                }
              },
              speaker: {},
              rolls: [JSON.stringify(json.dice.roll)],
              flavor: '',
              whisper: [],
              blind: json._isBlind
            }
            if (json.attribute) {
              checkData.flags[FOLDER_ID].load.key = json.attribute
              checkData.flags[FOLDER_ID].load.type = 'attribute'
            } else if (json.characteristic) {
              checkData.flags[FOLDER_ID].load.key = json.characteristic
              checkData.flags[FOLDER_ID].load.type = 'characteristic'
            } else if (json.skillId) {
              checkData.flags[FOLDER_ID].load.key = checkData.flags[FOLDER_ID].load.actorUuid + '.Item.' + json.skillId
              checkData.flags[FOLDER_ID].load.type = 'skill'
            }
            participants[offset].speedCheck.checkData = checkData
            /* // FoundryVTT V13 */
            participants[offset].speedCheck['-=rollDataString'] = null
            changed = true
          } catch (e) {
          }
        }
      }
      if (changed) {
        CoC7Updater.mergeEmbeddedDocuments(document, documentUpdates, 'Item', packId, parentUuid, {
          'system.participants': participants
        })
      }
    }
  }

  /**
   * Migrate Actor artwork to assets
   * @param {object} options
   * @param {object} options.document
   * @param {object} options.documentUpdates
   * @param {string} options.packId
   * @param {string} options.parentUuid
   */
  static _migrateActorArtwork ({ document, documentUpdates, packId = '', parentUuid = '' } = {}) {
    const image = String(document.img).match(/systems\/CoC7\/artwork\/icons\/(.+)/)
    if (image) {
      CoC7Updater.mergeEmbeddedDocuments(document, documentUpdates, 'Actor', packId, parentUuid, {
        img: 'systems/CoC7/assets/icons/' + image[1]
      })
    }
    if (typeof document.prototypeToken?.texture?.src !== 'undefined') {
      const image = String(document.prototypeToken.texture.src).match(/systems\/CoC7\/artwork\/icons\/(.+)/)
      if (image) {
        CoC7Updater.mergeEmbeddedDocuments(document, documentUpdates, 'Actor', packId, parentUuid, {
          'prototypeToken.texture.src': 'systems/CoC7/assets/icons/' + image[1]
        })
      }
    }
    for (const offset in document.effects?.contents ?? []) {
      const image = String(document.effects.contents[offset].img).match(/systems\/CoC7\/artwork\/icons\/(.+)/)
      if (image) {
        CoC7Updater.mergeEmbeddedDocuments(document.effects.contents[offset], documentUpdates, 'ActiveEffect', packId, document.uuid, {
          img: 'systems/CoC7/assets/icons/' + image[1]
        })
      }
    }
  }

  /**
   * Migrate old investigator class sheet names to new name
   * @param {object} options
   * @param {object} options.document
   * @param {object} options.documentUpdates
   * @param {string} options.packId
   * @param {string} options.parentUuid
   */
  static _migrateActorSheetClasses ({ document, documentUpdates, packId = '', parentUuid = '' } = {}) {
    // Rename custom sheetClass to new class names
    if (typeof document.flags?.core?.sheetClass !== 'undefined') {
      switch (document.flags.core.sheetClass) {
        case 'CoC7.CoC7CharacterSheetMinimized':
          CoC7Updater.mergeEmbeddedDocuments(document, documentUpdates, 'Actor', packId, parentUuid, {
            'flags.core.sheetClass': 'CoC7.CoC7ModelsActorCharacterSheetSummarizedV3'
          })
          break
        case 'CoC7.CoC7CharacterSheetV3':
          CoC7Updater.mergeEmbeddedDocuments(document, documentUpdates, 'Actor', packId, parentUuid, {
            'flags.core.sheetClass': 'CoC7.CoC7ModelsActorCharacterSheetV3'
          })
          break
        case 'CoC7.CoC7CharacterSheet':
          CoC7Updater.mergeEmbeddedDocuments(document, documentUpdates, 'Actor', packId, parentUuid, {
            'flags.core.sheetClass': 'CoC7.CoC7ModelsActorCharacterSheetV2'
          })
          break
      }
    }
  }

  /**
   * Migrate Actor.CoC7.flags to Actor.system.flags so they are part of the dataModel
   * @param {object} options
   * @param {object} options.document
   * @param {object} options.documentUpdates
   * @param {string} options.packId
   * @param {string} options.parentUuid
   */
  static _migrateActorFlags ({ document, documentUpdates, packId = '', parentUuid = '' } = {}) {
    // Move Actor.flags mythosHardened to Actor.system.flags
    if (typeof document.flags?.[FOLDER_ID]?.mythosHardened !== 'undefined') {
      CoC7Updater.mergeEmbeddedDocuments(document, documentUpdates, 'Actor', packId, parentUuid, {
        'system.flags.mythosHardened': document.flags[FOLDER_ID].mythosHardened === true,
        /* // FoundryVTT V13 */
        ['flags.' + FOLDER_ID + '.-=mythosHardened']: null
      })
    }
    // Move Actor.flags mythosInsanityExperienced to Actor.system.flags
    if (typeof document.flags?.[FOLDER_ID]?.mythosInsanityExperienced !== 'undefined') {
      CoC7Updater.mergeEmbeddedDocuments(document, documentUpdates, 'Actor', packId, parentUuid, {
        'system.flags.mythosInsanityExperienced': document.flags[FOLDER_ID].mythosInsanityExperienced === true,
        /* // FoundryVTT V13 */
        ['flags.' + FOLDER_ID + '.-=mythosInsanityExperienced']: null
      })
    }
    // Move Actor.flags skillListMode to Actor.system.flags
    if (typeof document.flags?.[FOLDER_ID]?.skillListMode !== 'undefined') {
      CoC7Updater.mergeEmbeddedDocuments(document, documentUpdates, 'Actor', packId, parentUuid, {
        'system.flags.skillListMode': document.flags[FOLDER_ID].skillListMode === true,
        /* // FoundryVTT V13 */
        ['flags.' + FOLDER_ID + '.-=skillListMode']: null
      })
    }
    // Move Actor.flags skillShowUncommon to Actor.system.flags
    if (typeof document.flags?.[FOLDER_ID]?.skillShowUncommon !== 'undefined') {
      CoC7Updater.mergeEmbeddedDocuments(document, documentUpdates, 'Actor', packId, parentUuid, {
        'system.flags.skillShowUncommon': document.flags[FOLDER_ID].skillShowUncommon === true,
        /* // FoundryVTT V13 */
        ['flags.' + FOLDER_ID + '.-=skillShowUncommon']: null
      })
    }
  }

  /**
   * Migrate vehicle Actor remove attribs and move notes
   * @param {object} options
   * @param {object} options.document
   * @param {object} options.documentUpdates
   * @param {string} options.packId
   * @param {string} options.parentUuid
   */
  static _migrateActorVehicleAttributes ({ document, documentUpdates, packId = '', parentUuid = '' } = {}) {
    if (document.type === 'vehicle') {
      // Move vehicle attribs to vehicle stats
      if (typeof document.system?.description?.notes !== 'undefined') {
        CoC7Updater.mergeEmbeddedDocuments(document, documentUpdates, 'Actor', packId, parentUuid, {
          'system.description.keeper': document.system.description.notes,
          /* // FoundryVTT V13 */
          'system.description.-=notes': null
        })
      }
      CoC7Updater.mergeEmbeddedDocuments(document, documentUpdates, 'Actor', packId, parentUuid, {
        /* // FoundryVTT V13 */
        'system.-=attribs': null
      })
    }
  }

  /**
   * Migrate Actor embedded book items to Actors books
   * @param {object} options
   * @param {object} options.document
   * @param {object} options.documentUpdates
   * @param {string} options.packId
   * @param {string} options.parentUuid
   */
  static _migrateActorBooks ({ document, documentUpdates, packId = '', parentUuid = '' } = {}) {
    if (typeof document.system?.books !== 'undefined' && document.system.books.length === 0) {
      const books = []
      for (const offset in document.items) {
        if (document.items[offset].type === 'book') {
          const book = {
            id: document.items[offset]._id ?? document.items[offset].id,
            cocid: document.items[offset].flags?.[FOLDER_ID]?.cocidFlag?.id ?? '',
            name: document.items[offset].name,
            initialReading: document.items[offset].system.initialReading ?? false,
            fullStudies: document.items[offset].system.fullStudies ?? 0,
            necessary: document.items[offset].system.study.necessary ?? 1,
            progress: document.items[offset].system.study.progress ?? 0,
            units: document.items[offset].system.study.units ?? 'CoC7.weeks',
            spellsLearned: []
          }
          for (const spellOffset in document.items[offset].system.spells) {
            let spell = document.items[offset].system.spells[spellOffset]
            if (typeof spell === 'string') {
              spell = JSON.parse(spell)
            }
            if (spell.system.learned) {
              book.spellsLearned.push(spell._id ?? spell.id)
            }
          }
          books.push(book)
        }
      }
      CoC7Updater.mergeEmbeddedDocuments(document, documentUpdates, 'Actor', packId, parentUuid, {
        'system.books': books
      })
    }
  }

  /**
   * Migrate Table artwork to assets
   * @param {object} options
   * @param {object} options.document
   * @param {object} options.documentUpdates
   * @param {string} options.packId
   * @param {string} options.parentUuid
   */
  static _migrateMacroArtwork ({ document, documentUpdates, packId = '', parentUuid = '' } = {}) {
    const image = String(document.img).match(/systems\/CoC7\/artwork\/icons\/(.+)/)
    if (image) {
      CoC7Updater.mergeEmbeddedDocuments(document, documentUpdates, 'Macro', packId, parentUuid, {
        img: 'systems/CoC7/assets/icons/' + image[1]
      })
    }
  }

  /**
   * Migrate Table artwork to assets
   * @param {object} options
   * @param {object} options.document
   * @param {object} options.documentUpdates
   * @param {string} options.packId
   * @param {string} options.parentUuid
   */
  static _migrateTableArtwork ({ document, documentUpdates, packId = '', parentUuid = '' } = {}) {
    const image = String(document.img).match(/systems\/CoC7\/artwork\/icons\/(.+)/)
    if (image) {
      CoC7Updater.mergeEmbeddedDocuments(document, documentUpdates, 'RollTable', packId, parentUuid, {
        img: 'systems/CoC7/assets/icons/' + image[1]
      })
    }
    for (const offset in document.results.contents ?? []) {
      const image = String(document.results.contents[offset].img).match(/systems\/CoC7\/artwork\/icons\/(.+)/)
      if (image) {
        CoC7Updater.mergeEmbeddedDocuments(document.results.contents[offset], documentUpdates, 'TableResult', packId, document.uuid, {
          img: 'systems/CoC7/assets/icons/' + image[1]
        })
      }
    }
  }

  /**
   * Migrate Table artwork to assets
   * @param {object} options
   * @param {object} options.document
   * @param {object} options.documentUpdates
   * @param {string} options.packId
   * @param {string} options.parentUuid
   */
  static _migrateTokenArtwork ({ document, documentUpdates, packId = '', parentUuid = '' } = {}) {
    const image = String(document.img).match(/systems\/CoC7\/artwork\/icons\/(.+)/)
    if (image) {
      CoC7Updater.mergeEmbeddedDocuments(document, documentUpdates, 'Token', packId, parentUuid, {
        img: 'systems/CoC7/assets/icons/' + image[1]
      })
    }
  }

  /**
   * Migrate Chat Message
   */
  static async migrateChatMessages () {
    const updates = []
    const deleteIds = []
    for (const offset in game.messages.contents) {
      const message = game.messages.contents[offset]
      if (deleteIds.includes(message.id)) {
        // Merged into other message so delete
      } else if (message.flags?.[FOLDER_ID]?.type === 'rollCard' || message.flags?.[FOLDER_ID]?.GMSelfRoll === true) {
        try {
          await CoC7Check.migrateOlderMessages({ offset, updates, deleteIds })
        } catch (e) {
          ui.notifications.error('CoC7.Errors.UnableToMigrateMessages', { localize: true })
        }
      } else if (message.flags?.[FOLDER_ID]?.type === 'combinedCard') {
        try {
          await CoC7ChatCombinedMessage.migrateOlderMessagesRoll({ offset, updates, deleteIds })
        } catch (e) {
          ui.notifications.error('CoC7.Errors.UnableToMigrateMessages', { localize: true })
        }
      } else if (message.flags?.[FOLDER_ID]?.['group-message']?.type === 'combined') {
        try {
          await CoC7ChatCombinedMessage.migrateOlderMessagesLink({ offset, updates, deleteIds })
        } catch (e) {
          ui.notifications.error('CoC7.Errors.UnableToMigrateMessages', { localize: true })
        }
      } else if (message.flags?.[FOLDER_ID]?.type === 'opposedCard') {
        try {
          await CoC7ChatOpposedMessage.migrateOlderMessagesRoll({ offset, updates, deleteIds })
        } catch (e) {
          ui.notifications.error('CoC7.Errors.UnableToMigrateMessages', { localize: true })
        }
      } else if (message.flags?.[FOLDER_ID]?.['group-message']?.type === 'opposed') {
        try {
          await CoC7ChatOpposedMessage.migrateOlderMessagesLink({ offset, updates, deleteIds })
        } catch (e) {
          ui.notifications.error('CoC7.Errors.UnableToMigrateMessages', { localize: true })
        }
      } else if (message.content.indexOf('coc7 chat-card con-check-card') > -1) {
        try {
          await CoC7ConCheck.migrateOlderMessages({ offset, updates, deleteIds })
        } catch (e) {
          ui.notifications.error('CoC7.Errors.UnableToMigrateMessages', { localize: true })
        }
      } else if (message.content.indexOf('coc7 chat-card chat-card-v2 san-loss-card') > -1) {
        try {
          await CoC7SanCheckCard.migrateOlderMessages({ offset, updates, deleteIds })
        } catch (e) {
          ui.notifications.error('CoC7.Errors.UnableToMigrateMessages', { localize: true })
        }
      } else if (message.content.indexOf('coc7 chat-card damage') > -1) {
        try {
          await CoC7ChatDamage.migrateOlderMessages({ offset, updates, deleteIds })
        } catch (e) {
          ui.notifications.error('CoC7.Errors.UnableToMigrateMessages', { localize: true })
        }
      } else if (message.content.indexOf('coc7 chat-card range initiator') > -1) {
        try {
          await CoC7ChatCombatRanged.migrateOlderMessages({ offset, updates, deleteIds })
        } catch (e) {
          ui.notifications.error('CoC7.Errors.UnableToMigrateMessages', { localize: true })
        }
      } else if (message.content.indexOf('coc7 chat-card melee resolution') > -1) {
        try {
          await CoC7ChatDamage.migrateOlderMeleeMessages({ offset, updates, deleteIds })
        } catch (e) {
          ui.notifications.error('CoC7.Errors.UnableToMigrateMessages', { localize: true })
        }
      } else if (message.content.indexOf('coc7 chat-card melee') > -1) {
        try {
          await CoC7ChatCombatMelee.migrateOlderMessages({ offset, updates, deleteIds })
        } catch (e) {
          ui.notifications.error('CoC7.Errors.UnableToMigrateMessages', { localize: true })
        }
      } else if (message.content.indexOf('coc7 chat-card chat-card-v2 enhanced-chat-card obstacle-card') > -1) {
        try {
          await CoC7ChatChaseObstacle.migrateOlderMessages({ offset, updates, deleteIds })
        } catch (e) {
          ui.notifications.error('CoC7.Errors.UnableToMigrateMessages', { localize: true })
        }
      }
    }
    if (updates.length) {
      ChatMessage.updateDocuments(updates)
      if (deleteIds.length) {
        ChatMessage.deleteDocuments(deleteIds)
      }
      /* // FoundryV13 workaround new rolls being automatically expanded */
      if (game.release.generation === 13) {
        setTimeout(() => {
          document.querySelectorAll('#sidebar-content #chat .expanded[data-action=expandRoll]').forEach((element) => { element.classList.remove('expanded') })
        }, 500)
      }
    }
  }
}
