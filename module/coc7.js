/**
 * A simple and flexible system for world-building using an arbitrary collection of character and item attributes
 * Author: Atropos
 * Software License: GNU GPLv3
 */

// Import Modules
import { CoCActor } from './actors/actor.js';
import { CoC7WeaponSheet } from './items/sheets/weapon-sheet.js';
import { CoCItemSheet } from './items/sheets/item-sheet.js';
import { CoC7Item } from './items/item.js';
import { CoC7NPCSheet } from './actors/sheets/npc-sheet.js';
import { CoC7CreatureSheet } from './actors/sheets/creature-sheet.js';
import { CoC7CharacterSheet } from './actors/sheets/actor-sheet.js';
import { preloadHandlebarsTemplates } from './templates.js';
import { CoC7Chat } from './chat.js';
import { CoC7Combat } from './combat.js';


Hooks.once('init', async function() {
	// console.log('-->Hooks.once Init');
	// console.log(`Initializing Simple  System`);

	/**
	 * Set an initiative formula for the system
	 * @type {String}
	 */
	CONFIG.Combat.initiative = {
		formula: '@characteristics.dex.value',
		decimals: 0
	};


	//TODO : remove debug hooks
	CONFIG.debug.hooks = true;
	CONFIG.Combat.entityClass = CoC7Combat;
	CONFIG.Actor.entityClass = CoCActor;
	CONFIG.Item.entityClass = CoC7Item;
	
	game.settings.register('CoC7', 'creditRatingFactor', {
		name: 'Factor for cash calculation',
		hint: 'The amount to multiply to get cash and assets values',
		scope: 'world',
		config: true,
		default: 1,
		type: Number
	});

	// Set default check difficulty.
	game.settings.register('CoC7', 'defaultCheckDifficulty', {
		name: 'SETTINGS.DefaultDifficulty',
		hint: 'SETTINGS.DefaultDifficultyHint',
		scope: 'world',
		config: true,
		default: 'regular',
		type: String,
		choices: {
			'regular': 'SETTINGS.CheckDifficultyRegular',
			'unknown': 'SETTINGS.CheckDifficultyUnknown'
		}
	});

	
	// Set the use of token instead of portraits.
	game.settings.register('CoC7', 'useToken', {
		name: 'SETTINGS.UseToken',
		hint: 'SETTINGS.UseTokenHint',
		scope: 'world',
		config: true,
		default: false,
		type: Boolean
	});

	// Set the need to display actor image on chat cards.
	game.settings.register('CoC7', 'displayActorOnCard', {
		name: 'SETTINGS.DisplayActorOnCard',
		hint: 'SETTINGS.DisplayActorOnCardHint',
		scope: 'world',
		config: true,
		default: false,
		type: Boolean
	});

	// Register sheet application classes
	Actors.unregisterSheet('core', ActorSheet);
	Actors.registerSheet('CoC7', CoC7NPCSheet, { types: ['npc'] });
	Actors.registerSheet('CoC7', CoC7CreatureSheet, { types: ['creature'] });
	Actors.registerSheet('CoC7', CoC7CharacterSheet, { types: ['character'], makeDefault: true });
	Items.unregisterSheet('core', ItemSheet);
	Items.registerSheet('CoC7', CoC7WeaponSheet, { types: ['weapon'], makeDefault: true});
	Items.registerSheet('CoC7', CoCItemSheet, { makeDefault: true});
	preloadHandlebarsTemplates();
});

//Hooks.on("renderChatLog", (app, html, data) => CoC7Item.chatListeners(html));
Hooks.on('renderChatLog', (app, html, data) => CoC7Chat.chatListeners(app, html, data));
Hooks.on('renderChatMessage', (app, html, data) => CoC7Chat.renderMessageHook(app, html, data));
Hooks.on('updateChatMessage', (chatMessage, chatData, diff, speaker) => CoC7Chat.onUpdateChatMessage( chatMessage, chatData, diff, speaker));
// Hooks.on('preCreateChatMessage', (app, html, data) => CoC7Chat.preCreateChatMessageHook(app, html, data));

Hooks.on('ready', CoC7Chat.ready);
Hooks.on('preCreateActor', (createData) => CoCActor.initToken( createData));
Hooks.on('renderCombatTracker', (combatTracker, html, data) => CoC7Combat.renderCombatTracker(combatTracker, html, data));
Hooks.on('closeActorSheet', (characterSheet) => characterSheet.onCloseSheet());
// Hooks.on('chatMessage', (chatLog, message, chatData) => { console.log('**************************************************************************************************chatMessage : '  + message);});


// Add button on Token selection bar
//Hooks.on('getSceneControlButtons', CoC7Chat.getSceneControlButtons);

// Hooks.on('preCreateToken', ( scene, actor, options, id) => CoCActor.preCreateToken( scene, actor, options, id))
// Hooks.on('createToken', ( scene, actor, options, id) => CoCActor.preCreateToken( scene, actor, options, id))
