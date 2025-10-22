/* global CONST foundry fromUuid game */
import ChaosiumCanvasInterface from './chaosium-canvas-interface.js'

export default class ChaosiumCanvasInterfaceTileToggle extends ChaosiumCanvasInterface {
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
    return 'fa-solid fa-cubes'
  }

  static get triggerButtons () {
    const buttons = super.triggerButtons
    buttons[ChaosiumCanvasInterfaceTileToggle.triggerButton.Both] = 'CoC7.ChaosiumCanvasInterface.Buttons.Both'
    return buttons
  }

  static get triggerButton () {
    const button = super.triggerButton
    button.Both = 20
    return button
  }

  static defineSchema () {
    const fields = foundry.data.fields
    return {
      triggerButton: new fields.NumberField({
        choices: ChaosiumCanvasInterfaceTileToggle.triggerButtons,
        initial: ChaosiumCanvasInterfaceTileToggle.triggerButton.Left,
        label: 'CoC7.ChaosiumCanvasInterface.TileToggle.Button.Title',
        hint: 'CoC7.ChaosiumCanvasInterface.TileToggle.Button.Hint'
      }),
      action: new fields.NumberField({
        choices: ChaosiumCanvasInterface.actionToggles,
        initial: ChaosiumCanvasInterface.actionToggle.Off,
        label: 'CoC7.ChaosiumCanvasInterface.DrawingToggle.Action.Title',
        hint: 'CoC7.ChaosiumCanvasInterface.DrawingToggle.Action.Hint',
        required: true
      }),
      tileUuids: new fields.SetField(
        new fields.DocumentUUIDField({
          type: 'Tile'
        }),
        {
          label: 'CoC7.ChaosiumCanvasInterface.TileToggle.Tile.Title',
          hint: 'CoC7.ChaosiumCanvasInterface.TileToggle.Tile.Hint'
        }
      ),
      journalEntryUuids: new fields.SetField(
        new fields.DocumentUUIDField({
          type: 'JournalEntry'
        }),
        {
          label: 'CoC7.ChaosiumCanvasInterface.TileToggle.JournalEntry.Title',
          hint: 'CoC7.ChaosiumCanvasInterface.TileToggle.JournalEntry.Hint'
        }
      ),
      permissionDocument: new fields.NumberField({
        choices: Object.keys(ChaosiumCanvasInterfaceTileToggle.PERMISSIONS).reduce((c, k) => { c[k] = game.i18n.localize(ChaosiumCanvasInterfaceTileToggle.PERMISSIONS[k]); return c }, {}),
        initial: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
        label: 'CoC7.ChaosiumCanvasInterface.TileToggle.PermissionDocument.Title',
        hint: 'CoC7.ChaosiumCanvasInterface.TileToggle.PermissionDocument.Hint',
        required: true
      }),
      permissionDocumentHide: new fields.NumberField({
        choices: Object.keys(ChaosiumCanvasInterfaceTileToggle.PERMISSIONS).reduce((c, k) => { c[k] = game.i18n.localize(ChaosiumCanvasInterfaceTileToggle.PERMISSIONS[k]); return c }, {}),
        initial: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE,
        label: 'CoC7.ChaosiumCanvasInterface.TileToggle.PermissionDocumentHide.Title',
        hint: 'CoC7.ChaosiumCanvasInterface.TileToggle.PermissionDocumentHide.Hint',
        required: true
      }),
      journalEntryPageUuids: new fields.SetField(
        new fields.DocumentUUIDField({
          type: 'JournalEntryPage'
        }),
        {
          label: 'CoC7.ChaosiumCanvasInterface.TileToggle.JournalEntryPage.Title',
          hint: 'CoC7.ChaosiumCanvasInterface.TileToggle.JournalEntryPage.Hint'
        }
      ),
      permissionPage: new fields.NumberField({
        choices: Object.keys(ChaosiumCanvasInterfaceTileToggle.PERMISSIONS).reduce((c, k) => { c[k] = game.i18n.localize(ChaosiumCanvasInterfaceTileToggle.PERMISSIONS[k]); return c }, {}),
        initial: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
        label: 'CoC7.ChaosiumCanvasInterface.TileToggle.PermissionPage.Title',
        hint: 'CoC7.ChaosiumCanvasInterface.TileToggle.PermissionPage.Hint',
        required: true
      }),
      permissionPageHide: new fields.NumberField({
        choices: Object.keys(ChaosiumCanvasInterfaceTileToggle.PERMISSIONS).reduce((c, k) => { c[k] = game.i18n.localize(ChaosiumCanvasInterfaceTileToggle.PERMISSIONS[k]); return c }, {}),
        initial: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE,
        label: 'CoC7.ChaosiumCanvasInterface.TileToggle.PermissionPageHide.Title',
        hint: 'CoC7.ChaosiumCanvasInterface.TileToggle.PermissionPageHide.Hint',
        required: true
      }),
      regionBehaviorUuids: new fields.SetField(
        new fields.DocumentUUIDField({
          type: 'RegionBehavior'
        }),
        {
          label: 'CoC7.ChaosiumCanvasInterface.TileToggle.RegionBehavior.Title',
          hint: 'CoC7.ChaosiumCanvasInterface.TileToggle.RegionBehavior.Hint'
        }
      ),
      regionButton: new fields.NumberField({
        choices: ChaosiumCanvasInterface.triggerButtons,
        initial: ChaosiumCanvasInterface.triggerButton.Right,
        label: 'CoC7.ChaosiumCanvasInterface.TileToggle.TriggerButton.Title',
        hint: 'CoC7.ChaosiumCanvasInterface.TileToggle.TriggerButton.Hint'
      }),
      regionUuids: new fields.SetField(
        new fields.DocumentUUIDField({
          type: 'Region'
        }),
        {
          label: 'CoC7.ChaosiumCanvasInterface.TileToggle.TriggerRegionUuids.Title',
          hint: 'CoC7.ChaosiumCanvasInterface.TileToggle.TriggerRegionUuids.Hint'
        }
      ),
      triggerAsButton: new fields.NumberField({
        choices: ChaosiumCanvasInterface.triggerButtons,
        initial: ChaosiumCanvasInterface.triggerButton.Left,
        label: 'CoC7.ChaosiumCanvasInterface.TileToggle.TriggerAsButton.Title',
        hint: 'CoC7.ChaosiumCanvasInterface.TileToggle.TriggerAsButton.Hint'
      })
    }
  }

  static migrateData (source) {
    if (typeof source.triggerButton === 'undefined' && source.regionUuids?.length) {
      source.triggerButton = ChaosiumCanvasInterfaceTileToggle.triggerButton.Both
    }
    if (typeof source.toggle !== 'undefined' && typeof source.action === 'undefined') {
      source.action = (source.toggle ? ChaosiumCanvasInterface.actionToggle.On : ChaosiumCanvasInterface.actionToggle.Off)
    }
    return source
  }

  async _handleMouseOverEvent () {
    return game.user.isGM
  }

  async #handleClickEvent (button) {
    let toggle = false
    switch (this.action) {
      case ChaosiumCanvasInterface.actionToggle.On:
        toggle = true
        break
      case ChaosiumCanvasInterface.actionToggle.Toggle:
        {
          const firstUuid = this.tileUuids.first()
          if (firstUuid) {
            const doc = await fromUuid(firstUuid)
            toggle = doc.hidden
          }
        }
        break
    }
    for (const uuid of this.tileUuids) {
      const doc = await fromUuid(uuid)
      if (doc) {
        await doc.update({ hidden: !toggle })
      } else {
        console.error('Tile ' + uuid + ' not loaded')
      }
    }
    const permissionDocument = (!toggle ? this.permissionDocumentHide : this.permissionDocument)
    const permissionPage = (!toggle ? this.permissionPageHide : this.permissionPage)
    for (const uuid of this.journalEntryUuids) {
      const doc = await fromUuid(uuid)
      if (doc) {
        await doc.update({ 'ownership.default': permissionDocument })
      } else {
        console.error('Journal Entry ' + uuid + ' not loaded')
      }
    }
    for (const uuid of this.journalEntryPageUuids) {
      const doc = await fromUuid(uuid)
      if (doc) {
        await doc.update({ 'ownership.default': permissionPage })
      } else {
        console.error('Journal Entry Page ' + uuid + ' not loaded')
      }
    }
    for (const uuid of this.regionBehaviorUuids) {
      const doc = await fromUuid(uuid)
      if (doc) {
        await doc.update({ disabled: !toggle })
      } else {
        console.error('Region Behavior ' + uuid + ' not loaded')
      }
    }
    if (this.triggerButton === ChaosiumCanvasInterfaceTileToggle.triggerButton.Both) {
      for (const uuid of this.regionUuids) {
        setTimeout(() => {
          if (button === this.regionButton) {
            if (this.triggerAsButton === ChaosiumCanvasInterface.triggerButton.Right) {
              game.CoC7.ClickRegionRightUuid(uuid)
            } else if (this.triggerAsButton === ChaosiumCanvasInterface.triggerButton.Left) {
              game.CoC7.ClickRegionLeftUuid(uuid)
            }
          }
        }, 100)
      }
    }
  }

  async _handleLeftClickEvent () {
    if ([ChaosiumCanvasInterfaceTileToggle.triggerButton.Both, ChaosiumCanvasInterface.triggerButton.Left].includes(this.triggerButton)) {
      this.#handleClickEvent(ChaosiumCanvasInterface.triggerButton.Left)
    }
  }

  async _handleRightClickEvent () {
    if ([ChaosiumCanvasInterfaceTileToggle.triggerButton.Both, ChaosiumCanvasInterface.triggerButton.Right].includes(this.triggerButton)) {
      this.#handleClickEvent(ChaosiumCanvasInterface.triggerButton.Right)
    }
  }
}
