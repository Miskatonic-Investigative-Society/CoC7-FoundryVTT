/* global Actor Card CONFIG foundry fromUuid game Item JournalEntry Macro Playlist RollTable Scene ui */
import { FOLDER_ID, ERAS } from '../constants.js'
import CoC7Utilities from './utilities.js'
import deprecated from '../deprecated.js'

export default class CoCID {
  /**
   * Configure fields loading in compendium index
   */
  static init () {
    CONFIG.Actor.compendiumIndexFields.push('flags.' + FOLDER_ID + '.cocidFlag')
    // CONFIG.Cards.compendiumIndexFields.push('flags.' + FOLDER_ID + '.cocidFlag')
    CONFIG.Item.compendiumIndexFields.push('flags.' + FOLDER_ID + '.cocidFlag')
    CONFIG.Item.compendiumIndexFields.push('system.base')
    CONFIG.Item.compendiumIndexFields.push('system.properties')
    CONFIG.Item.compendiumIndexFields.push('system.skillName')
    CONFIG.JournalEntry.compendiumIndexFields.push('flags.' + FOLDER_ID + '.cocidFlag')
    CONFIG.Macro.compendiumIndexFields.push('flags.' + FOLDER_ID + '.cocidFlag')
    CONFIG.Playlist.compendiumIndexFields.push('flags.' + FOLDER_ID + '.cocidFlag')
    CONFIG.RollTable.compendiumIndexFields.push('flags.' + FOLDER_ID + '.cocidFlag')
    CONFIG.Scene.compendiumIndexFields.push('flags.' + FOLDER_ID + '.cocidFlag')
    game.CoC7.cocid = CoCID
  }

