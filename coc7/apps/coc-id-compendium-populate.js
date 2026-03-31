/* global CONFIG Folder foundry game Item */
import { FOLDER_ID } from '../constants.js'

export default class CoCIDCompendiumPopulate extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
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
      title: 'CoC7.CoCIDCompendiumPopulate'
    },
    form: {
      closeOnSubmit: false,
      handler: CoCIDCompendiumPopulate.#onSubmit
    },
    position: {
      width: 550
    }
  }

  static PARTS = {
    form: {
      template: 'systems/' + FOLDER_ID + '/templates/apps/coc-id-compendium-populate.hbs',
      scrollable: ['']
    },
    footer: {
      template: 'templates/generic/form-footer.hbs'
    }
  }

  /**
   * @inheritdoc
   * @param {ApplicationRenderContext} context
   * @param {RenderOptions} options
   * @returns {Promise<void>}
   */
  async _onRender (context, options) {
    await super._onRender(context, options)

    this.element.querySelector('select[name=pack]')?.addEventListener('change', (event) => {
      this.coc7Config.packList = event.target.value
    })
    this.element.querySelectorAll('.toggle-switch').forEach((element) => element.addEventListener('click', (event) => {
      const propertyId = event.target.dataset.property
      const index = this.coc7Config.types.findIndex(t => t.id === propertyId)
      if (index > -1) {
        this.coc7Config.types[index].toggle = !this.coc7Config.types[index].toggle
      }
      this.render({ force: true })
    }))
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
      const included = this.coc7Config.types.filter(t => t.toggle).map(t => t.id)
      const destination = game.packs.get(this.coc7Config.packList)
      if (included.length && destination) {
        const items = await game.CoC7.cocid.fromCoCIDRegexBest({ cocidRegExp: new RegExp('^i.(' + included.join('|') + ')'), type: 'i', showLoading: true })
        const folders = await [...new Set(items.map(d => d.type))].reduce(async (sc, t) => {
          const name = game.i18n.localize('TYPES.Item.' + t)
          let folder = destination.folders.find(d => d.name === name)
          if (typeof folder === 'undefined') {
            folder = await Folder.create({
              name,
              type: 'Item'
            }, {
              pack: this.coc7Config.packList
            })
          }
          const c = await sc
          c[t] = folder.id
          return c
        }, {})
        const priority = 1 + items.map(d => d.flags.CoC7.cocidFlag.priority ?? 0).reduce((c, v) => { if (v > c) { c = v } return c }, 0)
        const newDocs = items.map(d => {
          const doc = d.toObject()
          doc.flags.CoC7.cocidFlag.priority = priority
          doc.flags.CoC7.cocidFlag.lang = game.i18n.lang
          doc.folder = folders[doc.type]
          return doc
        })
        await Item.implementation.createDocuments(newDocs, { pack: this.coc7Config.packList })
        destination.render(true)
      } else {
        event.submitter.classList.remove('currently-submitting')
        return
      }
      this.close()
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
        context.coc7Config = this.coc7Config
        break
      case 'footer':
        context.buttons = []
        context.buttons.push({
          type: 'submit',
          action: 'close',
          label: 'Cancel',
          icon: 'fa-solid fa-ban'
        })
        if (this.coc7Config.packLists.length > 0) {
          context.buttons.push({
            type: 'submit',
            action: 'update',
            label: 'CoC7.CoCIDCompendiumPopulateButton',
            icon: 'fa-solid fa-check'
          })
        }
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
   * Create popup
   */
  static async create () {
    const packLists = game.modules.contents.filter(m => m.active && m.id !== 'call-of-cthulhu-foundryvtt-investigator-wizard' && !m.id.match(/^cha-coc-fvtt-/)).reduce((c, m) => {
      m.packs.filter(p => p.type === 'Item' && !game.packs.get(p.id).locked).forEach(p => {
        c.push({
          group: m.title,
          value: p.id,
          label: p.label + ' (' + m.title + ')'
        })
      })
      return c
    }, [])

    const types = Object.keys(CONFIG.Item.sheetClasses).filter(t => t !== 'base').map(t => {
      return {
        id: t,
        label: game.i18n.localize('TYPES.Item.' + t),
        toggle: (t === 'skill')
      }
    }).sort((a, b) => a.id.localeCompare(b.id))

    new CoCIDCompendiumPopulate({}, {}, {
      packLists,
      packList: packLists.reduce((c, d) => { if (c === '') { c = d.id } return c }, ''),
      types
    }).render({ force: true })
  }
}
