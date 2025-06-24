/* global CONFIG, Dialog, foundry, game, ui */
import { CoC7Item } from '../documents/item.js'
import { CoCIDBatch } from '../../features/coc-id-system/apps/coc-id-batch.js'

export class Updater {
  static async checkForUpdate () {
    let systemUpdateVersion = game.settings.get('CoC7', 'systemUpdateVersion')
    if (game.actors.size + game.scenes.size + game.items.size + game.journal.size + game.tables.size === 0) {
      // If there are no actors, items, journals, roll tables, or scenes skip world update
      systemUpdateVersion = game.system.version
      await game.settings.set('CoC7', 'systemUpdateVersion', systemUpdateVersion)
    }
    const runMigrate = foundry.utils.isNewerVersion(game.system.version, systemUpdateVersion ?? '0')
    this.updatedModules = game.settings.get('CoC7', 'systemUpdatedModuleVersion') || {}
    this.currentModules = {}
    for (const pack of game.packs) {
      if (!['CoC7', 'world'].includes(pack.metadata.packageName) && ['Actor', 'Item', 'Scene'].includes(pack.metadata.type)) {
        if (!Object.prototype.hasOwnProperty.call(this.currentModules, pack.metadata.packageName)) {
          // Only need to check each module once
          const module = game.modules.get(pack.metadata.packageName)
          if (module) {
            if (runMigrate || !Object.prototype.hasOwnProperty.call(this.updatedModules, module.id) || String(this.updatedModules[module.id]) !== String(module.version)) {
              // A migration is required, module has not been updated before, or the version number has changed, check against known good values
              const knownModuleVersions = {
                'call-of-cthulhu-foundryvtt-investigator-wizard': '1.0.5',
                'cha-coc-fvtt-en-quickstart': '5.0.5',
                'cha-coc-fvtt-en-starterset': '5.0.5'
              }
              if (typeof knownModuleVersions[module.id] === 'string') {
                if (foundry.utils.isNewerVersion(module.version, knownModuleVersions[module.id])) {
                  this.currentModules[module.id] = module.version
                }
              } else {
                this.currentModules[module.id] = module.version
              }
            }
          }
        }
      }
    }
    if (runMigrate || Object.keys(this.currentModules).length > 0) {
      if (game.user.isGM) {
        new Dialog({
          title: game.i18n.localize('CoC7.Migrate.Title'),
          content: game.i18n.format(
            Object.keys(this.currentModules).length === 0
              ? 'CoC7.Migrate.Message'
              : 'CoC7.Migrate.WithModulesMessage',
            {
              version: game.system.version,
              modules:
                '<ul><li>' +
                Object.keys(this.currentModules)
                  .map(mod => game.modules.get(mod).title)
                  .join('</li><li>') +
                '</li></ul>'
            }
          ),
          buttons: {
            update: {
              label: game.i18n.localize('CoC7.Migrate.ButtonUpdate'),
              callback: async () => Updater.update()
            },
            skip: {
              label: game.i18n.localize('CoC7.Migrate.ButtonSkip')
            }
          }
        }).render(true)
      } else {
        new Dialog({
          title: game.i18n.localize('CoC7.Migrate.Title'),
          content: game.i18n.format('CoC7.Migrate.GMRequired', {
            version: game.system.version
          }),
          buttons: {
            OK: {
              label: game.i18n.localize('CoC7.Migrate.ButtonOkay')
            }
          }
        }).render(true)
      }
    }
  }

  static async update () {
    await this.updateDocuments()

    // // If we put up a temporary scene return the user and remove it
    // if (
    //   typeof this.temporaryScene !== 'undefined' &&
    //   typeof this.originalScene !== 'undefined'
    // ) {
    //   await this.originalScene.view()
    //   await new Promise(resolve => setTimeout(resolve, 1000))
    //   await this.temporaryScene.delete()
    // }

    // Migrate Settings if Pulp Rules is enabled turn on all rules
    if (game.settings.get('CoC7', 'pulpRules')) {
      game.settings.set('CoC7', 'pulpRuleDoubleMaxHealth', true)
      game.settings.set('CoC7', 'pulpRuleDevelopmentRollLuck', true)
      game.settings.set('CoC7', 'pulpRuleArchetype', true)
      game.settings.set('CoC7', 'pulpRuleOrganization', true)
      game.settings.set('CoC7', 'pulpRuleTalents', true)
      game.settings.set('CoC7', 'pulpRuleFasterRecovery', true)
      game.settings.set('CoC7', 'pulpRuleIgnoreMajorWounds', true)
      game.settings.set('CoC7', 'pulpRuleIgnoreAgePenalties', true)
    }

    await CoCIDBatch.create('skill')

    const settings = foundry.utils.mergeObject(this.updatedModules || {}, this.currentModules)
    game.settings.set('CoC7', 'systemUpdatedModuleVersion', settings)
    game.settings.set('CoC7', 'systemUpdateVersion', game.system.version)

    ui.notifications.info(game.i18n.format('CoC7.Migrate.Complete'), {
      permanent: true
    })
  }

