/**
 * Allow for parsing of CoC7 elements in chat message and sheets.
 * Format is :
 * @coc7.TYPE_OF_REQUEST[OPTIONS]{DISPLAYED_NAME}
 * TYPE_OF_REQUEST :
 * - sanloss : trigger a san check, upon failure will propose to deduct the corresponding SAN.
 * - check : trigger a check depending on the options.
 * 
 * OPTIONS: [] = optional
 * sanloss:
 *   sanMax: max SAN loss
 *   sanMin: min SAN loss
 * check:
 *   type: type of check (characteristic, skill, attrib).
 *   name: name of the skill/characteristic.
 *   [difficulty]: ? (blind), 0 (regular), + (hard), ++ (extreme), +++ (critical).
 *   [modifier]: -x (x penalty dice), +x (x bonus dice), 0 (no modifier).
 *   [icon]: icon tu use (font awsome).
 *   [blind]: will trigger a blind roll.
 * 
 * [DISPLAYED_NAME: name to display.]
 * 
 */

import { SanCheckCard } from '../chat/cards/san-check.js';
import { chatHelper } from '../chat/helper.js';
// import { CoC7SanCheck } from '../chat/sancheck.js';
import { CoC7Check } from '../check.js';
import { CoC7Utilities } from '../utilities.js';
import { RollDialog } from './roll-dialog.js';

export class CoC7Parser{

	// static async onDropSomething( canvas, item){
	// 	let grid_size = canvas.scene.data.grid;
	// 	const number_marked = canvas.tokens.targetObjects({
	// 		x: item.x-grid_size/2,
	// 		y: item.y-grid_size/2,
	// 		height: grid_size,
	// 		width: grid_size
	// 	});
	// 	if (number_marked) {
	// 		// Change item type to avoid that Foundry processes it
	// 		item.type = 'Custom';
	// 		if (item.hasOwnProperty('id')) {
	// 			game.macros.get(item.id).execute();
	// 		} else {
	// 			eval(item.data.command);
	// 		}
	// 	}
	// }

	static async onEditorDrop( event, editor){
		event.preventDefault();

		//check key pressed (CTRL ?)
		// if CTRL check if item is skill/weapon
		// if item from game or pack add ref to the link !
		// const dataString = event.dataTransfer.getData('text/plain');
		const dataString = event.dataTransfer.getData('text/plain');
		const data = JSON.parse( dataString);
		if( 'coc7-link' == data.linkType){
			event.stopPropagation();
			if( !event.shiftKey && (undefined == data.difficulty || undefined == data.modifier)) {
				const usage = await RollDialog.create();
				if( usage) {
					data.modifier = usage.get('bonusDice');
					data.difficulty = usage.get('difficulty');
				}
			}
			if( 'blindroll' === game.settings.get('core', 'rollMode')) data.blind = true;

			const link = CoC7Parser.createCoC7Link( data);

			if( link) {
				editor.insertContent(link);
			}
		} else if(event.metaKey || event.ctrlKey || event.keyCode == 91 || event.keyCode == 224) {
			event.stopPropagation();

			if(  data.type !== 'Item' ) return;
			
			let item;
			const linkData = {};

			if (data.pack) {
				const pack = game.packs.get(data.pack);
				if (pack.metadata.entity !== 'Item') return;
				item = await pack.getEntity(data.id);
			} else if (data.data) {
				item = data.data;
			} else {
				item = game.items.get(data.id);
			}

			if( !item) return;

			linkData.name = item.name;
			if( data.pack) linkData.pack = data.pack;
			if( data.id) linkData.id = data.id;
			
			if( 'skill' == item.type){
				if( !event.shiftKey) {
					const usage = await RollDialog.create();
					if( usage) {
						linkData.modifier = usage.get('bonusDice');
						linkData.difficulty = usage.get('difficulty');
					}
				}
				linkData.check = 'check';
				linkData.type = 'skill';
				if( 'blindroll' === game.settings.get('core', 'rollMode')) linkData.blind = true;
			} else if( 'weapon' == item.type){
				linkData.check = 'item';
				linkData.type = 'weapon';
			} else return;

			const link = CoC7Parser.createCoC7Link( linkData);
			if( link) {
				editor.insertContent(link);
			}
		}
	}

