/* global foundry, loadTemplates */

/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
  /** Define template paths to load */
  const templatePaths = [
    'systems/CoC7/templates/actors/npc-v2/tab/skills.hbs',
    'systems/CoC7/templates/actors/npc-v2/tab/combat.hbs',

    'systems/CoC7/templates/actors/investigator-v2/tabs/possession.hbs',
    'systems/CoC7/templates/actors/npc-v2/tab/inventory-items.hbs',
    'systems/CoC7/templates/actors/investigator-v2/tabs/background.hbs',
    'systems/CoC7/templates/common/active-effects.hbs',
    'systems/CoC7/templates/actors/investigator-v2/parts/actor-mythos-encounters.hbs',
    'systems/CoC7/templates/actors/investigator-v2/parts/actor-keeper-mythos-encounters.hbs',
    'systems/CoC7/templates/actors/investigator-v2/tabs/skills.hbs',
    'systems/CoC7/templates/actors/investigator-v2/tabs/development.hbs',
    'systems/CoC7/templates/actors/investigator-v2/parts/development.hbs',
    'systems/CoC7/templates/actors/investigator-v2/parts/vitals.hbs',
    'systems/CoC7/templates/actors/investigator-v2/tabs/combat.hbs',
    'systems/CoC7/templates/actors/investigator-v2/header.hbs',
    'systems/CoC7/templates/actors/character/investigator-summarized-v2/body.hbs',

    'systems/CoC7/templates/items/book-tab-details.hbs',
    'systems/CoC7/templates/items/spell-tab-details.hbs',

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

    'systems/CoC7/templates/chat/parts/roll-container.hbs',
    'systems/CoC7/templates/chat/parts/roll-dice.hbs',

    'systems/CoC7/templates/actors/investigator-v3/parts/portrait-frame.hbs',
    'systems/CoC7/templates/actors/investigator-v3/parts/attributes-primary.hbs',
    'systems/CoC7/templates/actors/investigator-v3/tabs/development.hbs',
    'systems/CoC7/templates/actors/investigator-v3/tabs/skills.hbs',
    'systems/CoC7/templates/actors/investigator-v3/tabs/combat.hbs',
    'systems/CoC7/templates/actors/investigator-v3/tabs/possession.hbs',
    'systems/CoC7/templates/actors/investigator-v3/tabs/background.hbs',
    'systems/CoC7/templates/actors/investigator-v3/tabs/keeper.hbs',
    'systems/CoC7/templates/actors/investigator-v3/tabs/active-effects.hbs'
  ]

  /** Load the template parts */
  /* // FoundryVTT V12 */
  return (foundry.applications.handlebars?.loadTemplates ?? loadTemplates)(templatePaths)
}
