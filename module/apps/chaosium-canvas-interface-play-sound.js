/* global foundry fromUuid game */
import ChaosiumCanvasInterface from './chaosium-canvas-interface.js'

export default class ChaosiumCanvasInterfacePlaySound extends ChaosiumCanvasInterface {
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
      toggle: new fields.BooleanField({
        initial: false,
        label: 'CoC7.ChaosiumCanvasInterface.PlaySound.Toggle.Title',
        hint: 'CoC7.ChaosiumCanvasInterface.PlaySound.Toggle.Hint'
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

  async _handleMouseOverEvent () {
    return game.user.isGM
  }

  async #handleClickEvent () {
    if (this.playlistUuid) {
      const playList = await fromUuid(this.playlistUuid)
      if (playList) {
        if (this.toggle) {
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
        if (this.toggle) {
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
