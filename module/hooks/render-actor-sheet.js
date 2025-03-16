import { CoC7CharacterSheet } from '../actors/sheets/character.js'

export default function (app, html, data) {
  CoC7CharacterSheet.renderSheet(app, html, data)
}
