/* global CONST foundry fromUuid game NotesLayer */
import ChaosiumCanvasInterface from './chaosium-canvas-interface.js'

export default class ChaosiumCanvasInterfaceMapPinToggle extends ChaosiumCanvasInterface {
  static get PERMISSIONS () {
    return {
      [CONST.DOCUMENT_OWNERSHIP_LEVELS.INHERIT]: 'OWNERSHIP.INHERIT',
      [CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE]: 'OWNERSHIP.NONE',
      [CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED]: 'OWNERSHIP.LIMITED',
      [CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER]: 'OWNERSHIP.OBSERVER',
      [CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER]: 'OWNERSHIP.OWNER'
    }
  }

  static get icon () {
    return 'fa-solid fa-map-pin'
  }

  static defineSchema () {
    const fields = foundry.data.fields
    return {
      toggle: new fields.BooleanField({
        initial: false,
        label: 'CoC7.ChaosiumCanvasInterface.MapPinToggle.Toggle.Title',
        hint: 'CoC7.ChaosiumCanvasInterface.MapPinToggle.Toggle.Hint'
      }),
      documentUuids: new fields.SetField(
        new fields.DocumentUUIDField(),
        {
          label: 'CoC7.ChaosiumCanvasInterface.MapPinToggle.Document.Title',
          hint: 'CoC7.ChaosiumCanvasInterface.MapPinToggle.Document.Hint'
        }
      ),
      noteUuids: new fields.SetField(
        new fields.DocumentUUIDField({
          type: 'Note'
        }),
        {
          label: 'CoC7.ChaosiumCanvasInterface.MapPinToggle.Note.Title',
          hint: 'CoC7.ChaosiumCanvasInterface.MapPinToggle.Note.Hint'
        }
      ),
      permissionShow: new fields.NumberField({
        choices: Object.keys(ChaosiumCanvasInterfaceMapPinToggle.PERMISSIONS).reduce((c, k) => { c[k] = game.i18n.localize(ChaosiumCanvasInterfaceMapPinToggle.PERMISSIONS[k]); return c }, {}),
        initial: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
        label: 'CoC7.ChaosiumCanvasInterface.MapPinToggle.PermissionShow.Title',
        hint: 'CoC7.ChaosiumCanvasInterface.MapPinToggle.PermissionShow.Hint',
        required: true
      }),
      permissionHide: new fields.NumberField({
        choices: Object.keys(ChaosiumCanvasInterfaceMapPinToggle.PERMISSIONS).reduce((c, k) => { c[k] = game.i18n.localize(ChaosiumCanvasInterfaceMapPinToggle.PERMISSIONS[k]); return c }, {}),
        initial: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE,
        label: 'CoC7.ChaosiumCanvasInterface.MapPinToggle.PermissionHide.Title',
        hint: 'CoC7.ChaosiumCanvasInterface.MapPinToggle.PermissionHide.Hint',
        required: true
      })
    }
  }

  async _handleMouseOverEvent () {
    return game.user.isGM
  }

  async _handleLeftClickEvent () {
    game.socket.emit('system.coc7', { type: 'toggleMapNotes', toggle: true })
    /* // FoundryVTT V12 */
    game.settings.set('core', (foundry.canvas.layers?.NotesLayer ?? NotesLayer).TOGGLE_SETTING, true)
    for (const uuid of this.documentUuids) {
      const doc = await fromUuid(uuid)
      if (doc) {
        const permission = (this.toggle ? this.permissionShow : this.permissionHide)
        await doc.update({ 'ownership.default': permission })
      } else {
        console.error('Document ' + uuid + ' not loaded')
      }
    }
    for (const uuid of this.noteUuids) {
      const doc = await fromUuid(uuid)
      if (doc) {
        const texture = (this.toggle ? 'systems/CoC7/assets/art/map-pin.svg' : 'systems/CoC7/assets/art/map-pin-dark.svg')
        await doc.update({ 'texture.src': texture })
      } else {
        console.error('Note ' + uuid + ' not loaded')
      }
    }
  }
}
