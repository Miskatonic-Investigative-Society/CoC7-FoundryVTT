/* global Actors, foundry, Items */
import CoC7ArchetypeSheet from '../models/item/archetype-sheet.js'
import CoC7ArmorSheet from '../models/item/armor-sheet.js'
import CoC7BookSheet from '../models/item/book-sheet.js'
import CoC7CharacterSheet from '../models/actor/character-sheet-v2.js'
import CoC7CharacterSheetV3 from '../models/actor/character-sheet-v3.js'
import CoC7CharacterSheetMinimized from '../models/actor/character-sheet-summarized-v2.js'
import CoC7ContainerSheet from '../models/actor/container-sheet-v2.js'
import CoC7ChaseSheet from '../models/item/chase-sheet.js'
import CoC7CreatureSheet from '../models/actor/creature-sheet-v2.js'
import CoC7ExperiencePackageSheet from '../models/item/experience-package-sheet.js'
import { CoC7ItemSheet } from '../items/sheets/item-sheet.js'
import CoC7ItemSheetV2 from '../models/item/item-sheet-v2.js'
import CoC7NPCSheet from '../models/actor/npc-sheet-v2.js'
import CoC7OccupationSheet from '../models/item/occupation-sheet.js'
import CoC7SetupSheet from '../models/item/setup-sheet.js'
import CoC7SkillSheet from '../models/item/skill-sheet.js'
import CoC7SpellSheet from '../models/item/spell-sheet.js'
import CoC7StatusSheet from '../models/item/status-sheet.js'
import CoC7TalentSheet from '../models/item/talent-sheet.js'
import CoC7VehicleSheet from '../models/actor/vehicle-sheet-v2.js'
import CoC7WeaponSheet from '../models/item/weapon-sheet.js'

export default function () {
  /* // FoundryVTT V12 */
  const ActorsPolyfill = (foundry.documents.collections?.Actors ?? Actors)
  const ItemsPolyfill = (foundry.documents.collections?.Items ?? Items)

  ActorsPolyfill.unregisterSheet('core', foundry.appv1.sheets.ActorSheet)
  ActorsPolyfill.registerSheet('CoC7', CoC7NPCSheet, {
    types: ['npc'],
    makeDefault: true
  })
  ActorsPolyfill.registerSheet('CoC7', CoC7VehicleSheet, {
    types: ['vehicle'],
    makeDefault: true
  })
  ActorsPolyfill.registerSheet('CoC7', CoC7CreatureSheet, {
    types: ['creature'],
    makeDefault: true
  })
  ActorsPolyfill.registerSheet('CoC7', CoC7ContainerSheet, {
    types: ['container'],
    makeDefault: true
  })
  ActorsPolyfill.registerSheet('CoC7', CoC7CharacterSheet, {
    types: ['character']
  })
  ActorsPolyfill.registerSheet('CoC7', CoC7CharacterSheetMinimized, {
    types: ['character']
  })
  ActorsPolyfill.registerSheet('CoC7', CoC7CharacterSheetV3, {
    types: ['character'],
    makeDefault: true
  })

  ItemsPolyfill.unregisterSheet('core', foundry.appv1.sheets.ItemSheet)
  ItemsPolyfill.registerSheet('CoC7', CoC7SkillSheet, {
    types: ['skill'],
    makeDefault: true
  })
  ItemsPolyfill.registerSheet('CoC7', CoC7WeaponSheet, {
    types: ['weapon'],
    makeDefault: true
  })
  ItemsPolyfill.registerSheet('CoC7', CoC7BookSheet, {
    types: ['book'],
    makeDefault: true
  })
  ItemsPolyfill.registerSheet('CoC7', CoC7SpellSheet, {
    types: ['spell'],
    makeDefault: true
  })
  ItemsPolyfill.registerSheet('CoC7', CoC7TalentSheet, {
    types: ['talent'],
    makeDefault: true
  })
  ItemsPolyfill.registerSheet('CoC7', CoC7StatusSheet, {
    types: ['status'],
    makeDefault: true
  })
  ItemsPolyfill.registerSheet('CoC7', CoC7OccupationSheet, {
    types: ['occupation'],
    makeDefault: true
  })
  ItemsPolyfill.registerSheet('CoC7', CoC7ArchetypeSheet, {
    types: ['archetype'],
    makeDefault: true
  })
  ItemsPolyfill.registerSheet('CoC7', CoC7SetupSheet, {
    types: ['setup'],
    makeDefault: true
  })
  ItemsPolyfill.registerSheet('CoC7', CoC7ChaseSheet, {
    types: ['chase'],
    makeDefault: true
  })
  ItemsPolyfill.registerSheet('CoC7', CoC7ArmorSheet, {
    types: ['armor'],
    makeDefault: true
  })
  ItemsPolyfill.registerSheet('CoC7', CoC7ExperiencePackageSheet, {
    types: ['experiencePackage'],
    makeDefault: true
  })
  ItemsPolyfill.registerSheet('CoC7', CoC7ItemSheet, { types: ['item'] })
  ItemsPolyfill.registerSheet('CoC7', CoC7ItemSheetV2, {
    types: ['item'],
    makeDefault: true
  })
}