  static async updateDocuments () {
    // Migrate World Actors
    for (const actor of game.actors.contents) {
      try {
        const updateData = this.migrateActorData(actor.toObject())
        if (!foundry.utils.isEmpty(updateData)) {
          console.log(`Migrating Actor document ${actor.name}`)
          await actor.update(updateData, { enforceTypes: false })
        }
      } catch (err) {
        console.log('Error details', err)
        err.message = game.i18n.format('CoC7.Migrate.ErrorActor', {
          name: actor.name,
          message: err.message
        })
        ui.notifications.error(err.message, { permanent: true })
      }
    }

    // Migrate World Items
    for (const item of game.items.contents) {
      try {
        const updateData = Updater.migrateItemData(item.toObject())
        if (!foundry.utils.isEmpty(updateData)) {
          console.log(`Migrating Item document ${item.name}`)
          await item.update(updateData, { enforceTypes: false })
        }
      } catch (err) {
        console.log('Error details', err)
        err.message = game.i18n.format('CoC7.Migrate.ErrorItem', {
          name: item.name,
          message: err.message
        })
        ui.notifications.error(err.message, { permanent: true })
      }
    }

    // Migrate World Tables
    for (const table of game.tables.contents) {
      try {
        const updateData = Updater.migrateTableData(table.toObject())
        if (!foundry.utils.isEmpty(updateData)) {
          console.log(`Migrating Table document ${table.name}`)
          await table.update(updateData, { enforceTypes: false })
        }
      } catch (err) {
        console.log('Error details', err)
        err.message = game.i18n.format('CoC7.Migrate.ErrorTable', {
          name: table.name,
          message: err.message
        })
        ui.notifications.error(err.message, { permanent: true })
      }
    }

    // Migrate Macros
    for (const macro of game.macros.contents) {
      try {
        const updateData = Updater.migrateMacroData(macro.toObject())
        if (!foundry.utils.isEmpty(updateData)) {
          console.log(`Migrating Macro document ${macro.name}`)
          await macro.update(updateData, { enforceTypes: false })
        }
      } catch (err) {
        console.log('Error details', err)
        err.message = game.i18n.format('CoC7.Migrate.ErrorMacro', {
          name: macro.name,
          message: err.message
        })
        ui.notifications.error(err.message, { permanent: true })
      }
    }

    // Migrate Scenes [Token] Actors
    for (const scene of game.scenes) {
      try {
        const updateData = Updater.migrateSceneData(scene)
        if (!foundry.utils.isEmpty(updateData)) {
          console.log(`Migrating Scene document ${scene.name}`)
          // if (
          //   scene.id === game.scenes.current.id &&
          //   typeof this.temporaryScene === 'undefined' &&
          //   typeof this.originalScene === 'undefined'
          // ) {
          //   this.temporaryScene = await Scene.create({
          //     name: game.i18n.format('CoC7.Migrate.UpdateCurrentScene'),
          //     backgroundColor: '#000000'
          //   })
          //   this.originalScene = scene
          //   await DrawingDocument.create(
          //     {
          //       author: game.user.id,
          //       shape: {
          //         type: 'r',
          //         width: 1600,
          //         height: 200
          //       },
          //       x: 2200,
          //       y: 2200,
          //       z: 0,
          //       strokeWidth: 0,
          //       text: game.i18n.format('CoC7.Migrate.UpdateCurrentScene'),
          //       fontFamily: 'Signika',
          //       fontSize: 128,
          //       textColor: '#FFFFFF',
          //       textAlpha: 1,
          //       hidden: false,
          //       locked: true
          //     },
          //     {
          //       parent: this.temporaryScene
          //     }
          //   )
          //   await this.temporaryScene.view()
          //   await new Promise(resolve => setTimeout(resolve, 1000))
          // }
          await scene.update(updateData, { enforceTypes: false })
        }
        scene.tokens.forEach(t => (t._actor = null))
      } catch (err) {
        console.log('Error details', err)
        err.message = game.i18n.format('CoC7.Migrate.ErrorScene', {
          name: scene.name,
          message: err.message
        })
        ui.notifications.error(err.message, { permanent: true })
      }
    }

    // Migrate World Compendium Packs
    for (const pack of game.packs) {
      if (
        pack.metadata.packageName !== 'CoC7' &&
        ['Actor', 'Item', 'Macro', 'RollTable', 'Scene'].includes(
          pack.metadata.type
        )
      ) {
        await Updater.migrateCompendiumData(pack)
      }
    }
  }

  static migrateActorData (actor) {
    const updateData = {}

    // Update World Actor
    Updater._migrateActorCharacterSanity(actor, updateData)
    Updater._migrateActorArtwork(actor, updateData)
    Updater._migrateActorKeeperNotes(actor, updateData)
    Updater._migrateActorNpcCreature(actor, updateData)
    Updater._migrateActorStatusEffectActive(actor, updateData)
    Updater._migrateActorSanLossReasons(actor, updateData)
    Updater._migrateActorMonetary(actor, updateData)

    // Migrate World Actor Items
    if (actor.items) {
      const items = actor.items.reduce((arr, i) => {
        const itemData =
          i instanceof CONFIG.Item.documentClass ? i.toObject() : i
        const itemUpdate = Updater.migrateItemData(itemData)
        if (!foundry.utils.isEmpty(itemUpdate)) {
          itemUpdate._id = itemData._id
          arr.push(foundry.utils.expandObject(itemUpdate))
        }
        return arr
      }, [])
      if (items.length > 0) {
        updateData.items = items
      }
    }

    return updateData
  }

