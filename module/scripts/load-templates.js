/* global loadTemplates */

/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
  /** Define template paths to load */
  const templatePaths = [
    'systems/CoC7/templates/actors/parts/npc-skills.html',
    'systems/CoC7/templates/actors/parts/npc-combat.html',

    'systems/CoC7/templates/actors/parts/actor-inventory.html',
    'systems/CoC7/templates/actors/parts/actor-inventory-items.html',
    'systems/CoC7/templates/actors/parts/actor-background.html',
    'systems/CoC7/templates/common/active-effects.hbs',
    'systems/CoC7/templates/actors/parts/actor-mythos-enounters.hbs',
    'systems/CoC7/templates/actors/parts/actor-keeper-mythos-enounters.hbs',
    'systems/CoC7/templates/actors/parts/actor-skills-v2.html',
    'systems/CoC7/templates/actors/parts/character-development-v2.html',
    'systems/CoC7/templates/actors/parts/development-controls.html',
    'systems/CoC7/templates/actors/parts/vitals.html',
    'systems/CoC7/templates/actors/parts/combat.html',
    'systems/CoC7/templates/actors/character-sheet-v2.html',
    'systems/CoC7/templates/actors/character/summary.html',

    'systems/CoC7/templates/items/book/details.html',
    'systems/CoC7/templates/items/spell/details.html',

    'systems/CoC7/templates/apps/investigator-wizard/introduction.hbs',
    'systems/CoC7/templates/apps/investigator-wizard/configuration.hbs',
    'systems/CoC7/templates/apps/investigator-wizard/select-setup.hbs',
    'systems/CoC7/templates/apps/investigator-wizard/select-archetype.hbs',
    'systems/CoC7/templates/apps/investigator-wizard/select-occupation.hbs',
    'systems/CoC7/templates/apps/investigator-wizard/set-characteristics.hbs',
    'systems/CoC7/templates/apps/investigator-wizard/set-attributes.hbs',
    'systems/CoC7/templates/apps/investigator-wizard/view-attributes.hbs',
    'systems/CoC7/templates/apps/investigator-wizard/set-investigator.hbs',
    'systems/CoC7/templates/apps/investigator-wizard/set-occupation-skills.hbs',
    'systems/CoC7/templates/apps/investigator-wizard/toggle-skill.hbs',
    'systems/CoC7/templates/apps/investigator-wizard/set-archetype-skills.hbs',
    'systems/CoC7/templates/apps/investigator-wizard/points-skills.hbs',
    'systems/CoC7/templates/apps/investigator-wizard/backstory.hbs',
    'systems/CoC7/templates/apps/investigator-wizard/create.hbs',

    'systems/CoC7/templates/chat/messages/roll-container.hbs',
    'systems/CoC7/templates/chat/messages/roll-dice.hbs'
  ]

  /** Load the template parts */
  return loadTemplates(templatePaths)
}
