/* global Actors foundry game Items */
import { FOLDER_ID } from '../constants.js'
import CoC7ModelsActorCharacterSheetSummarizedV2 from '../models/actor/character-sheet-summarized-v2.js'
import CoC7ModelsActorCharacterSheetSummarizedV3 from '../models/actor/character-sheet-summarized-v3.js'
import CoC7ModelsActorCharacterSheetV2 from '../models/actor/character-sheet-v2.js'
import CoC7ModelsActorCharacterSheetV3 from '../models/actor/character-sheet-v3.js'
import CoC7ModelsActorContainerSheetV2 from '../models/actor/container-sheet-v2.js'
import CoC7ModelsActorCreatureSheetV2 from '../models/actor/creature-sheet-v2.js'
import CoC7ModelsActorNPCSheetV2 from '../models/actor/npc-sheet-v2.js'
import CoC7ModelsActorVehicleSheetV2 from '../models/actor/vehicle-sheet-v2.js'
import CoC7ModelsItemArchetypeSheet from '../models/item/archetype-sheet.js'
import CoC7ModelsItemArmorSheet from '../models/item/armor-sheet.js'
import CoC7ModelsItemBookSheet from '../models/item/book-sheet.js'
import CoC7ModelsItemChaseSheet from '../models/item/chase-sheet.js'
import CoC7ModelsItemExperiencePackageSheet from '../models/item/experience-package-sheet.js'
import CoC7ModelsItemItemSheetV2 from '../models/item/item-sheet-v2.js'
import CoC7ModelsItemOccupationSheet from '../models/item/occupation-sheet.js'
import CoC7ModelsItemSetupSheet from '../models/item/setup-sheet.js'
import CoC7ModelsItemSkillSheet from '../models/item/skill-sheet.js'
import CoC7ModelsItemSpellSheet from '../models/item/spell-sheet.js'
import CoC7ModelsItemStatusSheet from '../models/item/status-sheet.js'
import CoC7ModelsItemTalentSheet from '../models/item/talent-sheet.js'
import CoC7ModelsItemWeaponSheet from '../models/item/weapon-sheet.js'

/**
 * Register Sheets
 */