  static async migrateCompendiumData (pack) {
    const documentType = pack.metadata.type
    if (
      !['Actor', 'Item', 'Macro', 'RollTable', 'Scene'].includes(documentType)
    ) {
      return
    }

    // Unlock the pack for editing
    const wasLocked = pack.locked
    await pack.configure({ locked: false })

    try {
      await pack.migrate()
    } catch (err) {
      console.log('pack migrate failed', pack, err)
    }
    const documents = await pack.getDocuments()

    // Iterate over compendium entries - applying fine-tuned migration functions
    for (const doc of documents) {
      let updateData = {}
      try {
        switch (documentType) {
          case 'Actor':
            updateData = Updater.migrateActorData(doc.toObject())
            break
          case 'Item':
            updateData = Updater.migrateItemData(doc.toObject())
            break
          case 'Macro':
            updateData = Updater.migrateMacroData(doc.toObject())
            break
          case 'RollTable':
            updateData = Updater.migrateTableData(doc.toObject())
            break
          case 'Scene':
            updateData = Updater.migrateSceneData(doc)
            break
        }
        // Save the entry, if data was changed
        if (!foundry.utils.isEmpty(updateData)) {
          console.log(
            `Migrated ${documentType} document ${doc.name} in Compendium ${pack.collection}`
          )
          await doc.update(updateData)
        }
      } catch (err) {
        console.log('Error details', err)
        err.message = game.i18n.format('CoC7.Migrate.ErrorDocumentPack', {
          name: doc.name,
          collection: pack.collection,
          message: err.message
        })
        ui.notifications.error(err.message, { permanent: true })
      }
    }

    // Apply the original locked status for the pack
    await pack.configure({ locked: wasLocked })
  }

  static migrateItemData (item) {
    const updateData = {}

    // Update World Item
    Updater._migrateItemEmbeddedv10(item, updateData)
    Updater._migrateItemExperience(item, updateData)
    Updater._migrateItemArtwork(item, updateData)
    Updater._migrateItemBookAutomated(item, updateData)
    Updater._migrateItemKeeperNotes(item, updateData)
    Updater._migrateItemSpellAutomated(item, updateData)
    Updater._migrateItemKeeperNotesMerge(item, updateData)
    Updater._migrateItemEras(item, updateData)
    Updater._migrateItemv10(item, updateData)
    Updater._migrateItemBookUnits(item, updateData)

    return updateData
  }

  static migrateMacroData (table) {
    const updateData = {}

    // Update World Actor
    Updater._migrateMacroArtwork(table, updateData)

    return updateData
  }

  static migrateTableData (table) {
    const updateData = {}

    // Update World Actor
    Updater._migrateTableArtwork(table, updateData)

    return updateData
  }

  static migrateSceneData (scene) {
    const returns = {
      tokens: []
    }
    if (typeof scene.tokens !== 'undefined' && scene.tokens.length) {
      returns.tokens = scene.tokens.map(token => {
        const t = token.toObject()
        const updateData = {}
        Updater._migrateTokenArtwork(t, updateData)
        if (Object.keys(updateData).length) {
          foundry.utils.mergeObject(t, updateData)
        }
        if (!t.actorId || t.actorLink) {
          t.actorData = {}
        } else if (!game.actors.has(t.actorId)) {
          t.actorId = null
          t.actorData = {}
        } else if (!t.actorLink) {
          const actorData = foundry.utils.duplicate(t.actorData)
          actorData.type = token.actor?.type
          const update = Updater.migrateActorData(actorData)
          ;['items', 'effects'].forEach(embeddedName => {
            if (!update[embeddedName]?.length) {
              return
            }
            const updates = new Map(update[embeddedName].map(u => [u._id, u]))
            t.actorData[embeddedName].forEach(original => {
              const update = updates.get(original._id)
              if (update) foundry.utils.mergeObject(original, update)
            })
            delete update[embeddedName]
          })
          foundry.utils.mergeObject(t.actorData, update)
        }
        return t
      })
    }
    return returns
  }

  static _migrateItemKeeperNotes (item, updateData) {
    if (
      [
        'archetype',
        'chase',
        'item',
        'occupation',
        'setup',
        'skill',
        'spell',
        'status',
        'talent',
        'weapon'
      ].includes(item.type)
    ) {
      if (typeof item.system.description === 'string') {
        updateData['system.description'] = {
          value: item.system.description,
          keeper: ''
        }
      } else if (
        typeof item.system.description === 'undefined' ||
        item.system.description === null
      ) {
        updateData['system.description'] = {
          value: '',
          keeper: ''
        }
      } else if (typeof item.system.description.keeper === 'undefined') {
        updateData['system.description.keeper'] = ''
      }
    }
    return updateData
  }

  static _migrateItemExperience (item, updateData) {
    if (item.type === 'skill') {
      if (typeof item.system.adjustments?.experience === 'undefined') {
        updateData['system.adjustments.experience'] = 0
      }
    }
    return updateData
  }

