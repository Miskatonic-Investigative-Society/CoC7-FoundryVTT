import { CoC7NPCSheet } from '../actors/sheets/npc-sheet.js'

export default function (app, html, data) {
  CoC7NPCSheet.forceAuto(app, html, data)
}
