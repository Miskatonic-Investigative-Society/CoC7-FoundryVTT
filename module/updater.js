/* global Dialog, game, isNewerVersion */

export class Updater {
  static async checkForUpdate () {
    const systemUpdateVersion = game.settings.get('CoC7', 'systemUpdateVersion')
    if (isNewerVersion('0.2', systemUpdateVersion)) {
      if (game.user.isGM) {
        new Dialog({
          title: 'Update required',
          content: `<p>An update is required for your version ${game.system.data.version}. Please backup your world folder before starting the upgrade.`,
          buttons: {
            update: {
              label: 'Update',
              callback: async () => Updater.update(systemUpdateVersion)
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

  static async update (systemUpdateVersion) {
    for (const entity of game.actors.contents && game.items.contents) {
      await Updater.updateEntity(systemUpdateVersion, entity)
    }
    game.settings.set('CoC7', 'systemUpdateVersion', '0.2')
  }

  static async update (systemUpdateVersion, entity) {
    switch (systemUpdateVersion) {
      case '0.0':
        if (entity.type === 'character') {
          for (const item of entity.items) {
            if (item.data.type === 'skill' && item.data.data.value) {
              const exp = item.data.data.adjustments?.experience
                ? parseInt(item.data.data.adjustments.experience)
                : 0
              await entity.updateEmbeddedEntity('OwnedItem', {
                _id: item._id,
                'data.adjustments.experience':
                  exp + parseInt(item.data.data.value) - item.value,
                'data.value': null
              })
            }
          }
        }
        break
      case '0.1':
        if (entity.type === 'character') {
          const defaults = {}
          const oneFifthSanity = Math.ceil(
            entity.data.data.attribs.san.value / 5
          )
          if (
            typeof entity.data.data.attribs.san.dailyLoss === 'undefined' ||
            entity.data.data.attribs.san.dailyLoss === null
          ) {
            defaults['data.attribs.san.dailyLoss'] = 0
          }
          if (
            typeof entity.data.data.attribs.san.oneFifthSanity ===
              'undefined' ||
            entity.data.data.attribs.san.oneFifthSanity === null
          ) {
            defaults['data.attribs.san.oneFifthSanity'] = ' / ' + oneFifthSanity
          }
          if (
            typeof entity.data.data.indefiniteInsanityLevel === 'undefined' ||
            entity.data.data.indefiniteInsanityLevel === null ||
            typeof entity.data.data.indefiniteInsanityLevel.value ===
              'undefined' ||
            entity.data.data.indefiniteInsanityLevel.value === null
          ) {
            defaults['data.indefiniteInsanityLevel.value'] = 0
          }
          if (
            typeof entity.data.data.indefiniteInsanityLevel === 'undefined' ||
            entity.data.data.indefiniteInsanityLevel === null ||
            typeof entity.data.data.indefiniteInsanityLevel.max ===
              'undefined' ||
            entity.data.data.indefiniteInsanityLevel.max === null
          ) {
            defaults['data.indefiniteInsanityLevel.max'] = oneFifthSanity
          }
          if (
            typeof entity.data.data.attribs.mp.value === 'undefined' ||
            entity.data.data.attribs.mp.value === null
          ) {
            defaults['data.attribs.mp.value'] = oneFifthSanity
          }
          if (
            typeof entity.data.data.attribs.mp.max === 'undefined' ||
            entity.data.data.attribs.mp.max === null
          ) {
            defaults['data.attribs.mp.max'] = oneFifthSanity
          }
          if (
            typeof entity.data.data.notes === 'undefined' ||
            entity.data.data.notes === null
          ) {
            defaults['data.notes'] = ''
          }
          if (Object.keys(defaults).length > 0) {
            await entity.update(defaults)
          }
        }
        break
      case '0.2':
        if (
          entity.type === 'skill' &&
          entity.img === 'systems/CoC7/artwork/icons/skills.svg'
        ) {
          entity.update({ img: 'systems/CoC7/assets/icons/skills.svg' })
        }
        if (entity.type === 'book' && entity.img === 'icons/svg/item-bag.svg') {
          entity.update({ img: 'icons/svg/book.svg' })
        }
        if (
          entity.type === 'status' &&
          entity.img === 'icons/svg/item-bag.svg'
        ) {
          entity.update({ img: 'icons/svg/aura.svg' })
        }
        if (entity.type === 'weapon' && entity.img === 'icons/svg/sword.svg') {
          entity.update({ img: 'icons/svg/sword.svg' })
        }
        break
    }
  }
}
