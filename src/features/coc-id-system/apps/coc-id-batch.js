/* global $, CONFIG, FormApplication, foundry, game, Item */
import { CoC7Utilities } from '../../../shared/utilities.js'

export class CoCIDBatch extends FormApplication {
  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['coc7', 'dialog', 'coc-id-editor'],
      template: 'systems/CoC7/templates/apps/coc-id-batch.hbs',
      width: 700,
      height: 'auto',
      title: 'CoC7.CoCIDFlag.title',
      closeOnSubmit: false,
      submitOnClose: false,
      submitOnChange: false
    })
  }

  async getData () {
    const sheetData = super.getData()
    sheetData.foundKeys = Object.keys(sheetData.object.foundKeys).reduce((out, key) => {
      out.push({ name: key, key: sheetData.object.foundKeys[key] })
      return out
    }, []).sort(CoC7Utilities.sortByNameKey)
    sheetData.missingNames = Object.keys(sheetData.object.missingNames).reduce((out, key) => {
      out.push({ key: sheetData.object.foundKeys[key] ?? '', name: key, custom: sheetData.object.missingNames[key], suffix: sheetData.object.missingNames[key].replace(this.object.suffixRegExp, '') })
      return out
    }, []).sort(CoC7Utilities.sortByNameKey)
    return sheetData
  }

  activateListeners (html) {
    super.activateListeners(html)
    html.find('.existing').change(this.onSetName.bind(this))
    html.find('.fa-wand-magic').click(this.onClickGuess.bind(this))
    html.find('input').keyup(this.onKeyup.bind(this))
  }

  onSetName (event) {
    const obj = $(event.currentTarget)
    this.object.missingNames[obj.closest('li').data('name')] = obj.val()
    this.render(true)
  }

  onClickGuess (event) {
    const obj = $(event.currentTarget)
    const name = obj.closest('li').data('name')
    this.object.missingNames[name] = this.object.idPrefix + CoC7Utilities.toKebabCase(name)
    this.render(true)
  }

  onKeyup (event) {
    const obj = $(event.currentTarget)
    const name = obj.closest('li').data('name')
    this.object.missingNames[name] = this.object.idPrefix + obj.val()
  }

  async _updateObject (event, formData) {
    if (event.submitter) {
      if (this.object.typeName === game.i18n.localize('CoC7.Entities.Skill')) {
        this.close()
        await CoCIDBatch.processSkillKeys(this.object.updateList, this.object.missingNames)
      }
      this.object.resolve(true)
    }
  }

  static async processSkillKeys (updateList, missingNames) {
    const items = []
    const actors = {}
    const scenes = {}
    for (const update of updateList) {
      update.cocidFlag.id = missingNames[update.name]
      if (typeof update.cocidFlag.lang === 'undefined') {
        update.cocidFlag.lang = game.i18n.lang
      }
      if (typeof update.cocidFlag.priority === 'undefined') {
        update.cocidFlag.priority = 0
      }
      if (typeof update.cocidFlag.eras === 'undefined') {
        update.cocidFlag.eras = {}
      }
      const flags = foundry.utils.flattenObject({ flags: { CoC7: { cocidFlag: update.cocidFlag } } })
      if (typeof update.scene !== 'undefined') {
        if (typeof scenes[update.scene] === 'undefined') {
          const scene = game.scenes.get(update.scene)
          scenes[update.scene] = scene.toObject()
        }
        const tokenOffset = scenes[update.scene].tokens.findIndex(t => t._id === update.token)
        if (tokenOffset > -1) {
          const itemOffset = scenes[update.scene].tokens[tokenOffset].actorData.items.findIndex(i => i._id === update.item)
          if (itemOffset > -1) {
            const expandedFlags = foundry.utils.expandObject(Object.entries(flags).reduce((out, entry) => {
              if (entry[0].match(/^flags\.CoC7\.cocidFlag/)) {
                out[entry[0]] = entry[1]
              }
              return out
            }, {}))
            scenes[update.scene].tokens[tokenOffset].actorData.items[itemOffset] = foundry.utils.mergeObject(scenes[update.scene].tokens[tokenOffset].actorData.items[itemOffset], expandedFlags)
          }
        }
      } else if (typeof update.actor !== 'undefined') {
        if (typeof actors[update.actor] === 'undefined') {
          actors[update.actor] = []
        }
        const item = {
          _id: update.item
        }
        for (const key of Object.keys(flags)) {
          if (key.match(/^flags\.CoC7\.cocidFlag/)) {
            item[key] = flags[key]
          }
        }
        actors[update.actor].push(item)
      } else {
        const item = {
          _id: update.item
        }
        for (const key of Object.keys(flags)) {
          if (key.match(/^flags\.CoC7\.cocidFlag/)) {
            item[key] = flags[key]
          }
        }
        items.push(item)
      }
    }
    if (items.length) {
      await Item.updateDocuments(items)
    }
    if (Object.keys(actors).length) {
      for (const actorId of Object.keys(actors)) {
        await Item.updateDocuments(actors[actorId], { parent: game.actors.get(actorId) })
      }
    }
    if (Object.keys(scenes).length) {
      for (const sceneId of Object.keys(scenes)) {
        const scene = game.scenes.get(sceneId)
        scene.update(scenes[sceneId])
      }
    }
    return true
  }

  static async populateSkillKeys (updateList, missingNames, foundKeys) {
    for (const actor of game.actors.contents) {
      const actorData = actor.toObject()
      if (actorData.items) {
        for (const item of actorData.items) {
          const itemData = item instanceof CONFIG.Item.documentClass ? item.toObject() : item
          if (itemData.type === 'skill') {
            if (!itemData.flags.CoC7?.cocidFlag?.id?.match(/^i.skill/)) {
              if (typeof missingNames[itemData.name] === 'undefined') {
                missingNames[itemData.name] = ''
              }
              updateList.push({
                actor: actor._id,
                item: itemData._id,
                name: itemData.name,
                cocidFlag: itemData.flags.CoC7?.cocidFlag ?? {}
              })
            } else {
              foundKeys[itemData.name] = itemData.flags.CoC7.cocidFlag.id
            }
          }
        }
      }
    }
    for (const item of game.items.contents) {
      const itemData = item instanceof CONFIG.Item.documentClass ? item.toObject() : item
      if (itemData.type === 'skill') {
        if (!itemData.flags.CoC7?.cocidFlag?.id?.match(/^i.skill/)) {
          if (typeof missingNames[itemData.name] === 'undefined') {
            missingNames[itemData.name] = ''
          }
          updateList.push({
            item: itemData._id,
            name: itemData.name,
            cocidFlag: itemData.flags.CoC7?.cocidFlag ?? {}
          })
        } else {
          foundKeys[itemData.name] = itemData.flags.CoC7.cocidFlag.id
        }
      }
    }
    for (const scene of game.scenes) {
      const sceneData = scene.toObject()
      for (const token of sceneData.tokens ?? []) {
        if (token.actorId && !token.actorLink) {
          if (token.actorData) {
            const actorData = foundry.utils.duplicate(token.actorData)
            for (const item of actorData.items ?? []) {
              const itemData = item instanceof CONFIG.Item.documentClass ? item.toObject() : item
              if (itemData.type === 'skill') {
                if (!itemData.flags.CoC7?.cocidFlag?.id?.match(/^i.skill/)) {
                  if (typeof missingNames[itemData.name] === 'undefined') {
                    missingNames[itemData.name] = ''
                  }
                  updateList.push({
                    scene: sceneData._id,
                    token: token._id,
                    item: itemData._id,
                    name: itemData.name,
                    cocidFlag: itemData.flags.CoC7?.cocidFlag ?? {}
                  })
                } else {
                  foundKeys[itemData.name] = itemData.flags.CoC7.cocidFlag.id
                }
              }
            }
          }
        }
      }
    }
    if (Object.keys(missingNames).filter(key => missingNames[key] === '').length > 0) {
      const items = await game.system.api.cocid.fromCoCIDRegexBest({ cocidRegExp: /^i\.skill\./, type: 'i', era: false })
      for (const item of items) {
        foundKeys[item.name] = item.flags.CoC7.cocidFlag.id
      }
      const CoCIDKeys = Object.assign(foundry.utils.flattenObject(game.i18n._fallback.CoC7?.CoCIDFlag?.keys ?? {}), foundry.utils.flattenObject(game.i18n.translations.CoC7?.CoCIDFlag?.keys ?? {}))
      for (const key in CoCIDKeys) {
        foundKeys[game.i18n.format('CoC7.CoCIDFlag.keys.' + key)] = key
      }
      for (const name in missingNames) {
        if (typeof foundKeys[name] !== 'undefined') {
          missingNames[name] = foundKeys[name]
        }
      }
    }
  }

  static async create (type) {
    const updateList = []
    const missingNames = {}
    const foundKeys = {}
    let typeName = ''
    let idPrefix = ''
    let suffixRegExp = null
    switch (type) {
      case 'skill':
        typeName = game.i18n.localize('CoC7.Entities.Skill')
        idPrefix = 'i.skill.'
        suffixRegExp = /^i\.skill\./
        break
      default:
        return false
    }
    await CoCIDBatch.populateSkillKeys(updateList, missingNames, foundKeys)
    if (Object.keys(missingNames).filter(key => missingNames[key] === '').length === 0) {
      await CoCIDBatch.processSkillKeys(updateList, missingNames)
      return true
    }
    return new Promise(resolve => {
      const dlg = new CoCIDBatch({ typeName, idPrefix, suffixRegExp, updateList, missingNames, foundKeys, resolve })
      dlg.render(true)
    })
  }
}
