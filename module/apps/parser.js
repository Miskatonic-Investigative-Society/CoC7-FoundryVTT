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

import { chatHelper } from '../chat/helper.js';
import { CoC7SanCheck } from '../chat/sancheck.js';
import { CoC7Check } from '../check.js';
import { CoC7Utilities } from '../utilities.js';

export class CoC7Parser{

	static async onEditorDrop( event, editor){
		// event.preventDefault();
		//check key pressed (CTRL ?)
		// if CTRL check if item is skill/weapon
		// if item from game or pack add ref to the link !
		// const dataString = event.dataTransfer.getData('text/plain');
		const dataString = event.dataTransfer.getData('text/plain');
		const data = JSON.parse( dataString);
		if( 'coc7-link' == data.linkType){
			const link = CoC7Parser.createCoC7Link( data);
			if( link) {
				editor.insertContent(link);
				event.stopPropagation();}
		} else if( event.ctrlKey) {
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
				linkData.check = 'check';
				linkData.type = 'skill';
			} else if( 'weapon' == item.type){
				linkData.check = 'item';
				linkData.type = 'weapon';
			} else return;

			const link = CoC7Parser.createCoC7Link( linkData);
			if( link) {
				editor.insertContent(link);
				event.stopPropagation();}
		}
	}

	static ParseMessage(data/*, option, user*/){
		//@coc7.sanloss[sanMax:1D6,sanMin:1,difficulty:++,modifier:-1]{Hard San Loss (-1) 1/1D6}
		//@coc7.check[type:charac,name:STR,difficulty:+,modifier:-1]{Hard STR check(-1)}
		//@coc7.check[type:attrib,name:lck,difficulty:+,modifier:-1]{Hard luck check(-1)}
		//@coc7.check[type:skill,name:anthropology,difficulty:+,modifier:-1]{Hard Anthropology check(-1)}
		//@coc7.check[type:skill,icon:fas fa-arrow-alt-circle-right,name:anthropology,difficulty:+,modifier:-1]{Hard Anthropology check(-1)}
		//@coc7.item[name:Shotgun,icon:fas fa-arrow-alt-circle-right,difficulty:+,modifier:-1]{Use shotgun}
		//@coc7.damage[formula:1D6]{Damage 1D6}
		//@coc7.roll[threshold:50]{Simple roll}
		data.content = CoC7Parser.EnrichHTML(data.content);
		return true;	
	}

	static createCoC7Link( data){
		if( !data.check) return;
		switch (data.check.toLowerCase()) {
		case 'check':{
			// @coc7.check[type:charac,name:STR,difficulty:+,modifier:-1]{Hard STR check(-1)}
			if( !data.type || !data.name) return;
			let options = `type:${data.type},name:${data.name},difficulty:${data.difficulty?data.difficulty:0},modifier:${data.modifier?data.modifier:0}`;
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
			let options = `sanMax:${data.sanMax},sanMin:${data.sanMin},difficulty:${data.difficulty?data.difficulty:0},modifier:${data.modifier?data.modifier:0}`;
			if( data.icon) options += `,icon:${data.icon}`;
			let link = `@coc7.sanloss[${options}]`;
			if( data.displayName) link += `{${data.displayName}}`;
			return link;
		}
				
		//Do we need that ???
		case 'item':{
			// @coc7.item[type:optional,name:Shotgun,difficulty:+,modifier:-1]{Hard Shitgun check(-1)}
			if( !data.type || !data.name) return;
			let options = `type:${data.type},name:${data.name},difficulty:${data.difficulty?data.difficulty:0},modifier:${data.modifier?data.modifier:0}`;
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
			element.innerHTML = CoC7Parser.EnrichHTML( element.innerHTML);
		}

		//Bind the click to execute the check.
		// html.on('click', 'a.coc7-link', CoC7Parser._onCheck.bind(this));
		html.find('a.coc7-link').on( 'click', (event)=> CoC7Parser._onCheck(event));
		html.find('a.coc7-link').on( 'dragstart', (event)=> CoC7Parser._onDragCoC7Link(event));
		return;
	}

	static EnrichHTML(content){
		const html = document.createElement('div');
		html.innerHTML = String(content);

		const text = TextEditor._getTextNodes(html);
		// Alternative regex : '@(coc7).([^\[]+)\[([^\]]+)\](?:{([^}]+)})?'
		const rgx = new RegExp('@(coc7).(.*?)\\[([^\\]]+)\\](?:{([^}]+)})?', 'gi');
		TextEditor._replaceTextContent( text, rgx, CoC7Parser._createLink);
		return html.innerHTML;
	}

	static _onDragCoC7Link(event) {
		event.stopPropagation();
		const a = event.currentTarget;
		const i = a.querySelector('i');
		const data = duplicate( a.dataset);
		data.linkType = 'coc7-link';
		data.icon = null;
		if( i){
			if( i.classList.length) data.icon = i.classList.value;
			if( data.icon == 'fas fa-dice') data.icon = null;
		}
		data.displayName = a.innerText;
		event.originalEvent.dataTransfer.setData('text/plain', JSON.stringify(data));
	}

	static _createLink(match, tag, type, options, name){
		const data = {
			cls: ['coc7-link'],
			dataset: { check: type, difficulty:CoC7Check.difficultyLevel.regular, modifier:0},
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
				data.blind = true && 'check' == type.toLowerCase();
			}
			data.dataset[key] = value;
		}

		let title;
		const difficulty = CoC7Check.difficultyString(data.dataset.difficulty);

		switch (type.toLowerCase()) {
		case 'check':
			title = game.i18n.format(`CoC7.LinkCheck${0==data.dataset.difficulty?'':'Diff'}${0==data.dataset.modifier?'':'Modif'}`, {difficulty: difficulty, modifier: data.dataset.modifier, type: data.dataset.type, name: data.dataset.name});
			break;
		case 'sanloss':
			title = game.i18n.format(`CoC7.LinkSanLoss${0==data.dataset.difficulty?'':'Diff'}${0==data.dataset.modifier?'':'Modif'}`, {difficulty: difficulty, modifier: data.dataset.modifier, sanMin: data.dataset.sanMin, sanMax: data.dataset.sanMax});
			break;
		case 'item':
			title = game.i18n.format(`CoC7.LinkItem${0==data.dataset.difficulty?'':'Diff'}${0==data.dataset.modifier?'':'Modif'}`, {difficulty: difficulty, modifier: data.dataset.modifier, type: data.dataset.type, name: data.dataset.name});
			break;
		default:
			break;
		}

		if( !name){
			data.name = title;
		}

		const a = document.createElement('a');
		a.title = title;
		a.classList.add(...data.cls);
		for (let [k, v] of Object.entries(data.dataset)) {
			a.dataset[k] = v;
		}
		a.draggable = true;
		a.innerHTML = `${data.blind?'<i class="fas fa-eye-slash"></i>':''}<i class="${data.icon}"></i>${data.name}`;

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
		if( options.difficulty){
			options.difficulty = CoC7Utilities.convertDifficulty(options.difficulty);
		} else {
			options.difficulty = CoC7Check.difficultyLevel.regular;
		}
		if( !options.modifier) options.modifier = 0;

		//Click origin (from message or from sheet)
		const fromSheet = event.currentTarget.closest('.chat-message')?false:true;

		if( game.user.isGM){
			//If GM and from sheet and CTRL clicked publish a message asking for the click.
			if( fromSheet && event.ctrlKey){
				chatHelper.createMessage(game.i18n.localize('CoC7.MessageWaitForKeeperToClick'), event.currentTarget.outerHTML);
			} else if( canvas.tokens.controlled.length){
				canvas.tokens.controlled.forEach( token =>{
					switch (options.check) {
					case 'check':
						if( ['charac', 'char', 'characteristic', 'characteristics'].includes( options.type.toLowerCase())) return token.actor.characteristicCheck( options.name, event.shiftKey, options);
						if( ['skill'].includes( options.type.toLowerCase())) return token.actor.skillCheck( options, event.shiftKey, options);
						if( ['attribute', 'attrib', 'attribs'].includes( options.type.toLowerCase())) return token.actor.attributeCheck( options.name, event.shiftKey, options);
						break;

					case 'sanloss':{
						const check = new CoC7SanCheck( token.actor.id, options.sanMin, options.sanMax, Number(options.difficulty), Number(options.modifier));
						check.toMessage( event.shiftKey);
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
					if( ['attribute', 'attrib', 'attribs'].includes( options.type.toLowerCase())) return actor.attributeCheck( options.name, event.shiftKey, options);
					break;

				case 'sanloss':{
					const check = new CoC7SanCheck( actor.id, options.sanMin, options.sanMax, Number(options.difficulty), Number(options.modifier));
					check.toMessage( event.shiftKey);
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