/* global canvas CONFIG CONST DocumentSheetConfig foundry fromUuid game NotesLayer RegionBehavior TokenLayer */
import ChaosiumCanvasInterfaceAmbientLightToggle from './chaosium-canvas-interface-ambient-light-toggle.js'
import ChaosiumCanvasInterfaceDrawingToggle from './chaosium-canvas-interface-drawing-toggle.js'
import ChaosiumCanvasInterfaceMapPinToggle from './chaosium-canvas-interface-map-pin-toggle.js'
import ChaosiumCanvasInterfaceOpenDocument from './chaosium-canvas-interface-open-document.js'
import ChaosiumCanvasInterfacePlaySound from './chaosium-canvas-interface-play-sound.js'
import ChaosiumCanvasInterfaceToScene from './chaosium-canvas-interface-to-scene.js'
import ChaosiumCanvasInterfaceTileToggle from './chaosium-canvas-interface-tile-toggle.js'
import ChaosiumCanvasInterface from './chaosium-canvas-interface.js'

export default class CoC7ClickableEvents extends foundry.data.regionBehaviors.RegionBehaviorType {
  /**
   * Set up Clickable Events and Chaosium Canvas Interface
   */
  static initSelf () {
    /* // FoundryVTT V12 */
    if (game.release.generation === 12) {
      class NoteDocumentPolyfill extends CONFIG.Note.documentClass {
        /**
         * Name field for FoundryVTT v12 Note
         * @returns {string}
         */
        get name () {
          return (this.text?.length ? this.text : this.label)
        }
      }
      CONFIG.Note.documentClass = NoteDocumentPolyfill
      class TileDocumentPolyfill extends CONFIG.Tile.documentClass {
        /**
         * Name field for FoundryVTT v12 Tile
         * @returns {string}
         */
        get name () {
          return this.collectionName + ': ' + this.id
        }
      }
      CONFIG.Tile.documentClass = TileDocumentPolyfill
      class DrawingDocumentPolyfill extends CONFIG.Drawing.documentClass {
        /**
         * Name field for FoundryVTT v12 Drawing
         * @returns {string}
         */
        get name () {
          return this.collectionName + ': ' + this.id
        }
      }
      CONFIG.Drawing.documentClass = DrawingDocumentPolyfill
    }

    const known = [
      ChaosiumCanvasInterfaceAmbientLightToggle,
      ChaosiumCanvasInterfaceDrawingToggle,
      ChaosiumCanvasInterfaceMapPinToggle,
      ChaosiumCanvasInterfaceOpenDocument,
      ChaosiumCanvasInterfacePlaySound,
      ChaosiumCanvasInterfaceToScene,
      ChaosiumCanvasInterfaceTileToggle
    ]

    const dataModels = {
      coc7ClickableEvents: CoC7ClickableEvents
    }
    const typeIcons = {
      coc7ClickableEvents: 'fa-solid fa-computer-mouse'
    }
    const types = [
      'coc7ClickableEvents'
    ]
    for (const CCI of known) {
      const name = (new CCI()).constructor.name
      dataModels[name] = CCI
      typeIcons[name] = CCI.icon
      types.push(name)
    }

    Object.assign(CONFIG.RegionBehavior.dataModels, dataModels)

    Object.assign(CONFIG.RegionBehavior.typeIcons, typeIcons)

    /* // FoundryVTT V12 */
    ;(foundry.applications.apps?.DocumentSheetConfig ?? DocumentSheetConfig).registerSheet(
      RegionBehavior,
      'CoC7',
      foundry.applications.sheets.RegionBehaviorConfig,
      {
        types,
        makeDefault: true
      }
    )

    /* // FoundryVTT V12 */
    const polyfillTokenLayer = (foundry.canvas?.layers?.TokenLayer ?? TokenLayer)

    const oldOnClickLeft = polyfillTokenLayer.prototype._onClickLeft
    polyfillTokenLayer.prototype._onClickLeft = function (event) {
      oldOnClickLeft.call(this, event)
      if (canvas.activeLayer instanceof polyfillTokenLayer) {
        const destination = canvas.activeLayer.toLocal(event)
        for (const region of canvas.scene.regions.contents) {
          /* // FoundryVTT V12 */
          const polygonTree = region.object?.document.polygonTree ?? region.object.polygonTree
          if (region.behaviors.filter(b => !b.disabled).find(b => b.system instanceof CoC7ClickableEvents || b.system instanceof ChaosiumCanvasInterface) && polygonTree.testPoint(destination)) {
            region.behaviors.filter(b => !b.disabled).map(async (b) => { if (await b.system._handleMouseOverEvent() === true && typeof b.system._handleLeftClickEvent === 'function') { await b.system._handleLeftClickEvent() } })
          }
        }
      }
    }

    const oldOnClickRight = polyfillTokenLayer.prototype._onClickRight
    polyfillTokenLayer.prototype._onClickRight = function (event) {
      oldOnClickRight.call(this, event)
      if (canvas.activeLayer instanceof polyfillTokenLayer) {
        const destination = canvas.activeLayer.toLocal(event)
        for (const region of canvas.scene.regions.contents) {
          /* // FoundryVTT V12 */
          const polygonTree = region.object?.document.polygonTree ?? region.object.polygonTree
          if (region.behaviors.filter(b => !b.disabled).find(b => b.system instanceof CoC7ClickableEvents || b.system instanceof ChaosiumCanvasInterface) && polygonTree.testPoint(destination)) {
            region.behaviors.filter(b => !b.disabled).map(async (b) => { if (await b.system._handleMouseOverEvent() === true && typeof b.system._handleRightClickEvent === 'function') { await b.system._handleRightClickEvent() } })
          }
        }
      }
    }

    document.body.addEventListener('mousemove', async function (event) {
      if (canvas.activeLayer instanceof polyfillTokenLayer) {
        const pointer = canvas?.app?.renderer?.events?.pointer
        if (!pointer) {
          return
        }
        const destination = canvas.activeLayer.toLocal(event)
        let setPointer = false
        for (const region of canvas.scene.regions.contents) {
          /* // FoundryVTT V12 */
          const polygonTree = region.object?.document.polygonTree ?? region.object.polygonTree
          if (region.behaviors.filter(b => !b.disabled).find(b => b.system instanceof CoC7ClickableEvents || b.system instanceof ChaosiumCanvasInterface) && polygonTree.testPoint(destination)) {
            setPointer = await region.behaviors.filter(b => !b.disabled).reduce(async (c, b) => {
              const r = await b.system._handleMouseOverEvent()
              if (r !== false && r !== true) {
                console.error(b.uuid + ' did not return a boolean')
              }
              c = c || r
              return c
            }, false)
          }
        }
        if (setPointer) {
          document.getElementById('board').style.cursor = 'pointer'
        } else {
          document.getElementById('board').style.cursor = ''
        }
      }
    })
  }

