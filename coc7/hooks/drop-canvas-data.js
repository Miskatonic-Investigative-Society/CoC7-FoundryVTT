import CoC7Canvas from '../apps/canvas.js'

/**
 * Data dropped on canvas
 * @param {Canvas} canvas
 * @param {object} data
 * @param {DragEvent} event
 */
export default function (canvas, data, event) {
  CoC7Canvas.onDropSomething(canvas, data, event)
}
