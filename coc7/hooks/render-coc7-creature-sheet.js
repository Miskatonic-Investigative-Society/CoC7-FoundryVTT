import { CoC7CreatureSheet } from '../actors/sheets/creature-sheet.js'

export default function (app, html, data) {
  CoC7CreatureSheet.forceAuto(app, html, data)
}