	static ParseMessage(data/*, option, user*/){
		//@coc7.sanloss[sanMax:1D6,sanMin:1,difficulty:++,modifier:-1]{Hard San Loss (-1) 1/1D6}
		//@coc7.check[type:charac,name:STR,difficulty:+,modifier:-1]{Hard STR check(-1)}
		//@coc7.check[type:attrib,name:lck,difficulty:+,modifier:-1]{Hard luck check(-1)}
		//@coc7.check[type:skill,name:anthropology,difficulty:+,modifier:-1]{Hard Anthropology check(-1)}
		//@coc7.check[type:skill,icon:fas fa-arrow-alt-circle-right,name:anthropology,difficulty:+,modifier:-1]{Hard Anthropology check(-1)}
		//@coc7.item[name:Shotgun,icon:fas fa-bullseye,difficulty:+,modifier:-1]{Use shotgun}
		//[TBI]@coc7.damage[formula:1D6]{Damage 1D6}
		//[TBI]@coc7.roll[threshold:50]{Simple roll}

		if( data.content.toLocaleLowerCase().includes('@coc7')){
			data.content = CoC7Parser.enrichHTML(data.content);
		}
		return true; //allow message to be published !
	}

	static createCoC7Link( data){
		if( !data.check) return;
		switch (data.check.toLowerCase()) {
		case 'check':{
			// @coc7.check[type:charac,name:STR,difficulty:+,modifier:-1]{Hard STR check(-1)}
			if( !data.type || !data.name) return;
			let options = `${data.blind?'blind,':''}type:${data.type},name:${data.name}`;
			if( undefined != data.difficulty) options += `,difficulty:${data.difficulty}`;
			if( undefined != data.modifier) options += `,modifier:${data.modifier}`;
			if( data.icon) options += `,icon:${data.icon}`;
			if( data.pack) options += `,pack:${data.pack}`;
			if( data.id) options += `,id:${data.id}`;
			let link = `@coc7.check[${options}]`;
			if( data.displayName) link += `{${data.displayName}}`;
			return link;
		}
			
		case 'sanloss':{
			//@coc7.sanloss[sanMax:1D6,sanMin:1,difficulty:++,modifier:-1]{Hard San Loss (-1) 1/1D6}
			if( !data.sanMax || !data.sanMin) return;
			let options = `${data.blind?'blind,':''}sanMax:${data.sanMax},sanMin:${data.sanMin}`;
			if( data.difficulty) options += `,difficulty:${data.difficulty}`;
			if( data.modifier) options += `,modifier:${data.modifier}`;
			if( data.icon) options += `,icon:${data.icon}`;
			let link = `@coc7.sanloss[${options}]`;
			if( data.displayName) link += `{${data.displayName}}`;
			return link;
		}
				
		//Do we need that ???
		case 'item':{
			// @coc7.item[type:optional,name:Shotgun,difficulty:+,modifier:-1]{Hard Shitgun check(-1)}
			if( !data.type || !data.name) return;
			let options = `${data.blind?'blind,':''}type:${data.type},name:${data.name}`;
			// if( data.difficulty) options += `,difficulty:${data.difficulty}`;
			// if( data.modifier) options += `,modifier:${data.modifier}`;
			if( data.icon) options += `,icon:${data.icon}`;
			if( data.pack) options += `,pack:${data.pack}`;
			if( data.id) options += `,id:${data.id}`;
			let link = `@coc7.item[${options}]`;
			if( data.displayName) link += `{${data.displayName}}`;
			return link;
		}

		default:
			break;
		}
	}

	static ParseSheetContent(app, html){
		//Check in all editors content for a link.
		for (const element of html.find('div.editor-content > *, p')) {
			if( element.outerHTML.toLocaleLowerCase().includes('@coc7'))
				element.outerHTML = CoC7Parser.enrichHTML( element.outerHTML);
		}

		//Bind the click to execute the check.
		// html.on('click', 'a.coc7-link', CoC7Parser._onCheck.bind(this));
		html.find('a.coc7-link').on( 'click', (event)=> CoC7Parser._onCheck(event));
		html.find('a.coc7-link').on( 'dragstart', (event)=> CoC7Parser._onDragCoC7Link(event));
		return;
	}

