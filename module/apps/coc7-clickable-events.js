/* global canvas, CONFIG, CONST, DocumentSheetConfig, foundry, fromUuid, game, NotesLayer, RegionBehavior, TokenLayer */
const { RegionBehaviorType } = foundry.data.regionBehaviors

export default class CoC7ClickableEvents extends RegionBehaviorType {
  static initSelf () {
    Object.assign(CONFIG.RegionBehavior.dataModels, {
      coc7ClickableEvents: CoC7ClickableEvents
    })

    Object.assign(CONFIG.RegionBehavior.typeIcons, {
      coc7ClickableEvents: 'fa-solid fa-computer-mouse'
    })

    DocumentSheetConfig.registerSheet(
      RegionBehavior,
      'CoC7',
      foundry.applications.sheets.RegionBehaviorConfig,
      {
        types: [
          'coc7ClickableEvents'
        ],
        makeDefault: true
      }
    )

    const oldOnClickLeft = TokenLayer.prototype._onClickLeft
    TokenLayer.prototype._onClickLeft = function (event) {
      oldOnClickLeft.call(this, event)
      if (canvas.activeLayer instanceof TokenLayer) {
        const destination = canvas.activeLayer.toLocal(event)
        for (const region of canvas.scene.regions.contents) {
          if (region.behaviors.filter(b => !b.disabled).find(b => b.system instanceof CoC7ClickableEvents) && region.object.polygonTree.testPoint(destination)) {
            region.behaviors.filter(b => !b.disabled).map(async (b) => { if (await b.system._handleMouseOverEvent() === true) { await b.system._handleLeftClickEvent() } })
          }
        }
      }
    }

    const oldOnClickRight = TokenLayer.prototype._onClickRight
    TokenLayer.prototype._onClickRight = function (event) {
      oldOnClickRight.call(this, event)
      if (canvas.activeLayer instanceof TokenLayer) {
        const destination = canvas.activeLayer.toLocal(event)
        for (const region of canvas.scene.regions.contents) {
          if (region.behaviors.filter(b => !b.disabled).find(b => b.system instanceof CoC7ClickableEvents) && region.object.polygonTree.testPoint(destination)) {
            region.behaviors.filter(b => !b.disabled).map(async (b) => { if (await b.system._handleMouseOverEvent() === true) { await b.system._handleRightClickEvent() } })
          }
        }
      }
    }

    document.body.addEventListener('mousemove', async function (event) {
      if (canvas.activeLayer instanceof TokenLayer) {
        const pointer = canvas?.app?.renderer?.events?.pointer
        if (!pointer) {
          return
        }
        const destination = canvas.activeLayer.toLocal(event)
        let setPointer = false
        for (const region of canvas.scene.regions.contents) {
          if (region.behaviors.filter(b => !b.disabled).find(b => b.system instanceof CoC7ClickableEvents) && region.object.polygonTree.testPoint(destination)) {
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

  static async ClickRegionLeftUuid (docUuid) {
    const doc = await fromUuid(docUuid)
    if (doc) {
      doc.behaviors.filter(b => !b.disabled).map(async (b) => { if (await b.system._handleMouseOverEvent() === true) { await b.system._handleLeftClickEvent() } })
    } else {
      console.error('journalPageUuids ' + docUuid + ' not loaded')
    }
  }

  static async ClickRegionRightUuid (docUuid) {
    const doc = await fromUuid(docUuid)
    if (doc) {
      doc.behaviors.filter(b => !b.disabled).map(async (b) => { if (await b.system._handleMouseOverEvent() === true) { await b.system._handleRightClickEvent() } })
    } else {
      console.error('journalPageUuids ' + docUuid + ' not loaded')
    }
  }

  static async hasPermissionDocument (documentUuid) {
    const doc = await fromUuid(documentUuid)
    return doc?.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER) ?? false
  }

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

  static async openDocument (documentUuid, pageId = null, anchor = null) {
    const doc = await fromUuid(documentUuid)
    if (doc?.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)) {
      if (pageId) {
        if (doc.pages.get(pageId)?.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)) {
          doc.sheet.render(true, { pageId, anchor })
        }
      } else {
        doc.sheet.render(true)
      }
    }
  }

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
