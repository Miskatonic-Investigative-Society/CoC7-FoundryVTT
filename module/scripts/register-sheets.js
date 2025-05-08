/* global Actors, foundry, Items */
import { CoC7ArchetypeSheet } from '../items/sheets/archetype.js'
import { CoC7ArmorSheet } from '../items/sheets/armor.js'
import { CoC7BookSheet } from '../items/book/sheet.js'
import { CoC7CharacterSheet } from '../actors/sheets/character.js'
import { CoC7CharacterSheetV3 } from '../actors/sheets/character-v3.js'
import { CoC7CharacterSheetMinimized } from '../actors/sheets/character-minimized.js'
import { CoC7ContainerSheet } from '../actors/sheets/container.js'
import { CoC7ChaseSheet } from '../items/chase/sheet.js'
import { CoC7CreatureSheet } from '../actors/sheets/creature-sheet.js'
import { CoC7ExperiencePackageSheet } from '../items/sheets/experience-package.js'
import { CoC7ItemSheet } from '../items/sheets/item-sheet.js'
import { CoC7ItemSheetV2 } from '../items/sheets/item-sheetV2.js'
import { CoC7NPCSheet } from '../actors/sheets/npc-sheet.js'
import { CoC7OccupationSheet } from '../items/sheets/occupation.js'
import { CoC7SetupSheet } from '../items/sheets/setup.js'
import { CoC7SkillSheet } from '../items/sheets/skill.js'
import { CoC7SpellSheet } from '../items/spell/sheet.js'
import { CoC7StatusSheet } from '../items/sheets/status.js'
import { CoC7TalentSheet } from '../items/sheets/talent.js'
import { CoC7VehicleSheet } from '../actors/sheets/vehicle.js'
import { CoC7WeaponSheet } from '../items/sheets/weapon-sheet.js'

export function registerSheets () {
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