	static _getTextNodes(parent) {
		const text = [];
		const walk = document.createTreeWalker(parent, NodeFilter.SHOW_TEXT, null, false);
		while( walk.nextNode() ) text.push(walk.currentNode);
		return text;
	}

	static enrichHTML(content){
		const html = document.createElement('div');
		html.innerHTML = String(content);

		let text = [];

		text = TextEditor._getTextNodes(html);
		// Alternative regex : '@(coc7).([^\[]+)\[([^\]]+)\](?:{([^}]+)})?'
		const rgx = new RegExp('@(coc7).(.*?)\\[([^\\]]+)\\](?:{([^}]+)})?', 'gi');
		TextEditor._replaceTextContent( text, rgx, CoC7Parser._createLink);
		return html.innerHTML;
	}

	static bindEventsHandler( html){
		html.find('a.coc7-link').on( 'click', (event)=> CoC7Parser._onCheck(event));
		html.find('a.coc7-link').on( 'dragstart', (event)=> CoC7Parser._onDragCoC7Link(event));
	}

	static _onDragCoC7Link(event) {
		const a = event.currentTarget;
		const i = a.querySelector('i.link-icon');
		const data = duplicate( a.dataset);
		data.linkType = 'coc7-link';
		data.icon = null;
		
		if( i.dataset && i.dataset.linkIcon && 'fas fa-dice' != i.dataset.linkIcon){
			data.icon = i.dataset.linkIcon;
		}
		data.displayName = a.dataset.displayName?a.innerText:null;
		event.originalEvent.dataTransfer.setData('text/plain', JSON.stringify(data));
	}

	static _createLink(match, tag, type, options, name){
		const data = {
			cls: ['coc7-link'],
			dataset: { check: type},
			icon: 'fas fa-dice',
			blind: false,
			name: name
		};

		const regx = new RegExp('[^,]+', 'gi');
		const matches = options.matchAll( regx);
		for ( let match of Array.from(matches) ) {
			let [key, value] = match[0].split(':');
			if( 'icon' == key) data.icon = value;
			if( 'blind' == key && undefined == value) {
				value = true;
				data.blind = true && ['check'].includes( type.toLowerCase());
			}
			data.dataset[key] = value;
		}

		let title;
		const difficulty = CoC7Check.difficultyString(data.dataset.difficulty);

		switch (type.toLowerCase()) {
		case 'check':{
			let humanName = data.dataset.name;
			if( ['attributes', 'attribute', 'attrib', 'attribs'].includes( data.dataset.type?.toLowerCase())){
				if( 'lck'== data.dataset.name) humanName = game.i18n.localize( 'CoC7.Luck');
				if( 'san'== data.dataset.name) humanName = game.i18n.localize( 'CoC7.Sanity');
			}
			if( ['charac', 'char', 'characteristic', 'characteristics'].includes( data.dataset.type?.toLowerCase())){
				humanName= CoC7Utilities.getCharacteristicNames( data.dataset.name)?.label;
			}
			title = game.i18n.format(`CoC7.LinkCheck${!data.dataset.difficulty?'':'Diff'}${!data.dataset.modifier?'':'Modif'}`, {difficulty: difficulty, modifier: data.dataset.modifier, name: humanName});
			break;
		}
		case 'sanloss':
			title = game.i18n.format(`CoC7.LinkSanLoss${!data.dataset.difficulty?'':'Diff'}${!data.dataset.modifier?'':'Modif'}`, {difficulty: difficulty, modifier: data.dataset.modifier, sanMin: data.dataset.sanMin, sanMax: data.dataset.sanMax});
			break;
		case 'item':
			title = game.i18n.format(`CoC7.LinkItem${!data.dataset.difficulty?'':'Diff'}${!data.dataset.modifier?'':'Modif'}`, {difficulty: difficulty, modifier: data.dataset.modifier, name: data.dataset.name});
			break;
		default:
			break;
		}

		if( !name){
			data.name = title;
		} else data.dataset.displayName = true;

		const a = document.createElement('a');
		a.title = title;
		a.classList.add(...data.cls);
		for (let [k, v] of Object.entries(data.dataset)) {
			a.dataset[k] = v;
		}
		a.draggable = true;
		a.innerHTML = `${data.blind?'<i class="fas fa-eye-slash"></i>':''}<i data-link-icon="${data.icon}" class="link-icon ${data.icon}"></i>${data.name}`;

		return a;
	}

