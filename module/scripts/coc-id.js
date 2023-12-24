/* global Actor, Card, CONFIG, foundry, game, Item, JournalEntry, Macro, Playlist, RollTable, Scene, SceneNavigation, ui */
import { COC7 } from '../config.js'
import { CoC7Utilities } from '../utilities.js'

export class CoCID {
  static init () {
    CONFIG.Actor.compendiumIndexFields.push('flags.CoC7.cocidFlag')
    // CONFIG.Cards.compendiumIndexFields.push('flags.CoC7.cocidFlag')
    CONFIG.Item.compendiumIndexFields.push('flags.CoC7.cocidFlag')
    CONFIG.Item.compendiumIndexFields.push('system.base')
    CONFIG.Item.compendiumIndexFields.push('system.properties')
    CONFIG.JournalEntry.compendiumIndexFields.push('flags.CoC7.cocidFlag')
    CONFIG.Macro.compendiumIndexFields.push('flags.CoC7.cocidFlag')
    CONFIG.Playlist.compendiumIndexFields.push('flags.CoC7.cocidFlag')
    CONFIG.RollTable.compendiumIndexFields.push('flags.CoC7.cocidFlag')
    CONFIG.Scene.compendiumIndexFields.push('flags.CoC7.cocidFlag')
    game.system.api = {
      cocid: CoCID
    }
  }

  /**
   * Returns RegExp for valid type and format
   * @returns RegExp
   */
  static regExKey () {
    return new RegExp('^(' + Object.keys(CoCID.gamePropertyLookup).join('|') + ')\\.(.*?)\\.(.+)$')
  }

  /**
   * Get CoCID type.subtype. based on document
   * @param document
   * @returns string
   */
  static getPrefix (document) {
    for (const type in CoCID.documentNameLookup) {
      if (document instanceof CoCID.documentNameLookup[type]) {
        return type + '.' + (document.type ?? '') + '.'
      }
    }
    return ''
  }

  /**
   * Get CoCID type.subtype.name based on document
   * @param document
   * @returns string
   */
  static guessId (document) {
    return CoCID.getPrefix(document) + CoC7Utilities.toKebabCase(document.name)
  }

  /**
   * Get CoCID type.subtype.partial-name(-removed)
   * @param key
   * @returns string
   */
  static guessGroupFromKey (id) {
    if (id) {
      const key = id.replace(/([^\\.-]+)$/, '')
      if (key.substr(-1) === '-') {
        return key
      }
    }
    return ''
  }

  /**
   * Get CoCID type.subtype.partial-name(-removed)
   * @param document
   * @returns string
   */
  static guessGroupFromDocument (document) {
    return CoCID.guessGroupFromKey(document.flags?.CoC7?.cocidFlag?.id)
  }

  /**
   * Returns translation of era key
   * @param era the eras to match against ('standard', 'modernPulp', ...), true = world default, false = no filter
   * @returns string
   */
  static eraText (era) {
    if (era === false) {
      return game.i18n.localize('CoC7.Any')
    } else if (era === true) {
      era = game.settings.get('CoC7', 'worldEra')
    }

    return game.i18n.format(COC7.eras[era] ?? 'CoC7.CoCIDFlag.error.unknown-era', { era })
  }

  /**
   * Returns all items with matching CoCIDs, language, and eras
   * ui.notifications.warn for missing keys
   * @param itemList array of CoCIDs
   * @param lang the language to match against ('en', 'es', ...)
   * @param era the eras to match against ('standard', 'modernPulp', ...), true = world default, false = no filter
   * @param langFallback should the system fall back to en incase there is no translation
   * @param showLoading Show loading bar
   * @returns array
   */
  static async expandItemArray ({ itemList, lang = game.i18n.lang, era = true, langFallback = true, showLoading = false } = {}) {
    let items = []
    const cocids = itemList.filter(it => typeof it === 'string')
    items = itemList.filter(it => typeof it !== 'string')

    if (cocids.length) {
      const found = await CoCID.fromCoCIDRegexBest({ cocidRegExp: CoCID.makeGroupRegEx(cocids), type: 'i', lang, era, langFallback, showLoading })
      const all = []
      for (const cocid of cocids) {
        const item = found.find(i => i.flags.CoC7.cocidFlag.id === cocid)
        if (item) {
          all.push(item)
        }
      }
      if (all.length < cocids.length) {
        const notmissing = []
        for (const doc of all) {
          notmissing.push(doc.flags.CoC7.cocidFlag.id)
        }
        if (era === true) {
          era = game.settings.get('CoC7', 'worldEra')
        }
        ui.notifications.warn(game.i18n.format('CoC7.CoCIDFlag.error.documents-not-found', { cocids: cocids.filter(x => !notmissing.includes(x)).join(', '), lang, era: CoCID.eraText(era) }))
      }
      items = items.concat(all)
    }
    return items
  }