  /**
   * Create Schema
   * @returns {DataSchema}
   */
  static defineSchema () {
    return {
      mouseOver: new foundry.data.fields.JavaScriptField({
        async: true,
        gmOnly: true,
        initial: 'return false',
        label: 'CoC7.ClickableEvents.MouseOver.Title',
        hint: 'CoC7.ClickableEvents.MouseOver.Hint'
      }),
      leftClick: new foundry.data.fields.JavaScriptField({
        async: true,
        gmOnly: true,
        label: 'CoC7.ClickableEvents.LeftClick.Title'
      }),
      rightClick: new foundry.data.fields.JavaScriptField({
        async: true,
        gmOnly: true,
        label: 'CoC7.ClickableEvents.RightClick.Title'
      })
    }
  }

  /** @override */
  async _handleMouseOverEvent () {
    try {
      const fn = new foundry.utils.AsyncFunction('scene', 'region', 'behavior', `{${this.mouseOver}\n}`)
      return await fn.call(globalThis, this.scene, this.region, this.behavior)
    } catch (err) {
      console.error(err)
    }
  }

  /** @override */
  async _handleLeftClickEvent () {
    try {
      const fn = new foundry.utils.AsyncFunction('scene', 'region', 'behavior', `{${this.leftClick}\n}`)
      return await fn.call(globalThis, this.scene, this.region, this.behavior)
    } catch (err) {
      console.error(err)
    }
  }

