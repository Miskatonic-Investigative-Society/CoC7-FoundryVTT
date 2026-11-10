import { FOLDER_ID, ERAS } from '../constants.js'
import CoC7Utilities from './utilities.js'

export default class CoCIDEditor extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.DocumentSheetV2) {
  #showLoading

  /**
   * @inheritdoc
   * @param {...any} args
   */
  constructor (...args) {
    super(...args)
    this.#showLoading = true
  }

  static DEFAULT_OPTIONS = {
    classes: ['coc7-sheet', 'coc-id-editor'],
    tag: 'form',
    window: {
      contentClasses: [
        'standard-form'
      ]
    },
    form: {
      handler: CoCIDEditor.#onSubmit,
      submitOnChange: true
    },
    position: {
      width: 910
    }
  }

  static PARTS = {
    header: {
      template: 'systems/' + FOLDER_ID + '/templates/apps/coc-id-editor.hbs'
    }
  }

  /**
   * @inheritdoc
   * @param {RenderOptions} options
   * @returns {Promise<ApplicationRenderContext>}
   */
  async _prepareContext (options) {
    const context = await super._prepareContext(options)

    context.supportedLanguages = CONFIG.supportedLanguages

    context.guessCode = game[FOLDER_ID].cocid.guessId(context.document)
    context.idPrefix = game[FOLDER_ID].cocid.getPrefix(context.document)

    const cocidFlag = context.document.flags?.[FOLDER_ID]?.cocidFlag ?? {}

    context.id = cocidFlag.id || ''
    context.lang = cocidFlag.lang || game.i18n.lang
    context.priority = cocidFlag.priority || 0

    context._eras = []
    for (const [value, era] of Object.entries(ERAS)) {
      context._eras.push({
        value,
        label: game.i18n.localize(era.label),
        icon: era.icon,
        isEnabled: (cocidFlag.eras ?? {})[value] === true
      })
    }
    context._eras.sort(CoC7Utilities.sortByLabelKey)
    context.useEraIcons = game.settings.get(FOLDER_ID, 'sheetEraIcons')

    const CoCIDKeys = Object.assign(foundry.utils.flattenObject(game.i18n._fallback.CoC7?.CoCIDFlag?.keys ?? {}), foundry.utils.flattenObject(game.i18n.translations.CoC7?.CoCIDFlag?.keys ?? {}))
    const prefix = new RegExp('^' + CoC7Utilities.quoteRegExp(context.idPrefix))
    context.existingKeys = Object.keys(CoCIDKeys).reduce((obj, value) => {
      if (value.match(prefix)) {
        obj.push({ value, label: CoCIDKeys[value] })
      }
      return obj
    }, []).sort(CoC7Utilities.sortByLabelKey)

    context.isSystemID = (typeof CoCIDKeys[context.id] !== 'undefined')
    const match = context.id.match(/^([^\\.]+)\.([^\\.]*)\.(.+)/)
    context._existing = (match && typeof match[3] !== 'undefined' ? match[3] : '')

    context.usedEras = []
    if (context.id && context.lang) {
      // Find out if there exists a duplicate CoCID
      const usedEras = {}
      let response = await this.getDocumentsInScope(usedEras, context.id, context.lang, 'world')
      context.worldDocumentInfo = response.documentInfo
      context.worldDuplicates = response.duplicates
      context.warnDuplicateWorldPriority = response.warnDuplicatePriority
      response = await this.getDocumentsInScope(usedEras, context.id, context.lang, 'compendiums')
      context.compendiumDocumentInfo = response.documentInfo
      context.compendiumDuplicates = response.duplicates
      context.warnDuplicateCompendiumPriority = response.warnDuplicatePriority
      this.#showLoading = false

      for (const [value, field] of Object.entries(usedEras)) {
        context.usedEras.push({
          value,
          icon: field.icon,
          label: game.i18n.localize(field.label)
        })
      }
      context.usedEras.sort(CoC7Utilities.sortByLabelKey)
      context.compendiumDocumentInfo = context.compendiumDocumentInfo.reduce((c, o) => {
        const sortKey = []
        for (const s of context.usedEras) {
          sortKey.push(o.eras[s.id] ? 'Y' : 'N')
        }
        o.sortKey = sortKey.join('')
        c.push(o)
        return c
      }, []).sort((a, b) => {
        return (a.sortKey === b.sortKey ? b.priority - a.priority : b.sortKey.compare(a.sortKey))
      })
    } else {
      context.compendiumDocumentInfo = []
      context.worldDocumentInfo = []
      context.worldDuplicates = 0
      context.compendiumDuplicates = 0
      context.warnDuplicateWorldPriority = false
      context.warnDuplicateCompendiumPriority = false
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

    const form = this.element

    form.querySelectorAll('a.copy-to-clipboard').forEach((element) => element.addEventListener('click', (event) => {
      const text = event.target.closest('.form-value').querySelector('input').value
      if (text) {
        game.clipboard.copyPlainText(text).then(() => {
          ui.notifications.info('CoC7.WhatCopiedClipboard', { format: { what: text }, console: false })
        })
      }
    }))

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return

    form.querySelectorAll('.toggle-switch').forEach((element) => element.addEventListener('click', async (event) => {
      const era = event.currentTarget.dataset.property
      await game[FOLDER_ID].cocid.eraToggle(this.document, era, { isCtrlKey: CoC7Utilities.isCtrlKey(event) })
    }))

    form.querySelector('input[name=_existing')?.addEventListener('change', (event) => {
      let value = event.target.value
      const prefix = event.target.dataset.prefix
      if (value !== '') {
        value = prefix + CoC7Utilities.toKebabCase(value)
      }
      const element = form.querySelector('input[name=id]')
      element.value = value
      const newEvent = new Event('change', { bubbles: true })
      element.dispatchEvent(newEvent)
    })

    form.querySelector('select[name=known]')?.addEventListener('change', (event) => {
      const value = event.target.value
      const element = form.querySelector('input[name=id]')
      element.value = value
      const newEvent = new Event('change', { bubbles: true })
      element.dispatchEvent(newEvent)
    })

    form.querySelector('a[data-guess]')?.addEventListener('click', (event) => {
      event.preventDefault()
      const value = event.target.closest('a').dataset.guess
      if (value) {
        const element = form.querySelector('input[name=id]')
        element.value = value
        const newEvent = new Event('change', { bubbles: true })
        element.dispatchEvent(newEvent)
      }
    })
  }

  /**
   * Add CoC ID Button to sheet header
   * @param {ApplicationV2} application
   * @param {HTMLElement} element
   */
  static addCoCIDSheetHeaderButton (application, element) {
    if (game.user.isGM) {
      if (!element.querySelector('button.header-control.fa-solid.fa-fingerprint')) {
        application.options.actions.cocid = {
          handler: (event, element) => {
            event.preventDefault()
            event.stopPropagation()
            if (event.detail > 1) return // Ignore repeated clicks
            if (event.button === 2 && (application.document.flags[FOLDER_ID]?.cocidFlag?.id ?? false)) {
              game.clipboard.copyPlainText(application.document.flags[FOLDER_ID].cocidFlag.id).then(() => {
                ui.notifications.info('CoC7.WhatCopiedClipboard', { format: { what: game.i18n.localize('CoC7.CoCIDFlag.key') }, console: false })
              })
            } else {
              new CoCIDEditor({ document: application.document }, {}).render({ force: true, focus: true })
            }
          },
          buttons: [0, 2]
        }
        const copyUuidButton = element.querySelector('button.header-control.fa-solid.fa-passport')
        if (copyUuidButton) {
          const button = document.createElement('button')
          button.type = 'button'
          button.classList = 'header-control fa-solid fa-fingerprint icon'
          if (!application.document.flags[FOLDER_ID]?.cocidFlag?.id?.length || !application.document.flags[FOLDER_ID]?.cocidFlag?.lang?.length || typeof application.document.flags[FOLDER_ID]?.cocidFlag?.priority === 'undefined') {
            button.classList.add('invalid-coc-id')
          }
          button.dataset.action = 'cocid'
          button.dataset.tooltip = 'CoC7.CoCIDFlag.key'
          copyUuidButton.after(button)
        }
      }
    }
  }

  /**
   * Get documents with matching CoC ID in World/Compendiums
   * @param {object} usedEras
   * @param {string} cocid
   * @param {string} lang
   * @param {string} scope
   * @returns {object}
   */
  async getDocumentsInScope (usedEras, cocid, lang, scope) {
    const documents = await game[FOLDER_ID].cocid.fromCoCIDAll({
      cocid,
      lang,
      scope,
      showLoading: this.#showLoading
    })
    let warnDuplicatePriority = false
    const duplicates = documents.length ?? 0
    const uniquePriority = {}
    const documentInfo = await Promise.all(documents.map(async (d) => {
      if (d.flags[FOLDER_ID].cocidFlag.eras) {
        Object.entries(d.flags[FOLDER_ID].cocidFlag.eras).filter(e => e[1]).map(e => {
          if (typeof uniquePriority[d.flags[FOLDER_ID].cocidFlag.priority + '/' + e[0]] === 'undefined') {
            uniquePriority[d.flags[FOLDER_ID].cocidFlag.priority + '/' + e[0]] = 0
          }
          uniquePriority[d.flags[FOLDER_ID].cocidFlag.priority + '/' + e[0]]++
          return false
        })
      } else {
        if (typeof uniquePriority[d.flags[FOLDER_ID].cocidFlag.priority + '/*'] === 'undefined') {
          uniquePriority[d.flags[FOLDER_ID].cocidFlag.priority + '/*'] = 0
        }
        uniquePriority[d.flags[FOLDER_ID].cocidFlag.priority + '/*']++
      }
      const eras = (d.flags[FOLDER_ID].cocidFlag.eras ? Object.entries(d.flags[FOLDER_ID].cocidFlag.eras).filter(e => e[1]).map(e => e[0]).sort() : [])
      for (const era of eras) {
        usedEras[era] = {
          label: ERAS[era]?.label ?? '?',
          icon: ERAS[era]?.icon ?? 'fa-solid fa-info-circle'
        }
      }
      const folders = []
      let e = d?.folder
      while (e?.name) {
        folders.unshift(e?.name)
        e = e.folder
      }
      if (d.collection.inCompendium === true) {
        folders.unshift(d.collection.metadata.label)
        e = d?.collection.folder
        while (e?.name) {
          folders.unshift(e?.name)
          e = e.folder
        }
      }
      return {
        eras: eras.reduce(function (all, current) {
          all[current] = true
          return all
        }, {}),
        priority: parseInt(d.flags[FOLDER_ID].cocidFlag.priority, 10),
        lang: d.flags[FOLDER_ID].cocidFlag.lang ?? 'en',
        link: await foundry.applications.ux.TextEditor.implementation.enrichHTML(d.link, { async: true }),
        folder: folders.map(n => n.indexOf(' ') > -1 ? '"' + n + '"' : n).join(' &gt; ')
      }
    }))
    if (Object.entries(uniquePriority).filter(c => c[1] > 1).length > 0) {
      warnDuplicatePriority = true
    }
    return { duplicates, uniquePriority, documentInfo, warnDuplicatePriority }
  }

  /**
   * Handle form submission
   * @param {SubmitEvent|null} event
   * @param {HTMLFormElement} form
   * @param {FormDataExtended} formData
   */
  static async #onSubmit (event, form, formData) {
    if (!this.isEditable) return
    const submitData = this._processFormData(event, form, formData)
    const changes = {
      ['flags.' + FOLDER_ID + '.cocidFlag.id']: submitData.id || '',
      ['flags.' + FOLDER_ID + '.cocidFlag.lang']: submitData.lang || game.i18n.lang,
      ['flags.' + FOLDER_ID + '.cocidFlag.priority']: submitData.priority || 0
    }
    const html = this.document.sheet.element.querySelector('header.window-header [data-action="cocid"]')
    if (html) {
      if (changes['flags.' + FOLDER_ID + '.cocidFlag.id'].length) {
        html.classList.remove('invalid-coc-id')
      } else {
        html.classList.add('invalid-coc-id')
      }
    }
    this.document.update(changes)
  }
}
