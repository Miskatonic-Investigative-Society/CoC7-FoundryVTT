/* global Actor, ActorSheet, canvas, CONFIG, FormApplication, foundry, fromUuid, game, ui */
import { COC7 } from '../config.js'

export default class CoCIDActorUpdateItems extends FormApplication {
  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'coc-id-actor-update-items',
      classes: ['coc7', 'dialog', 'investigator-wizard'],
      title: game.i18n.localize('CoC7.ActorCoCIDItemsBest'),
      template: 'systems/CoC7/templates/apps/coc-id-actor-update-items.hbs',
      width: 520,
      height: 410,
      closeOnSubmit: false
    })
  }

  async getData () {
    const sheetData = await super.getData()

    sheetData.lang = CONFIG.supportedLanguages[game.i18n.lang] ?? '?'
    const defaultEra = game.settings.get('CoC7', 'worldEra')
    sheetData.isEn = game.i18n.lang === 'en'
    sheetData.era = game.i18n.format(COC7.eras[defaultEra] ?? 'CoC7.CoCIDFlag.error.unknown-era', { era: defaultEra })

    return sheetData
  }

  getUpdateData (item) {
    const output = {
      flags: {
        CoC7: {
          cocidFlag: item.flags.CoC7.cocidFlag
        }
      },
      name: item.name,
      system: {}
    }
    for (const key of ['chat', 'keeper', 'notes', 'opposingDifficulty', 'pushedFaillureConsequences', 'special', 'value']) {
      if (typeof item.system.description?.[key] === 'string' && item.system.description[key].length) {
        if (!Object.prototype.hasOwnProperty.call(output.system, 'description')) {
          output.system.description = {}
        }
        output.system.description[key] = item.system.description[key]
      }
    }
    switch (item.type) {
      case 'archetype':
        output.system.suggestedOccupations = item.system.suggestedOccupations
        output.system.suggestedTraits = item.system.suggestedTraits
        break
      case 'book':
        break
      case 'occupation':
        output.system.suggestedContacts = item.system.suggestedContacts
        break
      case 'skill':
        output.system.skillName = item.system.skillName
        output.system.specialization = item.system.specialization
        break
      case 'spell':
        break
      case 'status':
        break
      case 'weapon':
        break
    }
    return output
  }

  async updateActors (actorList, parent, any) {
    if (parent) {
      const unlinkedActors = await actorList.filter(a => a.token?.actorLink === false).map(a => a.id).filter((a, o, v) => v.indexOf(a) === o).reduce(async (c, i) => {
        c.push(await fromUuid('Actor.' + i))
        return c
      }, [])
      actorList = unlinkedActors.concat(actorList)
    }
    const ids = {}
    const anys = {}
    for (const actor of actorList) {
      for (const item of actor.items.contents) {
        if (typeof item.flags?.CoC7?.cocidFlag?.id === 'string') {
          if (!any && item.flags.CoC7.cocidFlag.id.match(/-any$/)) {
            if (!Object.prototype.hasOwnProperty.call(anys, item.flags.CoC7.cocidFlag.id)) {
              anys[item.flags.CoC7.cocidFlag.id] = []
            }
            anys[item.flags.CoC7.cocidFlag.id].push(actor.name)
          } else {
            ids[item.flags.CoC7.cocidFlag.id] = {}
          }
        }
      }
    }
    const found = await game.system.api.cocid.fromCoCIDRegexBest({ cocidRegExp: game.system.api.cocid.makeGroupRegEx(Object.keys(ids)), type: 'i', showLoading: true })
    for (const item of found) {
      ids[item.flags.CoC7.cocidFlag.id] = this.getUpdateData(item.toObject())
    }
    if (Object.keys(anys).length) {
      console.log('Invalid any keys on Actors', anys)
    }
    const actorUpdates = []
    const tokenUpdates = []
    for (const actor of actorList) {
      const updates = []
      for (const item of actor.items.contents) {
        if (Object.prototype.hasOwnProperty.call(ids, item.flags?.CoC7?.cocidFlag?.id) && Object.keys(ids[item.flags.CoC7.cocidFlag.id]).length) {
          updates.push(foundry.utils.mergeObject({
            _id: item.id
          }, ids[item.flags.CoC7.cocidFlag.id]))
        }
      }
      if (updates.length) {
        if (actor.parent) {
          tokenUpdates.push({
            updates: {
              _id: actor.id,
              items: updates
            },
            operation: {
              parent: actor.parent
            }
          })
        } else {
          actorUpdates.push({
            _id: actor.id,
            items: updates
          })
        }
      }
    }
    if (actorUpdates.length) {
      await Actor.updateDocuments(actorUpdates)
    }
    for (const tokenUpdate of tokenUpdates) {
      await Actor.updateDocuments([tokenUpdate.updates], tokenUpdate.operation)
    }
  }

  async _updateObject (event, formData) {
    if (event.submitter?.dataset.button === 'update') {
      if (event.submitter.className.indexOf('currently-submitting') > -1) {
        return
      }
      event.submitter.className = event.submitter.className + ' currently-submitting'
      const parent = typeof formData['coc-id-actor-update-items-parent'] === 'string'
      const any = typeof formData['coc-id-actor-update-items-any'] === 'string'
      const which = (formData['coc-id-actor-update-items-which'] ?? '').toString()
      switch (which) {
        case '1':
          await this.updateActors(canvas.scene.tokens.contents.map(d => d.object.actor), parent, any)
          break
        case '2':
          await this.updateActors(Object.values(ui.windows).filter(s => s instanceof ActorSheet).map(s => s.object), parent, any)
          break
        case '3':
          await this.updateActors(game.actors.contents, false, any)
          break
      }
    }
    this.close()
  }

  static async create (options = {}) {
    new CoCIDActorUpdateItems(options).render(true)
  }
}
