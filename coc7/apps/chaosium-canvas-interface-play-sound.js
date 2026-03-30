/* global foundry fromUuid game */
import ChaosiumCanvasInterface from './chaosium-canvas-interface.js'

export default class ChaosiumCanvasInterfacePlaySound extends ChaosiumCanvasInterface {
  static get actionToggles () {
    const buttons = super.actionToggles
    buttons[ChaosiumCanvasInterface.actionToggle.On] = 'CoC7.ChaosiumCanvasInterface.PlaySound.Action.Play'
    buttons[ChaosiumCanvasInterface.actionToggle.Off] = 'CoC7.ChaosiumCanvasInterface.PlaySound.Action.Stop'
    return buttons
  }

  static get icon () {
    return 'fa-solid fa-music'
  }

  static defineSchema () {
    const fields = foundry.data.fields
    return {
      triggerButton: new fields.NumberField({
        choices: ChaosiumCanvasInterface.triggerButtons,
        initial: ChaosiumCanvasInterface.triggerButton.Left,
        label: 'CoC7.ChaosiumCanvasInterface.PlaySound.Button.Title',
        hint: 'CoC7.ChaosiumCanvasInterface.PlaySound.Button.Hint'
      }),
      action: new fields.NumberField({
        choices: ChaosiumCanvasInterfacePlaySound.actionToggles,
        initial: ChaosiumCanvasInterface.actionToggle.Off,
        label: 'CoC7.ChaosiumCanvasInterface.PlaySound.Action.Title',
        hint: 'CoC7.ChaosiumCanvasInterface.PlaySound.Action.Hint',
        required: true
      }),
      playlistUuid: new fields.DocumentUUIDField({
        label: 'CoC7.ChaosiumCanvasInterface.PlaySound.Playlist.Title',
        hint: 'CoC7.ChaosiumCanvasInterface.PlaySound.Playlist.Hint',
        type: 'Playlist'
      }),
      soundUuid: new fields.DocumentUUIDField({
        label: 'CoC7.ChaosiumCanvasInterface.PlaySound.Sound.Title',
        hint: 'CoC7.ChaosiumCanvasInterface.PlaySound.Sound.Hint',
        type: 'PlaylistSound'
      })
    }
  }

  static migrateData (source) {
    if (typeof source.toggle !== 'undefined' && typeof source.action === 'undefined') {
      source.action = (source.toggle ? ChaosiumCanvasInterface.actionToggle.On : ChaosiumCanvasInterface.actionToggle.Off)
    }
    return source
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
          const firstUuid = this.playlistUuid ?? this.soundUuid
          if (firstUuid) {
            const doc = await fromUuid(firstUuid)
            toggle = !doc.playing
          }
        }
        break
    }
    if (this.playlistUuid) {
      const playList = await fromUuid(this.playlistUuid)
      if (playList) {
        if (toggle) {
          playList.playAll()
        } else {
          playList.stopAll()
        }
      } else {
        console.error('Playlist ' + this.sceneUuid + ' not loaded')
      }
    }
    if (this.soundUuid) {
      const sound = await fromUuid(this.soundUuid)
      if (sound) {
        if (toggle) {
          sound.parent.playSound(sound)
        } else {
          sound.parent.stopSound(sound)
        }
      } else {
        console.error('Sound ' + this.sceneUuid + ' not loaded')
      }
    }
  }

  async _handleLeftClickEvent () {
    if ((this.playlistUuid || this.soundUuid) && this.triggerButton === ChaosiumCanvasInterface.triggerButton.Left) {
      this.#handleClickEvent()
    }
  }

  async _handleRightClickEvent () {
    if ((this.playlistUuid || this.soundUuid) && this.triggerButton === ChaosiumCanvasInterface.triggerButton.Right) {
      this.#handleClickEvent()
    }
  }
}