  static _migrateItemArtwork (item, updateData) {
    let image = String(item.img).match(/systems\/CoC7\/artwork\/icons\/(.+)/)
    if (image !== null) {
      updateData.img = 'systems/CoC7/assets/icons/' + image[1]
    }
    if (item.type === 'setup') {
      for (const [k, v] of Object.entries(item.system.items)) {
        if (typeof v !== 'string') {
          image = String(v.img).match(/systems\/CoC7\/artwork\/icons\/(.+)/)
          if (image !== null) {
            if (typeof updateData['system.items'] === 'undefined') {
              updateData['system.items'] = item.system.items
            }
            updateData['system.items'][k].img =
              'systems/CoC7/assets/icons/' + image[1]
          }
        }
      }
    } else if (item.type === 'occupation') {
      for (const [k, v] of Object.entries(item.system.skills)) {
        if (typeof v !== 'string') {
          image = String(v.img).match(/systems\/CoC7\/artwork\/icons\/(.+)/)
          if (image !== null) {
            if (typeof updateData['system.skills'] === 'undefined') {
              updateData['system.skills'] = item.system.skills
            }
            updateData['system.skills'][k].img =
              'systems/CoC7/assets/icons/' + image[1]
          }
        }
      }
      for (const [o, g] of Object.entries(item.system.groups)) {
        for (const [k, v] of Object.entries(g.skills)) {
          if (typeof v !== 'string') {
            image = String(v.img).match(/systems\/CoC7\/artwork\/icons\/(.+)/)
            if (image !== null) {
              if (typeof updateData['system.groups'] === 'undefined') {
                updateData['system.groups'] = item.system.groups
              }
              updateData['system.groups'][o].skills[k].img =
                'systems/CoC7/assets/icons/' + image[1]
            }
          }
        }
      }
    } else if (item.type === 'book') {
      for (const [k, v] of Object.entries(item.system.spells)) {
        if (typeof v !== 'string') {
          image = String(v.img).match(/systems\/CoC7\/artwork\/icons\/(.+)/)
          if (image !== null) {
            if (typeof updateData['system.spells'] === 'undefined') {
              updateData['system.spells'] = item.system.spells
            }
            updateData['system.spells'][k].img =
              'systems/CoC7/assets/icons/' + image[1]
          }
        }
      }
    } else if (item.type === 'archetype') {
      for (const [k, v] of Object.entries(item.system.skills)) {
        if (typeof v !== 'string') {
          image = String(v.img).match(/systems\/CoC7\/artwork\/icons\/(.+)/)
          if (image !== null) {
            if (typeof updateData['system.skills'] === 'undefined') {
              updateData['system.skills'] = item.system.skills
            }
            updateData['system.skills'][k].img =
              'systems/CoC7/assets/icons/' + image[1]
          }
        }
      }
    }
    return updateData
  }

  static _migrateItemSpellAutomated (item, updateData) {
    if (item.type === 'spell' && typeof item.system.cost !== 'undefined') {
      updateData['system.castingTime'] = item.system.castingTime || ''
      updateData['system.costs.hitPoints'] = item.system.cost.hp || 0
      updateData['system.costs.magicPoints'] = item.system.cost.mp || 0
      updateData['system.costs.sanity'] = item.system.cost.san || 0
      updateData['system.costs.power'] = item.system.cost.pow || 0
      updateData['system.costs.others'] = ''

      updateData['system.-=cost'] = null
      updateData['system.description.-=unidentified'] = null
      updateData['system.description.-=notes'] = null
    }
  }

  /**
   * Book automation was increased in 0.6.5
   *
   * @param {object} item Document data expressed as a plain object
   * @param {json} updateData Differential update data which modifies the existing values of this document data
   * @returns {json} Differential update data which modifies the existing values of this document data
   */
  static _migrateItemBookAutomated (item, updateData) {
    if (item.type === 'book') {
      /** If book still has the system.description.unidentified key then run migrate on it */
      if (typeof item.system.description.unidentified !== 'undefined') {
        /** Fields changed from null default to empty string */
        updateData['system.author'] = item.system.author || ''
        updateData['system.date'] = item.system.date || ''
        updateData['system.language'] = item.system.language || ''
        /** Fields changed from null/string defaults to integer to 0 */
        updateData['system.sanityLoss'] = item.system.sanLoss || 0
        updateData['system.mythosRating'] = Number(item.system.mythosRating) || 0
        /** Renamed/moved fields */
        updateData['system.content'] = item.system.description.unidentified
        updateData['system.description.keeper'] = item.system.description.notes
        /** New fields set default values */
        updateData['system.difficultyLevel'] = 'regular'
        updateData['system.fullStudies'] = 0
        updateData['system.initialReading'] = false
        updateData['system.keeperNotes'] = ''
        /** Move and rename gain fields to gains, default NaN values to 0 */
        updateData['system.gains.cthulhuMythos.initial'] =
          Number(item.system.gain.cthulhuMythos.CMI) || 0
        updateData['system.gains.cthulhuMythos.final'] =
          Number(item.system.gain.cthulhuMythos.CMF) || 0
        updateData['system.gains.occult'] = Number(item.system.gain.occult) || 0
        updateData['system.gains.others'] = []
        /** New study field default necessary to integer of weeksStudyTime or 0 if not set */
        updateData['system.study'] = {
          necessary: Number(item.system.weeksStudyTime) || 0,
          progress: 0,
          units: 'CoC7.weeks'
        }
        /** Remove old keys */
        updateData['system.-=sanLoss'] = null
        updateData['system.-=weeksStudyTime'] = null
        updateData['system.-=gain'] = null
        updateData['system.description.-=unidentified'] = null
        updateData['system.description.-=notes'] = null
        updateData['system.gains.-=other'] = null
        updateData['system.-=properties'] = null
        updateData['system.-=flags'] = null
      }
    }
    return updateData
  }

