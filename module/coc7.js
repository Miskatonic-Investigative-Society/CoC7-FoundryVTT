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
import { CoC7CharacterSheetV2 } from './actors/sheets/character.js';
import { preloadHandlebarsTemplates } from './templates.js';
import { CoC7Chat } from './chat.js';
import { CoC7Combat, rollInitiative } from './combat.js';
import { CoC7BookSheet } from './items/sheets/book.js';
import { CoC7SpellSheet } from './items/sheets/spell.js';
import { CoC7TalentSheet } from './items/sheets/talent.js';
import { CoC7OccupationSheet } from './items/sheets/occupation.js';
import { CoC7ArchetypeSheet } from './items/sheets/archetype.js';
import { CoC7SetupSheet } from './items/sheets/setup.js';
import { COC7 } from './config.js';
import { Updater } from './updater.js';
// import { CoC7ActorSheet } from './actors/sheets/base.js';
import {CoC7Utilities} from './utilities.js';
import {CoC7Parser} from './apps/parser.js';
import { CoC7StatusSheet } from './items/sheets/status.js';
import { CoC7Check } from './check.js';

Hooks.once('init', async function() {

	game.CoC7 = {
		macros:{
			skillCheck: CoC7Utilities.skillCheckMacro,
			weaponCheck: CoC7Utilities.weaponCheckMacro
		}
		// ,enricher: CoC7Utilities.enrichHTML
	};


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

	game.settings.register('CoC7', 'developmentEnabled', {
		name: 'Dev phased allowed',
		scope: 'world',
		config: false,
		type: Boolean,
		default: false
	});

	game.settings.register('CoC7', 'charCreationEnabled', {
		name: 'Char creation allowed',
		scope: 'world',
		config: false,
		type: Boolean,
		default: false
	});

	game.settings.register('CoC7', 'systemUpdateVersion', {
		name: 'System update version',
		scope: 'world',
		config: false,
		type: Number,
		default: 0
	});

	game.settings.register('CoC7', 'gridSpaces', {
		name: 'SETTINGS.RestrictGridSpaces',
		hint: 'SETTINGS.RestrictGridSpacesHint',
		scope: 'world',
		config: true,
		default: false,
		type: Boolean
	});	
	
	game.settings.register('CoC7', 'pulpRules', {
		name: 'SETTINGS.PulpRules',
		hint: 'SETTINGS.PulpRulesHint',
		scope: 'world',
		config: true,
		default: false,
		type: Boolean
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

	// Display result type.
	game.settings.register('CoC7', 'displayResultType', {
		name: 'SETTINGS.DisplayResultType',
		scope: 'client',
		config: true,
		default: false,
		type: Boolean
	});
	
	// Display check success level.
	game.settings.register('CoC7', 'displayCheckSuccessLevel', {
		name: 'SETTINGS.DisplayCheckSuccessLevel',
		scope: 'client',
		config: true,
		default: true,
		type: Boolean
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

	// Set displaying dices for init Roll.
	game.settings.register('CoC7', 'displayInitAsText', {
		name: 'SETTINGS.displayInitAsText',
		hint: 'SETTINGS.displayInitAsTextHint',
		scope: 'world',
		config: true,
		default: true,
		type: Boolean
	});

	// Allow player to modify status.
	game.settings.register('CoC7', 'statusPlayerEditable', {
		name: 'SETTINGS.StatusPlayerEditable',
		hint: 'SETTINGS.StatusPlayerEditableHint',
		scope: 'world',
		config: true,
		default: true,
		type: Boolean
	});

	// Allow player to unlock the sheet outside of creation mode.
	game.settings.register( 'CoC7', 'playerUnlockSheetMode',{
		name: 'SETTINGS.PlayerUnlockSheetMode',
		// hint: 'SETTINGS.PlayerCanUnlockSheetHint',
		scope: 'world',
		config: true,
		default: 'always',
		type: String,
		choices: {
			'always': 'SETTINGS.AlwaysEditable',
			'creation': 'SETTINGS.CreationModeOnly',
			'never': 'SETTINGS.NeverEditable'
		}
	});
		
	game.settings.register('CoC7', 'disregardAmmo', {
		name: 'SETTINGS.DisregardAmmo',
		hint: 'SETTINGS.DisregardAmmoHint',
		scope: 'world',
		config: true,
		default: false,
		type: Boolean
	});
		
	game.settings.register('CoC7', 'disregardUsePerRound', {
		name: 'SETTINGS.DisregardUsePerRound',
		hint: 'SETTINGS.DisregardUsePerRoundHint',
		scope: 'world',
		config: true,
		default: false,
		type: Boolean
	});

	if(game.modules.get('dice-so-nice')?.active){

		game.settings.register('CoC7', 'syncDice3d',{
			name: 'SETTINGS.SyncDice3D',
			hint: 'SETTINGS.SyncDice3DHint',
			scope: 'world',
			config: true,
			default: true,
			type: Boolean
		});
		
		const [version] = game.modules.get('dice-so-nice')?.data.version.split('.');

		if( !isNaN(Number(version)) && Number(version) >= 3){

			// game.settings.register( 'CoC7', 'overrideDsNStyle',{
			// 	name: 'SETTINGS.OverrideDsNStyle',
			// 	hint: 'SETTINGS.OverrideDsNStyleHint',
			// 	scope: 'client',
			// 	config: true,
			// 	default: true,
			// 	type: Boolean
			// });

			game.settings.register('CoC7', 'unitDieColorset',{
				name: 'SETTINGS.UnitDieColorset',
				hint: 'SETTINGS.UnitDieColorsetHint',
				scope: 'client',
				config: true,
				default: 'white',
				type: String
			});
			
			game.settings.register('CoC7', 'tenDieNoMod',{
				name: 'SETTINGS.TenDieNoMod',
				hint: 'SETTINGS.TenDieNoModHint',
				scope: 'client',
				config: true,
				default: 'foundry',
				type: String
			});
			
			game.settings.register('CoC7', 'tenDieBonus',{
				name: 'SETTINGS.TenDieBonus',
				hint: 'SETTINGS.TenDieBonusHint',
				scope: 'client',
				config: true,
				default: 'bronze',
				type: String
			});
			
			game.settings.register('CoC7', 'tenDiePenalty',{
				name: 'SETTINGS.TenDiePenalty',
				hint: 'SETTINGS.TenDiePenaltyHint',
				scope: 'client',
				config: true,
				default: 'bloodmoon',
				type: String
			});

		}
	}

	game.settings.register('CoC7', 'overrideSheetArtwork', {
		name: 'SETTINGS.OverrideSheetArtwork',
		hint: 'SETTINGS.OverrideSheetArtworkHint',
		scope: 'world',
		config: true,
		default: false,
		type: Boolean
	});

	if( game.settings.get('CoC7', 'overrideSheetArtwork')){
		game.settings.register('CoC7', 'artWorkSheetBackground',{
			name: 'SETTINGS.ArtWorkSheetBackground',
			hint: 'SETTINGS.ArtWorkSheetBackgroundHint',
			scope: 'world',
			config: true,
			default: 'url( \'./artwork/backgrounds/character-sheet.png\') 4 repeat',
			type: String
		});

		game.settings.register('CoC7', 'artworkSheetImage',{
			name: 'SETTINGS.ArtworkSheetImage',
			hint: 'SETTINGS.ArtworkSheetImageHint',
			scope: 'world',
			config: true,
			default: 'url(\'./artwork/tentacules.png\')',
			type: String
		});

		game.settings.register('CoC7', 'artworkFrontColor',{
			name: 'SETTINGS.ArtworkFrontColor',
			hint: 'SETTINGS.ArtworkFrontColorHint',
			scope: 'world',
			config: true,
			default: 'rgba(43,55,83,1)',
			type: String
		});

		game.settings.register('CoC7', 'artworkBackgroundColor',{
			name: 'SETTINGS.ArtworkBackgroundColor',
			hint: 'SETTINGS.ArtworkBackgroundColorHint',
			scope: 'world',
			config: true,
			default: 'rgba(103,11,11,1)',
			type: String
		});

		game.settings.register('CoC7', 'artworkInteractiveColor',{
			name: 'SETTINGS.ArtworkInteractiveColor',
			hint: 'SETTINGS.ArtworkInteractiveColorHint',
			scope: 'world',
			config: true,
			default: 'rgba(103,11,11,1)',
			type: String
		});
		
		game.settings.register('CoC7', 'artworkFixedSkillLength',{
			name: 'SETTINGS.ArtworkFixedSkillLength',
			hint: 'SETTINGS.ArtworkFixedSkillLengthHint',
			scope: 'world',
			config: true,
			default: true,
			type: Boolean
		});

		game.settings.register('CoC7', 'artworkMainFont',{
			name: 'SETTINGS.ArtworkMainFont',
			// hint: 'SETTINGS.ArtworkMainFontHint',
			scope: 'world',
			config: true,
			default: '',
			type: String
		});

		game.settings.register('CoC7', 'artworkMainFontBold',{
			name: 'SETTINGS.ArtworkMainFontBold',
			// hint: 'SETTINGS.ArtworkMainFontBoldHint',
			scope: 'world',
			config: true,
			default: '',
			type: String
		});

		game.settings.register('CoC7', 'artworkMainFontSize',{
			name: 'SETTINGS.ArtworkMainFontSize',
			// hint: 'SETTINGS.ArtworkMainFontSizeHint',
			scope: 'world',
			config: true,
			default: 16,
			type: Number
		});
	}

	_setInitiativeOptions(game.settings.get('CoC7', 'initiativeRule'));


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
	Actors.registerSheet('CoC7', CoC7NPCSheet, { types: ['npc'], makeDefault: true});
	Actors.registerSheet('CoC7', CoC7CreatureSheet, { types: ['creature'], makeDefault: true});
	Actors.registerSheet('CoC7', CoC7CharacterSheet, { types: ['character']});
	Actors.registerSheet('CoC7', CoC7CharacterSheetV2, { types: ['character'], makeDefault: true});
	
	Items.unregisterSheet('core', ItemSheet);
	Items.registerSheet('CoC7', CoC7WeaponSheet, { types: ['weapon'], makeDefault: true});
	Items.registerSheet('CoC7', CoC7BookSheet, { types: ['book'], makeDefault: true});
	Items.registerSheet('CoC7', CoC7SpellSheet, { types: ['spell'], makeDefault: true});
	Items.registerSheet('CoC7', CoC7TalentSheet, { types: ['talent'], makeDefault: true});
	Items.registerSheet('CoC7', CoC7StatusSheet, { types: ['status'], makeDefault: true});
	Items.registerSheet('CoC7', CoC7OccupationSheet, { types: ['occupation'], makeDefault: true});
	Items.registerSheet('CoC7', CoC7ArchetypeSheet, { types: ['archetype'], makeDefault: true});
	Items.registerSheet('CoC7', CoC7SetupSheet, { types: ['setup'], makeDefault: true});
	// Items.registerSheet('CoC7', CoC7ManeuverSheet, { types: ['maneuver'], makeDefault: true});
	Items.registerSheet('CoC7', CoCItemSheet, { makeDefault: true});
	preloadHandlebarsTemplates();
});

Hooks.on('renderCombatTracker', (app, html, data) => CoC7Combat.renderCombatTracker( app, html, data));

Hooks.once('setup', function() {

	// Localize CONFIG objects once up-front
	const toLocalize = [ 'spellProperties', 'bookType', 'talentType', 'occupationProperties', 'statusType'];

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

Hooks.on('hotbarDrop', async (bar, data, slot) => CoC7Utilities.createMacro( bar, data, slot));

Hooks.on('renderChatLog', (app, html, data) => CoC7Chat.chatListeners(app, html, data));
Hooks.on('renderChatMessage', (app, html, data) => CoC7Chat.renderMessageHook(app, html, data));
Hooks.on('updateChatMessage', (chatMessage, chatData, diff, speaker) => CoC7Chat.onUpdateChatMessage( chatMessage, chatData, diff, speaker));

Hooks.on('ready', async () =>{
	await Updater.checkForUpdate();

	activateGlobalListener();
	

	game.socket.on('system.CoC7', data => {
		if (data.type == 'updateChar')
			CoC7Utilities.updateCharSheets();
	});

	// "SETTINGS.BoutOfMadnessPhobiasIndex": "Phobias index",
	// "SETTINGS.BoutOfMadnessPhobiasIndexHint": "The index (roll result) that will trigger a roll in the phobias table",
	// "SETTINGS.BoutOfMadnessManiasIndex": "Manias index",
	// "SETTINGS.BoutOfMadnessManiasIndexHint": "The index (roll result) that will trigger a roll in the manias table",
	// "SETTINGS.SamplePhobiasTable": "Sample phobias table",
	// "SETTINGS.SampleManiasTable": "Sample Manias table",

	function _tableSettingsChanged( table, id){
		if( 'none' == id ) game.CoC7.tables[table]=null;
		else game.CoC7.tables[table]=game.tables.get(id);		
	}

	// function _tableIndexChanged( table, index){
	// 	game.CoC7.tables[table]=index;		
	// }
	
	const tableChoice = { 'none': 'SETTINGS.LetKeeperDecide'};
	game.tables.forEach(t => {
		tableChoice[t.data._id] = t.data.name;		
	});

	game.settings.register('CoC7', 'boutOfMadnessSummaryTable',{
		name: 'SETTINGS.BoutOfMadnessSummaryTable',
		scope: 'world',
		config: true,
		default: 'none',
		type: String,
		choices: tableChoice,
		onChange:  id => _tableSettingsChanged( 'boutOfMadness_Summary', id)
	});

	game.settings.register('CoC7', 'boutOfMadnessRealTimeTable',{
		name: 'SETTINGS.BoutOfMadnessRealTimeTable',
		scope: 'world',
		config: true,
		default: 'none',
		type: String,
		choices: tableChoice,
		onChange:  id => _tableSettingsChanged( 'boutOfMadness_RealTime', id)
	});

	// game.settings.register('CoC7', 'boutOfMadnessPhobiasIndex',{
	// 	name: 'SETTINGS.BoutOfMadnessPhobiasIndex',
	// 	hint: 'SETTINGS.BoutOfMadnessPhobiasIndexHint',
	// 	scope: 'world',
	// 	config: true,
	// 	default: 9,
	// 	type: Number,
	// 	onChange:  id => _tableIndexChanged( 'phobiasIndex', id)	
	// });

	// game.settings.register('CoC7', 'boutOfMadnessManiasIndex',{
	// 	name: 'SETTINGS.BoutOfMadnessManiasIndex',
	// 	hint: 'SETTINGS.BoutOfMadnessManiasIndexHint',
	// 	scope: 'world',
	// 	config: true,
	// 	default: 10,
	// 	type: Number,
	// 	onChange:  id => _tableIndexChanged( 'maniasIndex', id)	
	// });

	// game.settings.register('CoC7', 'samplePhobiasTable',{
	// 	name: 'SETTINGS.SamplePhobiasTable',
	// 	scope: 'world',
	// 	config: true,
	// 	default: 'none',
	// 	type: String,
	// 	choices: tableChoice,
	// 	onChange:  id => _tableSettingsChanged( 'phobias', id)
	// });

	// game.settings.register('CoC7', 'sampleManiasTable',{
	// 	name: 'SETTINGS.SampleManiasTable',
	// 	scope: 'world',
	// 	config: true,
	// 	default: 'none',
	// 	type: String,
	// 	choices: tableChoice,
	// 	onChange:  id => _tableSettingsChanged( 'manias', id)
	// });

	game.CoC7.tables = {
		boutOfMadness_Summary: ('none' == game.settings.get('CoC7', 'boutOfMadnessSummaryTable'))?null:game.tables.get(game.settings.get('CoC7', 'boutOfMadnessSummaryTable')),
		boutOfMadness_RealTime: ('none' == game.settings.get('CoC7', 'boutOfMadnessRealTimeTable'))?null:game.tables.get(game.settings.get('CoC7', 'boutOfMadnessRealTimeTable')),
		// maniasIndex: ge.settings.get('CoC7', 'boutOfMadnessPhobiasIndex'),
		// phobiasIndex: game.settings.get('CoC7', 'boutOfMadnessManiasIndex'),
		// phobias: ('none' == game.settings.get('CoC7', 'samplePhobiasTable'))?null:game.tables.get(game.settings.get('CoC7', 'samplePhobiasTable')),
		// manias: ('none' == game.settings.get('CoC7', 'sampleManiasTable'))?null:game.tables.get(game.settings.get('CoC7', 'sampleManiasTable')),
	};
});

// Hooks.on('preCreateActor', (createData) => CoCActor.initToken( createData));

// Called on closing a character sheet to lock it on getting it to display values
Hooks.on('closeActorSheet', (characterSheet) => characterSheet.onCloseSheet());
Hooks.on('renderCoC7CreatureSheet', (app, html, data) => CoC7CreatureSheet.forceAuto(app, html, data));
Hooks.on('renderCoC7NPCSheet', (app, html, data) => CoC7NPCSheet.forceAuto(app, html, data));
// Hooks.on('updateActor', (actor, dataUpdate) => CoCActor.updateActor( actor, dataUpdate));
// Hooks.on('updateToken', (scene, token, dataUpdate) => CoCActor.updateToken( scene, token, dataUpdate));

// Hooks.on('chatMessage', (chatLog, message, chatData) => { console.log('chatMessage : '  + message);});
// Hooks.on('preCreateToken', ( scene, actor, options, id) => CoCActor.preCreateToken( scene, actor, options, id))
// Hooks.on('createToken', ( scene, actor, options, id) => CoCActor.preCreateToken( scene, actor, options, id))
// Hooks.on("renderChatLog", (app, html, data) => CoC7Item.chatListeners(html));

Hooks.on('getSceneControlButtons', (buttons) => {
	if( game.user.isGM){
		let group = buttons.find(b => b.name == 'token');
		group.tools.push({
			toggle: true,
			icon : 'fas fa-angle-double-up',
			name: 'devphase',
			active: game.settings.get('CoC7', 'developmentEnabled'),
			title: game.settings.get('CoC7', 'developmentEnabled')? game.i18n.localize( 'CoC7.DevPhaseEnabled'): game.i18n.localize( 'CoC7.DevPhaseDisabled'),
			onClick :async () => await CoC7Utilities.toggleDevPhase()
		});
		group.tools.push({
			toggle: true,
			icon : 'fas fas fa-user-edit',
			name: 'charcreate',
			active: game.settings.get('CoC7', 'charCreationEnabled'), 
			title: game.settings.get('CoC7', 'charCreationEnabled')? game.i18n.localize( 'CoC7.CharCreationEnabled'): game.i18n.localize( 'CoC7.CharCreationDisabled'),
			onClick :async () => await CoC7Utilities.toggleCharCreation()
		});
	}


	// buttons.push({
	// 	activeTool: 'diceroll',
	// 	icon: 'game-icon game-icon-d10',
	// 	layer: 'TokenLayer',
	// 	name: 'token',
	// 	title: 'CONTROLS.GroupBasic',
	// 	tools:[
	// 		{
	// 			toggle: false,
	// 			icon: 'game-icon game-icon-d10',
	// 			name:'diceroll',
	// 			title: 'roll some dice',
	// 			onClick: async() => await CoC7Utilities.test()
	// 		}
	// 	],
	// 	visible: true
	// });
});

// Hooks.on('renderSceneControls', () => CoC7Utilities.updateCharSheets());
// Hooks.on('renderSceneNavigation', () => CoC7Utilities.updateCharSheets());
Hooks.on('renderItemSheet', CoC7Parser.ParseSheetContent);
Hooks.on('renderJournalSheet', CoC7Parser.ParseSheetContent);
Hooks.on('renderActorSheet', CoC7Parser.ParseSheetContent);
// Chat command processing
Hooks.on('preCreateChatMessage', CoC7Parser.ParseMessage);
// Sheet V2 css options
Hooks.on('renderCoC7CharacterSheetV2', CoC7CharacterSheetV2.renderSheet);
// Hooks.on('dropCanvasData', CoC7Parser.onDropSomething);

tinyMCE.PluginManager.add('CoC7_Editor_OnDrop', function (editor) {
	editor.on('drop', (event) => CoC7Parser.onEditorDrop(event, editor));
});

CONFIG.TinyMCE.plugins = `CoC7_Editor_OnDrop ${CONFIG.TinyMCE.plugins}`;

function activateGlobalListener(){
	const body=$('body');
	body.on('click', 'a.coc7-inline-check', CoC7Check._onClickInlineRoll);
	document.addEventListener('mousedown', _onLeftClick);
}

function _onLeftClick( event){
	return event.shiftKey;
}