  /** @override */
  async _handleRightClickEvent () {
    try {
      const fn = new foundry.utils.AsyncFunction('scene', 'region', 'behavior', `{${this.rightClick}\n}`)
      return await fn.call(globalThis, this.scene, this.region, this.behavior)
    } catch (err) {
      console.error(err)
    }
  }

  /**
   * Trigger Clickable Event or Chaosium Canvas Interface behavior left click function
   * @param {string} docUuid
   */
  static async ClickRegionLeftUuid (docUuid) {
    const doc = await fromUuid(docUuid)
    if (doc) {
      doc.behaviors.filter(b => !b.disabled).filter(b => b.system instanceof CoC7ClickableEvents || b.system instanceof ChaosiumCanvasInterface).map(async (b) => { if (await b.system._handleMouseOverEvent() === true && typeof b.system._handleLeftClickEvent === 'function') { await b.system._handleLeftClickEvent() } })
    } else {
      console.error('RegionUuid ' + docUuid + ' not loaded')
    }
  }

  /**
   * Trigger Clickable Event or Chaosium Canvas Interface behavior right click function
   * @param {string} docUuid
   */
  static async ClickRegionRightUuid (docUuid) {
    const doc = await fromUuid(docUuid)
    if (doc) {
      doc.behaviors.filter(b => !b.disabled).filter(b => b.system instanceof CoC7ClickableEvents || b.system instanceof ChaosiumCanvasInterface).map(async (b) => { if (await b.system._handleMouseOverEvent() === true && typeof b.system._handleRightClickEvent === 'function') { await b.system._handleRightClickEvent() } })
    } else {
      console.error('RegionUuid ' + docUuid + ' not loaded')
    }
  }

