/* global Actor canvas CONFIG foundry fromUuid game */
import { FOLDER_ID, ERAS } from '../constants.js'

export default class CoCIDActorUpdateItems extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  /**
   * @inheritdoc
   */
  constructor (...args) {
    const coc7Config = args.pop()
    super(...args)
    this.coc7Config = coc7Config
  }

  static DEFAULT_OPTIONS = {
    id: 'coc-id-actor-update-items',
    tag: 'form',
    classes: ['coc7', 'dialog'],
    window: {
      contentClasses: [
        'standard-form'
      ],
      title: 'CoC7.ActorCoCIDItemsBest'
    },
    form: {
      closeOnSubmit: false,
      handler: CoCIDActorUpdateItems.#onSubmit
    },
    position: {
      width: 550
    }
  }

  static PARTS = {
    form: {
      template: 'systems/' + FOLDER_ID + '/templates/apps/coc-id-actor-update-items.hbs',
      scrollable: ['']
    },
    footer: {
      template: 'templates/generic/form-footer.hbs'
    }
  }

  /**
   * Where to pick Actors from
   * @returns {object}
   */
  static get Which () {
    return {
      SceneTokens: 1,
      ActorSheets: 2,
      ActorDirectory: 3
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
      case 'form':
        {
          context.coc7Config = this.coc7Config
          context.Which = CoCIDActorUpdateItems.Which
          context.lang = CONFIG.supportedLanguages[game.i18n.lang] ?? '?'
          const defaultEra = game.settings.get(FOLDER_ID, 'worldEra')
          context.isEn = game.i18n.lang === 'en'
          context.era = game.i18n.format(ERAS[defaultEra]?.name ?? 'CoC7.CoCIDFlag.error.unknown-era', { era: defaultEra })
        }
        break
      case 'footer':
        context.buttons = []
        context.buttons.push({
          type: 'submit',
          action: 'close',
          label: 'Cancel',
          icon: 'fa-solid fa-ban'
        })
        context.buttons.push({
          type: 'submit',
          action: 'update',
          label: 'CoC7.ActorCoCIDItemsUpdate',
          icon: 'fa-solid fa-check'
        })
        break
    }
    return context
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

  /**
   * @inheritdoc
   * @param {ApplicationRenderContext} context
   * @param {RenderOptions} options
   * @returns {Promise<void>}
   */
  async _onRender (context, options) {
    await super._onRender(context, options)

    this.element.querySelectorAll('.toggle-switch').forEach((element) => element.addEventListener('click', (event) => {
      const propertyId = event.target.dataset.property
      switch (propertyId) {
        case 'unlinked':
        case 'anySkills':
          this.coc7Config[propertyId] = !this.coc7Config[propertyId]
          break
        case 'which':
          this.coc7Config.which = Number(event.target.dataset.value)
          break
      }
      this.render({ force: true })
    }))
  }

  /**
   * Create update object for item
   * @param {Document} item
   * @returns {object}
   */
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
    for (const key of ['keeper', 'notes', 'special', 'value']) {
      if (typeof item.system.description?.[key] === 'string' && item.system.description[key].length) {
        if (typeof output.system.description === 'undefined') {
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

  /**
   * Update Actors in array
   * @param {Array} actorList
   * @param {boolean} parent
   * @param {boolean} any
   */
  async updateActors (actorList, parent, any) {
    if (parent) {
      const unlinkedActors = await actorList.filter(a => a.token?.actorLink === false).map(a => a.id).filter((a, o, v) => v.indexOf(a) === o).reduce(async (c, i) => {
        c.push(await fromUuid('Actor.' + i))
        return c
      }, [])
      actorList = unlinkedActors.concat(actorList)
    }
    const ids = {}
    const anySkills = {}
    for (const actor of actorList) {
      for (const item of actor.items.contents) {
        if (typeof item.flags?.CoC7?.cocidFlag?.id === 'string') {
          if (!any && item.flags.CoC7.cocidFlag.id.match(/-any$/)) {
            if (typeof anySkills[item.flags.CoC7.cocidFlag.id] === 'undefined') {
              anySkills[item.flags.CoC7.cocidFlag.id] = []
            }
            anySkills[item.flags.CoC7.cocidFlag.id].push(actor.name)
          } else {
            ids[item.flags.CoC7.cocidFlag.id] = {}
          }
        }
      }
    }
    const found = await game.CoC7.cocid.fromCoCIDRegexBest({ cocidRegExp: game.CoC7.cocid.makeGroupRegEx(Object.keys(ids)), type: 'i', showLoading: true })
    for (const item of found) {
      ids[item.flags.CoC7.cocidFlag.id] = this.getUpdateData(item.toObject())
    }
    if (Object.keys(anySkills).length) {
      console.log('Invalid any keys on Actors', anySkills)
    }
    const actorUpdates = []
    const tokenUpdates = []
    for (const actor of actorList) {
      const updates = []
      for (const item of actor.items.contents) {
        if (typeof ids[item.flags?.CoC7?.cocidFlag?.id] !== 'undefined' && Object.keys(ids[item.flags.CoC7.cocidFlag.id]).length) {
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

  /**
   * Submit the configuration form.
   * @param {SubmitEvent} event
   * @param {HTMLFormElement} form
   * @param {FormDataExtended} formData
   * @returns {Promise<void>}
   */
  static async #onSubmit (event, form, formData) {
    if (event.submitter?.dataset.action === 'update') {
      if (event.submitter.classList.contains('currently-submitting')) {
        return
      }
      event.submitter.classList.add('currently-submitting')
      switch (this.coc7Config.which) {
        case CoCIDActorUpdateItems.Which.SceneTokens:
          await this.updateActors(canvas.scene.tokens.contents.map(d => d.object.actor), this.coc7Config.unlinked, this.coc7Config.anySkills)
          break
        case CoCIDActorUpdateItems.Which.ActorSheets:
          await this.updateActors([...foundry.applications.instances.values()].filter(s => s instanceof foundry.applications.sheets.ActorSheetV2).map(s => s.document), this.coc7Config.unlinked, this.coc7Config.anySkills)
          break
        case CoCIDActorUpdateItems.Which.ActorDirectory:
          await this.updateActors(game.actors.contents, false, this.coc7Config.anySkills)
          break
      }
      this.close()
    }
  }

  /**
   * Create popup
   */
  static async create () {
    new CoCIDActorUpdateItems({}, {}, {
      unlinked: true,
      anySkills: false,
      which: CoCIDActorUpdateItems.Which.SceneTokens
    }).render({ force: true })
  }
}
