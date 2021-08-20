/* global Dialog, game, isNewerVersion, ui */

export class Updater {
  static async checkForUpdate () {
    this.systemUpdateVersion = String(
      game.settings.get('CoC7', 'systemUpdateVersion')
    )
    if (isNewerVersion('0.3', this.systemUpdateVersion)) {
      if (game.user.isGM) {
        new Dialog({
          title: 'Update required',
          content: `<p>An update is required for your version ${game.system.data.version}. Please backup your world folder before starting the upgrade.`,
          buttons: {
            update: {
              label: 'Update',
              callback: async () => Updater.update()
            },
            skip: {
              label: 'Skip',
              callback: () => {}
            }
          }
        }).render(true)
      } else {
        new Dialog({
          title: 'Update required',
          content: `<p>An update is required for your version ${game.system.data.version}. Please wait for your GM to update the system then refresh (F5) this page.`,
          buttons: {
            OK: {
              label: 'OK',
              callback: () => {}
            }
          }
        }).render(true)
      }
    }
  }

  static async update () {
    for (const actor of game.actors.contents) {
      await Updater.updateActor(actor)
    }
    for (const item of game.items.contents) {
      await Updater.updateItem(item)
    }
    for (const pack of game.packs) {
      if (pack.metadata.package === 'world') {
        switch (pack.metadata.entity) {
          case 'Actor':
          // fall through
          case 'Item':
          // fall through
          case 'RollTable':
            await Updater.updatePack(pack)
            break
        }
      }
    }
    for (const table of game.tables.contents) {
      await Updater.updateTable(table)
    }

    game.settings.set('CoC7', 'systemUpdateVersion', '0.2')
  }

  static async updateActor (actor, pack = null) {
    if (actor.data.type === 'character') {
      for (const item of actor.items) {
        switch (this.systemUpdateVersion) {
          case '0.0':
            if (item.data.type === 'skill' && item.data.data.value) {
              const exp = item.data.data.adjustments?.experience
                ? parseInt(item.data.data.adjustments.experience)
                : 0
              console.log(
                'Migrating actor (' +
                  actor.name +
                  ') item (' +
                  item.name +
                  ')' +
                  (pack !== null ? ' in pack ' + pack.title : '')
              )
              await actor.updateEmbeddedDocuments('Item', [
                {
                  _id: item.id,
                  'data.adjustments.experience':
                    exp + parseInt(item.data.data.value) - item.value,
                  'data.value': null
                }
              ])
            }
          // fall through
          case '0.1':
          // fall through
          case '0.2':
          // fall through
        }
      }
      const defaults = {}
      const oneFifthSanity = Math.ceil(actor.data.data.attribs.san.value / 5)
      switch (this.systemUpdateVersion) {
        case '0.0':
        // fall through
        case '0.1':
          if (
            typeof actor.data.data.attribs.san.dailyLoss === 'undefined' ||
            actor.data.data.attribs.san.dailyLoss === null
          ) {
            defaults['data.attribs.san.dailyLoss'] = 0
          }
          if (
            typeof actor.data.data.attribs.san.oneFifthSanity === 'undefined' ||
            actor.data.data.attribs.san.oneFifthSanity === null
          ) {
            defaults['data.attribs.san.oneFifthSanity'] = ' / ' + oneFifthSanity
          }
          if (
            typeof actor.data.data.indefiniteInsanityLevel === 'undefined' ||
            actor.data.data.indefiniteInsanityLevel === null ||
            typeof actor.data.data.indefiniteInsanityLevel.value ===
              'undefined' ||
            actor.data.data.indefiniteInsanityLevel.value === null
          ) {
            defaults['data.indefiniteInsanityLevel.value'] = 0
          }
          if (
            typeof actor.data.data.indefiniteInsanityLevel === 'undefined' ||
            actor.data.data.indefiniteInsanityLevel === null ||
            typeof actor.data.data.indefiniteInsanityLevel.max ===
              'undefined' ||
            actor.data.data.indefiniteInsanityLevel.max === null
          ) {
            defaults['data.indefiniteInsanityLevel.max'] = oneFifthSanity
          }
          if (
            typeof actor.data.data.attribs.mp.value === 'undefined' ||
            actor.data.data.attribs.mp.value === null
          ) {
            defaults['data.attribs.mp.value'] = oneFifthSanity
          }
          if (
            typeof actor.data.data.attribs.mp.max === 'undefined' ||
            actor.data.data.attribs.mp.max === null
          ) {
            defaults['data.attribs.mp.max'] = oneFifthSanity
          }
          if (
            typeof actor.data.data.notes === 'undefined' ||
            actor.data.data.notes === null
          ) {
            defaults['data.notes'] = ''
          }
          if (Object.keys(defaults).length > 0) {
            console.log(
              'Migrating actor (' +
                actor.name +
                ')' +
                (pack !== null ? ' in pack ' + pack.title : '')
            )
            await actor.update(defaults)
          }
        // fall through
        case '0.2':
        // fall through
      }
    }
    if (pack === null) {
      for (const item of actor.items) {
        Updater.updateItem(item, actor, pack)
      }
    }
    const defaults = {}
    try {
      const image = actor.data.img.match(
        /systems\/CoC7\/artwork\/icons\/((hanging-spider|paranoia|skills|tentacles-skull)\.svg)/
      )
      if (image !== null) {
        defaults.img = 'systems/CoC7/assets/icons/' + image[1]
      }
    } catch (e) {
      ui.notifications.error(e.message)
    }
    if (Object.keys(defaults).length > 0) {
      console.log(
        'Migrating actor (' +
          actor.name +
          ')' +
          (pack !== null ? ' in pack ' + pack.title : '')
      )
      await actor.update(defaults)
    }
  }