  /**
   * Does the current user have at least observer permission on the document
   * @param {string} documentUuid
   * @returns {boolean}
   */
  static async hasPermissionDocument (documentUuid) {
    const doc = await fromUuid(documentUuid)
    return doc?.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER) ?? false
  }

  /**
   * Call from Clickable Event Behavior Macro
   * @param {Event} event
   * @param {string} destinationRegion
   */
  static async InSceneRelativeTeleport (event, destinationRegion) {
    if (event.name === 'tokenMoveIn') {
      // region MUST be the same shape with no transformation
      // Currently only PolygonShapeData and RectangleShapeData
      const sourceTL = event.region.shapes.reduce((c, p) => {
        if (p instanceof foundry.data.PolygonShapeData) {
          for (let i = 0, im = p.points.length; i < im; i = i + 2) {
            if (c[0] === false || p.points[i] < c[0]) {
              c[0] = p.points[i]
            }
            if (c[1] === false || p.points[i + 1] < c[1]) {
              c[1] = p.points[i + 1]
            }
          }
        } else if (p instanceof foundry.data.RectangleShapeData) {
          const x = Math.min(p.x + p.width, p.x)
          const y = Math.min(p.y + p.height, p.y)
          if (c[0] === false || x < c[0]) {
            c[0] = x
          }
          if (c[1] === false || y < c[1]) {
            c[1] = y
          }
        }
        return c
      }, [false, false])
      const destinationTL = (await fromUuid(destinationRegion)).shapes.reduce((c, p) => {
        if (p instanceof foundry.data.PolygonShapeData) {
          for (let i = 0, im = p.points.length; i < im; i = i + 2) {
            if (c[0] === false || p.points[i] < c[0]) {
              c[0] = p.points[i]
            }
            if (c[1] === false || p.points[i + 1] < c[1]) {
              c[1] = p.points[i + 1]
            }
          }
        } else if (p instanceof foundry.data.RectangleShapeData) {
          const x = Math.min(p.x + p.width, p.x)
          const y = Math.min(p.y + p.height, p.y)
          if (c[0] === false || x < c[0]) {
            c[0] = x
          }
          if (c[1] === false || y < c[1]) {
            c[1] = y
          }
        }
        return c
      }, [false, false])
      const destinationX = event.data.destination.x - sourceTL[0] + destinationTL[0]
      const destinationY = event.data.destination.y - sourceTL[1] + destinationTL[1]
      await event.data.token.object.stopAnimation() // Panic
      event.data.token.update({ x: destinationX, y: destinationY }, { animate: false })
    }
  }

  /**
   * Map Pin Toggle along with Journal Entry Pages
   * @param {boolean} toggle
   * @param {object} options
   * @param {Array} options.journalPageUuids
   * @param {Array} options.noteUuids
   * @param {int} options.permissionFalse
   * @param {int} options.permissionTrue
   */
  static async MapPinToggle (toggle, { journalPageUuids = [], noteUuids = [], permissionFalse = CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE, permissionTrue = CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER } = {}) {
    game.socket.emit('system.CoC7', { type: 'toggleMapNotes', toggle: true })
    game.settings.set('core', NotesLayer.TOGGLE_SETTING, true)
    for (const docUuid of journalPageUuids) {
      const doc = await fromUuid(docUuid)
      if (doc) {
        let permission = permissionTrue
        if (!toggle) {
          permission = permissionFalse
        }
        await doc.update({ 'ownership.default': permission })
      } else {
        console.error('journalPageUuids ' + docUuid + ' not loaded')
      }
    }

    for (const docUuid of noteUuids) {
      const doc = await fromUuid(docUuid)
      if (doc) {
        let texture = 'systems/CoC7/assets/art/map-pin.svg'
        if (!toggle) {
          texture = 'systems/CoC7/assets/art/map-pin-dark.svg'
        }
        await doc.update({ 'texture.src': texture })
      } else {
        console.error('noteUuids ' + docUuid + ' not loaded')
      }
    }
  }

  /**
   * Option document with optional page and anchor
   * @param {string} documentUuid
   * @param {string|null} pageId
   * @param {string|null} anchor
   */
  static async openDocument (documentUuid, pageId = null, anchor = null) {
    const doc = await fromUuid(documentUuid)
    if (doc?.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)) {
      if (pageId) {
        if (doc.pages.get(pageId)?.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)) {
          /* // FoundryVTT V12 */
          doc.sheet.render(true, { pageId, anchor })
        }
      } else {
        /* // FoundryVTT V12 */
        doc.sheet.render(true)
      }
    }
  }

  /**
   * Toggle Tile visibility, Journal Entry permission, and Journal Entry Page permissions
   * @param {boolean} active
   * @param {Array} tileUuids
   * @param {Array} journalUuids
   * @param {Array} pageUuids
   * @param {object} options
   * @param {int} options.pagePermission
   */
  static async toggleTileJournalPages (active, tileUuids, journalUuids, pageUuids, { pagePermission = CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER } = {}) {
    for (const docUuid of tileUuids) {
      const doc = await fromUuid(docUuid)
      if (doc) {
        await doc.update({ hidden: !active })
      } else {
        console.error('Tile ' + docUuid + ' not loaded')
      }
    }
    const permission = (!active ? CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE : pagePermission)
    for (const docUuid of pageUuids) {
      const doc = await fromUuid(docUuid)
      if (doc) {
        await doc.update({ 'ownership.default': permission })
      } else {
        console.error('Journal Page ' + docUuid + ' not loaded')
      }
    }
    // Do not none / owner journals if any entries do not match
    for (const docUuid of journalUuids) {
      const doc = await fromUuid(docUuid)
      if (doc) {
        if (pageUuids.length === 0 || permission === pagePermission || doc.pages.contents.filter(d => d.ownership.default === pagePermission).length === 0) {
          await doc.update({ 'ownership.default': (!active ? CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE : CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER) })
        }
      } else {
        console.error('Journal ' + docUuid + ' not loaded')
      }
    }
  }

  /**
   * View scene
   * @param {string} sceneUuid
   */
  static async toScene (sceneUuid) {
    const doc = await fromUuid(sceneUuid)
    if (doc) {
      setTimeout(() => {
        doc.view()
      }, 100)
    } else {
      console.error('Scene ' + sceneUuid + ' not loaded')
    }
  }
}
