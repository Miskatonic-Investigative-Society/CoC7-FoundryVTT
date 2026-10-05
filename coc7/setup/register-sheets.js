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
  foundry.documents.collections.Actors.unregisterSheet('core', foundry.appv1.sheets.ActorSheet)
  foundry.documents.collections.Actors.registerSheet(FOLDER_ID, CoC7ModelsActorNPCSheetV2, {
    types: ['npc'],
    makeDefault: true
  })
  foundry.documents.collections.Actors.registerSheet(FOLDER_ID, CoC7ModelsActorVehicleSheetV2, {
    types: ['vehicle'],
    makeDefault: true
  })
  foundry.documents.collections.Actors.registerSheet(FOLDER_ID, CoC7ModelsActorCreatureSheetV2, {
    types: ['creature'],
    makeDefault: true
  })
  foundry.documents.collections.Actors.registerSheet(FOLDER_ID, CoC7ModelsActorContainerSheetV2, {
    types: ['container'],
    makeDefault: true
  })
  foundry.documents.collections.Actors.registerSheet(FOLDER_ID, CoC7ModelsActorCharacterSheetV2, {
    types: ['character']
  })
  foundry.documents.collections.Actors.registerSheet(FOLDER_ID, CoC7ModelsActorCharacterSheetSummarizedV2, {
    types: ['character']
  })
  foundry.documents.collections.Actors.registerSheet(FOLDER_ID, CoC7ModelsActorCharacterSheetSummarizedV3, {
    types: ['character']
  })
  foundry.documents.collections.Actors.registerSheet(FOLDER_ID, CoC7ModelsActorCharacterSheetV3, {
    types: ['character'],
    makeDefault: true
  })

  foundry.documents.collections.Items.unregisterSheet('core', foundry.appv1.sheets.ItemSheet)
  foundry.documents.collections.Items.registerSheet(FOLDER_ID, CoC7ModelsItemSkillSheet, {
    types: ['skill'],
    makeDefault: true
  })
  foundry.documents.collections.Items.registerSheet(FOLDER_ID, CoC7ModelsItemWeaponSheet, {
    types: ['weapon'],
    makeDefault: true
  })
  foundry.documents.collections.Items.registerSheet(FOLDER_ID, CoC7ModelsItemBookSheet, {
    types: ['book'],
    makeDefault: true
  })
  foundry.documents.collections.Items.registerSheet(FOLDER_ID, CoC7ModelsItemSpellSheet, {
    types: ['spell'],
    makeDefault: true
  })
  foundry.documents.collections.Items.registerSheet(FOLDER_ID, CoC7ModelsItemTalentSheet, {
    types: ['talent'],
    makeDefault: true
  })
  foundry.documents.collections.Items.registerSheet(FOLDER_ID, CoC7ModelsItemStatusSheet, {
    types: ['status'],
    makeDefault: true
  })
  foundry.documents.collections.Items.registerSheet(FOLDER_ID, CoC7ModelsItemOccupationSheet, {
    types: ['occupation'],
    makeDefault: true
  })
  foundry.documents.collections.Items.registerSheet(FOLDER_ID, CoC7ModelsItemArchetypeSheet, {
    types: ['archetype'],
    makeDefault: true
  })
  foundry.documents.collections.Items.registerSheet(FOLDER_ID, CoC7ModelsItemSetupSheet, {
    types: ['setup'],
    makeDefault: true
  })
  foundry.documents.collections.Items.registerSheet(FOLDER_ID, CoC7ModelsItemChaseSheet, {
    types: ['chase'],
    makeDefault: true
  })
  foundry.documents.collections.Items.registerSheet(FOLDER_ID, CoC7ModelsItemArmorSheet, {
    types: ['armor'],
    makeDefault: true
  })
  foundry.documents.collections.Items.registerSheet(FOLDER_ID, CoC7ModelsItemExperiencePackageSheet, {
    types: ['experiencePackage'],
    makeDefault: true
  })
  foundry.documents.collections.Items.registerSheet(FOLDER_ID, CoC7ModelsItemItemSheetV2, {
    types: ['item'],
    makeDefault: true
  })
}
