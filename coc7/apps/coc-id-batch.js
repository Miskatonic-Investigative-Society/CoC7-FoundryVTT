/* global foundry fromUuid game Item */
import { FOLDER_ID } from '../constants.js'
import CoC7Utilities from './utilities.js'

export default class CoCIDBatch extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  /**
   * @inheritdoc
   */
  constructor (...args) {
    const coc7Config = args.pop()
    super(...args)
    this.coc7Config = coc7Config
    this.coc7Config.cocidRegExp = new RegExp('^' + CoC7Utilities.quoteRegExp(this.coc7Config.idPrefix))
  }

  static DEFAULT_OPTIONS = {
    tag: 'form',
    classes: ['coc7', 'dialog'],
    window: {
      title: 'CoC7.CoCIDBatch.title',
      contentClasses: [
        'standard-form'
      ]
    },
    form: {
      closeOnSubmit: false,
      submitOnClose: false,
      submitOnChange: false,
      handler: CoCIDBatch.#onSubmit
    },
    position: {
      width: 700
    }
  }

  static PARTS = {
    header: {
      template: 'systems/' + FOLDER_ID + '/templates/apps/coc-id-batch-header.hbs'
    },
    body: {
      template: 'systems/' + FOLDER_ID + '/templates/apps/coc-id-batch-body.hbs',
      scrollable: []
    },
    footer: {
      template: 'templates/generic/form-footer.hbs'
    }
  }

  /**
   * @inheritdoc
   * @param {string} partId
   * @param {ApplicationRenderContext} context
   * @param {HandlebarsRenderOptions} options
   * @returns {Promise<ApplicationRenderContext>}
   */
  async _preparePartContext (partId, context, options) {
    context = await super._preparePartContext(partId, context, options)

    switch (partId) {
      case 'header':
        context.typeName = this.coc7Config.typeName
        break
      case 'body':
        context.idPrefix = this.coc7Config.idPrefix
        context.typeName = this.coc7Config.typeName
        context.foundKeys = Object.keys(this.coc7Config.foundKeys).reduce((out, key) => {
          out.push({ name: key, key: this.coc7Config.foundKeys[key] })
          return out
        }, []).sort(CoC7Utilities.sortByNameKey)
        context.missingNames = Object.keys(this.coc7Config.missingNames).reduce((out, key) => {
          out.push({ key: this.coc7Config.foundKeys[key] ?? '', name: key, custom: this.coc7Config.missingNames[key], suffix: this.coc7Config.missingNames[key].replace(this.coc7Config.cocidRegExp, '') })
          return out
        }, []).sort(CoC7Utilities.sortByNameKey)
        break
      case 'footer':
        context.buttons = [{
          type: 'submit',
          action: 'okay',
          label: 'CoC7.Migrate.ButtonUpdate',
          icon: 'fa-solid fa-check'
        }]
        break
    }
    return context
  }

  /**
   * @inheritdoc
   * @param {ApplicationRenderContext} context
   * @param {RenderOptions} options
   * @returns {Promise<void>}
   */
  async _onRender (context, options) {
    await super._onRender(context, options)

    this.element.querySelectorAll('[data-action]').forEach((element) => {
      element.addEventListener('click', event => {
        switch (event.currentTarget.dataset.action) {
          case 'guess-id':
            {
              const name = event.currentTarget.closest('.item').dataset.name
              if (name) {
                this.coc7Config.missingNames[name] = this.coc7Config.idPrefix + CoC7Utilities.toKebabCase(name)
                this.render()
              }
            }
            break
          case 'guess-toggle':
            {
              const rows = event.currentTarget.closest('.item-list').querySelectorAll('.item')
              for (const row of rows) {
                const name = row.dataset.name
                if (name && this.coc7Config.missingNames[name] === '') {
                  this.coc7Config.missingNames[name] = this.coc7Config.idPrefix + CoC7Utilities.toKebabCase(name)
                }
              }
              this.render()
            }
            break
        }
      })
    })

    this.element.querySelectorAll('input').forEach((element) => {
      element.addEventListener('change', event => {
        const name = event.currentTarget.closest('.item').dataset.name
        if (name) {
          this.coc7Config.missingNames[name] = event.currentTarget.value
          this.render()
        }
      })
    })

    this.element.querySelectorAll('select').forEach((element) => {
      element.addEventListener('change', event => {
        const name = event.currentTarget.closest('.item').dataset.name
        if (name) {
          this.coc7Config.missingNames[name] = event.currentTarget.value
          this.render()
        }
      })
    })
  }

  /**
   * Submit the configuration form.
   * @param {SubmitEvent} event
   * @param {HTMLFormElement} form
   * @param {FormDataExtended} formData
   * @returns {Promise<void>}
   */
  static async #onSubmit (event, form, formData) {
    switch (this.coc7Config.idType) {
      case 'i':
        this.close()
        await CoCIDBatch.processItemKeys({ updateList: this.coc7Config.updateList, missingNames: this.coc7Config.missingNames })
        break
    }
    this.close()
    this.coc7Config.resolve(true)
  }

  /**
   * Update documents on world, actor, then tokens
   * @param {object} options
   * @param {Array} options.updateList
   * @param {object} options.missingNames
   */
  static async processItemKeys ({ updateList, missingNames } = {}) {
    const actors = {}
    const foundCompendiumActor = {}
    const foundCompendiumItem = {}
    const items = []
    const tokenActors = {}
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
      if (typeof update.pack !== 'undefined' && typeof update.actor !== 'undefined') {
        if (typeof foundCompendiumActor[update.pack] === 'undefined') {
          foundCompendiumActor[update.pack] = {}
        }
        if (typeof foundCompendiumActor[update.pack][update.actor] === 'undefined') {
          foundCompendiumActor[update.pack][update.actor] = []
        }
        foundCompendiumActor[update.pack][update.actor].push({
          _id: update.item,
          flags: {
            [FOLDER_ID]: {
              cocidFlag: update.cocidFlag
            }
          }
        })
      } else if (typeof update.pack !== 'undefined') {
        if (typeof foundCompendiumItem[update.pack] === 'undefined') {
          foundCompendiumItem[update.pack] = []
        }
        foundCompendiumItem[update.pack].push({
          _id: update.item,
          flags: {
            [FOLDER_ID]: {
              cocidFlag: update.cocidFlag
            }
          }
        })
      } else if (typeof update.tokenActor !== 'undefined') {
        if (typeof tokenActors[update.tokenActor] === 'undefined') {
          tokenActors[update.tokenActor] = []
        }
        tokenActors[update.tokenActor].push({
          _id: update.item,
          flags: {
            [FOLDER_ID]: {
              cocidFlag: update.cocidFlag
            }
          }
        })
      } else if (typeof update.actor !== 'undefined') {
        if (typeof actors[update.actor] === 'undefined') {
          actors[update.actor] = []
        }
        actors[update.actor].push({
          _id: update.item,
          flags: {
            [FOLDER_ID]: {
              cocidFlag: update.cocidFlag
            }
          }
        })
      } else {
        items.push({
          _id: update.item,
          flags: {
            [FOLDER_ID]: {
              cocidFlag: update.cocidFlag
            }
          }
        })
      }
    }
    if (items.length) {
      await Item.updateDocuments(items)
    }
    for (const actorUuid of Object.keys(actors)) {
      await Item.updateDocuments(actors[actorUuid], { parent: await fromUuid(actorUuid) })
    }
    for (const actorUuid of Object.keys(tokenActors)) {
      await Item.updateDocuments(tokenActors[actorUuid], { parent: await fromUuid(actorUuid) })
    }
    for (const pack in foundCompendiumItem) {
      const wasLocked = game.packs.get(pack).locked
      if (wasLocked) {
        await game.packs.get(pack).configure({ locked: false })
      }
      await Item.updateDocuments(foundCompendiumItem[pack], { pack })
      if (wasLocked) {
        await game.packs.get(pack).configure({ locked: true })
      }
    }
    for (const pack in foundCompendiumActor) {
      const wasLocked = game.packs.get(pack).locked
      if (wasLocked) {
        await game.packs.get(pack).configure({ locked: false })
      }
      for (const parentUuid in foundCompendiumActor[pack]) {
        await Item.updateDocuments(foundCompendiumActor[pack][parentUuid], { parent: await fromUuid(parentUuid), pack })
      }
      if (wasLocked) {
        await game.packs.get(pack).configure({ locked: true })
      }
    }
    await CoCIDBatch.migrateThrowSkill()
  }

  /**
   * Check all world items and create list of items that required updates
   * @param {object} options
   * @param {string} options.itemType
   * @param {string} options.idType
   * @param {string} options.idPrefix
   * @param {Array} options.updateList
   * @param {object} options.missingNames
   * @param {object} options.foundKeys
   */
  static async populateItemKeys ({ itemType, idType, idPrefix, updateList, missingNames, foundKeys } = {}) {
    for (const actor of game.actors.contents) {
      if (actor.items) {
        for (const item of actor.items) {
          if (item.type === itemType) {
            if (!item.flags[FOLDER_ID]?.cocidFlag?.id?.startsWith(idPrefix)) {
              if (typeof missingNames[item.name] === 'undefined') {
                missingNames[item.name] = ''
              }
              updateList.push({
                actor: actor.uuid,
                item: item._id,
                name: item.name,
                cocidFlag: item.flags[FOLDER_ID]?.cocidFlag ?? {}
              })
            } else {
              foundKeys[item.name] = item.flags[FOLDER_ID].cocidFlag.id
            }
          }
        }
      }
    }
    for (const item of game.items.contents) {
      if (item.type === itemType) {
        if (!item.flags[FOLDER_ID]?.cocidFlag?.id?.startsWith(idPrefix)) {
          if (typeof missingNames[item.name] === 'undefined') {
            missingNames[item.name] = ''
          }
          updateList.push({
            item: item._id,
            name: item.name,
            cocidFlag: item.flags[FOLDER_ID]?.cocidFlag ?? {}
          })
        } else {
          foundKeys[item.name] = item.flags[FOLDER_ID].cocidFlag.id
        }
      }
    }
    for (const scene of game.scenes) {
      for (const token of scene.tokens ?? []) {
        if (!token.actorLink) {
          for (const item of token.delta?.items ?? []) {
            if (item.type === itemType) {
              if (!item.flags[FOLDER_ID]?.cocidFlag?.id?.startsWith(idPrefix)) {
                if (typeof missingNames[item.name] === 'undefined') {
                  missingNames[item.name] = ''
                }
                updateList.push({
                  tokenActor: token.actor.uuid,
                  item: item._id,
                  name: item.name,
                  cocidFlag: item.flags[FOLDER_ID]?.cocidFlag ?? {}
                })
              } else {
                foundKeys[item.name] = item.flags[FOLDER_ID].cocidFlag.id
              }
            }
          }
        }
      }
    }
    for (const pack of game.packs) {
      if (['world', 'module'].includes(pack.metadata.packageType)) {
        if (pack.metadata.type === 'Actor') {
          const documents = await pack.getDocuments()
          for (const actor of documents) {
            if (actor.items) {
              for (const item of actor.items) {
                if (item.type === itemType) {
                  if (!item.flags[FOLDER_ID]?.cocidFlag?.id?.startsWith(idPrefix)) {
                    if (typeof missingNames[item.name] === 'undefined') {
                      missingNames[item.name] = ''
                    }
                    updateList.push({
                      pack: pack.collection,
                      actor: actor.uuid,
                      item: item._id,
                      name: item.name,
                      cocidFlag: item.flags[FOLDER_ID]?.cocidFlag ?? {}
                    })
                  } else {
                    foundKeys[item.name] = item.flags[FOLDER_ID].cocidFlag.id
                  }
                }
              }
            }
          }
        } else if (pack.metadata.type === 'Item') {
          const documents = await pack.getDocuments()
          for (const item of documents) {
            if (item.type === itemType) {
              if (!item.flags[FOLDER_ID]?.cocidFlag?.id?.startsWith(idPrefix)) {
                if (typeof missingNames[item.name] === 'undefined') {
                  missingNames[item.name] = ''
                }
                updateList.push({
                  pack: pack.collection,
                  item: item._id,
                  name: item.name,
                  cocidFlag: item.flags[FOLDER_ID]?.cocidFlag ?? {}
                })
              } else {
                foundKeys[item.name] = item.flags[FOLDER_ID].cocidFlag.id
              }
            }
          }
        }
      }
    }
    if (Object.keys(missingNames).filter(key => missingNames[key] === '').length > 0) {
      const cocidRegExp = new RegExp('^' + CoC7Utilities.quoteRegExp(idPrefix))
      const items = await game.CoC7.cocid.fromCoCIDRegexBest({ cocidRegExp, type: idType, era: false, showLoading: true })
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

  /**
   * Migrate old Fighting (Throw) / Firearms (Throw) / Ranged (Throw) to Throw
   */
  static async migrateThrowSkill () {
    const foundActor = {}
    const foundCompendiumActor = {}
    const foundCompendiumItem = {}
    const foundItem = []
    const foundToken = {}
    for (const actor of game.actors.contents) {
      if (actor.items) {
        for (const item of actor.items) {
          if (item.type === 'skill' && item.flags[FOLDER_ID]?.cocidFlag?.id?.match(/^i.skill.(firearms|fighting|ranged)-throw$/) && item.system.properties?.special && (item.system.properties?.fighting || item.system.properties?.firearm || item.system.properties?.ranged)) {
            if (typeof foundActor[actor.uuid] === 'undefined') {
              foundActor[actor.uuid] = []
            }
            foundActor[actor.uuid].push({
              _id: item._id,
              name: item.system.skillName,
              ['flags.' + FOLDER_ID + '.cocidFlag.id']: 'i.skill.throw',
              'system.specialization': '',
              'system.properties.special': false,
              'system.properties.fighting': false,
              'system.properties.firearm': false,
              'system.properties.ranged': false
            })
          } else if (item.type === 'weapon' && (item.system?.skill?.main?.name?.match(/^i.skill.(firearms|fighting|ranged)-throw$/) || item.system?.skill?.alternativ?.name?.match(/^i.skill.(firearms|fighting|ranged)-throw$/))) {
            if (typeof foundActor[actor.uuid] === 'undefined') {
              foundActor[actor.uuid] = []
            }
            const row = {
              _id: item._id
            }
            if (item.system?.skill?.main?.name?.match(/^i.skill.(firearms|fighting|ranged)-throw$/)) {
              row['system.skill.main.name'] = 'i.skill.throw'
            }
            if (item.system?.skill?.alternativ?.name?.match(/^i.skill.(firearms|fighting|ranged)-throw$/)) {
              row['system.skill.alternativ.name'] = 'i.skill.throw'
            }
            foundActor[actor.uuid].push(row)
          }
        }
      }
    }
    for (const item of game.items.contents) {
      if (item.type === 'skill' && item.flags[FOLDER_ID]?.cocidFlag?.id?.match(/^i.skill.(firearms|fighting|ranged)-throw$/) && item.system.properties?.special && (item.system.properties?.fighting || item.system.properties?.firearm || item.system.properties?.ranged)) {
        foundItem.push({
          _id: item._id,
          name: item.system.skillName,
          ['flags.' + FOLDER_ID + '.cocidFlag.id']: 'i.skill.throw',
          'system.specialization': '',
          'system.properties.special': false,
          'system.properties.fighting': false,
          'system.properties.firearm': false,
          'system.properties.ranged': false
        })
      } else if (item.type === 'weapon' && (item.system?.skill?.main?.name?.match(/^i.skill.(firearms|fighting|ranged)-throw$/) || item.system?.skill?.alternativ?.name?.match(/^i.skill.(firearms|fighting|ranged)-throw$/))) {
        const row = {
          _id: item._id
        }
        if (item.system?.skill?.main?.name?.match(/^i.skill.(firearms|fighting|ranged)-throw$/)) {
          row['system.skill.main.name'] = 'i.skill.throw'
        }
        if (item.system?.skill?.alternativ?.name?.match(/^i.skill.(firearms|fighting|ranged)-throw$/)) {
          row['system.skill.alternativ.name'] = 'i.skill.throw'
        }
        foundItem.push(row)
      } else if (['archetype', 'experiencePackage', 'setup', 'occupation'].includes(item.type)) {
        const row = {}
        const found = item.system?.itemKeys?.filter(t => t.match(/^i.skill.(firearms|fighting|ranged)-throw$/)) ?? []
        if (found.length) {
          const itemKeys = foundry.utils.duplicate(item.system.itemKeys)
          let index
          do {
            index = itemKeys.findIndex(t => t.match(/^i.skill.(firearms|fighting|ranged)-throw$/))
            if (index > -1) {
              itemKeys[index] = 'i.skill.throw'
            }
          } while (index > -1)
          row['system.itemKeys'] = itemKeys
        }
        if (['experiencePackage', 'occupation'].includes(item.type)) {
          const groups = foundry.utils.duplicate(item.system.groups)
          let changed = false
          for (const index in groups) {
            const found = groups[index].itemKeys?.filter(t => t.match(/^i.skill.(firearms|fighting|ranged)-throw$/)) ?? []
            if (found.length) {
              let index2
              do {
                index2 = groups[index].itemKeys.findIndex(t => t.match(/^i.skill.(firearms|fighting|ranged)-throw$/))
                if (index2 > -1) {
                  groups[index].itemKeys[index2] = 'i.skill.throw'
                  changed = true
                }
              } while (index2 > -1)
            }
          }
          if (changed) {
            row['system.groups'] = groups
          }
        }
        if (Object.keys(row).length) {
          row._id = item._id
          foundItem.push(row)
        }
      }
    }
    for (const scene of game.scenes) {
      for (const token of scene.tokens ?? []) {
        if (!token.actorLink) {
          for (const item of token.delta?.items ?? []) {
            if (item.type === 'skill' && item.flags[FOLDER_ID]?.cocidFlag?.id?.match(/^i.skill.(firearms|fighting|ranged)-throw$/) && item.system.properties?.special && (item.system.properties?.fighting || item.system.properties?.firearm || item.system.properties?.ranged)) {
              if (typeof foundToken[token.actor.uuid] === 'undefined') {
                foundToken[token.actor.uuid] = []
              }
              foundToken[token.actor.uuid].push({
                _id: item._id,
                name: item.system.skillName,
                ['flags.' + FOLDER_ID + '.cocidFlag.id']: 'i.skill.throw',
                'system.specialization': '',
                'system.properties.special': false,
                'system.properties.fighting': false,
                'system.properties.firearm': false,
                'system.properties.ranged': false
              })
            } else if (item.type === 'weapon' && (item.system?.skill?.main?.name?.match(/^i.skill.(firearms|fighting|ranged)-throw$/) || item.system?.skill?.alternativ?.name?.match(/^i.skill.(firearms|fighting|ranged)-throw$/))) {
              if (typeof foundToken[token.actor.uuid] === 'undefined') {
                foundToken[token.actor.uuid] = []
              }
              const row = {
                _id: item._id
              }
              if (item.system?.skill?.main?.name?.match(/^i.skill.(firearms|fighting|ranged)-throw$/)) {
                row['system.skill.main.name'] = 'i.skill.throw'
              }
              if (item.system?.skill?.alternativ?.name?.match(/^i.skill.(firearms|fighting|ranged)-throw$/)) {
                row['system.skill.alternativ.name'] = 'i.skill.throw'
              }
              foundToken[token.actor.uuid].push(row)
            }
          }
        }
      }
    }
    for (const pack of game.packs) {
      if (['world', 'module'].includes(pack.metadata.packageType)) {
        if (pack.metadata.type === 'Actor') {
          const documents = await pack.getDocuments()
          for (const actor of documents) {
            if (actor.items) {
              for (const item of actor.items) {
                if (item.type === 'skill' && item.flags[FOLDER_ID]?.cocidFlag?.id?.match(/^i.skill.(firearms|fighting|ranged)-throw$/) && item.system.properties?.special && (item.system.properties?.fighting || item.system.properties?.firearm || item.system.properties?.ranged)) {
                  if (typeof foundCompendiumActor[pack.collection] === 'undefined') {
                    foundCompendiumActor[pack.collection] = {}
                  }
                  if (typeof foundCompendiumActor[pack.collection][actor.uuid] === 'undefined') {
                    foundCompendiumActor[pack.collection][actor.uuid] = []
                  }
                  foundCompendiumActor[pack.collection][actor.uuid].push({
                    _id: item._id,
                    name: item.system.skillName,
                    ['flags.' + FOLDER_ID + '.cocidFlag.id']: 'i.skill.throw',
                    'system.specialization': '',
                    'system.properties.special': false,
                    'system.properties.fighting': false,
                    'system.properties.firearm': false,
                    'system.properties.ranged': false
                  })
                } else if (item.type === 'weapon' && (item.system?.skill?.main?.name?.match(/^i.skill.(firearms|fighting|ranged)-throw$/) || item.system?.skill?.alternativ?.name?.match(/^i.skill.(firearms|fighting|ranged)-throw$/))) {
                  if (typeof foundCompendiumActor[pack.collection] === 'undefined') {
                    foundCompendiumActor[pack.collection] = {}
                  }
                  if (typeof foundCompendiumActor[pack.collection][actor.uuid] === 'undefined') {
                    foundCompendiumActor[pack.collection][actor.uuid] = []
                  }
                  const row = {
                    _id: item._id
                  }
                  if (item.system?.skill?.main?.name?.match(/^i.skill.(firearms|fighting|ranged)-throw$/)) {
                    row['system.skill.main.name'] = 'i.skill.throw'
                  }
                  if (item.system?.skill?.alternativ?.name?.match(/^i.skill.(firearms|fighting|ranged)-throw$/)) {
                    row['system.skill.alternativ.name'] = 'i.skill.throw'
                  }
                  foundCompendiumActor[pack.collection][actor.uuid].push(row)
                }
              }
            }
          }
        } else if (pack.metadata.type === 'Item') {
          const documents = await pack.getDocuments()
          for (const item of documents) {
            if (item.type === 'skill' && item.flags[FOLDER_ID]?.cocidFlag?.id?.match(/^i.skill.(firearms|fighting|ranged)-throw$/) && item.system.properties?.special && (item.system.properties?.fighting || item.system.properties?.firearm || item.system.properties?.ranged)) {
              if (typeof foundCompendiumItem[pack.collection] === 'undefined') {
                foundCompendiumItem[pack.collection] = []
              }
              foundCompendiumItem[pack.collection].push({
                _id: item._id,
                name: item.system.skillName,
                ['flags.' + FOLDER_ID + '.cocidFlag.id']: 'i.skill.throw',
                'system.specialization': '',
                'system.properties.special': false,
                'system.properties.fighting': false,
                'system.properties.firearm': false,
                'system.properties.ranged': false
              })
            } else if (item.type === 'weapon' && (item.system?.skill?.main?.name?.match(/^i.skill.(firearms|fighting|ranged)-throw$/) || item.system?.skill?.alternativ?.name?.match(/^i.skill.(firearms|fighting|ranged)-throw$/))) {
              if (typeof foundCompendiumItem[pack.collection] === 'undefined') {
                foundCompendiumItem[pack.collection] = []
              }
              const row = {
                _id: item._id
              }
              if (item.system?.skill?.main?.name?.match(/^i.skill.(firearms|fighting|ranged)-throw$/)) {
                row['system.skill.main.name'] = 'i.skill.throw'
              }
              if (item.system?.skill?.alternativ?.name?.match(/^i.skill.(firearms|fighting|ranged)-throw$/)) {
                row['system.skill.alternativ.name'] = 'i.skill.throw'
              }
              foundCompendiumItem[pack.collection].push(row)
            } else if (['archetype', 'experiencePackage', 'setup', 'occupation'].includes(item.type)) {
              if (typeof foundCompendiumItem[pack.collection] === 'undefined') {
                foundCompendiumItem[pack.collection] = []
              }
              const row = {}
              const found = item.system?.itemKeys?.filter(t => t.match(/^i.skill.(firearms|fighting|ranged)-throw$/)) ?? []
              if (found.length) {
                const itemKeys = foundry.utils.duplicate(item.system.itemKeys)
                let index
                do {
                  index = itemKeys.findIndex(t => t.match(/^i.skill.(firearms|fighting|ranged)-throw$/))
                  if (index > -1) {
                    itemKeys[index] = 'i.skill.throw'
                  }
                } while (index > -1)
                row['system.itemKeys'] = itemKeys
              }
              if (['experiencePackage', 'occupation'].includes(item.type)) {
                const groups = foundry.utils.duplicate(item.system.groups)
                let changed = false
                for (const index in groups) {
                  const found = groups[index].itemKeys?.filter(t => t.match(/^i.skill.(firearms|fighting|ranged)-throw$/)) ?? []
                  if (found.length) {
                    let index2
                    do {
                      index2 = groups[index].itemKeys.findIndex(t => t.match(/^i.skill.(firearms|fighting|ranged)-throw$/))
                      if (index2 > -1) {
                        groups[index].itemKeys[index2] = 'i.skill.throw'
                        changed = true
                      }
                    } while (index2 > -1)
                  }
                }
                if (changed) {
                  row['system.groups'] = groups
                }
              }
              if (Object.keys(row).length) {
                row._id = item._id
                foundCompendiumItem[pack.collection].push(row)
              }
            }
          }
        }
      }
    }
    if ((Object.keys(foundActor).length + foundItem.length + Object.keys(foundToken).length + Object.keys(foundCompendiumActor).length + Object.keys(foundCompendiumItem).length) > 0) {
      const migrate = await new Promise(resolve => {
        new foundry.applications.api.DialogV2({
          window: { title: 'CoC7.CoCIDBatch.title' },
          content: game.i18n.localize('CoC7.CoCIDBatch.ThrowSkillChange'),
          buttons: [{
            action: 'cancel',
            label: 'CoC7.Migrate.ButtonSkip',
            icon: 'fa-solid fa-ban'
          }, {
            action: 'ok',
            label: 'CoC7.Migrate.ButtonUpdate',
            icon: 'fa-solid fa-check'
          }],
          submit: result => {
            resolve(result === 'ok')
          }
        }).render({ force: true })
      })
      if (migrate) {
        if (foundItem.length) {
          await Item.updateDocuments(foundItem)
        }
        for (const actorUuid of Object.keys(foundActor)) {
          await Item.updateDocuments(foundActor[actorUuid], { parent: await fromUuid(actorUuid) })
        }
        for (const actorUuid of Object.keys(foundToken)) {
          await Item.updateDocuments(foundToken[actorUuid], { parent: await fromUuid(actorUuid) })
        }
        for (const pack in foundCompendiumItem) {
          const wasLocked = game.packs.get(pack).locked
          if (wasLocked) {
            await game.packs.get(pack).configure({ locked: false })
          }
          await Item.updateDocuments(foundCompendiumItem[pack], { pack })
          if (wasLocked) {
            await game.packs.get(pack).configure({ locked: true })
          }
        }
        for (const pack in foundCompendiumActor) {
          const wasLocked = game.packs.get(pack).locked
          if (wasLocked) {
            await game.packs.get(pack).configure({ locked: false })
          }
          for (const parentUuid in foundCompendiumActor[pack]) {
            await Item.updateDocuments(foundCompendiumActor[pack][parentUuid], { parent: await fromUuid(parentUuid), pack })
          }
          if (wasLocked) {
            await game.packs.get(pack).configure({ locked: true })
          }
        }
      }
    }
  }

  /**
   * Update all items in the world automatically if possible, if not prompt for further information
   * @param {string} type
   * @returns {boolean}
   */
  static async create (type) {
    const updateList = []
    const missingNames = {}
    const foundKeys = {}
    let typeName = ''
    let idPrefix = ''
    switch (type) {
      case 'skill':
        typeName = game.i18n.localize('TYPES.Item.skill')
        idPrefix = 'i.skill.'
        break
      default:
        return false
    }
    const idType = idPrefix.substring(0, idPrefix.indexOf('.'))
    switch (idType) {
      case 'i':
        await CoCIDBatch.populateItemKeys({ itemType: type, idType, idPrefix, updateList, missingNames, foundKeys })
        break
    }
    switch (idType) {
      case 'i':
        if (Object.keys(missingNames).filter(key => missingNames[key] === '').length === 0) {
          await CoCIDBatch.processItemKeys({ updateList, missingNames })
          return true
        }
        break
    }
    return await new Promise(resolve => {
      new CoCIDBatch({}, {}, {
        foundKeys,
        idPrefix,
        idType,
        missingNames,
        resolve,
        typeName,
        updateList
      }).render({ force: true })
    })
  }

  /**
   * @inheritdoc
   * @param {RenderOptions} options
   * @returns {Promise<HTMLElement>}
   */
  async _renderFrame (options) {
    const frame = await super._renderFrame(options)

    /* // FoundryV12 polyfill */
    if (!foundry.utils.isNewerVersion(game.version, 13)) {
      frame.setAttribute('open', true)
    }

    return frame
  }
}