  /**
   * Returns RegExp for valid type and format
   * @returns {RegExp}
   */
  static #regExKey () {
    return new RegExp('^(' + Object.keys(CoCID.#gamePropertyLookup).join('|') + ')\\.(.*?)\\.(.+)$')
  }

  /**
   * Get CoCID type.subtype. based on document
   * @param {Document} document
   * @returns {string}
   */
  static getPrefix (document) {
    for (const type in CoCID.#documentNameLookup) {
      if (document instanceof CoCID.#documentNameLookup[type]) {
        return type + '.' + (document.type ?? '') + '.'
      }
    }
    return ''
  }

  /**
   * Get CoCID type.subtype.name based on document
   * @param {Document} document
   * @returns {string}
   */
  static guessId (document) {
    return CoCID.getPrefix(document) + CoC7Utilities.toKebabCase(document.name)
  }

  /**
   * Get CoCID type.subtype.partial-name(-removed)
   * @param {string} id
   * @returns {string}
   */
  static guessGroupFromKey (id) {
    if (id) {
      const key = id.replace(/([^\\.-]+)$/, '')
      if (key.endsWith('-')) {
        return key
      }
    }
    return ''
  }

  /**
   * Get CoCID type.subtype.partial-name(-removed)
   * @param {Document} document
   * @returns {string}
   */
  static guessGroupFromDocument (document) {
    return CoCID.guessGroupFromKey(document.flags?.[FOLDER_ID]?.cocidFlag?.id)
  }

  /**
   * Returns translation of era key
   * @param {string|boolean} era the eras to match against ('standard', 'modernPulp', ...), true = world default, false = no filter
   * @returns {string}
   */
  static eraText (era) {
    if (era === false) {
      return game.i18n.localize('CoC7.Any')
    } else if (era === true) {
      era = game.settings.get(FOLDER_ID, 'worldEra')
    }

    return game.i18n.format(ERAS[era]?.name ?? 'CoC7.CoCIDFlag.error.unknown-era', { era })
  }

  /**
   * Returns all items with matching CoCIDs, language, and eras
   * ui.notifications.warn for missing keys
   * @param {object} options
   * @param {Array} options.itemList array of CoCIDs
   * @param {string} options.lang the language to match against ('en', 'es', ...)
   * @param {string|boolean} options.era the eras to match against ('standard', 'modernPulp', ...), true = world default, false = no filter
   * @param {boolean} options.langFallback should the system fall back to en in case there is no translation
   * @param {boolean} options.showLoading Show loading bar
   * @returns {Array}
   */
  static async expandItemArray ({ itemList, lang = game.i18n.lang, era = true, langFallback = true, showLoading = false } = {}) {
    const cocids = itemList.filter(it => typeof it === 'string')
    let items = itemList.filter(it => typeof it !== 'string')
    if (cocids.length) {
      const found = await CoCID.fromCoCIDRegexBest({ cocidRegExp: CoCID.makeGroupRegEx(cocids), type: 'i', lang, era, langFallback, showLoading })
      const all = []
      for (const cocid of cocids) {
        const item = found.find(i => i.flags[FOLDER_ID].cocidFlag.id === cocid)
        if (item) {
          all.push(item)
        }
      }
      if (all.length < cocids.length) {
        const notMissing = []
        for (const doc of all) {
          notMissing.push(doc.flags[FOLDER_ID].cocidFlag.id)
        }
        if (era === true) {
          era = game.settings.get(FOLDER_ID, 'worldEra')
        }
        /* // FoundryVTT V12 */
        ui.notifications.warn(game.i18n.format('CoC7.CoCIDFlag.error.documents-not-found', { cocids: cocids.filter(x => !notMissing.includes(x)).join(', '), lang, era: CoCID.eraText(era) }))
      }
      items = items.concat(all)
    }
    return items
  }

  /**
   * Returns item with matching CoCIDs from list
   * Empty array return for missing keys
   * @param {string} cocid a single cocid
   * @param {Array|object} list array of items
   * @returns {Array}
   */
  static findCocIdInList (cocid, list) {
    let itemName = ''
    const CoCIDKeys = Object.assign(foundry.utils.flattenObject(game.i18n._fallback[FOLDER_ID]?.CoCIDFlag?.keys ?? {}), foundry.utils.flattenObject(game.i18n.translations[FOLDER_ID]?.CoCIDFlag?.keys ?? {}))
    if (typeof CoCIDKeys[cocid] !== 'undefined') {
      itemName = CoCIDKeys[cocid]
    }
    return (typeof list.filter === 'undefined' ? Object.values(list) : list).filter(i => i.flags?.[FOLDER_ID]?.cocidFlag?.id === cocid || (itemName !== '' && itemName === i.name))
  }

  /**
   * Returns RegExp matching all strings in array
   * @param {Array} cocids an array of CoCID strings
   * @returns {RegExp}
   */
  static makeGroupRegEx (cocids) {
    if (typeof cocids === 'string') {
      cocids = [cocids]
    } else if (typeof cocids === 'undefined' || typeof cocids.filter !== 'function') {
      return undefined
    }
    const splits = {}
    const rgx = CoCID.#regExKey()
    for (const i of cocids) {
      const key = i.match(rgx)
      if (key) {
        if (typeof splits[key[1]] === 'undefined') {
          splits[key[1]] = {}
        }
        if (typeof splits[key[1]][key[2]] === 'undefined') {
          splits[key[1]][key[2]] = []
        }
        splits[key[1]][key[2]].push(key[3])
      } else {
        // Silently error
      }
    }
    const regExParts = []
    for (const t in splits) {
      const row = []
      for (const s in splits[t]) {
        if (splits[t][s].length > 1) {
          row.push(s + '\\.' + '(' + splits[t][s].join('|') + ')')
        } else {
          row.push(s + '\\.' + splits[t][s].join(''))
        }
      }
      if (row.length > 1) {
        regExParts.push(t + '\\.' + '(' + row.join('|') + ')')
      } else {
        regExParts.push(t + '\\.' + row.join(''))
      }
    }
    if (regExParts.length > 1) {
      return new RegExp('^(' + regExParts.join('|') + ')$')
    }
    return new RegExp('^' + regExParts.join('') + '$')
  }

  /**
   * Returns all documents with an CoCID matching the regex and matching the document type
   * and language, from the specified scope.
   * Empty array return for no matches
   * @param {object} options
   * @param {RegExp} options.cocidRegExp regex used on the CoCID
   * @param {string} options.type the first part of the wanted CoCID, for example 'i', 'a', 'je'
   * @param {string} options.lang the language to match against ('en', 'es', ...)
   * @param {string|boolean} options.era the eras to match against ('standard', 'modernPulp', ...), true = world default, false = no filter
   * @param {string} options.scope defines where it will look:
   * **all**: find in both world & compendia,
   * **world**: only search in world,
   * **compendiums**: only search in compendiums
   * @param {boolean} options.langFallback should the system fall back to en in case there is no translation
   * @param {boolean} options.showLoading Show loading bar
   * @returns {Array}
   */
  static async fromCoCIDRegexAll ({ cocidRegExp, type, lang = game.i18n.lang, era = false, scope = 'all', langFallback = true, showLoading = false } = {}) {
    let candidates = await CoCID.fromCoCIDRegexAllMixed({ cocidRegExp, type, lang, era, scope, langFallback, showLoading })
    if (langFallback && lang !== 'en') {
      candidates = CoCID.#filterByLanguage(candidates, lang)
    }
    candidates.sort(CoCID.#compareCoCIDPriority)
    let progressBar = false
    if (showLoading && candidates.length > 0) {
      progressBar = {
        current: 0,
        max: candidates.length + 1 // Will always call pct = 1 after progress to prevent rounding issues
      }
      /* // FoundryVTT V12 */
      if (foundry.utils.isNewerVersion(game.version, 13)) {
        progressBar.bar = ui.notifications.info('CoC7.CoCIDFlag.loading', { localize: true, progress: true, console: false })
      } else {
        progressBar.bar = deprecated.displayProgressBar(game.i18n.localize('CoC7.CoCIDFlag.loading'))
      }
    }
    return await CoCID.#onlyDocuments(candidates, progressBar)
  }

  /**
   * Returns all documents with an CoCID, language, and era from the specified scope.
   * Empty array return for no matches
   * @param {object} options
   * @param {string} options.cocid a single cocid
   * @param {string} options.lang the language to match against ('en', 'es', ...)
   * @param {string|boolean} options.era the eras to match against ('standard', 'modernPulp', ...), true = world default, false = no filter
   * @param {string} options.scope defines where it will look:
   * **all**: find in both world & compendia,
   * **world**: only search in world,
   * **compendiums**: only search in compendiums
   * @param {boolean} options.langFallback should the system fall back to en in case there is no translation
   * @param {boolean} options.showLoading Show loading bar
   * @returns {Array}
   */
  static async fromCoCIDAll ({ cocid, lang = game.i18n.lang, era = false, scope = 'all', langFallback = true, showLoading = false } = {}) {
    if (!cocid || typeof cocid !== 'string') {
      return []
    }
    const parts = cocid.match(CoCID.#regExKey())
    if (!parts) {
      return []
    }
    if (lang === '') {
      lang = game.i18n.lang
    }
    return CoCID.fromCoCIDRegexAll({ cocidRegExp: new RegExp('^' + CoC7Utilities.quoteRegExp(cocid) + '$'), type: parts[1], lang, era, scope, langFallback, showLoading })
  }

  /**
   * Gets only the highest priority documents for each CoCID that matches the RegExp and language, with the highest priority documents in the World taking precedence over any documents in compendium packs.
   * Empty array return for no matches
   * @param {object} options
   * @param {RegExp} options.cocidRegExp regex used on the CoCID
   * @param {string} options.type the first part of the wanted CoCID, for example 'i', 'a', 'je'
   * @param {string} options.lang the language to match against ("en", "es", ...)
   * @param {string|true} options.era the eras to match against ('standard', 'modernPulp', ...), true = world default
   * @param {boolean} options.langFallback should the system fall back to en in case there is no translation
   * @param {boolean} options.showLoading Show loading bar
   * @returns {Array}
   */
  static async fromCoCIDRegexBest ({ cocidRegExp, type, lang = game.i18n.lang, era = true, langFallback = true, showLoading = false } = {}) {
    let candidates = await this.fromCoCIDRegexAllMixed({ cocidRegExp, type, lang, era, scope: 'all', langFallback, showLoading })
    if (langFallback && lang !== 'en') {
      candidates = CoCID.#filterByLanguage(candidates, lang)
    }
    candidates.sort(CoCID.#compareCoCIDPriority)
    const ids = {}
    for (const candidate of candidates) {
      if (typeof ids[candidate.flags[FOLDER_ID].cocidFlag.id] === 'undefined') {
        ids[candidate.flags[FOLDER_ID].cocidFlag.id] = candidate
      }
    }
    let progressBar = false
    const documentList = Object.values(ids)
    if (showLoading && documentList.length > 0) {
      progressBar = {
        current: 0,
        max: documentList.length + 1 // Will always call pct = 1 after progress to prevent rounding issues
      }
      /* // FoundryVTT V12 */
      if (foundry.utils.isNewerVersion(game.version, 13)) {
        progressBar.bar = ui.notifications.info('CoC7.CoCIDFlag.loading', { localize: true, progress: true, console: false })
      } else {
        progressBar.bar = deprecated.displayProgressBar(game.i18n.localize('CoC7.CoCIDFlag.loading'))
      }
    }
    return await CoCID.#onlyDocuments(documentList, progressBar)
  }

  /**
   * Gets only the highest priority document for CoCID that matches the language, with the highest priority documents in the World taking precedence over any documents in compendium packs.
   * @param {string} cocid CoCID
   * @param {string} lang the language to match against ("en", "es", ...)
   * @param {string|true} era the eras to match against ('standard', 'modernPulp', ...), true = world default
   * @param {boolean} langFallback should the system fall back to en in case there is no translation
   * @param {boolean} showLoading Show loading bar
   * @returns {Array}
   */
  static fromCoCID (cocid, lang = game.i18n.lang, era = true, langFallback = true, showLoading = false) {
    if (era === false) {
      /* // FoundryVTT V12 */
      ui.notifications.error(game.i18n.format('CoC7.CoCIDFlag.error.unknown-era', { era: game.i18n.localize('CoC7.Any') }))
      return []
    }
    return CoCID.fromCoCIDBest({ cocid, lang, era, langFallback, showLoading })
  }

  /**
   * Gets only the highest priority document for CoCID that matches the language, with the highest priority documents in the World taking precedence over any documents in compendium packs.
   * @param {object} options
   * @param {string} options.cocid CoCID
   * @param {string} options.lang the language to match against ("en", "es", ...)
   * @param {string|true} options.era the eras to match against ('standard', 'modernPulp', ...), true = world default
   * @param {boolean} options.langFallback should the system fall back to en in case there is no translation
   * @param {boolean} options.showLoading Show loading bar
   * @returns {Array}
   */
  static fromCoCIDBest ({ cocid, lang = game.i18n.lang, era = true, langFallback = true, showLoading = false } = {}) {
    if (!cocid || typeof cocid !== 'string') {
      return []
    }
    if (era === false) {
      /* // FoundryVTT V12 */
      ui.notifications.error(game.i18n.format('CoC7.CoCIDFlag.error.unknown-era', { era: game.i18n.localize('CoC7.Any') }))
      return []
    }
    const type = cocid.split('.')[0]
    const cocidRegExp = new RegExp('^' + CoC7Utilities.quoteRegExp(cocid) + '$')
    return CoCID.fromCoCIDRegexBest({ cocidRegExp, type, lang, era, langFallback, showLoading })
  }

  /**
   * Returns all documents or indexes with an CoCID matching the regex and matching the document type and language, from the specified scope.
   * Empty array return for no matches
   * @param {object} options
   * @param {RegExp} options.cocidRegExp regex used on the CoCID
   * @param {string} options.type the first part of the wanted CoCID, for example 'i', 'a', 'je'
   * @param {string|boolean} options.era the eras to match against ('standard', 'modernPulp', ...), true = world default, false = no filter
   * @param {string} options.lang the language to match against ('en', 'es', ...)
   * @param {string} options.scope defines where it will look:
   * **all**: find in both world & compendia,
   * **world**: only search in world,
   * **compendiums**: only search in compendiums
   * @param {boolean} options.langFallback should the system fall back to en in case there is no translation
   * @param {boolean} options.showLoading Show loading bar
   * @returns {Array}
   */
  static async fromCoCIDRegexAllMixed ({ cocidRegExp, type, lang = game.i18n.lang, era = false, scope = 'all', langFallback = true, showLoading = false } = {}) {
    if (!cocidRegExp) {
      return []
    }

    let results = []

    let progressBar = false
    if (showLoading) {
      progressBar = {
        current: 0,
        max: (['all', 'world'].includes(scope) ? 1 : 0) + (['all', 'compendiums'].includes(scope) ? game.packs.size : 0) + 1 // Will always call pct = 1 after progress to prevent rounding issues
      }
      /* // FoundryVTT V12 */
      if (foundry.utils.isNewerVersion(game.version, 13)) {
        progressBar.bar = ui.notifications.info('SETUP.PackagesLoading', { localize: true, progress: true, console: false })
      } else {
        progressBar.bar = deprecated.displayProgressBar(game.i18n.localize('SETUP.PackagesLoading'))
      }
    }
    if (['all', 'world'].includes(scope)) {
      results = results.concat(await CoCID.#docsFromWorld({ cocidRegExp, type, lang, era, langFallback, progressBar }))
    }

    if (['all', 'compendiums'].includes(scope)) {
      results = results.concat(await CoCID.#indexesFromCompendia({ cocidRegExp, type, lang, era, langFallback, progressBar }))
    }

    if (showLoading) {
      // await new Promise(resolve => setTimeout(resolve, 1000))
      progressBar.bar.remove()
    }
    return results
  }

  /**
   * Get a list of all documents matching the CoCID regex, language, and era from the world.
   * The document list is sorted with the highest priority first.
   * @param {object} options
   * @param {RegExp} options.cocidRegExp regex used on the CoCID
   * @param {string} options.type the first part of the wanted CoCID, for example 'i', 'a', 'je'
   * @param {string|boolean} options.era the eras to match against ('standard', 'modernPulp', ...), true = world default, false = no filter
   * @param {string} options.lang the language to match against ('en', 'es', ...)
   * @param {boolean} options.langFallback should the system fall back to en in case there is no translation
   * @param {object|false} options.progressBar containing progress bar
   * @returns {Array}
   */
  static async #docsFromWorld ({ cocidRegExp, type, lang = game.i18n.lang, era = false, langFallback = true, progressBar = false } = {}) {
    if (!cocidRegExp) {
      return []
    }
    if (lang === '') {
      lang = game.i18n.lang
    }
    if (era === true) {
      era = game.settings.get(FOLDER_ID, 'worldEra')
    }

    if (progressBar !== false) {
      // await new Promise(resolve => setTimeout(resolve, 1000))
      progressBar.bar.update({ pct: progressBar.current / progressBar.max })
      progressBar.current++
    }

    const gameProperty = CoCID.#getGameProperty(`${type}..`)

    const candidateDocuments = game[gameProperty]?.filter((d) => {
      const cocidFlag = d.getFlag(FOLDER_ID, 'cocidFlag')
      if (typeof cocidFlag === 'undefined') {
        return false
      }
      const eras = (cocidFlag.eras ?? [])
      const matchingEras = (era === false || Object.entries(eras).length === 0 || (typeof eras[era] !== 'undefined' && eras[era]))
      return cocidRegExp.test(cocidFlag.id) && [lang, (langFallback ? 'en' : '-')].includes(cocidFlag.lang) && matchingEras
    })

    if (candidateDocuments === undefined) {
      return []
    }

    return candidateDocuments
  }

  /**
   * Get a list of all indexes matching the CoCID regex, language, and era from the compendiums.
   * @param {object} options
   * @param {RegExp} options.cocidRegExp regex used on the CoCID
   * @param {string} options.type the first part of the wanted CoCID, for example 'i', 'a', 'je'
   * @param {string|boolean} options.era the eras to match against ('standard', 'modernPulp', ...), true = world default, false = no filter
   * @param {string} options.lang the language to match against ('en', 'es', ...)
   * @param {boolean} options.langFallback should the system fall back to en in case there is no translation
   * @param {object|false} options.progressBar containing progress bar
   * @returns {Array}
   */
  static async #indexesFromCompendia ({ cocidRegExp, type, lang = game.i18n.lang, era = false, langFallback = true, progressBar = false }) {
    if (!cocidRegExp) {
      return []
    }
    if (lang === '') {
      lang = game.i18n.lang
    }
    if (era === true) {
      era = game.settings.get(FOLDER_ID, 'worldEra')
    }

    const documentType = CoCID.#getDocumentType(type).name
    let indexDocuments = []

    for (const pack of game.packs) {
      if (progressBar !== false) {
        // await new Promise(resolve => setTimeout(resolve, 1000))
        progressBar.bar.update({ pct: progressBar.current / progressBar.max })
        progressBar.current++
      }
      if (pack.documentName === documentType) {
        if (!pack.indexed) {
          await pack.getIndex()
        }
        indexDocuments = indexDocuments.concat(pack.index.filter((i) => {
          if (typeof i.flags?.[FOLDER_ID]?.cocidFlag?.id !== 'string') {
            return false
          }
          const eras = (i.flags[FOLDER_ID].cocidFlag.eras ?? {})
          const matchingEras = (era === false || Object.entries(eras).length === 0 || (typeof eras[era] !== 'undefined' && eras[era]))
          return cocidRegExp.test(i.flags[FOLDER_ID].cocidFlag.id) && [lang, (langFallback ? 'en' : '-')].includes(i.flags[FOLDER_ID].cocidFlag.lang) && matchingEras
        }))
      }
    }
    return indexDocuments
  }

  /**
   * Sort a list of document on CoCID priority - the highest first.
   * If priority is the same use world over compendiums
   * @param {Document} a
   * @param {Document} b
   * @returns {int} >0,<0,===0
   * @example
   * aListOfDocuments.sort(CoCID.#compareCoCIDPriority)
   */
  static #compareCoCIDPriority (a, b) {
    const ap = parseInt(a.flags[FOLDER_ID].cocidFlag.priority, 10)
    const bp = parseInt(b.flags[FOLDER_ID].cocidFlag.priority, 10)
    if (ap === bp) {
      const ao = a instanceof foundry.abstract.DataModel
      const bo = b instanceof foundry.abstract.DataModel
      if (ao === bo) {
        return 0
      } else {
        return (ao ? -1 : 1)
      }
    }
    return bp - ap
  }

  /**
   * Translates the first part of a CoCID to what those documents are called in the `game` object.
   * @param {string} cocid a single cocid
   * @returns {string}
   */
  static #getGameProperty (cocid) {
    const type = cocid.split('.')[0]
    const gameProperty = CoCID.#gamePropertyLookup[type]
    if (!gameProperty) {
      ui.notifications.warn('CoC7.CoCIDFlag.error.incorrect.type', { localize: true })
      console.log('CoC7 | ', cocid)
      throw new Error()
    }
    return gameProperty
  }

  /**
   * First part of CoC ID to game[...]
   * @returns {object}
   */
  static get #gamePropertyLookup () {
    return {
      a: 'actors',
      c: 'cards',
      i: 'items',
      je: 'journal',
      m: 'macros',
      p: 'playlists',
      rt: 'tables',
      s: 'scenes'
    }
  }

  /**
   * Translates the first part of a CoCID to what those documents are called in the `game` object.
   * @param {string} cocid a single cocid
   * @returns {Document}
   */
  static #getDocumentType (cocid) {
    const type = cocid.split('.')[0]
    const documentType = CoCID.#documentNameLookup[type]
    if (!documentType) {
      ui.notifications.warn('CoC7.CoCIDFlag.error.incorrect.type', { localize: true })
      console.log('CoC7 | ', cocid)
      throw new Error()
    }
    return documentType
  }

