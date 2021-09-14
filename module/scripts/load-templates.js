/* global loadTemplates */

/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
  /** Define template paths to load */
  const templatePaths = [
    'systems/CoC7/templates/actors/parts/actor-skills.html',
    'systems/CoC7/templates/actors/parts/npc-skills.html',
    'systems/CoC7/templates/actors/parts/actor-weapons.html',
    'systems/CoC7/templates/actors/parts/npc-combat.html',
    'systems/CoC7/templates/actors/parts/character-development.html',

    'systems/CoC7/templates/actors/parts/actor-inventory.html',
    'systems/CoC7/templates/actors/parts/actor-inventory-items.html',
    'systems/CoC7/templates/actors/parts/actor-background.html',
    'systems/CoC7/templates/actors/parts/actor-skills-v2.html',
    'systems/CoC7/templates/actors/parts/actor-weapons-v2.html',
    'systems/CoC7/templates/actors/parts/character-development-v2.html',
    'systems/CoC7/templates/actors/parts/development-controls.html',
    'systems/CoC7/templates/actors/parts/vitals.html',
    'systems/CoC7/templates/actors/parts/combat.html',
    'systems/CoC7/templates/actors/character-sheet-v2.html',
    'systems/CoC7/templates/actors/character/summary.html',

    'systems/CoC7/templates/items/book/details.html'
  ]

  /** Load the template parts */
  return loadTemplates(templatePaths)
}