  static _migrateItemBookUnits (item, updateData) {
    if (item.type === 'book') {
      if (
        typeof item.system.study.necessary !== 'undefined' &&
        typeof item.system.study.units === 'undefined'
      ) {
        updateData['system.study.units'] = 'CoC7.weeks'
      }
    }
  }

  static _migrateItemKeeperNotesMerge (item, updateData) {
    if (item.type === 'spell' || item.type === 'book') {
      if (typeof item.system.notes !== 'undefined') {
        if (typeof item.system.description.keeper !== 'undefined') {
          updateData['system.description.keeper'] =
            item.system.description.keeper + item.system.notes
        } else {
          updateData['system.description.keeper'] = item.system.notes
        }
        updateData['system.-=notes'] = null
      }
      if (typeof item.system.keeperNotes !== 'undefined') {
        if (typeof updateData['system.description.keeper'] !== 'undefined') {
          updateData['system.description.keeper'] =
            item.system.keeperNotes + updateData['system.description.keeper']
        } else {
          updateData['system.description.keeper'] = item.system.keeperNotes
        }
        updateData['system.-=keeperNotes'] = null
      }
    }
  }

  static _migrateItemEmbeddedv10 (item, updateData) {
    if (item.type === 'occupation') {
      let changed = false
      for (const [o, g] of Object.entries(item.system.groups)) {
        for (const [k, v] of Object.entries(g.skills)) {
          if (typeof v !== 'string') {
            if (typeof v.system === 'undefined') {
              item.system.groups[o].skills[k].system = v.data
              changed = true
            }
          }
        }
      }
      if (changed) {
        updateData['system.groups'] = item.system.groups
      }
    }
    if (['setup'].includes(item.type)) {
      let changed = false
      for (const [k, v] of Object.entries(item.system.items)) {
        if (typeof v !== 'string') {
          if (typeof v.system === 'undefined') {
            item.system.items[k].system = v.data
            changed = true
          }
        }
      }
      if (changed) {
        updateData['system.items'] = item.system.items
      }
    }
    if (['archetype', 'occupation'].includes(item.type)) {
      let changed = false
      for (const [k, v] of Object.entries(item.system.skills)) {
        if (typeof v !== 'string') {
          if (typeof v.system === 'undefined') {
            item.system.skills[k].system = v.data
            changed = true
          }
        }
      }
      if (changed) {
        updateData['system.skills'] = item.system.skills
      }
    }
    if (['book'].includes(item.type)) {
      let changed = false
      for (const [k, v] of Object.entries(item.system.spells)) {
        if (typeof v !== 'string') {
          if (typeof v.system === 'undefined') {
            item.system.spells[k].system = v.data
            changed = true
          }
        }
      }
      if (changed) {
        updateData['system.spells'] = item.system.spells
      }
    }
  }

