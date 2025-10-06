/* global foundry fromUuid game */
import ChaosiumCanvasInterface from './chaosium-canvas-interface.js'

export default class ChaosiumCanvasInterfaceToScene extends ChaosiumCanvasInterface {
  static get PERMISSIONS () {
    return {
      ALWAYS: 'CoC7.ChaosiumCanvasInterface.Permission.Always',
      GM: 'CoC7.ChaosiumCanvasInterface.Permission.GM',
      SEE_TILE: 'CoC7.ChaosiumCanvasInterface.Permission.SeeTile'
    }
  }

  static get icon () {
    return 'fa-solid fa-map'
  }

  static defineSchema () {
    const fields = foundry.data.fields
    return {
      permission: new fields.StringField({
        blank: false,
        choices: Object.keys(ChaosiumCanvasInterfaceToScene.PERMISSIONS).reduce((c, k) => { c[k] = game.i18n.localize(ChaosiumCanvasInterfaceToScene.PERMISSIONS[k]); return c }, {}),
        initial: 'GM',
        label: 'CoC7.ChaosiumCanvasInterface.ToScene.Permission.Title',
        hint: 'CoC7.ChaosiumCanvasInterface.ToScene.Permission.Hint',
        required: true
      }),
      sceneUuid: new fields.DocumentUUIDField({
        label: 'CoC7.ChaosiumCanvasInterface.ToScene.Scene.Title',
        hint: 'CoC7.ChaosiumCanvasInterface.ToScene.Scene.Hint',
        type: 'Scene'
      }),
      tileUuid: new fields.DocumentUUIDField({
        label: 'CoC7.ChaosiumCanvasInterface.ToScene.Tile.Title',
        hint: 'CoC7.ChaosiumCanvasInterface.ToScene.Tile.Hint',
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
      case 'SEE_TILE':
        if (game.user.isGM) {
          return true
        }
        if (this.tileUuid) {
          return !(await fromUuid(this.tileUuid)).hidden
        }
    }
    return false
  }

  async _handleLeftClickEvent () {
    if (this.sceneUuid) {
      const doc = await fromUuid(this.sceneUuid)
      if (doc) {
        setTimeout(() => {
          doc.view()
        }, 100)
      } else {
        console.error('Scene ' + this.sceneUuid + ' not loaded')
      }
    }
  }
}