  static async updateItem (item, actor = null, pack = null) {
    const defaults = {}
    switch (this.systemUpdateVersion) {
      case '0.0':
      // fall through
      case '0.1':
      // fall through
      case '0.2':
        try {
          let image = item.img.match(
            /systems\/CoC7\/artwork\/icons\/((hanging-spider|paranoia|skills|tentacles-skull)\.svg)/
          )
          if (image !== null) {
            defaults.img = 'systems/CoC7/assets/icons/' + image[1]
          }
          if (item.type === 'setup') {
            for (const [k, v] of Object.entries(item.data.data.items)) {
              image = v.img.match(
                /systems\/CoC7\/artwork\/icons\/((hanging-spider|paranoia|skills|tentacles-skull)\.svg)/
              )
              if (image !== null) {
                item.data.data.items[k].img =
                  'systems/CoC7/assets/icons/' + image[1]
                defaults['data.items'] = item.data.data.items
              }
            }
          } else if (item.type === 'occupation') {
            for (const [k, v] of Object.entries(item.data.data.skills)) {
              image = v.img.match(
                /systems\/CoC7\/artwork\/icons\/((hanging-spider|paranoia|skills|tentacles-skull)\.svg)/
              )
              if (image !== null) {
                item.data.data.skills[k].img =
                  'systems/CoC7/assets/icons/' + image[1]
                defaults['data.skills'] = item.data.data.skills
              }
            }
            for (const [o, g] of Object.entries(item.data.data.groups)) {
              for (const [k, v] of Object.entries(g.skills)) {
                image = v.img.match(
                  /systems\/CoC7\/artwork\/icons\/((hanging-spider|paranoia|skills|tentacles-skull)\.svg)/
                )
                if (image !== null) {
                  item.data.data.groups[o].skills[k].img =
                    'systems/CoC7/assets/icons/' + image[1]
                  defaults['data.groups'] = item.data.data.groups
                }
              }
            }
          } else if (item.type === 'book') {
            for (const [k, v] of Object.entries(item.data.data.spells)) {
              image = v.img.match(
                /systems\/CoC7\/artwork\/icons\/((hanging-spider|paranoia|skills|tentacles-skull)\.svg)/
              )
              if (image !== null) {
                item.data.data.spells[k].img =
                  'systems/CoC7/assets/icons/' + image[1]
                defaults['data.spells'] = item.data.data.spells
              }
            }
          } else if (item.type === 'archetype') {
            for (const [k, v] of Object.entries(item.data.data.skills)) {
              image = v.img.match(
                /systems\/CoC7\/artwork\/icons\/((hanging-spider|paranoia|skills|tentacles-skull)\.svg)/
              )
              if (image !== null) {
                item.data.data.skills[k].img =
                  'systems/CoC7/assets/icons/' + image[1]
                defaults['data.skills'] = item.data.data.skills
              }
            }
          }
        } catch (e) {
          ui.notifications.error(e.message)
        }
        if (Object.keys(defaults).length > 0) {
          if (actor === null) {
            console.log(
              'Migrating item (' +
                item.name +
                ')' +
                (pack !== null ? ' in pack ' + pack.title : '')
            )
            await item.update(defaults)
          } else {
            defaults._id = item.id
            console.log(
              'Migrating actor (' +
                actor.name +
                ') item (' +
                item.name +
                ')' +
                (pack !== null ? ' in pack ' + pack.title : '')
            )
            await actor.updateEmbeddedDocuments('Item', [defaults])
          }
        }
      // fall through
    }
  }

  static async updatePack (pack) {
    const locked = pack.locked
    if (locked) {
      await pack.configure({ locked: false })
    }
    await pack.migrate()
    const documents = await pack.getDocuments()
    for (const doc of documents) {
      switch (pack.metadata.entity) {
        case 'Actor':
          await Updater.updateActor(doc, pack)
          break
        case 'Item':
          await Updater.updateItem(doc, null, pack)
          break
        case 'RollTable':
          await Updater.updateTable(doc, pack)
          break
      }
    }
    if (locked) {
      await pack.configure({ locked: true })
    }
  }

  static async updateTable (table, pack = null) {
    const defaults = {}
    switch (this.systemUpdateVersion) {
      case '0.0':
      // fall through
      case '0.1':
      // fall through
      case '0.2':
        try {
          const image = table.data.img.match(
            /systems\/CoC7\/artwork\/icons\/((hanging-spider|paranoia|skills|tentacles-skull)\.svg)/
          )
          if (image !== null) {
            defaults.img = 'systems/CoC7/assets/icons/' + image[1]
          }
        } catch (e) {
          ui.notifications.error(e.message)
        }
        if (Object.keys(defaults).length > 0) {
          console.log(
            'Migrating table (' +
              table.name +
              ')' +
              (pack !== null ? ' in pack ' + pack.title : '')
          )
          await table.update(defaults)
        }
      // fall through
    }
  }
}