  static _migrateItemv10 (item, updateData) {
    if (
      item.type === 'skill' &&
      (typeof item.system.skillName === 'undefined' || item.system.skillName === '')
    ) {
      updateData.name = item.name
      // Update Polish dodge translation from Uniki to Unik to match update to lang/pl.json
      if (updateData.name === 'Uniki') {
        updateData.name = 'Unik'
      }
      const parts = CoC7Item.getNamePartsSpec(
        updateData.name,
        typeof item.system.specialization?.group === 'string'
          ? item.system.specialization.group
          : item.system.specialization
      )
      updateData.name = parts.name
      updateData['system.skillName'] = parts.skillName
      updateData['system.specialization'] = parts.specialization
    } else if (item.type === 'setup') {
      for (const [k, v] of Object.entries(item.system.items)) {
        if (typeof v !== 'string') {
          if (
            v.type === 'skill' &&
            (typeof v.system.skillName === 'undefined' || v.system.skillName === '')
          ) {
            if (typeof updateData['system.items'] === 'undefined') {
              updateData['system.items'] = item.system.items
            }
            updateData['system.items'][k].name = v.name
            if (updateData['system.items'][k].name === 'Uniki') {
              updateData['system.items'][k].name = 'Unik'
            }
            const parts = CoC7Item.getNamePartsSpec(
              updateData['system.items'][k].name,
              typeof v.system.specialization?.group === 'string'
                ? v.system.specialization.group
                : v.system.specialization
            )
            updateData['system.items'][k].name = parts.name
            updateData['system.items'][k].system.skillName = parts.skillName
            updateData['system.items'][k].system.specialization = parts.specialization
          }
        }
      }
    } else if (item.type === 'occupation') {
      for (const [k, v] of Object.entries(item.system.skills)) {
        if (typeof v !== 'string') {
          if (
            v.type === 'skill' &&
            (typeof v.system.skillName === 'undefined' || v.system.skillName === '')
          ) {
            if (typeof updateData['system.skills'] === 'undefined') {
              updateData['system.skills'] = item.system.skills
            }
            updateData['system.skills'][k].name = v.name
            if (updateData['system.skills'][k].name === 'Uniki') {
              updateData['system.skills'][k].name = 'Unik'
            }
            const parts = CoC7Item.getNamePartsSpec(
              updateData['system.skills'][k].name,
              typeof v.system.specialization?.group === 'string'
                ? v.system.specialization.group
                : v.system.specialization
            )
            updateData['system.skills'][k].name = parts.name
            updateData['system.skills'][k].system.skillName = parts.skillName
            updateData['system.skills'][k].system.specialization =
              parts.specialization
          }
        }
      }
      for (const [o, g] of Object.entries(item.system.groups)) {
        for (const [k, v] of Object.entries(g.skills)) {
          if (typeof v !== 'string') {
            if (
              v.type === 'skill' &&
              (typeof v.system.skillName === 'undefined' || v.system.skillName === '')
            ) {
              if (typeof updateData['system.groups'] === 'undefined') {
                updateData['system.groups'] = item.system.groups
              }
              updateData['system.groups'][o].skills[k].name = v.name
              if (updateData['system.groups'][o].skills[k].name === 'Uniki') {
                updateData['system.groups'][o].skills[k].name = 'Unik'
              }
              const parts = CoC7Item.getNamePartsSpec(
                updateData['system.groups'][o].skills[k].name,
                typeof v.system.specialization?.group === 'string'
                  ? v.system.specialization.group
                  : v.system.specialization
              )
              updateData['system.groups'][o].skills[k].name = parts.name
              updateData['system.groups'][o].skills[k].system.skillName =
                parts.skillName
              updateData['system.groups'][o].skills[k].system.specialization =
                parts.specialization
            }
          }
        }
      }
    } else if (item.type === 'archetype') {
      for (const [k, v] of Object.entries(item.system.skills)) {
        if (typeof v !== 'string') {
          if (
            v.type === 'skill' &&
            (typeof v.system.skillName === 'undefined' || v.system.skillName === '')
          ) {
            if (typeof updateData['system.skills'] === 'undefined') {
              updateData['system.skills'] = item.system.skills
            }
            updateData['system.skills'][k].name = v.name
            if (updateData['system.skills'][k].name === 'Uniki') {
              updateData['system.skills'][k].name = 'Unik'
            }
            const parts = CoC7Item.getNamePartsSpec(
              updateData['system.skills'][k].name,
              typeof v.system.specialization?.group === 'string'
                ? v.system.specialization.group
                : v.system.specialization
            )
            updateData['system.skills'][k].name = parts.name
            updateData['system.skills'][k].system.skillName = parts.skillName
            updateData['system.skills'][k].system.specialization =
              parts.specialization
          }
        }
      }
    }
  }

  static _migrateItemEras (item, updateData) {
    if (typeof item.system.eras !== 'undefined') {
      // 1920 => standard
      // mdrn => modern / modernPulp
      // pulp => pulp
      // ddts => downDarkerTrails / downDarkerTrailsPulp
      // drka => darkAges / darkAgesPulp
      // glit => gasLight
      // nvct => invictus
      let eras = {}
      for (const [key, value] of Object.entries(item.system.eras)) {
        if (value === true || (typeof value !== 'string' && typeof value.selected !== 'undefined')) {
          switch (key) {
            case '1920':
              eras.standard = true
              break
            case 'mdrn':
              eras.modern = true
              eras.modernPulp = true
              break
            case 'pulp':
              eras.pulp = true
              break
            case 'ddts':
              eras.downDarkerTrails = true
              eras.downDarkerTrailsPulp = true
              break
            case 'drka':
              eras.darkAges = true
              eras.darkAgesPulp = true
              break
            case 'glit':
              eras.gasLight = true
              break
            case 'nvct':
              eras.invictus = true
              break
          }
        }
      }
      if (item.type === 'setup') {
        // If more than one era take the first one only
        const key = Object.keys(eras)[0]
        if (key) {
          eras = { [key]: true }
        } else {
          // If no eras default to standard
          eras = { standard: true }
        }
      }
      const CoC7 = {
        cocidFlag: {
          id: '',
          lang: game.i18n.lang,
          priority: 0,
          eras
        }
      }
      if (typeof item.flags?.CoC7 === 'undefined') {
        item.flags.CoC7 = CoC7
        updateData['flags.CoC7'] = CoC7
      } else if (typeof item.flags?.CoC7?.cocidFlag === 'undefined') {
        item.flags.CoC7.cocidFlag = CoC7.cocidFlag
        updateData['flags.CoC7.cocidFlag'] = CoC7.cocidFlag
      } else {
        item.flags.CoC7.cocidFlag.eras = CoC7.cocidFlag.eras
        updateData['flags.CoC7.cocidFlag.eras'] = CoC7.cocidFlag.eras
      }
      updateData['system.-=eras'] = null
    }
  }

  static _migrateActorArtwork (actor, updateData) {
    let image = String(actor.img).match(/systems\/CoC7\/artwork\/icons\/(.+)/)
    if (image !== null) {
      updateData.img = 'systems/CoC7/assets/icons/' + image[1]
    }
    if (
      typeof actor.prototypeToken !== 'undefined' &&
      typeof actor.prototypeToken.texture?.src !== 'undefined'
    ) {
      image = String(actor.prototypeToken.texture.src).match(
        /systems\/CoC7\/artwork\/icons\/(.+)/
      )
      if (image !== null) {
        updateData['prototypeToken.texture.src'] = 'systems/CoC7/assets/icons/' + image[1]
      }
    }
    if (typeof actor.effects !== 'undefined') {
      for (const [k, v] of Object.entries(actor.effects)) {
        image = String(v.icon).match(/systems\/CoC7\/artwork\/icons\/(.+)/)
        if (image !== null) {
          if (typeof updateData.effects === 'undefined') {
            updateData.effects = actor.effects
          }
          updateData.effects[k].icon = 'systems/CoC7/assets/icons/' + image[1]
        }
      }
    }
  }

