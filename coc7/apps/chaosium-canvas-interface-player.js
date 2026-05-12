/* global CONFIG foundry fromUuid game */
import ChaosiumCanvasInterface from './chaosium-canvas-interface.js'

export default class ChaosiumCanvasInterfacePlayer extends ChaosiumCanvasInterface {
  /**
   * Icon to show for behavior
   * @returns {string}
   */
  static get icon () {
    return 'fa-solid fa-user-large'
  }

  /**
   * Create Schema
   * @returns {DataSchema}
   */
  static defineSchema () {
    const fields = foundry.data.fields
    return {
      triggerButton: new fields.NumberField({
        choices: ChaosiumCanvasInterface.triggerButtons,
        initial: ChaosiumCanvasInterface.triggerButton.Right,
        label: 'CoC7.ChaosiumCanvasInterface.Player.Button.Title',
        hint: 'CoC7.ChaosiumCanvasInterface.Player.Button.Hint'
      }),
      imageTiles: new fields.SetField(
        new fields.DocumentUUIDField({
          type: 'Tile'
        }),
        {
          label: 'CoC7.ChaosiumCanvasInterface.Player.ImageDrop.Title',
          hint: 'CoC7.ChaosiumCanvasInterface.Player.ImageDrop.Hint'
        }
      ),
      imagePlaceholder: new fields.FilePathField({
        categories: ['IMAGE', 'VIDEO'],
        blank: true,
        initial: '',
        label: 'CoC7.ChaosiumCanvasInterface.Player.ImagePlaceholder.Title',
        hint: 'CoC7.ChaosiumCanvasInterface.Player.ImagePlaceholder.Hint'
      }),
      nameDrawings: new fields.SetField(
        new fields.DocumentUUIDField({
          type: 'Drawing'
        }),
        {
          label: 'CoC7.ChaosiumCanvasInterface.Player.NameDrop.Title',
          hint: 'CoC7.ChaosiumCanvasInterface.Player.NameDrop.Hint'
        }
      ),
      namePlaceholder: new fields.StringField({
        label: 'CoC7.ChaosiumCanvasInterface.Player.NamePlaceholder.Title',
        hint: 'CoC7.ChaosiumCanvasInterface.Player.NamePlaceholder.Hint'
      }),
      occupationDrawings: new fields.SetField(
        new fields.DocumentUUIDField({
          type: 'Drawing'
        }),
        {
          label: 'CoC7.ChaosiumCanvasInterface.Player.OccupationDrop.Title',
          hint: 'CoC7.ChaosiumCanvasInterface.Player.OccupationDrop.Hint'
        }
      ),
      occupationPlaceholder: new fields.StringField({
        label: 'CoC7.ChaosiumCanvasInterface.Player.OccupationPlaceholder.Title',
        hint: 'CoC7.ChaosiumCanvasInterface.Player.OccupationPlaceholder.Hint'
      }),
      otherRegions: new fields.SetField(
        new fields.DocumentUUIDField({
          type: 'Region'
        }),
        {
          label: 'CoC7.ChaosiumCanvasInterface.Player.OtherRegions.Title',
          hint: 'CoC7.ChaosiumCanvasInterface.Player.OtherRegions.Hint'
        }
      )
    }
  }

  /**
   * Check permissions
   * @returns {boolean}
   */
  async _handleMouseOverEvent () {
    return game.user.isGM
  }

  /**
   * Handle click event
   */
  async #handleClickEvent () {
    await ChaosiumCanvasInterfacePlayer.setupPlayer(this.parent, { img: this.imagePlaceholder, name: this.namePlaceholder, occupation: this.occupationPlaceholder, uuid: '' })
  }

  /**
   * Left click event
   */
  async _handleLeftClickEvent () {
    if (this.triggerButton === ChaosiumCanvasInterface.triggerButton.Left) {
      this.#handleClickEvent()
    }
  }

  /**
   * Right click event
   */
  async _handleRightClickEvent () {
    if (this.triggerButton === ChaosiumCanvasInterface.triggerButton.Right) {
      this.#handleClickEvent()
    }
  }

  /**
   * Setup or clear the player
   * @param {RegionBehavior} behavior
   * @param {object} options
   * @param {string} options.img
   * @param {string} options.name
   * @param {string} options.occupation
   * @param {string} options.uuid
   */
  static async setupPlayer (behavior, { img = '', name = '', occupation = '', uuid = '' }={}) {
    const scenes = {}
    for (const uuid of behavior.system.imageTiles) {
      const parts = foundry.utils.parseUuid(uuid)
      if (parts.primaryType === 'Scene') {
        if (typeof scenes[parts.primaryId]?.[parts.type] === 'undefined') {
          foundry.utils.setProperty(scenes, parts.primaryId + '.' + parts.type, [])
        }
        scenes[parts.primaryId][parts.type].push({
          _id: parts.id,
          'texture.src': img
        })
      }
    }
    for (const uuid of behavior.system.nameDrawings) {
      const parts = foundry.utils.parseUuid(uuid)
      if (parts.primaryType === 'Scene') {
        if (typeof scenes[parts.primaryId]?.[parts.type] === 'undefined') {
          foundry.utils.setProperty(scenes, parts.primaryId + '.' + parts.type, [])
        }
        scenes[parts.primaryId][parts.type].push({
          _id: parts.id,
          'text': name
        })
      }
    }
    for (const uuid of behavior.system.occupationDrawings) {
      const parts = foundry.utils.parseUuid(uuid)
      if (parts.primaryType === 'Scene') {
        if (typeof scenes[parts.primaryId]?.[parts.type] === 'undefined') {
          foundry.utils.setProperty(scenes, parts.primaryId + '.' + parts.type, [])
        }
        scenes[parts.primaryId][parts.type].push({
          _id: parts.id,
          'text': occupation
        })
      }
    }
    for (const sceneId in scenes) {
      for (const type in scenes[sceneId]) {
        const options = {
          parent: game.scenes.get(sceneId)
        }
        await CONFIG[type].documentClass.updateDocuments(scenes[sceneId][type], options)
      }
    }
    const regions = [behavior.parent.uuid, ...behavior.system.otherRegions]
    for (const regionUuid of regions) {
      const region = await fromUuid(regionUuid)
      if (region) {
        if (uuid === '') {
          const openDocument = region.behaviors.find(doc => doc.type === 'ChaosiumCanvasInterfaceOpenDocument')
          if (openDocument) {
            await openDocument.delete()
          }
        } else {
          const behaviors = foundry.utils.duplicate(region.behaviors)
          const index = behaviors.findIndex(doc => doc.type === 'ChaosiumCanvasInterfaceOpenDocument')
          if (index === -1) {
            behaviors.push({
              name: game.i18n.localize('TYPES.RegionBehavior.ChaosiumCanvasInterfaceOpenDocument'),
              type: 'ChaosiumCanvasInterfaceOpenDocument',
              system: {
                documentUuid: uuid
              }
            })
          } else {
            behaviors[index].system.documentUuid = uuid
          }
          await region.update({ behaviors })
        }
      }
    }
  }

  /**
   * Handle drop event
   * @param {Document} actor
   * @param {RegionBehavior} behavior
   */
  static async dropEvent (actor, behavior) {
    await ChaosiumCanvasInterfacePlayer.setupPlayer(behavior, { img: actor.img, name: actor.name, occupation: (actor.occupation ? actor.occupation.name : actor.system.infos.occupation), uuid: actor.uuid })
  }
}