export default function () {
  /* // FoundryVTT V12 */
  const ActorsPolyfill = (foundry.documents.collections?.Actors ?? Actors)
  const ItemsPolyfill = (foundry.documents.collections?.Items ?? Items)

  ActorsPolyfill.unregisterSheet('core', foundry.appv1.sheets.ActorSheet)
  ActorsPolyfill.registerSheet(FOLDER_ID, CoC7ModelsActorNPCSheetV2, {
    types: ['npc'],
    label: game.i18n.localize('CoC7.CoC7ModelsActorNPCSheetV2'), /* // FoundryVTT V12 */
    makeDefault: true
  })
  ActorsPolyfill.registerSheet(FOLDER_ID, CoC7ModelsActorVehicleSheetV2, {
    types: ['vehicle'],
    makeDefault: true
  })
  ActorsPolyfill.registerSheet(FOLDER_ID, CoC7ModelsActorCreatureSheetV2, {
    types: ['creature'],
    label: game.i18n.localize('CoC7.CoC7ModelsActorCreatureSheetV2'), /* // FoundryVTT V12 */
    makeDefault: true
  })
  ActorsPolyfill.registerSheet(FOLDER_ID, CoC7ModelsActorContainerSheetV2, {
    types: ['container'],
    label: game.i18n.localize('CoC7.CoC7ModelsActorContainerSheetV2'), /* // FoundryVTT V12 */
    makeDefault: true
  })
  ActorsPolyfill.registerSheet(FOLDER_ID, CoC7ModelsActorCharacterSheetV2, {
    types: ['character'],
    label: game.i18n.localize('CoC7.CoC7ModelsActorCharacterSheetV2') /* // FoundryVTT V12 */
  })
  ActorsPolyfill.registerSheet(FOLDER_ID, CoC7ModelsActorCharacterSheetSummarizedV2, {
    types: ['character'],
    label: game.i18n.localize('CoC7.CoC7ModelsActorCharacterSheetSummarizedV2') /* // FoundryVTT V12 */
  })
  ActorsPolyfill.registerSheet(FOLDER_ID, CoC7ModelsActorCharacterSheetSummarizedV3, {
    types: ['character'],
    label: game.i18n.localize('CoC7.CoC7ModelsActorCharacterSheetSummarizedV3') /* // FoundryVTT V12 */
  })
  ActorsPolyfill.registerSheet(FOLDER_ID, CoC7ModelsActorCharacterSheetV3, {
    types: ['character'],
    label: game.i18n.localize('CoC7.CoC7ModelsActorCharacterSheetV3'), /* // FoundryVTT V12 */
    makeDefault: true
  })

  ItemsPolyfill.unregisterSheet('core', foundry.appv1.sheets.ItemSheet)
  ItemsPolyfill.registerSheet(FOLDER_ID, CoC7ModelsItemSkillSheet, {
    types: ['skill'],
    label: game.i18n.localize('CoC7.CoC7ModelsItemSkillSheet'), /* // FoundryVTT V12 */
    makeDefault: true
  })
  ItemsPolyfill.registerSheet(FOLDER_ID, CoC7ModelsItemWeaponSheet, {
    types: ['weapon'],
    label: game.i18n.localize('CoC7.CoC7ModelsItemWeaponSheet'), /* // FoundryVTT V12 */
    makeDefault: true
  })
  ItemsPolyfill.registerSheet(FOLDER_ID, CoC7ModelsItemBookSheet, {
    types: ['book'],
    label: game.i18n.localize('CoC7.CoC7ModelsItemBookSheet'), /* // FoundryVTT V12 */
    makeDefault: true
  })
  ItemsPolyfill.registerSheet(FOLDER_ID, CoC7ModelsItemSpellSheet, {
    types: ['spell'],
    label: game.i18n.localize('CoC7.CoC7ModelsItemSpellSheet'), /* // FoundryVTT V12 */
    makeDefault: true
  })
  ItemsPolyfill.registerSheet(FOLDER_ID, CoC7ModelsItemTalentSheet, {
    types: ['talent'],
    label: game.i18n.localize('CoC7.CoC7ModelsItemTalentSheet'), /* // FoundryVTT V12 */
    makeDefault: true
  })
  ItemsPolyfill.registerSheet(FOLDER_ID, CoC7ModelsItemStatusSheet, {
    types: ['status'],
    label: game.i18n.localize('CoC7.CoC7ModelsItemStatusSheet'), /* // FoundryVTT V12 */
    makeDefault: true
  })
  ItemsPolyfill.registerSheet(FOLDER_ID, CoC7ModelsItemOccupationSheet, {
    types: ['occupation'],
    label: game.i18n.localize('CoC7.CoC7ModelsItemOccupationSheet'), /* // FoundryVTT V12 */
    makeDefault: true
  })
  ItemsPolyfill.registerSheet(FOLDER_ID, CoC7ModelsItemArchetypeSheet, {
    types: ['archetype'],
    label: game.i18n.localize('CoC7.CoC7ModelsItemArchetypeSheet'), /* // FoundryVTT V12 */
    makeDefault: true
  })
  ItemsPolyfill.registerSheet(FOLDER_ID, CoC7ModelsItemSetupSheet, {
    types: ['setup'],
    label: game.i18n.localize('CoC7.CoC7ModelsItemSetupSheet'), /* // FoundryVTT V12 */
    makeDefault: true
  })
  ItemsPolyfill.registerSheet(FOLDER_ID, CoC7ModelsItemChaseSheet, {
    types: ['chase'],
    label: game.i18n.localize('CoC7.CoC7ModelsItemChaseSheet'), /* // FoundryVTT V12 */
    makeDefault: true
  })
  ItemsPolyfill.registerSheet(FOLDER_ID, CoC7ModelsItemArmorSheet, {
    types: ['armor'],
    label: game.i18n.localize('CoC7.CoC7ModelsItemArmorSheet'), /* // FoundryVTT V12 */
    makeDefault: true
  })
  ItemsPolyfill.registerSheet(FOLDER_ID, CoC7ModelsItemExperiencePackageSheet, {
    types: ['experiencePackage'],
    label: game.i18n.localize('CoC7.CoC7ModelsItemExperiencePackageSheet'), /* // FoundryVTT V12 */
    makeDefault: true
  })
  ItemsPolyfill.registerSheet(FOLDER_ID, CoC7ModelsItemItemSheetV2, {
    types: ['item'],
    label: game.i18n.localize('CoC7.CoC7ModelsItemItemSheetV2'), /* // FoundryVTT V12 */
    makeDefault: true
  })
}