  static _migrateActorKeeperNotes (actor, updateData) {
    if (['character', 'npc', 'creature'].includes(actor.type)) {
      if (
        typeof actor.system !== 'undefined' &&
        typeof actor.system.description === 'undefined'
      ) {
        updateData['system.description'] = {
          keeper: ''
        }
      }
    }
  }

  static _migrateActorMonetary (actor, updateData) {
    if (actor.type === 'character' && typeof actor.system.credit?.multiplier !== 'undefined') {
      updateData['system.monetary.symbol'] = actor.system.credit?.monetarySymbol ? actor.system.credit.monetarySymbol : '$'
      if (updateData['system.monetary.symbol'].toString().trim() === '') {
        updateData['system.monetary.symbol'] = '$'
      }
      const multiplier = parseInt(actor.system.credit.multiplier) ? parseInt(actor.system.credit.multiplier) : 1
      updateData['system.monetary.spent'] = actor.system.credit.spent
      updateData['system.monetary.assetsDetails'] = actor.system.credit.assetsDetails
      updateData['system.monetary.spendingLevel'] = actor.system.credit.spendingLevel
      updateData['system.monetary.cash'] = actor.system.credit.cash
      updateData['system.monetary.assets'] = actor.system.credit.assets
      updateData['system.monetary.values'] = foundry.utils.duplicate(actor.system.monetary.values)
      if (multiplier !== 1) {
        for (const value of updateData['system.monetary.values']) {
          value.cashValue = multiplier * value.cashValue
          value.assetsValue = multiplier * value.assetsValue
          value.spendingValue = multiplier * value.spendingValue
        }
      }
      updateData['system.-=credit'] = null
    }
  }

  static _migrateActorSanLossReasons (actor, updateData) {
    if (
      actor.type === 'character' &&
      typeof actor.system?.encounteredCreatures !== 'undefined'
    ) {
      const groups = {}
      for (const sanityLossEvent of actor.system.encounteredCreatures) {
        if (sanityLossEvent.totalLoss > 0) {
          groups[sanityLossEvent.name] = Math.max(
            groups[sanityLossEvent.name] ?? 0,
            sanityLossEvent.totalLoss
          )
        }
      }
      const sanityLossEvents = []
      for (const name in groups) {
        sanityLossEvents.push({
          type: name,
          totalLoss: groups[name],
          immunity: false
        })
      }
      updateData['system.sanityLossEvents'] = sanityLossEvents
      updateData['system.-=encounteredCreatures'] = null
    }
  }

  static _migrateActorStatusEffectActive (actor, updateData) {
    if (['character', 'npc', 'creature'].includes(actor.type)) {
      if (
        typeof actor.system !== 'undefined' &&
        (typeof actor.system.status !== 'undefined' ||
          typeof actor.system.conditions === 'undefined')
      ) {
        updateData['system.conditions.criticalWounds.value'] = false
        updateData['system.conditions.unconscious.value'] = false
        updateData['system.conditions.dying.value'] = false
        updateData['system.conditions.dead.value'] = false
        updateData['system.conditions.prone.value'] = false
        updateData['system.conditions.tempoInsane.value'] = false
        updateData['system.conditions.indefInsane.value'] = false
        if (
          typeof actor.system.status?.criticalWounds?.value !== 'undefined' &&
          actor.system.status?.criticalWounds.value
        ) {
          updateData['system.conditions.criticalWounds.value'] = true
        }
        if (
          typeof actor.system.status?.unconscious?.value !== 'undefined' &&
          actor.system.status?.unconscious.value
        ) {
          updateData['system.conditions.unconscious.value'] = true
        }
        if (
          typeof actor.system.status?.dying?.value !== 'undefined' &&
          actor.system.status?.dying.value
        ) {
          updateData['system.conditions.dying.value'] = true
        }
        if (
          typeof actor.system.status?.dead?.value !== 'undefined' &&
          actor.system.status?.dead.value
        ) {
          updateData['system.conditions.dead.value'] = true
        }
        if (
          typeof actor.system.status?.prone?.value !== 'undefined' &&
          actor.system.status?.prone.value
        ) {
          updateData['system.conditions.prone.value'] = true
        }
        if (
          typeof actor.system.status?.tempoInsane?.value !== 'undefined' &&
          actor.system.status?.tempoInsane.value
        ) {
          updateData['system.conditions.tempoInsane.value'] = true
        }
        if (
          typeof actor.system.status?.indefInsane?.value !== 'undefined' &&
          actor.system.status?.indefInsane.value
        ) {
          updateData['system.conditions.indefInsane.value'] = true
        }
        if (typeof actor.effects !== 'undefined') {
          const effects = actor.effects
          let changed = false
          for (let i = 0, im = effects.length; i < im; i++) {
            const effect = effects[i]
            const match = effect.icon.match(
              /\/(hanging-spider|tentacles-skull|arm-sling|heart-beats|tombstone|knocked-out-stars|falling|skull|unconscious)\./
            )
            if (match !== null) {
              let statusId = ''
              switch (match[1]) {
                case 'hanging-spider':
                  statusId = 'tempoInsane'
                  break
                case 'tentacles-skull':
                  statusId = 'indefInsane'
                  break
                case 'arm-sling':
                  statusId = 'criticalWounds'
                  break
                case 'heart-beats':
                  statusId = 'dying'
                  break
                case 'tombstone':
                case 'skull':
                  statusId = 'dead'
                  break
                case 'knocked-out-stars':
                case 'unconscious':
                  statusId = 'unconscious'
                  break
                case 'falling':
                  statusId = 'prone'
                  break
              }
              if (statusId !== '') {
                if (!updateData[`system.conditions.${statusId}.value`]) {
                  updateData[`system.conditions.${statusId}.value`] = true
                  changed = true
                }
                if (effect.flags.core?.statusId !== statusId) {
                  effects[i] = foundry.utils.mergeObject(effect, {
                    flags: {
                      core: {
                        statusId
                      }
                    }
                  })
                  changed = true
                }
              }
            }
          }
          if (changed) {
            updateData.effects = effects
          }
        }
        updateData['system.-=status'] = null
      }
    }
    return updateData
  }

