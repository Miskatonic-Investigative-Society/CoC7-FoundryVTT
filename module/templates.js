/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function() {

	// Define template paths to load
	const templatePaths = [
		'systems/CoC7/templates/actors/parts/actor-skills.html',
		'systems/CoC7/templates/actors/parts/npc-skills.html',
		'systems/CoC7/templates/actors/parts/actor-weapons.html',
		'systems/CoC7/templates/actors/parts/npc-combat.html',
	];
  
	// Load the template parts
	return loadTemplates(templatePaths);
};