/* global Compendium, foundry, game, Hooks, SearchFilter */
import { COC7 } from '../config.js'
import { CoC7Utilities } from '../utilities.js'

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

/* // FoundryVTT v12 */
let oldSearchFilter

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
    switch (type) {
      case 'occupation':
      case 'setup':
      case 'skill':
      case 'weapon':
        eraSelect.parentElement.style.display = ''
        era = eraSelect.value
        break
      default:
        eraSelect.parentElement.style.display = 'hide'
    }

    const isNameSearch = !!query
    const isSearch = isNameSearch || type !== '' || era !== ''
    const entryIds = new Set()
    const folderIds = new Set()
    const autoExpandFolderIds = new Set()

    // Match entries and folders
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
          if (autoExpand && !autoExpandFolderIds.has(folderId)) {
            autoExpandFolderIds.add(folderId)
          }
          return
        }
        folderIds.add(folderId)
        if (autoExpand) {
          autoExpandFolderIds.add(folderId)
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
        if (autoExpandFolderIds.has(el.dataset.folderId)) {
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
    switch (type) {
      case 'occupation':
      case 'setup':
      case 'skill':
      case 'weapon':
        eraSelect.parentElement.style.display = ''
        era = eraSelect.value
        break
      default:
        eraSelect.parentElement.style.display = 'hide'
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
        this._onMatchSearchEntry(query, entryIds, el, options)
      }
    }
  } else {
    oldSearchFilter.call(this, event, query, rgx, html)
  }
}

export function compendiumFilter () {
  /* // FoundryVTT v12 */
  oldSearchFilter = (foundry.applications.sidebar?.apps.Compendium ?? Compendium).prototype._onSearchFilter
  if (foundry.utils.isNewerVersion(game.version, '13')) {
    (foundry.applications.sidebar?.apps.Compendium ?? Compendium).prototype._onSearchFilter = _onSearchFilter
  } else {
    (foundry.applications.sidebar?.apps.Compendium ?? Compendium).prototype._onSearchFilter = _onSearchFilterV12
  }

  Hooks.on('renderCompendium', async (app, html, data) => {
    if (app.collection.documentName === 'Item') {
      if (!app.collection.indexed) {
        await app.collection.getIndex()
      }
      const types = [...new Set(app.collection.index.filter(i => i.name !== '#[CF_tempEntity]').map(item => item.type))]
      const select = []
      const selectedType = (app.options.filterCoC7?.type ?? '')
      const selectedEra = (app.options.filterCoC7?.era ?? '')
      select.push(
        '<option value="">' + game.i18n.localize('CoC7.All') + '</option>'
      )
      const groupTypes = [
        {
          key: 'archetype',
          name: 'CoC7.Entities.Archetype'
        },
        {
          key: 'book',
          name: 'CoC7.Entities.Book'
        },
        {
          key: 'item',
          name: 'CoC7.Entities.Item'
        },
        {
          key: 'occupation',
          name: 'CoC7.Entities.Occupation'
        },
        {
          key: 'setup',
          name: 'CoC7.Entities.Setup'
        },
        {
          key: 'skill',
          name: 'CoC7.Entities.Skill'
        },
        {
          key: 'spell',
          name: 'CoC7.Entities.Spell'
        },
        {
          key: 'status',
          name: 'CoC7.Entities.Status'
        },
        {
          key: 'talent',
          name: 'CoC7.Entities.Talent'
        },
        {
          key: 'weapon',
          name: 'CoC7.Entities.Weapon'
        }
      ]
      for (const groupType of groupTypes) {
        if (types.includes(groupType.key)) {
          select.push(
            '<option value="' + groupType.key + '"' + (selectedType === groupType.key ? ' selected="selected"' : '') + '>' +
              game.i18n.localize(groupType.name) +
              '</option>'
          )
        }
      }
      const eras = []
      eras.push(
        '<option value="">' + game.i18n.localize('CoC7.All') + '</option>'
      )
      for (const era of Object.entries(COC7.eras).map(e => { return { id: e[0], name: game.i18n.localize(e[1]) } }).sort(CoC7Utilities.sortByNameKey)) {
        eras.push(
          '<option value="' +
            era.id +
            '"' + (selectedEra === era.id ? ' selected="selected"' : '') + '>' +
            era.name +
            '</option>'
        )
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
      try {
        const header = html.querySelector('header.directory-header search')
        {
          const search = document.createElement('search')
          search.classList.add('compendiumSearchfilter', 'era_select')
          search.style.display = 'none'
          search.innerHTML = '<i class="fa-regular fa-calendar"></i><select name="coc7era">' + eras.join('') + '</select>'
          header.after(search)
        }
        {
          const search = document.createElement('search')
          search.classList.add('compendiumSearchfilter')
          search.innerHTML = '<i class="fas fa-layer-group"></i><select name="coc7type">' + select.join('') + '</select>'
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
      } catch (e) {
        /* // FoundryVTT v12 */
        const header = html[0].querySelector('header.directory-header')
        const search = document.createElement('search')
        search.classList.add('compendiumfilter')
        search.innerHTML = '<div class="compendiumfilter">' +
          '<div class="header-search flexrow-coc7"><i class="fas fa-layer-group"></i><select name="coc7type">' + select.join('') + '</select></div>' +
          '<div class="header-search flexrow-coc7 era_select" style="display:none"><i class="fa-regular fa-calendar"></i><select name="coc7era">' + eras.join('') + '</select></div>' +
          '</div>'
        header.after(search)
        html.find('select').change(app.options.filters[0].callback.bind(app))
      }
    }
  })
}