  static _migrateActorNpcCreature (actor, updateData) {
    if (['npc'].includes(actor.type) && typeof actor.system !== 'undefined') {
      if (typeof actor.system.special === 'undefined') {
        updateData['system.special'] = {
          checkPassed: null,
          checkFailled: null
        }
      }
      if (typeof actor.system.attacksPerRound === 'undefined') {
        updateData['system.attacksPerRound'] = 1
      }
    }
    return updateData
  }

  static _migrateActorCharacterSanity (actor, updateData) {
    if (
      actor.type === 'character' &&
      typeof actor.system?.attribs?.san !== 'undefined'
    ) {
      const oneFifthSanity = Math.ceil(actor.system.attribs.san.value / 5)
      if (
        typeof actor.system.attribs.san.dailyLoss === 'undefined' ||
        actor.system.attribs.san.dailyLoss === null
      ) {
        updateData['system.attribs.san.dailyLoss'] = 0
      }
      if (
        typeof actor.system.attribs.san.oneFifthSanity === 'undefined' ||
        actor.system.attribs.san.oneFifthSanity === null
      ) {
        updateData['system.attribs.san.oneFifthSanity'] = ' / ' + oneFifthSanity
      }
      if (
        typeof actor.system.attribs.san.dailyLoss === 'undefined' ||
        actor.system.attribs.san.dailyLoss === null
      ) {
        updateData['system.attribs.san.dailyLoss'] = 0
      }
      if (
        typeof actor.system.indefiniteInsanityLevel === 'undefined' ||
        actor.system.indefiniteInsanityLevel === null ||
        typeof actor.system.indefiniteInsanityLevel.value === 'undefined' ||
        actor.system.indefiniteInsanityLevel.value === null
      ) {
        updateData['system.indefiniteInsanityLevel.value'] = 0
      }
      if (
        typeof actor.system.indefiniteInsanityLevel === 'undefined' ||
        actor.system.indefiniteInsanityLevel === null ||
        typeof actor.system.indefiniteInsanityLevel.max === 'undefined' ||
        actor.system.indefiniteInsanityLevel.max === null
      ) {
        updateData['system.indefiniteInsanityLevel.max'] = oneFifthSanity
      }
      if (typeof actor.system.attribs.mp !== 'undefined') {
        if (
          typeof actor.system.attribs.mp.value === 'undefined' ||
          actor.system.attribs.mp.value === null
        ) {
          updateData['system.attribs.mp.value'] = oneFifthSanity
        }
        if (
          typeof actor.system.attribs.mp.max === 'undefined' ||
          actor.system.attribs.mp.max === null
        ) {
          updateData['system.attribs.mp.max'] = oneFifthSanity
        }
      }
      if (
        typeof actor.system.notes === 'undefined' ||
        actor.system.notes === null
      ) {
        updateData['system.notes'] = ''
      }
    }
    return updateData
  }

  static _migrateMacroArtwork (table, updateData) {
    const image = String(table.img).match(/systems\/CoC7\/artwork\/icons\/(.+)/)
    if (image !== null) {
      updateData.img = 'systems/CoC7/assets/icons/' + image[1]
    }
    return updateData
  }

  static _migrateTableArtwork (table, updateData) {
    let image = String(table.img).match(/systems\/CoC7\/artwork\/icons\/(.+)/)
    if (image !== null) {
      updateData.img = 'systems/CoC7/assets/icons/' + image[1]
    }
    for (const [k, v] of Object.entries(table.results)) {
      image = String(v.img).match(/systems\/CoC7\/artwork\/icons\/(.+)/)
      if (image !== null) {
        if (typeof updateData.results === 'undefined') {
          updateData.results = table.results
        }
        updateData.results[k].img = 'systems/CoC7/assets/icons/' + image[1]
      }
    }
    return updateData
  }

  static _migrateTokenArtwork (token, updateData) {
    const image = String(token.img).match(/systems\/CoC7\/artwork\/icons\/(.+)/)
    if (image !== null) {
      updateData.img = 'systems/CoC7/assets/icons/' + image[1]
    }
    return updateData
  }
}
