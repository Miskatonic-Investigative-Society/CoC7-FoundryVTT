import CoC7CharacterSheet from '../models/actor/character-sheet-v2.js'

export default function (app, html, data) {
  CoC7CharacterSheet.renderSheet(app, html, data)
}
