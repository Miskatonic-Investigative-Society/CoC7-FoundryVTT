/* global CONFIG Folder FormApplication foundry game Item */
export default class CoCIDCompendiumPopulate extends FormApplication {
  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'coc-id-actor-update-items',
      classes: ['coc7', 'dialog', 'investigator-wizard'],
      title: game.i18n.localize('CoC7.ActorCoCIDItemsBest'),
      template: 'systems/CoC7/templates/apps/coc-id-compendium-populate.hbs',
      width: 520,
      height: 250,
      closeOnSubmit: false
    })
  }

  activateListeners (html) {
    super.activateListeners(html)

    html
      .find('select[name=pack]')
      .click(this._onSelectPack.bind(this))

    html
      .find('.toggle-switch')
      .click(this._onClickToggle.bind(this))
  }

  _onSelectPack (event) {
    this.object.packList = event.target.value
  }

  _onClickToggle (event) {
    const key = event.target.dataset.property
    if (key) {
      const type = this.object.types.findIndex(t => t.id === key)
      this.object.types[type].toggle = !this.object.types[type].toggle
      this.render(true)
    }
  }

  async _updateObject (event, formData) {
    if (event.submitter?.dataset.button === 'update') {
      if (event.submitter.className.indexOf('currently-submitting') > -1) {
        return
      }
      event.submitter.classList.add('currently-submitting')
      const included = this.object.types.filter(t => t.toggle).map(t => t.id)
      const destination = game.packs.get(this.object.packList)
      if (included.length && destination) {
        const items = await game.system.api.cocid.fromCoCIDRegexBest({ cocidRegExp: new RegExp('^i.(' + included.join('|') + ')'), type: 'i', showLoading: true })
        const folders = await [...new Set(items.map(d => d.type))].reduce(async (sc, t) => {
          const name = game.i18n.localize('CoC7.Entities.' + t.charAt(0).toUpperCase() + t.slice(1))
          let folder = destination.folders.find(d => d.name === name)
          if (typeof folder === 'undefined') {
            folder = await Folder.create({
              name,
              type: 'Item'
            }, {
              pack: this.object.packList
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
        await Item.implementation.createDocuments(newDocs, { pack: this.object.packList })
        destination.render(true)
      } else {
        event.submitter.classList.remove('currently-submitting')
        return
      }
    }
    this.close()
  }

  static async create (options = {}) {
    options.packLists = game.modules.contents.filter(m => m.active && m.id !== 'call-of-cthulhu-foundryvtt-investigator-wizard' && !m.id.match(/^cha-coc-fvtt-/)).reduce((c, m) => {
      m.packs.filter(p => p.type === 'Item').forEach(p => {
        c.push({
          group: m.title,
          value: p.id,
          label: p.label + ' (' + m.title + ')'
        })
      })
      return c
    }, [])

    options.packList = options.packLists[0].value

    options.types = Object.keys(CONFIG.Item.sheetClasses).filter(t => t !== 'base').map(t => {
      return {
        id: t,
        label: game.i18n.localize('CoC7.Entities.' + t.charAt(0).toUpperCase() + t.slice(1)),
        toggle: (t === 'skill')
      }
    }).sort((a, b) => a.id.localeCompare(b.id))

    new CoCIDCompendiumPopulate(options).render(true)
  }
}
