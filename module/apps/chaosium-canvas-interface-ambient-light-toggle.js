/* global foundry fromUuid game */
import ChaosiumCanvasInterface from './chaosium-canvas-interface.js'

export default class ChaosiumCanvasInterfaceAmbientLightToggle extends ChaosiumCanvasInterface {
  static get actionToggles () {
    const buttons = super.actionToggles
    buttons[ChaosiumCanvasInterface.actionToggle.On] = 'CoC7.ChaosiumCanvasInterface.AmbientLightToggle.Action.On'
    buttons[ChaosiumCanvasInterface.actionToggle.Off] = 'CoC7.ChaosiumCanvasInterface.AmbientLightToggle.Action.Off'
    return buttons
  }

  static get icon () {
    return 'fa-regular fa-lightbulb'
  }

  static defineSchema () {
    const fields = foundry.data.fields
    return {
      triggerButton: new fields.NumberField({
        choices: ChaosiumCanvasInterface.triggerButtons,
        initial: ChaosiumCanvasInterface.triggerButton.Left,
        label: 'CoC7.ChaosiumCanvasInterface.AmbientLightToggle.Button.Title',
        hint: 'CoC7.ChaosiumCanvasInterface.AmbientLightToggle.Button.Hint'
      }),
      action: new fields.NumberField({
        choices: ChaosiumCanvasInterfaceAmbientLightToggle.actionToggles,
        initial: ChaosiumCanvasInterface.actionToggle.Off,
        label: 'CoC7.ChaosiumCanvasInterface.AmbientLightToggle.Action.Title',
        hint: 'CoC7.ChaosiumCanvasInterface.AmbientLightToggle.Action.Hint',
        required: true
      }),
      lightUuids: new fields.SetField(
        new fields.DocumentUUIDField({
          type: 'AmbientLight'
        }),
        {
          label: 'CoC7.ChaosiumCanvasInterface.AmbientLightToggle.Light.Title',
          hint: 'CoC7.ChaosiumCanvasInterface.AmbientLightToggle.Light.Hint'
        }
      )
    }
  }

  async _handleMouseOverEvent () {
    return game.user.isGM
  }

  async #handleClickEvent () {
    let toggle = false
    switch (this.action) {
      case ChaosiumCanvasInterface.actionToggle.On:
        toggle = true
        break
      case ChaosiumCanvasInterface.actionToggle.Toggle:
        {
          const firstUuid = this.lightUuids.first()
          if (firstUuid) {
            const doc = await fromUuid(firstUuid)
            toggle = doc.hidden
          }
        }
        break
    }
    for (const uuid of this.lightUuids) {
      const doc = await fromUuid(uuid)
      if (doc) {
        await doc.update({ hidden: !toggle })
      } else {
        console.error('Ambient Light ' + uuid + ' not loaded')
      }
    }
  }

  async _handleLeftClickEvent () {
    if (this.triggerButton === ChaosiumCanvasInterface.triggerButton.Left) {
      this.#handleClickEvent()
    }
  }

  async _handleRightClickEvent () {
    if (this.triggerButton === ChaosiumCanvasInterface.triggerButton.Right) {
      this.#handleClickEvent()
    }
  }
}
