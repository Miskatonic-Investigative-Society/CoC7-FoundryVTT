/* global CONFIG */
import CoC7ModelsActiveEffectDocumentClass from '../models/active-effect/document-class.js'
import CoC7ModelsActorCharacterSystem from '../models/actor/character-system.js'
import CoC7ModelsActorContainerSystem from '../models/actor/container-system.js'
import CoC7ModelsActorCreatureSystem from '../models/actor/creature-system.js'
import CoC7ModelsActorDocumentClass from '../models/actor/document-class.js'
import CoC7ModelsActorNPCSystem from '../models/actor/npc-system.js'
import CoC7ModelsActorVehicleSystem from '../models/actor/vehicle-system.js'
import CoC7ModelsItemArchetypeSystem from '../models/item/archetype-system.js'
import CoC7ModelsItemArmorSystem from '../models/item/armor-system.js'
import CoC7ModelsItemBookSystem from '../models/item/book-system.js'
import CoC7ModelsItemChaseSystem from '../models/item/chase-system.js'
import CoC7ModelsItemDocumentClass from '../models/item/document-class.js'
import CoC7ModelsItemExperiencePackageSystem from '../models/item/experience-package-system.js'
import CoC7ModelsItemItemSystem from '../models/item/item-system.js'
import CoC7ModelsItemOccupationSystem from '../models/item/occupation-system.js'
import CoC7ModelsItemSetupSystem from '../models/item/setup-system.js'
import CoC7ModelsItemSkillSystem from '../models/item/skill-system.js'
import CoC7ModelsItemSpellSystem from '../models/item/spell-system.js'
import CoC7ModelsItemStatusSystem from '../models/item/status-system.js'
import CoC7ModelsItemTalentSystem from '../models/item/talent-system.js'
import CoC7ModelsItemWeaponSystem from '../models/item/weapon-system.js'

/**
 * Set models and document classes
 */
export default function () {
  CONFIG.ActiveEffect.documentClass = CoC7ModelsActiveEffectDocumentClass

  CONFIG.Actor.documentClass = CoC7ModelsActorDocumentClass

  CONFIG.Actor.dataModels.character = CoC7ModelsActorCharacterSystem
  CONFIG.Actor.dataModels.container = CoC7ModelsActorContainerSystem
  CONFIG.Actor.dataModels.creature = CoC7ModelsActorCreatureSystem
  CONFIG.Actor.dataModels.npc = CoC7ModelsActorNPCSystem
  CONFIG.Actor.dataModels.vehicle = CoC7ModelsActorVehicleSystem

  CONFIG.Item.documentClass = CoC7ModelsItemDocumentClass

  CONFIG.Item.dataModels.book = CoC7ModelsItemBookSystem
  CONFIG.Item.dataModels.spell = CoC7ModelsItemSpellSystem
  CONFIG.Item.dataModels.chase = CoC7ModelsItemChaseSystem
  CONFIG.Item.dataModels.skill = CoC7ModelsItemSkillSystem
  CONFIG.Item.dataModels.archetype = CoC7ModelsItemArchetypeSystem
  CONFIG.Item.dataModels.armor = CoC7ModelsItemArmorSystem
  CONFIG.Item.dataModels.experiencePackage = CoC7ModelsItemExperiencePackageSystem
  CONFIG.Item.dataModels.item = CoC7ModelsItemItemSystem
  CONFIG.Item.dataModels.occupation = CoC7ModelsItemOccupationSystem
  CONFIG.Item.dataModels.setup = CoC7ModelsItemSetupSystem
  CONFIG.Item.dataModels.status = CoC7ModelsItemStatusSystem
  CONFIG.Item.dataModels.talent = CoC7ModelsItemTalentSystem
  CONFIG.Item.dataModels.weapon = CoC7ModelsItemWeaponSystem
}
