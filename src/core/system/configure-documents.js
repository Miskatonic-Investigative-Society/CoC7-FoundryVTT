/* global CONFIG */
import CoC7ActiveEffect from '../documents/active-effect.js'
import { CoCActor } from '../documents/actor.js'
import { CoC7Item } from '../documents/item.js'

import { CharacterData } from '../../features/actor-character/datamodel.js'
import { ContainerData } from '../../features/actor-container/datamodel.js'
import { CreatureData } from '../../features/actor-creature/datamodel.js'
import { NpcData } from '../../features/actor-npc/datamodel.js'
import { VehicleData } from '../../features/actor-vehicle/datamodel.js'
import { ArchetypeData } from '../../features/item-archetype/datamodel.js'
import { ArmorData } from '../../features/item-armor/datamodel.js'
import { BookData } from '../../features/item-book/datamodel.js'
import { ChaseData } from '../../features/chase/datamodel.js'
import { ExperiencePackageData } from '../../features/item-experience-package/datamodel.js'
import { GenericItemData } from '../../features/item-generic/datamodel.js'
import { OccupationData } from '../../features/item-occupation/datamodel.js'
import { SetupData } from '../../features/item-setup/datamodel.js'
import { SkillData } from '../../features/item-skill/datamodel.js'
import { SpellData } from '../../features/item-spell/datamodel.js'
import { StatusData } from '../../features/item-status/datamodel.js'
import { TalentData } from '../../features/item-talent/datamodel.js'
import { WeaponData } from '../../features/item-weapon/datamodel.js'

import { CoC7Vehicle } from '../../features/actor-vehicle/data.js'
import { CoC7Chase } from '../../features/chase/data.js'
import { CoC7Book } from '../../features/item-book/data.js'
import { CoC7Skill } from '../../features/item-skill/data.js'
import { CoC7Spell } from '../../features/item-spell/data.js'

export function configureDocuments() {
  // Configure custom Document classes
  CONFIG.ActiveEffect.documentClass = CoC7ActiveEffect
  CONFIG.Actor.documentClass = CoCActor
  CONFIG.Item.documentClass = CoC7Item

  // Register all DataModels for Actors and Items
  CONFIG.Actor.dataModels = {
    character: CharacterData,
    npc: NpcData,
    creature: CreatureData,
    vehicle: VehicleData,
    container: ContainerData
  }
  CONFIG.Item.dataModels = {
    item: GenericItemData,
    weapon: WeaponData,
    skill: SkillData,
    setup: SetupData,
    occupation: OccupationData,
    archetype: ArchetypeData,
    book: BookData,
    spell: SpellData,
    talent: TalentData,
    status: StatusData,
    chase: ChaseData,
    armor: ArmorData,
    experiencePackage: ExperiencePackageData
  }

  // Register custom Document classes for specific types that have extended logic
  CONFIG.Actor.documentClasses = {
    vehicle: CoC7Vehicle
  }
  CONFIG.Item.documentClasses = {
    book: CoC7Book,
    spell: CoC7Spell,
    chase: CoC7Chase,
    skill: CoC7Skill
  }
}
