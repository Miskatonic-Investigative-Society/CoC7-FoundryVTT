/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function() {

    // Define template paths to load
    const templatePaths = [
      "systems/CoC7/templates/actors/parts/actor-skills.html",
      "systems/CoC7/templates/actors/parts/npc-skills.html",
      "systems/CoC7/templates/actors/parts/actor-weapons.html",
      "systems/CoC7/templates/actors/parts/npc-combat.html"
  
      // Actor Sheet Partials
    //   "systems/dnd5e/templates/actors/parts/actor-traits.html",
    //   "systems/dnd5e/templates/actors/parts/actor-inventory.html",
    //   "systems/dnd5e/templates/actors/parts/actor-features.html",
    //   "systems/dnd5e/templates/actors/parts/actor-spellbook.html",
  
      // Item Sheet Partials
    //   "systems/dnd5e/templates/items/parts/item-action.html",
    //   "systems/dnd5e/templates/items/parts/item-activation.html",
    //   "systems/dnd5e/templates/items/parts/item-description.html"
    ];
  
    // Load the template parts
    return loadTemplates(templatePaths);
  };