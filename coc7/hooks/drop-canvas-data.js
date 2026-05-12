/* global fromUuidSync */
import ChaosiumCanvasInterfacePlayer from '../apps/chaosium-canvas-interface-player.js'
import CoC7Canvas from '../apps/canvas.js'

/**
 * Data dropped on canvas
 * @param {Canvas} canvas
 * @param {object} data
 * @param {DragEvent} event
 * @returns {void|false}
 */
export default function (canvas, data, event) {
  if (data.type === 'Actor' && typeof data.uuid === 'string') {
    const actor = fromUuidSync(data.uuid)
    if (actor.type === 'character' && !actor.pack) {
      for (const region of canvas.scene.regions.contents) {
        /* // FoundryVTT V12 */
        const polygonTree = region.object?.document.polygonTree ?? region.object.polygonTree
        const behavior = region.behaviors.find(b => !b.disabled && b.system instanceof ChaosiumCanvasInterfacePlayer && polygonTree.testPoint(data))
        if (behavior) {
          ChaosiumCanvasInterfacePlayer.dropEvent(actor, behavior)
          return false
        }
      }
    }
  }
  CoC7Canvas.onDropSomething(canvas, data, event)
}