  /**
   * First part of CoC ID to Type
   * @returns {object}
   */
  static get #documentNameLookup () {
    return {
      a: Actor,
      c: Card,
      i: Item,
      je: JournalEntry,
      m: Macro,
      p: Playlist,
      rt: RollTable,
      s: Scene
    }
  }

  /**
   * Replace indexes with their documents
   * @param {Array} candidates
   * @param {object|false} progressBar containing progress bar
   * @returns {Array}
   */
  static async #onlyDocuments (candidates, progressBar) {
    for (const offset in candidates) {
      if (progressBar !== false) {
        // await new Promise(resolve => setTimeout(resolve, 1000))
        progressBar.bar.update({ pct: progressBar.current / progressBar.max })
        progressBar.current++
      }
      if (!(candidates[offset] instanceof foundry.abstract.DataModel)) {
        candidates[offset] = await fromUuid(candidates[offset].uuid)
      }
    }
    if (progressBar !== false) {
      // await new Promise(resolve => setTimeout(resolve, 1000))
      progressBar.bar.remove()
    }
    return candidates
  }

  /**
   * Filter an array of index or documents.
   * If a CoCID has a version lang then remove the en versions
   * @param {Array} indexes
   * @param {string} lang
   * @returns {Array}
   */
  static #filterByLanguage (indexes, lang) {
    const ids = indexes.reduce((c, i) => {
      c[i.flags[FOLDER_ID].cocidFlag.id] = c[i.flags[FOLDER_ID].cocidFlag.id] || i.flags[FOLDER_ID].cocidFlag.lang === lang
      return c
    }, {})
    return indexes.filter(i => i.flags[FOLDER_ID].cocidFlag.lang !== 'en' || !ids[i.flags[FOLDER_ID].cocidFlag.id])
  }

  /**
   * Toggle Era flag
   * @param {Document} document
   * @param {string} era
   * @param {object} options
   * @param {boolean} options.isCtrlKey
   */
  static async eraToggle (document, era, { isCtrlKey = false } = {}) {
    if (document.type === 'setup') {
      // Setups can only have one era to make sure the correct skills are populated via CoC ID
      const update = {
        [era]: true
      }
      if (typeof document.flags?.[FOLDER_ID]?.cocidFlag?.eras !== 'undefined') {
        for (const [key] of Object.entries(document.flags[FOLDER_ID].cocidFlag.eras)) {
          if (key !== era) {
            /* // FoundryVTT V13 */
            update['-=' + key] = null
          }
        }
      }
      await document.update({
        ['flags.' + FOLDER_ID + '.cocidFlag.eras']: update
      })
    } else {
      const cocidFlag = document.getFlag(FOLDER_ID, 'cocidFlag') ?? {}
      if (typeof cocidFlag.eras === 'undefined') {
        cocidFlag.eras = {}
      }
      const value = cocidFlag.eras[era] ?? false
      if (value) {
        /* // FoundryVTT V13 */
        cocidFlag.eras['-=' + era] = null
      } else {
        cocidFlag.eras[era] = true
      }
      await document.setFlag(FOLDER_ID, 'cocidFlag', cocidFlag)
    }
  }
}