	/**
	 * Trigger a check when a link is clicqued.
	 * Depending the origin
	 * @param {*} event 
	 * 
	*/
	static _onCheck( event){
		const options = event.currentTarget.dataset;
		if( options.difficulty) options.difficulty = CoC7Utilities.convertDifficulty(options.difficulty);

		//Click origin (from message or from sheet)
		const fromSheet = event.currentTarget.closest('.chat-message')?false:true;

		if( game.user.isGM){
			//If GM and from sheet and CTRL clicked publish a message asking for the click.
			if( fromSheet && (event.metaKey || event.ctrlKey || event.keyCode == 91 || event.keyCode == 224)){
				chatHelper.createMessage(game.i18n.localize('CoC7.MessageWaitForKeeperToClick'), event.currentTarget.outerHTML);
			} else if( canvas.tokens.controlled.length){
				canvas.tokens.controlled.forEach( token =>{
					switch (options.check) {
					case 'check':
						if( ['charac', 'char', 'characteristic', 'characteristics'].includes( options.type.toLowerCase())) return token.actor.characteristicCheck( options.name, event.shiftKey, options);
						if( ['skill'].includes( options.type.toLowerCase())) return token.actor.skillCheck( options, event.shiftKey, options);
						if( ['attributes', 'attribute', 'attrib', 'attribs'].includes( options.type.toLowerCase())) return token.actor.attributeCheck( options.name, event.shiftKey, options);
						break;

					case 'sanloss':{
						SanCheckCard.create(token.actor.id,options,{fastForward:event.shiftKey});
						// const check = new CoC7SanCheck( 
						// 	token.actor.id,
						// 	options.sanMin,
						// 	options.sanMax,
						// 	undefined != options.difficulty?CoC7Utilities.convertDifficulty(options.difficulty):CoC7Check.difficultyLevel.regular,
						// 	undefined != options.modifier?Number(options.modifier):0);
						// check.toMessage( event.shiftKey);
						break;
					}

					case 'item':{
						return token.actor.weaponCheck( options, event.shiftKey);
					}
					
					default:
						return;
					}
				});
			} else {
				//Don't have any token selected and the link is from a sheet, publish the message
				if( fromSheet) chatHelper.createMessage(game.i18n.localize('CoC7.MessageWaitForKeeperToClick'), event.currentTarget.outerHTML);
				else ui.notifications.warn(game.i18n.localize('CoC7.WarnNoControlledActor'));
			}
		} else {
			const speaker = ChatMessage.getSpeaker();
			const actor = ChatMessage.getSpeakerActor( speaker);
			if( actor){
				switch (options.check) {
				case 'check':
					if( ['charac', 'char', 'characteristic', 'characteristics'].includes( options.type.toLowerCase())) return actor.characteristicCheck( options.name, event.shiftKey, options);
					if( ['skill'].includes( options.type.toLowerCase())) return actor.skillCheck( options, event.shiftKey, options);
					if( ['attributes', 'attribute', 'attrib', 'attribs'].includes( options.type.toLowerCase())) return actor.attributeCheck( options.name, event.shiftKey, options);
					break;

				case 'sanloss':{
					SanCheckCard.create(actor.id,options,{fastForward:event.shiftKey});
					// const check = new CoC7SanCheck( 
					// 	actor.id,
					// 	options.sanMin,
					// 	options.sanMax,
					// 	undefined != options.difficulty?CoC7Utilities.convertDifficulty(options.difficulty):CoC7Check.difficultyLevel.regular,
					// 	undefined != options.modifier?Number(options.modifier):0);
					// check.toMessage( event.shiftKey);
					break;
				}

				case 'item':{
					return actor.weaponCheck( options, event.shiftKey);
				}	
				default:
					return;
				}
			}
			else ui.notifications.warning(game.i18n.localize('CoC7.WarnNoControlledActor'));
		}
		return;
	}
}