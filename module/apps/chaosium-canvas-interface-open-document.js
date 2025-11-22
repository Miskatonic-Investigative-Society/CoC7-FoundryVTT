/* global CONST foundry fromUuid game JournalEntryPage */
import ChaosiumCanvasInterface from './chaosium-canvas-interface.js'

export default class ChaosiumCanvasInterfaceOpenDocument extends ChaosiumCanvasInterface {
  static get PERMISSIONS () {
    return {
      ALWAYS: 'CoC7.ChaosiumCanvasInterface.Permission.Always',
      DOCUMENT: 'CoC7.ChaosiumCanvasInterface.Permission.Document',
      SEE_TILE: 'CoC7.ChaosiumCanvasInterface.Permission.SeeTile',
      GM: 'CoC7.ChaosiumCanvasInterface.Permission.GM'
    }
  }

  static get icon () {
    return 'fa-solid fa-book-atlas'
  }

  static defineSchema () {
    const fields = foundry.data.fields
    return {
      triggerButton: new fields.NumberField({
        choices: ChaosiumCanvasInterface.triggerButtons,
        initial: ChaosiumCanvasInterface.triggerButton.Left,
        label: 'CoC7.ChaosiumCanvasInterface.OpenDocument.Button.Title',
        hint: 'CoC7.ChaosiumCanvasInterface.OpenDocument.Button.Hint'
      }),
      permission: new fields.StringField({
        blank: false,
        choices: Object.keys(ChaosiumCanvasInterfaceOpenDocument.PERMISSIONS).reduce((c, k) => { c[k] = game.i18n.localize(ChaosiumCanvasInterfaceOpenDocument.PERMISSIONS[k]); return c }, {}),
        initial: 'GM',
        label: 'CoC7.ChaosiumCanvasInterface.OpenDocument.Permission.Title',
        hint: 'CoC7.ChaosiumCanvasInterface.OpenDocument.Permission.Hint',
        required: true
      }),
      documentUuid: new fields.DocumentUUIDField({
        label: 'CoC7.ChaosiumCanvasInterface.OpenDocument.Document.Title',
        hint: 'CoC7.ChaosiumCanvasInterface.OpenDocument.Document.Hint'
      }),
      anchor: new fields.StringField({
        label: 'CoC7.ChaosiumCanvasInterface.OpenDocument.Anchor.Title',
        hint: 'CoC7.ChaosiumCanvasInterface.OpenDocument.Anchor.Hint'
      }),
      tileUuid: new fields.DocumentUUIDField({
        label: 'CoC7.ChaosiumCanvasInterface.OpenDocument.Tile.Title',
        hint: 'CoC7.ChaosiumCanvasInterface.OpenDocument.Tile.Hint',
        type: 'Tile'
      })
    }
  }

  async _handleMouseOverEvent () {
    switch (this.permission) {
      case 'ALWAYS':
        return true
      case 'GM':
        return game.user.isGM
      case 'DOCUMENT':
        if (game.user.isGM) {
          return true
        }
        if (this.documentUuid) {
          return (await fromUuid(this.documentUuid)).testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED) ?? false
        }
        break
      case 'SEE_TILE':
        if (game.user.isGM) {
          return true
        }
        if (this.tileUuid && this.documentUuid) {
          return !(await fromUuid(this.tileUuid)).hidden && ((await fromUuid(this.documentUuid)).testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED) ?? false)
        }
        break
    }
    return false
  }

  async #handleClickEvent () {
    const doc = await fromUuid(this.documentUuid)
    if (doc?.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED)) {
      if (doc instanceof JournalEntryPage) {
        doc.parent.sheet.render(true, { pageId: doc.id, anchor: this.anchor })
      } else {
        doc.sheet.render(true)
      }
    } else {
      console.error('Document ' + this.documentUuid + ' not loaded')
    }
  }

  async _handleLeftClickEvent () {
    if (this.documentUuid && this.triggerButton === ChaosiumCanvasInterface.triggerButton.Left) {
      this.#handleClickEvent()
    }
  }

  async _handleRightClickEvent () {
    if (this.documentUuid && this.triggerButton === ChaosiumCanvasInterface.triggerButton.Right) {
      this.#handleClickEvent()
    }
  }
}
