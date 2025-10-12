/* global Compendium CONFIG foundry game Hooks SearchFilter */
import { COC7 } from '../config.js'
import { CoC7Utilities } from '../utilities.js'

/* // FoundryVTT v12 */
let oldSearchFilter

const showEraList = [
  'occupation',
  'setup',
  'skill',
  'weapon'
]

/* // FoundryVTT v12 */
function matchSearchEntriesItem (app, isNameSearch, query, type, era, entryIds, folderIds, includeFolder) {
  const entries = app.collection.index ?? app.collection.contents

  // Copy the folderIds to a new set so we can add to the original set without incorrectly adding child entries
  const matchedFolderIds = new Set(folderIds)

  for (const entry of entries) {
    const entryId = app._getEntryId(entry)
    // If we matched a folder, add its children entries
    if (matchedFolderIds.has(entry.folder?._id ?? entry.folder)) {
      entryIds.add(entryId)
    } else {
      const matchName = (!isNameSearch || query.test(SearchFilter.cleanQuery(app._getEntryName(entry))))
      const matchType = (type === '' || type === entry.type)
      const eras = Object.keys(entry.flags?.CoC7?.cocidFlag?.eras ?? {})
      const matchEras = (era === '' || eras.length === 0 || eras.includes(era))
      if (matchName && matchType && matchEras) {
        // Otherwise, if we are searching by name, match the entry name
        entryIds.add(entryId)
        includeFolder(entry.folder)
      }
    }
  }
}

function _onSearchFilterV12 (event, query, rgx, html) {
  if (this.collection.documentName === 'Item') {
    if (typeof html === 'undefined') {
      query = this.element[0].querySelector(this.options.filters[0].inputSelector).value
      rgx = new RegExp(RegExp.escape(query), 'i')
      html = this.element[0].querySelector(this.options.filters[0].contentSelector)
    }
    const typeSelect = this.element[0].querySelector('select[name=coc7type]')
    const eraSelect = this.element[0].querySelector('select[name=coc7era]')
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

    // Match entries and folders.
    if (isSearch) {
      // Include folders and their parents, auto-expanding parent folders
      const includeFolder = (folder, autoExpand = true) => {
        if (!folder) {
          return
        }
        if (typeof folder === 'string') {
          folder = this.collection.folders.get(folder)
        }
        if (!folder) {
          return
        }
        const folderId = folder._id
        if (folderIds.has(folderId)) {
          // If this folder is not already auto-expanding, but it should be, add it to the set
          if (autoExpand && !autoExpandIds.has(folderId)) {
            autoExpandIds.add(folderId)
          }
          return
        }
        folderIds.add(folderId)
        if (autoExpand) {
          autoExpandIds.add(folderId)
        }
        if (folder.folder) {
          includeFolder(folder.folder)
        }
      }

      if (isNameSearch) {
        // First match folders
        this._matchSearchFolders(rgx, includeFolder)
      }

      // Next match entries
      matchSearchEntriesItem(this, isNameSearch, rgx, type, era, entryIds, folderIds, includeFolder)
    }

    // Toggle each directory item
    for (const el of html.querySelectorAll('.directory-item')) {
      if (el.classList.contains('hidden')) {
        continue
      }
      if (el.classList.contains('folder')) {
        const match = isSearch && folderIds.has(el.dataset.folderId)
        el.style.display = (!isSearch || match) ? 'flex' : 'none'
        if (autoExpandIds.has(el.dataset.folderId)) {
          if (isSearch && match) {
            el.classList.remove('collapsed')
          }
        } else {
          el.classList.toggle('collapsed', !game.folders._expanded[el.dataset.uuid])
        }
      } else {
        el.style.display = (!isSearch || entryIds.has(el.dataset.entryId)) ? 'flex' : 'none'
      }
    }
  } else {
    oldSearchFilter.call(this, event, query, rgx, html)
  }
}

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
          if ((type !== '' && entry.type !== type) || (era !== '' && !(entry.flags?.CoC7?.cocidFlag?.eras?.[era] ?? false))) {
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
  /* // FoundryVTT v12 */
  oldSearchFilter = (foundry.applications.sidebar?.apps.Compendium ?? Compendium).prototype._onSearchFilter
  if (foundry.utils.isNewerVersion(game.version, '13')) {
    (foundry.applications.sidebar?.apps.Compendium ?? Compendium).prototype._onSearchFilter = _onSearchFilter
  } else {
    (foundry.applications.sidebar?.apps.Compendium ?? Compendium).prototype._onSearchFilter = _onSearchFilterV12
  }

  Hooks.on('renderCompendium', async (app, html, data) => {
    /* // FoundryVTT v12 */
    if ((app.documentName ?? app.collection.documentName) === 'Item') {
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
      for (const era of Object.entries(COC7.eras).map(e => { return { id: e[0], name: game.i18n.localize(e[1]) } }).sort(CoC7Utilities.sortByNameKey)) {
        selectEras.push('<option value="' + era.id + '"' + (selectedEra === era.id ? ' selected="selected"' : '') + '>' + era.name + '</option>')
      }
      let uncommon = game.i18n.localize('CoC7.SkillRarityShort')
      if (uncommon === 'CoC7.SkillRarityShort') {
        uncommon = '??'
      }
      /* // FoundryVTT v12 */
      let directoryItems = false
      let keyName = false
      if (foundry.utils.isNewerVersion(game.version, '13')) {
        directoryItems = html.querySelectorAll('li.directory-item')
        keyName = 'entryId'
      } else {
        directoryItems = html.find('li.directory-item')
        keyName = 'documentId'
      }
      if (directoryItems) {
        for (const directoryItem of directoryItems) {
          const item = app.collection.index.get(directoryItem.dataset[keyName])
          if (item && item.type === 'skill') {
            directoryItem.querySelector('a').innerHTML = item.name + ' (' + (item.system?.base ?? '?') + '%)' + ((item.system?.properties?.rarity ?? false) ? ' ' + uncommon : '')
          }
        }
      }
      /* // FoundryVTT v12 */
      if (foundry.utils.isNewerVersion(game.version, '13')) {
        const header = html.querySelector('header.directory-header search')
        {
          const search = document.createElement('search')
          search.classList.add(['compendium-search-filter', 'hidden'])
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
      } else {
        const header = html[0].querySelector('header.directory-header')
        const search = document.createElement('search')
        search.classList.add('compendiumfilter')
        search.innerHTML = '<div class="header-search flexrow"><i class="fa-solid fa-layer-group"></i><select name="coc7type">' + selectTypes.join('') + '</select></div>' +
          '<div class="header-search flexrow hidden"><i class="fa-regular fa-calendar"></i><select name="coc7era">' + selectEras.join('') + '</select></div>'
        header.after(search)
        html.find('select').change(app.options.filters[0].callback.bind(app))
      }
    }
  })
}
