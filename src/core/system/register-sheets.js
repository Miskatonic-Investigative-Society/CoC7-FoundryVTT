/* global Actors, foundry, Items */
import { CoC7ArchetypeSheet } from '../../features/item-archetype/sheet.js'
import { CoC7ArmorSheet } from '../../features/item-armor/sheet.js'
import { CoC7BookSheet } from '../../features/item-book/sheet.js'
import { CoC7CharacterSheet } from '../../features/actor-character/sheet.js'
import { CoC7CharacterSheetV3 } from '../../features/actor-character/sheet-v3.js'
import { CoC7CharacterSheetMinimized } from '../../features/actor-character/sheet-minimized.js'
import { CoC7ContainerSheet } from '../../features/actor-container/sheet.js'
import { CoC7ChaseSheet } from '../../features/chase/sheet.js'
import { CoC7CreatureSheet } from '../../features/actor-creature/sheet.js'
import { CoC7ExperiencePackageSheet } from '../../features/item-experience-package/sheet.js'
import { CoC7ItemSheet } from '../../features/item-generic/sheet.js'
import { CoC7ItemSheetV2 } from '../../features/item-generic/sheet-v2.js'
import { CoC7NPCSheet } from '../../features/actor-npc/sheet.js'
import { CoC7OccupationSheet } from '../../features/item-occupation/sheet.js'
import { CoC7SetupSheet } from '../../features/item-setup/sheet.js'
import { CoC7SkillSheet } from '../../features/item-skill/sheet.js'
import { CoC7SpellSheet } from '../../features/item-spell/sheet.js'
import { CoC7StatusSheet } from '../../features/item-status/sheet.js'
import { CoC7TalentSheet } from '../../features/item-talent/sheet.js'
import { CoC7VehicleSheet } from '../../features/actor-vehicle/sheet.js'
import { CoC7WeaponSheet } from '../../features/item-weapon/sheet.js'

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
