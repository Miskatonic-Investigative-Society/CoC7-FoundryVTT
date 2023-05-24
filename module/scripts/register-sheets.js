/* global Actors, ActorSheet, Items, ItemSheet, Journal, JournalSheet, MacroConfig, Macros, PlaylistConfig, Playlists, RollTables, RollTableConfig, Scenes, SceneConfig */
import { CoC7ArchetypeSheet } from '../items/sheets/archetype.js'
import { CoC7BookSheet } from '../items/book/sheet.js'
import { CoC7CharacterSheet } from '../actors/sheets/character.js'
import { CoC7ContainerSheet } from '../actors/sheets/container.js'
import { CoC7ChaseSheet } from '../items/chase/sheet.js'
import { CoC7CreatureSheet } from '../actors/sheets/creature-sheet.js'
import { CoC7ItemSheet } from '../items/sheets/item-sheet.js'
import { CoC7ItemSheetV2 } from '../items/sheets/item-sheetV2.js'
import { CoC7JournalSheet } from '../sheets/coc7-journal-sheet.js'
import { CoC7MacroConfig } from '../sheets/coc7-macro-config.js'
import { CoC7NPCSheet } from '../actors/sheets/npc-sheet.js'
import { CoC7OccupationSheet } from '../items/sheets/occupation.js'
import { CoC7PlaylistConfig } from '../sheets/coc7-playlist-config.js'
import { CoC7RollTableConfig } from '../sheets/coc7-roll-table-config.js'
import { CoC7SceneConfig } from '../sheets/coc7-scene-config.js'
import { CoC7SetupSheet } from '../items/sheets/setup.js'
import { CoC7SkillSheet } from '../items/sheets/skill.js'
import { CoC7SpellSheet } from '../items/spell/sheet.js'
import { CoC7StatusSheet } from '../items/sheets/status.js'
import { CoC7TalentSheet } from '../items/sheets/talent.js'
import { CoC7VehicleSheet } from '../actors/sheets/vehicle.js'
import { CoC7WeaponSheet } from '../items/sheets/weapon-sheet.js'

export function registerSheets () {
  Actors.unregisterSheet('core', ActorSheet)
  Actors.registerSheet('CoC7', CoC7NPCSheet, {
    types: ['npc'],
    makeDefault: true
  })
  Actors.registerSheet('CoC7', CoC7VehicleSheet, {
    types: ['vehicle'],
    makeDefault: true
  })
  Actors.registerSheet('CoC7', CoC7CreatureSheet, {
    types: ['creature'],
    makeDefault: true
  })
  Actors.registerSheet('CoC7', CoC7ContainerSheet, {
    types: ['container'],
    makeDefault: true
  })
  Actors.registerSheet('CoC7', CoC7CharacterSheet, {
    types: ['character'],
    makeDefault: true
  })

  Items.unregisterSheet('core', ItemSheet)
  Items.registerSheet('CoC7', CoC7SkillSheet, {
    types: ['skill'],
    makeDefault: true
  })
  Items.registerSheet('CoC7', CoC7WeaponSheet, {
    types: ['weapon'],
    makeDefault: true
  })
  Items.registerSheet('CoC7', CoC7BookSheet, {
    types: ['book'],
    makeDefault: true
  })
  Items.registerSheet('CoC7', CoC7SpellSheet, {
    types: ['spell'],
    makeDefault: true
  })
  Items.registerSheet('CoC7', CoC7TalentSheet, {
    types: ['talent'],
    makeDefault: true
  })
  Items.registerSheet('CoC7', CoC7StatusSheet, {
    types: ['status'],
    makeDefault: true
  })
  Items.registerSheet('CoC7', CoC7OccupationSheet, {
    types: ['occupation'],
    makeDefault: true
  })
  Items.registerSheet('CoC7', CoC7ArchetypeSheet, {
    types: ['archetype'],
    makeDefault: true
  })
  Items.registerSheet('CoC7', CoC7SetupSheet, {
    types: ['setup'],
    makeDefault: true
  })
  Items.registerSheet('CoC7', CoC7ChaseSheet, {
    types: ['chase'],
    makeDefault: true
  })
  Items.registerSheet('CoC7', CoC7ItemSheet, { types: ['item'] })
  Items.registerSheet('CoC7', CoC7ItemSheetV2, {
    types: ['item'],
    makeDefault: true
  })

  Scenes.unregisterSheet('core', SceneConfig)
  Scenes.registerSheet('CoC7', CoC7SceneConfig, {
    makeDefault: true
  })

  Journal.unregisterSheet('core', JournalSheet)
  Journal.registerSheet('CoC7', CoC7JournalSheet, {
    makeDefault: true
  })

  RollTables.unregisterSheet('core', RollTableConfig)
  RollTables.registerSheet('CoC7', CoC7RollTableConfig, {
    makeDefault: true
  })

  Macros.unregisterSheet('core', MacroConfig)
  Macros.registerSheet('CoC7', CoC7MacroConfig, {
    makeDefault: true
  })

  Playlists.unregisterSheet('core', PlaylistConfig)
  Playlists.registerSheet('CoC7', CoC7PlaylistConfig, {
    makeDefault: true
  })
}
