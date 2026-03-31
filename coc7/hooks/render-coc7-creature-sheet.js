import CoC7CreatureSheet from '../models/actor/creature-sheet-v2.js'

export default function (app, html, data) {
  CoC7CreatureSheet.forceAuto(app, html, data)
}