  /**
   * Returns item with matching CoCIDs from list
   * Empty array return for missing keys
   * @param cocid a single cocid
   * @param list array of items
   * @returns array
   */
  static findCocIdInList (cocid, list) {
    let itemName = ''
    const CoCIDKeys = foundry.utils.flattenObject(game.i18n.translations.CoC7.CoCIDFlag.keys)
    if (typeof CoCIDKeys[cocid] !== 'undefined') {
      itemName = CoCIDKeys[cocid]
    }
    return (typeof list.filter === 'undefined' ? Object.values(list) : list).filter(i => i.flags?.CoC7?.cocidFlag?.id === cocid || (itemName !== '' && itemName === i.name))
  }

  /**
   * Returns RegExp matching all strings in array
   * @param cocids an array of CoCID strings
   * @param list array of items
   * @returns RegExp
   */
  static makeGroupRegEx (cocids) {
    if (typeof cocids === 'string') {
      cocids = [cocids]
    } else if (typeof cocids === 'undefined' || typeof cocids.filter !== 'function') {
      return undefined
    }
    const splits = {}
    const rgx = CoCID.regExKey()
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
        // Sliently error
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
   * @param cocidRegExp regex used on the CoCID
   * @param type the first part of the wanted CoCID, for example 'i', 'a', 'je'
   * @param era the eras to match against ('standard', 'modernPulp', ...), true = world default, false = no filter
   * @param lang the language to match against ('en', 'es', ...)
   * @param scope defines where it will look:
   * **match** same logic as fromCoCID function,
   * **all**: find in both world & compendia,
   * **world**: only search in world,
   * **compendiums**: only search in compendiums
   * @param langFallback should the system fall back to en incase there is no translation
   * @param showLoading Show loading bar
   * @returns array
   */
  static async fromCoCIDRegexAll ({ cocidRegExp, type, lang = game.i18n.lang, era = false, scope = 'match', langFallback = true, showLoading = false } = {}) {
    if (!cocidRegExp) {
      return []
    }
    const result = []

    let count = 0
    if (showLoading) {
      if (['match', 'all', 'world'].includes(scope)) {
        count++
      }
      if (['match', 'all', 'compendiums'].includes(scope)) {
        count = count + game.packs.size
      }
    }

    if (['match', 'all', 'world'].includes(scope)) {
      const worldDocuments = await CoCID.documentsFromWorld({ cocidRegExp, type, lang, era, langFallback, progressBar: count })
      if (scope === 'match' && worldDocuments.length) {
        if (showLoading) {
          SceneNavigation.displayProgressBar({ label: game.i18n.localize('SETUP.PackagesLoading'), pct: 100 })
        }
        return this.filterAllCoCID(worldDocuments, langFallback && lang !== 'en')
      }
      result.splice(0, 0, ...worldDocuments)
    }

    if (['match', 'all', 'compendiums'].includes(scope)) {
      const compendiaDocuments = await CoCID.documentsFromCompendia({ cocidRegExp, type, lang, era, langFallback, progressBar: count })

      result.splice(result.length, 0, ...compendiaDocuments)
    }

    if (showLoading) {
      SceneNavigation.displayProgressBar({ label: game.i18n.localize('SETUP.PackagesLoading'), pct: 100 })
    }

    return this.filterAllCoCID(result, langFallback && lang !== 'en')
  }

  /**
   * Returns all documents with an CoCID, language, and era from the specified scope.
   * Empty array return for no matches
   * @param cocid a single cocid
   * @param lang the language to match against ('en', 'es', ...)
   * @param era the eras to match against ('standard', 'modernPulp', ...), true = world default, false = no filter
   * @param scope defines where it will look:
   * **match** same logic as fromCoCID function,
   * **all**: find in both world & compendia,
   * **world**: only search in world,
   * **compendiums**: only search in compendiums
   * @param langFallback should the system fall back to en incase there is no translation
   * @param showLoading Show loading bar
   * @returns array
   */
  static async fromCoCIDAll ({ cocid, lang = game.i18n.lang, era = false, scope = 'match', langFallback = true, showLoading = false } = {}) {
    if (!cocid || typeof cocid !== 'string') {
      return []
    }
    const parts = cocid.match(CoCID.regExKey())
    if (!parts) {
      return []
    }
    if (lang === '') {
      lang = game.i18n.lang
    }
    return CoCID.fromCoCIDRegexAll({ cocidRegExp: new RegExp('^' + CoC7Utilities.quoteRegExp(cocid) + '$'), type: parts[1], lang, era, scope, langFallback, showLoading })
  }

  /**
   * Gets only the highest priority documents for each CoCID that matches the RegExp and
   * language, with the highest priority documents in the World taking precedence over
   * any documents in compendium packs.
   * Empty array return for no matches
   * @param cocidRegExp regex used on the CoCID
   * @param type the first part of the wanted CoCID, for example 'i', 'a', 'je'
   * @param lang the language to match against ("en", "es", ...)
   * @param era the eras to match against ('standard', 'modernPulp', ...), true = world default
   * @param langFallback should the system fall back to en incase there is no translation
   * @param showLoading Show loading bar
   */
  static async fromCoCIDRegexBest ({ cocidRegExp, type, lang = game.i18n.lang, era = true, langFallback = true, showLoading = false } = {}) {
    if (era === false) {
      ui.notifications.error(game.i18n.format('CoC7.CoCIDFlag.error.unknown-era', { era: game.i18n.localize('CoC7.Any') }))
      return []
    }
    const allDocuments = await this.fromCoCIDRegexAll({ cocidRegExp, type, lang, era, scope: 'all', langFallback, showLoading })
    const bestDocuments = this.filterBestCoCID(allDocuments)
    return bestDocuments
  }

  /**
   * Gets only the highest priority document for CoCID that matches the language,
   * with the highest priority documents in the World taking precedence over
   * any documents
   * in compendium packs.
   * @param cocid string CoCID
   * @param lang the language to match against ("en", "es", ...)
   * @param era the eras to match against ('standard', 'modernPulp', ...), true = world default
   * @param langFallback should the system fall back to en incase there is no translation
   */
  static fromCoCID (cocid, lang = game.i18n.lang, era = true, langFallback = true) {
    if (era === false) {
      ui.notifications.error(game.i18n.format('CoC7.CoCIDFlag.error.unknown-era', { era: game.i18n.localize('CoC7.Any') }))
      return []
    }
    return CoCID.fromCoCIDBest({ cocid, lang, era, langFallback })
  }

  /**
   * Gets only the highest priority document for CoCID that matches the language,
   * with the highest priority documents in the World taking precedence over
   * any documents
   * in compendium packs.
   * @param cocid string CoCID
   * @param lang the language to match against ("en", "es", ...)
   * @param era the eras to match against ('standard', 'modernPulp', ...), true = world default
   * @param langFallback should the system fall back to en incase there is no translation
   * @param showLoading Show loading bar
   */
  static fromCoCIDBest ({ cocid, lang = game.i18n.lang, era = true, langFallback = true, showLoading = false } = {}) {
    if (!cocid || typeof cocid !== 'string') {
      return []
    }
    if (era === false) {
      ui.notifications.error(game.i18n.format('CoC7.CoCIDFlag.error.unknown-era', { era: game.i18n.localize('CoC7.Any') }))
      return []
    }
    const type = cocid.split('.')[0]
    const cocidRegExp = new RegExp('^' + CoC7Utilities.quoteRegExp(cocid) + '$')
    return CoCID.fromCoCIDRegexBest({ cocidRegExp, type, lang, era, langFallback, showLoading })
  }

  /**
   * For an array of documents already processed by filterAllCoCID, returns only those that are the "best" version of their CoCID
   * @param documents
   * @returns
   */
  static filterBestCoCID (documents) {
    const bestMatchDocuments = new Map()
    for (const doc of documents) {
      const docCoCID = doc.getFlag('CoC7', 'cocidFlag')?.id
      if (docCoCID) {
        const currentDoc = bestMatchDocuments.get(docCoCID)
        if (typeof currentDoc === 'undefined') {
          bestMatchDocuments.set(docCoCID, doc)
          continue
        }

        // Prefer pack === '' if possible
        const docPack = (doc.pack ?? '')
        const existingPack = (currentDoc?.pack ?? '')
        const preferWorld = docPack === '' || existingPack !== ''
        if (!preferWorld) {
          continue
        }

        // Prefer highest priority
        let docPriority = parseInt(doc.getFlag('CoC7', 'cocidFlag')?.priority ?? Number.MIN_SAFE_INTEGER, 10)
        docPriority = isNaN(docPriority) ? Number.MIN_SAFE_INTEGER : docPriority
        let existingPriority = parseInt(currentDoc.getFlag('CoC7', 'cocidFlag')?.priority ?? Number.MIN_SAFE_INTEGER, 10)
        existingPriority = isNaN(existingPriority) ? Number.MIN_SAFE_INTEGER : existingPriority
        const preferPriority = docPriority >= existingPriority
        if (!preferPriority) {
          continue
        }

        bestMatchDocuments.set(docCoCID, doc)
      }
    }
    return [...bestMatchDocuments.values()]
  }

  /**
   * For an array of documents, returns filter out en documents if a translated one exists matching the same eras
   * @param documents
   * @param langFallback should the system fall back to en in case there is no translation
   * @returns
   */
  static filterAllCoCID (documents, langFallback) {
    if (!langFallback) {
      return documents
    }
    const bestMatchDocuments = new Map()
    for (const doc of documents) {
      const docCoCID = doc.getFlag('CoC7', 'cocidFlag')?.id
      if (docCoCID) {
        const docEras = Object.entries(doc.getFlag('CoC7', 'cocidFlag')?.eras ?? {}).filter(e => e[1]).map(e => e[0]).sort().join('/')
        let docPriority = parseInt(doc.getFlag('CoC7', 'cocidFlag')?.priority ?? Number.MIN_SAFE_INTEGER, 10)
        docPriority = isNaN(docPriority) ? Number.MIN_SAFE_INTEGER : docPriority
        const key = docCoCID + '/' + docEras + '/' + (isNaN(docPriority) ? Number.MIN_SAFE_INTEGER : docPriority)

        const currentDoc = bestMatchDocuments.get(key)
        if (typeof currentDoc === 'undefined') {
          bestMatchDocuments.set(key, doc)
          continue
        }

        const docLang = doc.getFlag('CoC7', 'cocidFlag')?.lang ?? 'en'
        const existingLang = currentDoc?.getFlag('CoC7', 'cocidFlag')?.lang ?? 'en'
        if (existingLang === 'en' && existingLang !== docLang) {
          bestMatchDocuments.set(key, doc)
        }
      }
    }
    return [...bestMatchDocuments.values()]
  }

  /**
   * Get a list of all documents matching the CoCID regex, language, and era from the world.
   * The document list is sorted with the highest priority first.
   * @param cocidRegExp regex used on the CoCID
   * @param type the first part of the wanted CoCID, for example 'i', 'a', 'je'
   * @param era the eras to match against ('standard', 'modernPulp', ...), true = world default, false = no filter
   * @param lang the language to match against ('en', 'es', ...)
   * @param langFallback should the system fall back to en incase there is no translation
   * @param progressBar If greater than zero show percentage
   * @returns array
   */
  static async documentsFromWorld ({ cocidRegExp, type, lang = game.i18n.lang, era = false, langFallback = true, progressBar = 0 } = {}) {
    if (!cocidRegExp) {
      return []
    }
    if (lang === '') {
      lang = game.i18n.lang
    }
    if (era === true) {
      era = game.settings.get('CoC7', 'worldEra')
    }

    if (progressBar > 0) {
      SceneNavigation.displayProgressBar({ label: game.i18n.localize('SETUP.PackagesLoading'), pct: Math.floor(100 / progressBar) })
    }

    const gameProperty = CoCID.getGameProperty(`${type}..`)

    const candidateDocuments = game[gameProperty]?.filter((d) => {
      const cocidFlag = d.getFlag('CoC7', 'cocidFlag')
      if (typeof cocidFlag === 'undefined') {
        return false
      }
      const eras = (cocidFlag.eras ?? [])
      const matchingEras = (era === false || Object.entries(eras).length === 0 || (Object.prototype.hasOwnProperty.call(eras, era) && eras[era]))
      return cocidRegExp.test(cocidFlag.id) && [lang, (langFallback ? 'en' : '-')].includes(cocidFlag.lang) && matchingEras
    })

    if (candidateDocuments === undefined) {
      return []
    }

    return candidateDocuments.sort(CoCID.compareCoCIDPrio)
  }

  /**
   * Get a list of all documents matching the CoCID regex, language, and era from the compendiums.
   * The document list is sorted with the highest priority first.
   * @param cocidRegExp regex used on the CoCID
   * @param type the first part of the wanted CoCID, for example 'i', 'a', 'je'
   * @param era the eras to match against ('standard', 'modernPulp', ...), true = world default, false = no filter
   * @param lang the language to match against ('en', 'es', ...)
   * @param langFallback should the system fall back to en incase there is no translation
   * @param progressBar If greater than zero show percentage
   * @returns array
   */
  static async documentsFromCompendia ({ cocidRegExp, type, lang = game.i18n.lang, era = false, langFallback = true, progressBar = 0 }) {
    if (!cocidRegExp) {
      return []
    }
    if (lang === '') {
      lang = game.i18n.lang
    }
    if (era === true) {
      era = game.settings.get('CoC7', 'worldEra')
    }
    const eraText = CoCID.eraText(era)

    const documentType = CoCID.getDocumentType(type).schema.name
    const candidateDocuments = []

    let count = 1
    for (const pack of game.packs) {
      if (progressBar > 0) {
        SceneNavigation.displayProgressBar({ label: game.i18n.localize('SETUP.PackagesLoading'), pct: Math.floor(count * 100 / progressBar) })
        count++
      }
      if (pack.documentName === documentType) {
        if (!pack.indexed) {
          await pack.getIndex()
        }
        const indexInstances = pack.index.filter((i) => {
          const cocidFlag = i.flags?.CoC7?.cocidFlag
          if (typeof cocidFlag === 'undefined') {
            return false
          }
          const eras = (cocidFlag.eras ?? [])
          const matchingEras = (era === false || Object.entries(eras).length === 0 || (Object.prototype.hasOwnProperty.call(eras, era) && eras[era]))
          return cocidRegExp.test(cocidFlag.id) && [lang, (langFallback ? 'en' : '-')].includes(cocidFlag.lang) && matchingEras
        })
        for (const index of indexInstances) {
          const document = await pack.getDocument(index._id)
          if (!document) {
            const msg = game.i18n.format('CoC7.CoCIDFlag.error.document-not-found', {
              cocid: cocidRegExp,
              lang,
              era: eraText
            })
            ui.notifications.error(msg)
            console.log('CoC7 |', msg, index)
            throw new Error()
          } else {
            candidateDocuments.push(document)
          }
        }
      }
    }
    return candidateDocuments.sort(CoCID.compareCoCIDPrio)
  }

  /**
   * Sort a list of document on CoCID priority - the highest first.
   * @example
   * aListOfDocuments.sort(CoCID.compareCoCIDPrio)
   */
  static compareCoCIDPrio (a, b) {
    return (
      b.getFlag('CoC7', 'cocidFlag')?.priority -
      a.getFlag('CoC7', 'cocidFlag')?.priority
    )
  }

  /**
   * Translates the first part of a CoCID to what those documents are called in the `game` object.
   * @param cocid a single cocid
   */
  static getGameProperty (cocid) {
    const type = cocid.split('.')[0]
    const gameProperty = CoCID.gamePropertyLookup[type]
    if (!gameProperty) {
      ui.notifications.warn(game.i18n.format('CoC7.CoCIDFlag.error.incorrect.type'))
      console.log('CoC7 | ', cocid)
      throw new Error()
    }
    return gameProperty
  }

  static get gamePropertyLookup () {
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
   * @param cocid a single cocid
   */
  static getDocumentType (cocid) {
    const type = cocid.split('.')[0]
    const documentType = CoCID.documentNameLookup[type]
    if (!documentType) {
      ui.notifications.warn(game.i18n.format('CoC7.CoCIDFlag.error.incorrect.type'))
      console.log('CoC7 | ', cocid)
      throw new Error()
    }
    return documentType
  }

  static get documentNameLookup () {
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
}
