/* global $, CONFIG, FormApplication, foundry, game, TextEditor */
import { COC7 } from '../../../core/config.js'
import { CoC7Utilities } from '../../../shared/utilities.js'

export class CoCIDEditor extends FormApplication {
  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['coc7', 'dialog', 'coc-id-editor'],
      template: 'systems/CoC7/templates/apps/coc-id-editor.hbs',
      width: 900,
      height: 'auto',
      title: 'CoC7.CoCIDFlag.title',
      closeOnSubmit: false,
      submitOnClose: true,
      submitOnChange: true
    })
  }

  async getData () {
    const sheetData = super.getData()

    sheetData.supportedLanguages = CONFIG.supportedLanguages

    this.options.editable = this.object.sheet.isEditable

    sheetData.guessCode = game.system.api.cocid.guessId(this.object)
    sheetData.idPrefix = game.system.api.cocid.getPrefix(this.object)

    sheetData.cocidFlag = this.object.flags?.CoC7?.cocidFlag

    sheetData.id = sheetData.cocidFlag?.id || ''
    sheetData.lang = sheetData.cocidFlag?.lang || game.i18n.lang
    sheetData.priority = sheetData.cocidFlag?.priority || 0

    sheetData.eras = []
    for (const [key, value] of Object.entries(COC7.eras)) {
      sheetData.eras.push({
        id: key,
        name: game.i18n.localize(value),
        isEnabled: (sheetData.cocidFlag?.eras ?? {})[key] === true
      })
    }
    sheetData.eras.sort(CoC7Utilities.sortByNameKey)

    const CoCIDKeys = Object.assign(foundry.utils.flattenObject(game.i18n._fallback.CoC7?.CoCIDFlag?.keys ?? {}), foundry.utils.flattenObject(game.i18n.translations.CoC7?.CoCIDFlag?.keys ?? {}))
    const prefix = new RegExp('^' + CoC7Utilities.quoteRegExp(sheetData.idPrefix))
    sheetData.existingKeys = Object.keys(CoCIDKeys).reduce((obj, k) => {
      if (k.match(prefix)) {
        obj.push({ k, name: CoCIDKeys[k] })
      }
      return obj
    }, []).sort(CoC7Utilities.sortByNameKey)

    sheetData.isSystemID = (typeof CoCIDKeys[sheetData.id] !== 'undefined')
    const match = sheetData.id.match(/^([^\\.]+)\.([^\\.]*)\.(.+)/)
    sheetData._existing = (match && typeof match[3] !== 'undefined' ? match[3] : '')

    if (sheetData.id && sheetData.lang) {
      // Find out if there exists a duplicate CoCID
      const worldDocuments = await game.system.api.cocid.fromCoCIDAll({
        cocid: sheetData.id,
        lang: sheetData.lang,
        scope: 'world'
      })
      const usedEras = {}
      const uniqueWorldPriority = {}
      sheetData.worldDocumentInfo = await Promise.all(worldDocuments.map(async (d) => {
        if (d.flags.CoC7.cocidFlag.eras) {
          Object.entries(d.flags.CoC7.cocidFlag.eras).filter(e => e[1]).map(e => {
            if (!Object.prototype.hasOwnProperty.call(uniqueWorldPriority, d.flags.CoC7.cocidFlag.priority + '/' + e[0])) {
              uniqueWorldPriority[d.flags.CoC7.cocidFlag.priority + '/' + e[0]] = 0
            }
            uniqueWorldPriority[d.flags.CoC7.cocidFlag.priority + '/' + e[0]]++
            return false
          })
        } else {
          uniqueWorldPriority[d.flags.CoC7.cocidFlag.priority + '/*'] = 1
        }
        const eras = (d.flags.CoC7.cocidFlag.eras ? Object.entries(d.flags.CoC7.cocidFlag.eras).filter(e => e[1]).map(e => e[0]).sort() : [])
        for (const era of eras) {
          usedEras[era] = COC7.eras[era] ?? '?'
        }
        const folders = []
        let e = d?.folder
        while (e?.name) {
          folders.unshift(e?.name)
          e = e.folder
        }
        return {
          eras: eras.reduce(function (all, current) {
            all[current] = true
            return all
          }, {}),
          priority: d.flags.CoC7.cocidFlag.priority,
          lang: d.flags.CoC7.cocidFlag.lang ?? 'en',
          link: await TextEditor.enrichHTML(d.link, { async: true }),
          folder: folders.map(n => n.indexOf(' ') > -1 ? '"' + n + '"' : n).join(' &gt; ')
        }
      }))
      if (Object.entries(uniqueWorldPriority).filter(c => c[1] > 1).length > 0) {
        sheetData.warnDuplicateWorldPriority = true
      }
      sheetData.worldDuplicates = worldDocuments.length ?? 0

      const compendiumDocuments = await game.system.api.cocid.fromCoCIDAll({
        cocid: sheetData.id,
        lang: sheetData.lang,
        scope: 'compendiums'
      })
      const uniqueCompendiumPriority = {}
      sheetData.compendiumDocumentInfo = await Promise.all(compendiumDocuments.map(async (d) => {
        if (d.flags.CoC7.cocidFlag.eras) {
          Object.entries(d.flags.CoC7.cocidFlag.eras).filter(e => e[1]).map(e => {
            if (!Object.prototype.hasOwnProperty.call(uniqueCompendiumPriority, d.flags.CoC7.cocidFlag.priority + '/' + e[0])) {
              uniqueCompendiumPriority[d.flags.CoC7.cocidFlag.priority + '/' + e[0]] = 0
            }
            uniqueCompendiumPriority[d.flags.CoC7.cocidFlag.priority + '/' + e[0]]++
            return false
          })
        } else {
          uniqueCompendiumPriority[d.flags.CoC7.cocidFlag.priority + '/*'] = 1
        }
        const eras = (d.flags.CoC7.cocidFlag.eras ? Object.entries(d.flags.CoC7.cocidFlag.eras).filter(e => e[1]).map(e => e[0]).sort() : [])
        for (const era of eras) {
          usedEras[era] = COC7.eras[era] ?? '?'
        }
        const folders = []
        let e = d?.folder
        while (e?.name) {
          folders.unshift(e?.name)
          e = e.folder
        }
        folders.unshift(d.compendium.metadata.label)
        e = d?.compendium.folder
        while (e?.name) {
          folders.unshift(e?.name)
          e = e.folder
        }
        return {
          eras: eras.reduce(function (all, current) {
            all[current] = true
            return all
          }, {}),
          priority: d.flags.CoC7.cocidFlag.priority,
          lang: d.flags.CoC7.cocidFlag.lang ?? 'en',
          link: await TextEditor.enrichHTML(d.link, { async: true }),
          folder: folders.map(n => n.indexOf(' ') > -1 ? '"' + n + '"' : n).join(' &gt; ')
        }
      }))
      if (Object.entries(uniqueCompendiumPriority).filter(c => c[1] > 1).length > 0) {
        sheetData.warnDuplicateCompendiumPriority = true
      }
      sheetData.compendiumDuplicates = compendiumDocuments.length ?? 0
      sheetData.usedEras = []
      for (const [key, value] of Object.entries(usedEras)) {
        sheetData.usedEras.push({
          id: key,
          name: game.i18n.localize(value)
        })
      }
      sheetData.usedEras.sort(CoC7Utilities.sortByNameKey)
    } else {
      sheetData.compendiumDocumentInfo = []
      sheetData.worldDocumentInfo = []
      sheetData.worldDuplicates = 0
      sheetData.compendiumDuplicates = 0
      sheetData.warnDuplicateWorldPriority = false
      sheetData.warnDuplicateCompendiumPriority = false
    }
    return sheetData
  }

  activateListeners (html) {
    super.activateListeners(html)

    html.find('a.copy-to-clipboard').click(function (e) {
      CoC7Utilities.copyToClipboard($(this).siblings('input').val())
    })

    if (!this.object.sheet.isEditable) return

    html.find('.toggle-switch').click(this._onClickToggle.bind(this))

    html.find('input[name=_existing').change(function (e) {
      const obj = $(this)
      const prefix = obj.data('prefix')
      let value = obj.val()
      if (value !== '') {
        value = prefix + CoC7Utilities.toKebabCase(value)
      }
      html.find('input[name=id]').val(value).trigger('change')
    })

    html.find('select[name=known]').change(function (e) {
      const obj = $(this)
      html.find('input[name=id]').val(obj.val())
    })

    html.find('a[data-guess]').click(async function (e) {
      e.preventDefault()
      const obj = $(this)
      const guess = obj.data('guess')
      html.find('input[name=id]').val(guess).trigger('change')
    })
  }

  static async eraToggle (document, propertyId) {
    if (document.type === 'setup') {
      // Setups can only have one era to make sure the correct skills are populated via CoC ID
      const update = {
        [propertyId]: true
      }
      if (typeof document.flags?.CoC7?.cocidFlag?.eras !== 'undefined') {
        for (const [key] of Object.entries(document.flags.CoC7.cocidFlag.eras)) {
          if (key !== propertyId) {
            update['-=' + key] = null
          }
        }
      }
      await document.update({
        'flags.CoC7.cocidFlag.eras': update
      })
    } else if (typeof document.flags?.CoC7?.cocidFlag?.eras?.[propertyId] === 'undefined') {
      if (typeof document.flags?.CoC7?.cocidFlag?.eras === 'undefined') {
        await document.update({
          'flags.CoC7.cocidFlag.eras': {
            [propertyId]: true
          }
        })
      } else {
        await document.update({
          [`flags.CoC7.cocidFlag.eras.${propertyId}`]: true
        })
      }
    } else {
      await document.update({
        [`flags.CoC7.cocidFlag.eras.-=${propertyId}`]: null
      })
    }
  }

  async _onClickToggle (event) {
    event.preventDefault()
    const propertyId = event.currentTarget.dataset.property
    await CoCIDEditor.eraToggle(this.object, propertyId)
    const options = foundry.utils.duplicate(this.options)
    await this.close()
    await this.render(true, options)
  }

  async _updateObject (event, formData) {
    const id = formData.id || ''
    await this.object.update({
      'flags.CoC7.cocidFlag.id': id,
      'flags.CoC7.cocidFlag.lang': formData.lang || game.i18n.lang,
      'flags.CoC7.cocidFlag.priority': formData.priority || 0,
      'flags.CoC7.cocidFlag.eras': (this.object.flags?.CoC7?.cocidFlag?.eras ?? {})
    })
    const html = $(this.object.sheet.element).find('header.window-header a.header-button.edit-coc-id-warning,header.window-header a.header-button.edit-coc-id-exisiting')
    if (html.length) {
      html.css({
        color: (id ? 'var(--color-text-light-highlight)' : 'red')
      })
    }
    this.render()
  }
}
