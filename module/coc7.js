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
import { CoC7Combat, rollInitiative } from './combat.js';
import { CoC7BookSheet } from './items/sheets/book.js';
import { CoC7SpellSheet } from './items/sheets/spell.js';
import { COC7 } from './config.js';


Hooks.once('init', async function() {
	// console.log('-->Hooks.once Init');
	// console.log(`Initializing Simple  System`);

	/**
	 * Set an initiative formula for the system
	 * @type {String}
	 */
	CONFIG.Combat.initiative = {
		formula: '@characteristics.dex.value',
		decimals: 4
	};


	//TODO : remove debug hooks
	CONFIG.debug.hooks = true;
	// CONFIG.Combat.entityClass = CoC7Combat;
	CONFIG.Actor.entityClass = CoCActor;
	CONFIG.Item.entityClass = CoC7Item;
	Combat.prototype.rollInitiative = rollInitiative;

	
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

	// Set the initiative rule.
	game.settings.register( 'CoC7', 'initiativeRule',{
		name: 'SETTINGS.InitiativeRule',
		hint: 'SETTINGS.InitiativeRuleHint',
		scope: 'world',
		config: true,
		default: 'basic',
		type: String,
		choices: {
			'basic': 'SETTINGS.InitiativeRuleBasic',
			'optional': 'SETTINGS.InitiativeRuleOptional'
		},
		onChange: rule => _setInitiativeOptions(rule)
	});
	
	// Set displaying dices for init Roll.
	game.settings.register('CoC7', 'displayInitDices', {
		name: 'SETTINGS.displayInitDices',
		hint: 'SETTINGS.displayInitDicesHint',
		scope: 'world',
		config: true,
		default: true,
		type: Boolean
	});

	function _setInitiativeOptions(rule)
	{
		let decimals = 0;
		switch (rule)
		{
		case 'optional':

			decimals = 2;
			break;

		case 'basic':
			decimals = 0;
			break;
		}
		CONFIG.Combat.initiative = {
			formula: null,
			decimals: decimals
		};

	}

	// Register sheet application classes
	Actors.unregisterSheet('core', ActorSheet);
	Actors.registerSheet('CoC7', CoC7NPCSheet, { types: ['npc'] });
	Actors.registerSheet('CoC7', CoC7CreatureSheet, { types: ['creature'] });
	Actors.registerSheet('CoC7', CoC7CharacterSheet, { types: ['character'], makeDefault: true });
	Items.unregisterSheet('core', ItemSheet);
	Items.registerSheet('CoC7', CoC7WeaponSheet, { types: ['weapon'], makeDefault: true});
	Items.registerSheet('CoC7', CoC7BookSheet, { types: ['book'], makeDefault: true});
	Items.registerSheet('CoC7', CoC7SpellSheet, { types: ['spell'], makeDefault: true});
	Items.registerSheet('CoC7', CoCItemSheet, { makeDefault: true});
	preloadHandlebarsTemplates();
});

Hooks.on('renderCombatTracker', (app, html, data) => CoC7Combat.renderCombatTracker( app, html, data));

// {
// 	const currentCombat = data.combats[data.currentIndex - 1];
// 	html.find('.combatant').each((i, el) => {
// 		const combId = el.getAttribute('data-combatant-id');
// 		const combatant = currentCombat.data.combatants.find((c) => c._id == combId);
// 		const initdiv = el.getElementsByClassName('token-initiative');
// 		if (combatant.hasRolled) {
// 			initdiv[0].innerHTML = `<span class="initiative">${combatant.flags.swade.cardString}</span>`;
// 		}
// 		else if (!data.user.isGM) {
// 			initdiv[0].innerHTML = '';
// 		}
// 	});
// }

Hooks.once('setup', function() {

	// Localize CONFIG objects once up-front
	const toLocalize = [ 'spellProperties', 'bookType'];

	for ( let o of toLocalize ) {
		const localized = Object.entries(COC7[o]).map(e => {
			return [e[0], game.i18n.localize(e[1])];
		});
		COC7[o] = localized.reduce((obj, e) => {
			obj[e[0]] = e[1];
			return obj;
		}, {});
	}	

});

Hooks.on('renderChatLog', (app, html, data) => CoC7Chat.chatListeners(app, html, data));
Hooks.on('renderChatMessage', (app, html, data) => CoC7Chat.renderMessageHook(app, html, data));
Hooks.on('updateChatMessage', (chatMessage, chatData, diff, speaker) => CoC7Chat.onUpdateChatMessage( chatMessage, chatData, diff, speaker));
Hooks.on('ready', CoC7Chat.ready);

Hooks.on('preCreateActor', (createData) => CoCActor.initToken( createData));

// Called on closing a character sheet to lock it on getting it to display values
Hooks.on('closeActorSheet', (characterSheet) => characterSheet.onCloseSheet());


// Add button on Token selection bar
// Hooks.on('getSceneControlButtons', CoC7Chat.getSceneControlButtons);
// Hooks.on('preCreateChatMessage', (app, html, data) => CoC7Chat.preCreateChatMessageHook(app, html, data));
// Hooks.on('chatMessage', (chatLog, message, chatData) => { console.log('**************************************************************************************************chatMessage : '  + message);});

// Hooks.on('preCreateToken', ( scene, actor, options, id) => CoCActor.preCreateToken( scene, actor, options, id))
// Hooks.on('createToken', ( scene, actor, options, id) => CoCActor.preCreateToken( scene, actor, options, id))
// Hooks.on("renderChatLog", (app, html, data) => CoC7Item.chatListeners(html));
