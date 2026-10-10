import { FOLDER_ID, ERAS } from '../constants.js'
import CoC7Utilities from '../apps/utilities.js'

let oldSearchFilter

const showEraList = [
  'occupation',
  'setup',
  'skill',
  'weapon'
]

function _onSearchFilter (event, query, rgx, html) {
  if (this.collection.documentName === 'Item') {
    const typeSelect = this.element.querySelector('select[name=coc7type]')
    const eraSelect = this.element.querySelector('select[name=coc7era]')
    const type = typeSelect.value
    let era = ''
    if (showEraList.includes(type)) {
      eraSelect.parentElement.classList.remove('hidden')
      era = eraSelect.value
    } else {
      eraSelect.parentElement.classList.add('hidden')
    }

    const isNameSearch = !!query
    const isSearch = isNameSearch || type !== '' || era !== ''

    const entryIds = new Set()
    const folderIds = new Set()
    const autoExpandIds = new Set()
    const options = {}

    // Match entries and folders.
    if (isNameSearch) {
      // First match folders.
      this._matchSearchFolders(rgx, folderIds, autoExpandIds, options)
    }
    if (isSearch) {
      // Next match entries.
      this._matchSearchEntries(rgx, entryIds, folderIds, autoExpandIds, options)
      if (entryIds.size) {
        const entries = this.collection.index ?? this.collection.contents
        entryIds.forEach((entryId) => {
          const entry = entries.get(entryId)
          if ((type !== '' && entry.type !== type) || (era !== '' && !(entry.flags?.[FOLDER_ID]?.cocidFlag?.eras?.[era] ?? false))) {
            entryIds.delete(entryId)
          }
        })
      }
    }

    // Toggle each directory entry.
    for (const el of html.querySelectorAll('.directory-item')) {
      if (el.hidden) {
        continue
      }
      if (el.classList.contains('folder')) {
        const { folderId, uuid } = el.dataset
        const match = folderIds.has(folderId)
        el.style.display = !query || match ? 'flex' : 'none'
        if (autoExpandIds.has(folderId)) {
          if (isNameSearch && match) {
            el.classList.add('expanded')
          }
        } else {
          el.classList.toggle('expanded', uuid in game.folders._expanded)
        }
      } else {
        el.style.display = (!isSearch && !query) || entryIds.has(el.dataset.entryId) ? 'flex' : 'none'
      }
    }
  } else {
    oldSearchFilter.call(this, event, query, rgx, html)
  }
}

export default function () {
  oldSearchFilter = foundry.applications.sidebar.apps.Compendium.prototype._onSearchFilter
  foundry.applications.sidebar.apps.Compendium.prototype._onSearchFilter = _onSearchFilter

  Hooks.on('renderCompendium', async (app, html, data) => {
    if (app.documentName === 'Item') {
      if (!app.collection.indexed) {
        await app.collection.getIndex()
      }
      const types = [...new Set(app.collection.index.map(item => item.type))]
      const selectTypes = []
      const selectEras = []
      const selectedType = (app.options.filterCoC7?.type ?? '')
      const selectedEra = (app.options.filterCoC7?.era ?? '')
      selectTypes.push('<option value="">' + game.i18n.localize('CoC7.All') + '</option>')
      for (const typeLabel in CONFIG.Item.typeLabels) {
        if (types.includes(typeLabel)) {
          selectTypes.push('<option value="' + typeLabel + '"' + (selectedType === typeLabel ? ' selected="selected"' : '') + '>' + game.i18n.localize(CONFIG.Item.typeLabels[typeLabel]) + '</option>')
        }
      }
      selectEras.push('<option value="">' + game.i18n.localize('CoC7.All') + '</option>')
      for (const era of Object.entries(ERAS).map(e => { return { value: e[0], label: game.i18n.localize(e[1].label) } }).sort(CoC7Utilities.sortByLabelKey)) {
        selectEras.push('<option value="' + era.value + '"' + (selectedEra === era.value ? ' selected="selected"' : '') + '>' + era.label + '</option>')
      }
      let uncommon = game.i18n.localize('CoC7.SkillRarityShort')
      if (uncommon === 'CoC7.SkillRarityShort') {
        uncommon = '??'
      }
      const directoryItems = html.querySelectorAll('li.directory-item')
      if (directoryItems) {
        for (const directoryItem of directoryItems) {
          const item = app.collection.index.get(directoryItem.dataset.entryId)
          if (item && item.type === 'skill') {
            directoryItem.querySelector('a').innerHTML = item.name + ' (' + (item.system?.base ?? '?') + '%)' + ((item.system?.properties?.rarity ?? false) ? ' ' + uncommon : '')
          }
        }
      }
      const header = html.querySelector('header.directory-header search')
      {
        const search = document.createElement('search')
        search.classList.add('compendium-search-filter', 'hidden')
        search.innerHTML = '<i class="fa-regular fa-calendar"></i><select name="coc7era">' + selectEras.join('') + '</select>'
        header.after(search)
      }
      {
        const search = document.createElement('search')
        search.classList.add('compendium-search-filter')
        search.innerHTML = '<i class="fa-solid fa-layer-group"></i><select name="coc7type">' + selectTypes.join('') + '</select>'
        header.after(search)
      }
      const selects = html.querySelectorAll('header.directory-header search select')
      for (const select of selects) {
        select.onchange = (event) => {
          const input = event.target.closest('header').querySelector('search input')
          const newEvent = new Event('input', {
            bubbles: true
          })
          input.dispatchEvent(newEvent)
        }
      }
    }
  })
}
