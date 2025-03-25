/* global ActorSheet, Die, foundry, ItemSheet, NumericTerm, ParentheticalTerm, RollTerm */
/* // FoundryVTT V11 */
// nameAttr= in hbs files
if (typeof foundry.dice === 'undefined') {
  foundry.dice = {
    terms: {
      Die,
      NumericTerm,
      ParentheticalTerm,
      RollTerm
    }
  }
}
if (typeof foundry.applications === 'undefined') {
  foundry.applications = {}
}
/* // FoundryVTT V12 */
if (typeof foundry.appv1 === 'undefined') {
  foundry.appv1 = {
    sheets: {
      ActorSheet,
      ItemSheet
    }
  }
}
// foundry.applications is frozen
// foundry.applications.apps.FilePicker
// foundry.applications.handlebars.loadTemplates
// foundry.applications.ux.DragDrop
// foundry.canvas is frozen
// foundry.canvas.layers.PlaceablesLayer
// foundry.documents is frozen
// foundry.documents.collections.Items
