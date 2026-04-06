/* global foundry loadTemplates */
import { FOLDER_ID } from '../constants.js'

export default async function () {
  const templatePaths = [
    'systems/' + FOLDER_ID + '/templates/items/chase-header-obstacle.hbs',

    'systems/' + FOLDER_ID + '/templates/actors/npc-v2/tab/skills.hbs',
    'systems/' + FOLDER_ID + '/templates/actors/npc-v2/tab/combat.hbs',
    'systems/' + FOLDER_ID + '/templates/actors/npc-v2/tab/inventory-items.hbs',

    'systems/' + FOLDER_ID + '/templates/actors/investigator-v2/tabs/possession.hbs',
    'systems/' + FOLDER_ID + '/templates/actors/investigator-v2/tabs/background.hbs',
    'systems/' + FOLDER_ID + '/templates/actors/investigator-v2/parts/actor-mythos-encounters.hbs',
    'systems/' + FOLDER_ID + '/templates/actors/investigator-v2/parts/actor-keeper-mythos-encounters.hbs',
    'systems/' + FOLDER_ID + '/templates/actors/investigator-v2/tabs/skills.hbs',
    'systems/' + FOLDER_ID + '/templates/actors/investigator-v2/tabs/development.hbs',
    'systems/' + FOLDER_ID + '/templates/actors/investigator-v2/parts/development.hbs',
    'systems/' + FOLDER_ID + '/templates/actors/investigator-v2/parts/vitals.hbs',
    'systems/' + FOLDER_ID + '/templates/actors/investigator-v2/tabs/combat.hbs',

    'systems/' + FOLDER_ID + '/templates/apps/investigator-wizard/introduction.hbs',
    'systems/' + FOLDER_ID + '/templates/apps/investigator-wizard/configuration.hbs',
    'systems/' + FOLDER_ID + '/templates/apps/investigator-wizard/select-setup.hbs',
    'systems/' + FOLDER_ID + '/templates/apps/investigator-wizard/select-archetype.hbs',
    'systems/' + FOLDER_ID + '/templates/apps/investigator-wizard/select-occupation.hbs',
    'systems/' + FOLDER_ID + '/templates/apps/investigator-wizard/set-characteristics.hbs',
    'systems/' + FOLDER_ID + '/templates/apps/investigator-wizard/set-attributes.hbs',
    'systems/' + FOLDER_ID + '/templates/apps/investigator-wizard/view-attributes.hbs',
    'systems/' + FOLDER_ID + '/templates/apps/investigator-wizard/set-investigator.hbs',
    'systems/' + FOLDER_ID + '/templates/apps/investigator-wizard/set-occupation-skills.hbs',
    'systems/' + FOLDER_ID + '/templates/apps/investigator-wizard/toggle-skill.hbs',
    'systems/' + FOLDER_ID + '/templates/apps/investigator-wizard/set-archetype-skills.hbs',
    'systems/' + FOLDER_ID + '/templates/apps/investigator-wizard/points-skills.hbs',
    'systems/' + FOLDER_ID + '/templates/apps/investigator-wizard/backstory.hbs',
    'systems/' + FOLDER_ID + '/templates/apps/investigator-wizard/create.hbs',

    'systems/' + FOLDER_ID + '/templates/chat/roll-result.hbs',
    'systems/' + FOLDER_ID + '/templates/chat/parts/roll-container.hbs',
    'systems/' + FOLDER_ID + '/templates/chat/parts/roll-dice.hbs',
    'systems/' + FOLDER_ID + '/templates/chat/parts/roll-no-formula-dice.hbs',

    'systems/' + FOLDER_ID + '/templates/common/active-effects.hbs',

    'systems/' + FOLDER_ID + '/templates/actors/investigator-v3/parts/portrait-frame.hbs',
    'systems/' + FOLDER_ID + '/templates/actors/investigator-v3/parts/attributes-primary.hbs',
    'systems/' + FOLDER_ID + '/templates/actors/investigator-v3/parts/attributes-secondary.hbs',
    'systems/' + FOLDER_ID + '/templates/actors/investigator-v3/parts/attributes-derived.hbs',
    'systems/' + FOLDER_ID + '/templates/actors/investigator-v3/tabs/development.hbs',
    'systems/' + FOLDER_ID + '/templates/actors/investigator-v3/tabs/skills.hbs',
    'systems/' + FOLDER_ID + '/templates/actors/investigator-v3/tabs/combat.hbs',
    'systems/' + FOLDER_ID + '/templates/actors/investigator-v3/tabs/possession.hbs',
    'systems/' + FOLDER_ID + '/templates/actors/investigator-v3/tabs/background.hbs',
    'systems/' + FOLDER_ID + '/templates/actors/investigator-v3/tabs/keeper.hbs',
    'systems/' + FOLDER_ID + '/templates/actors/investigator-v3/parts/biography.hbs',
    'systems/' + FOLDER_ID + '/templates/actors/investigator-v3/tabs/portrait-config.hbs',
    'systems/' + FOLDER_ID + '/templates/actors/investigator-v3/tabs/active-effects.hbs'
  ]
  /* // FoundryVTT V12 */
  return (foundry.applications.handlebars?.loadTemplates ?? loadTemplates)(templatePaths)
}
