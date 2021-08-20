/* global CONFIG, Dialog, expandObject, foundry, game, isNewerVersion */
export class Updater {
  static async checkForUpdate () {
    this.systemUpdateVersion = String(
      game.settings.get('CoC7', 'systemUpdateVersion')
    )
    if (isNewerVersion('0.3', this.systemUpdateVersion)) {
      if (game.user.isGM) {
        new Dialog({
          title: game.i18n.localize('CoC7.Migrate.Title'),
          content: game.i18n.format('CoC7.Migrate.Message', {
            version: game.system.data.version
          }),
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
            version: game.system.data.version
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
    // Migrate World Actors
    for (const actor of game.actors.contents) {
      try {
        const updateData = this.migrateActorData(actor.toObject())
        if (!foundry.utils.isObjectEmpty(updateData)) {
          console.log(`Migrating Actor entity ${actor.name}`)
          await actor.update(updateData, { enforceTypes: false })
        }
      } catch (err) {
        err.message = `Failed dnd5e system migration for Actor ${actor.name}: ${err.message}`
        console.error(err)
      }
    }

    // Migrate World Items
    for (const item of game.items.contents) {
      try {
        const updateData = Updater.migrateItemData(item.toObject())
        if (!foundry.utils.isObjectEmpty(updateData)) {
          console.log(`Migrating Item entity ${item.name}`)
          await item.update(updateData, { enforceTypes: false })
        }
      } catch (err) {
        err.message = `Failed dnd5e system migration for Item ${item.name}: ${err.message}`
        console.error(err)
      }
    }

    // Migrate World Tables
    for (const table of game.tables.contents) {
      try {
        const updateData = Updater.migrateTableData(table.toObject())
        if (!foundry.utils.isObjectEmpty(updateData)) {
          console.log(`Migrating Table entity ${table.name}`)
          await table.update(updateData, { enforceTypes: false })
        }
      } catch (err) {
        err.message = `Failed dnd5e system migration for Table ${table.name}: ${err.message}`
        console.error(err)
      }
    }

    // Migrate World Compendium Packs
    for (const pack of game.packs) {
      if (
        pack.metadata.package === 'world' &&
        ['Actor', 'Item', 'RollTable'].includes(pack.metadata.entity)
      ) {
        await Updater.migrateCompendiumData(pack)
      }
    }

    game.settings.set('CoC7', 'systemUpdateVersion', '0.3')
  }

  static migrateActorData (actor) {
    const updateData = {}

    // Update World Actor
    Updater._migrateActorCharacterSanity(actor, updateData)
    Updater._migrateActorArtwork(actor, updateData)

    // Migrate World Actor Items
    if (actor.items) {
      const items = actor.items.reduce((arr, i) => {
        const itemData =
          i instanceof CONFIG.Item.documentClass ? i.toObject() : i
        const itemUpdate = Updater.migrateItemData(itemData)
        if (!foundry.utils.isObjectEmpty(itemUpdate)) {
          itemUpdate._id = itemData._id
          arr.push(expandObject(itemUpdate))
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
    const entity = pack.metadata.entity
    if (!['Actor', 'Item', 'RollTable'].includes(entity)) return

    // Unlock the pack for editing
    const wasLocked = pack.locked
    await pack.configure({ locked: false })

    await pack.migrate()
    const documents = await pack.getDocuments()

    // Iterate over compendium entries - applying fine-tuned migration functions
    for (const doc of documents) {
      let updateData = {}
      try {
        switch (entity) {
          case 'Actor':
            updateData = Updater.migrateActorData(doc.toObject())
            break
          case 'Item':
            updateData = Updater.migrateItemData(doc.toObject())
            break
          case 'RollTable':
            updateData = Updater.migrateTableData(doc.toObject())
            break
        }
        // Save the entry, if data was changed
        if (!foundry.utils.isObjectEmpty(updateData)) {
          console.log(
            `Migrated ${entity} entity ${doc.name} in Compendium ${pack.collection}`
          )
          await doc.update(updateData)
        }
      } catch (err) {
        err.message = `Failed dnd5e system migration for entity ${doc.name} in pack ${pack.collection}: ${err.message}`
        console.error(err)
      }
    }

    // Apply the original locked status for the pack
    await pack.configure({ locked: wasLocked })
  }

  static migrateItemData (item) {
    const updateData = {}

    // Update World Item
    Updater._migrateItemExperience(item, updateData)
    Updater._migrateItemArtwork(item, updateData)

    return updateData
  }

  static migrateTableData (table) {
    const updateData = {}

    // Update World Actor
    Updater._migrateTableArtwork(table, updateData)

    return updateData
  }

  static _migrateItemExperience (item, updateData) {
    if (item.type === 'skill') {
      if (typeof item.data.adjustments?.experience === 'undefined') {
        updateData['data.adjustments.experience'] = 0
      }
    }
    return updateData
  }

  static _migrateItemArtwork (item, updateData) {
    const regEx = new RegExp(
      /systems\/CoC7\/artwork\/icons\/((hanging-spider|paranoia|skills|tentacles-skull)\.svg)/
    )
    let image = String(item.img).match(regEx)
    if (image !== null) {
      updateData.img = 'systems/CoC7/assets/icons/' + image[1]
    }
    if (item.type === 'setup') {
      for (const [k, v] of Object.entries(item.data.items)) {
        image = String(v.img).match(regEx)
        if (image !== null) {
          if (typeof updateData['data.items'] === 'undefined') {
            updateData['data.items'] = item.data.items
          }
          updateData['data.items'][k].img =
            'systems/CoC7/assets/icons/' + image[1]
        }
      }
    } else if (item.type === 'occupation') {
      for (const [k, v] of Object.entries(item.data.skills)) {
        image = String(v.img).match(regEx)
        if (image !== null) {
          if (typeof updateData['data.skills'] === 'undefined') {
            updateData['data.skills'] = item.data.skills
          }
          updateData['data.skills'][k].img =
            'systems/CoC7/assets/icons/' + image[1]
        }
      }
      for (const [o, g] of Object.entries(item.data.groups)) {
        for (const [k, v] of Object.entries(g.skills)) {
          image = String(v.img).match(regEx)
          if (image !== null) {
            if (typeof updateData['data.groups'] === 'undefined') {
              updateData['data.groups'] = item.data.groups
            }
            updateData['data.groups'][o].skills[k].img =
              'systems/CoC7/assets/icons/' + image[1]
          }
        }
      }
    } else if (item.type === 'book') {
      for (const [k, v] of Object.entries(item.data.spells)) {
        image = String(v.img).match(regEx)
        if (image !== null) {
          if (typeof updateData['data.spells'] === 'undefined') {
            updateData['data.spells'] = item.data.spells
          }
          updateData['data.spells'][k].img =
            'systems/CoC7/assets/icons/' + image[1]
        }
      }
    } else if (item.type === 'archetype') {
      for (const [k, v] of Object.entries(item.data.skills)) {
        image = String(v.img).match(regEx)
        if (image !== null) {
          if (typeof updateData['data.skills'] === 'undefined') {
            updateData['data.skills'] = item.data.skills
          }
          updateData['data.skills'][k].img =
            'systems/CoC7/assets/icons/' + image[1]
        }
      }
    }
    return updateData
  }

  static _migrateActorArtwork (actor, updateData) {
    const regEx = new RegExp(
      /systems\/CoC7\/artwork\/icons\/((hanging-spider|paranoia|skills|tentacles-skull)\.svg)/
    )
    const image = String(actor.img).match(regEx)
    if (image !== null) {
      updateData.img = 'systems/CoC7/assets/icons/' + image[1]
    }
    return updateData
  }

  static _migrateActorCharacterSanity (actor, updateData) {
    if (actor.type === 'character') {
      const oneFifthSanity = Math.ceil(actor.data.attribs.san.value / 5)
      if (
        typeof actor.data.attribs.san.dailyLoss === 'undefined' ||
        actor.data.attribs.san.dailyLoss === null
      ) {
        updateData['data.attribs.san.dailyLoss'] = 0
      }
      if (
        typeof actor.data.attribs.san.oneFifthSanity === 'undefined' ||
        actor.data.attribs.san.oneFifthSanity === null
      ) {
        updateData['data.attribs.san.oneFifthSanity'] = ' / ' + oneFifthSanity
      }
      if (
        typeof actor.data.attribs.san.dailyLoss === 'undefined' ||
        actor.data.attribs.san.dailyLoss === null
      ) {
        updateData['data.attribs.san.dailyLoss'] = 0
      }
      if (
        typeof actor.data.indefiniteInsanityLevel === 'undefined' ||
        actor.data.indefiniteInsanityLevel === null ||
        typeof actor.data.indefiniteInsanityLevel.value === 'undefined' ||
        actor.data.indefiniteInsanityLevel.value === null
      ) {
        updateData['data.indefiniteInsanityLevel.value'] = 0
      }
      if (
        typeof actor.data.indefiniteInsanityLevel === 'undefined' ||
        actor.data.indefiniteInsanityLevel === null ||
        typeof actor.data.indefiniteInsanityLevel.max === 'undefined' ||
        actor.data.indefiniteInsanityLevel.max === null
      ) {
        updateData['data.indefiniteInsanityLevel.max'] = oneFifthSanity
      }
      if (
        typeof actor.data.attribs.mp.value === 'undefined' ||
        actor.data.attribs.mp.value === null
      ) {
        updateData['data.attribs.mp.value'] = oneFifthSanity
      }
      if (
        typeof actor.data.attribs.mp.max === 'undefined' ||
        actor.data.attribs.mp.max === null
      ) {
        updateData['data.attribs.mp.max'] = oneFifthSanity
      }
      if (
        typeof actor.data.notes === 'undefined' ||
        actor.data.notes === null
      ) {
        updateData['data.notes'] = ''
      }
    }
    return updateData
  }

  static _migrateTableArtwork (table, updateData) {
    const regEx = new RegExp(
      /systems\/CoC7\/artwork\/icons\/((hanging-spider|paranoia|skills|tentacles-skull)\.svg)/
    )
    let image = String(table.img).match(regEx)
    if (image !== null) {
      updateData.img = 'systems/CoC7/assets/icons/' + image[1]
    }
    for (const [k, v] of Object.entries(table.results)) {
      image = String(v.img).match(regEx)
      if (image !== null) {
        if (typeof updateData.results === 'undefined') {
          updateData.results = table.results
        }
        updateData.results[k].img = 'systems/CoC7/assets/icons/' + image[1]
      }
    }
    return updateData
  }
}
