/* global CONFIG */
export default function (app, node) {
  const sheetClass = CONFIG.Actor.sheetClasses.character?.['CoC7.CoC7ModelsActorCharacterSheetV3']?.cls
  if (sheetClass && app instanceof sheetClass) {
    node.style.marginLeft = '87px'
  }
}
