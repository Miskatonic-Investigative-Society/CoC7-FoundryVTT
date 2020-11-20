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
 *   [icon]: icon tu use (font awsome)
 *   
 * 
 * DISPLAYED_NAME: name to display.
 * 
 */

import { chatHelper } from '../chat/helper.js';
import { CoC7SanCheck } from '../chat/sancheck.js';
import { CoC7Check } from '../check.js';

export class CoC7Parser{

	static ParseMessage(data/*, option, user*/){
		//@coc7.sanloss[sanMax:1D6,sanMin:1,difficulty:++,modifier:-1]{Hard San Loss (-1) 1/1D6}
		//@coc7.check[type:charac,name:STR,difficulty:+,modifier:-1]{Hard STR check(-1)}
		//@coc7.check[type:attrib,name:lck,difficulty:+,modifier:-1]{Hard luck check(-1)}
		//@coc7.check[type:skill,name:anthropology,difficulty:+,modifier:-1]{Hard Anthropology check(-1)}
		//@coc7.check[type:skill,icon:fas fa-arrow-alt-circle-right,name:anthropology,difficulty:+,modifier:-1]{Hard Anthropology check(-1)}
		//@coc7.damage[formula:1D6]{Damage 1D6}
		//@coc7.roll[threshold:50]{Simple roll}
		data.content = CoC7Parser.EnrichHTML(data.content);
		return true;	
	}

	static ParseSheetContent(app, html){
		//Check in all editors content for a link.
		for (const element of html.find('div.editor-content > *, p')) {
			element.innerHTML = CoC7Parser.EnrichHTML( element.innerHTML);
		}

		//Bind the click to execute the check.
		html.on('click', '.coc7-link', CoC7Parser._onCheck.bind(this));

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

	static _createLink(match, tag, type, options, name){
		const data = {
			cls: ['coc7-link'],
			dataset: { check: type, difficulty:CoC7Check.difficultyLevel.regular, modifier:0},
			icon: 'fas fa-dice',
			name: name
		};

		const regx = new RegExp('[^,]+', 'gi');
		const matches = options.matchAll( regx);
		for ( let match of Array.from(matches) ) {
			const [key, value] = match[0].split(':');
			if( 'icon' == key) data.icon = value;
			else data.dataset[key] = value;
		}

		let title;
		const difficulty = CoC7Check.difficultyString(data.dataset.difficulty);

		switch (type.toLowerCase()) {
		case 'check':
			title = game.i18n.format('CoC7.LinkCheck', {difficulty: difficulty, modifier: data.dataset.modifier, type: data.dataset.type, name: data.dataset.name});
			break;
		case 'sanloss':
			title = game.i18n.format('CoC7.LinkSanLoss', {difficulty: difficulty, modifier: data.dataset.modifier, sanMin: data.dataset.sanMin, sanMax: data.dataset.sanMax});
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
		a.innerHTML = `<i class="${data.icon}"></i> ${data.name}`;

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
			switch (options.difficulty) {
			case '?':
				options.difficulty = CoC7Check.difficultyLevel.unknown;
				break;
			case '+':
				options.difficulty = CoC7Check.difficultyLevel.hard;
				break;
			case '++':
				options.difficulty = CoC7Check.difficultyLevel.extreme;
				break;
			case '+++':
				options.difficulty = CoC7Check.difficultyLevel.critical;
				break;
			default:
				options.difficulty = CoC7Check.difficultyLevel.regular;
				break;
			}
		} else {
			options.difficulty = CoC7Check.difficultyLevel.regular;
		}
		if( !options.modifer) options.modifer = 0;

		//Click origin (from message or from sheet)
		const fromSheet = event.currentTarget.closest('.chat-message')?false:true;

		if( game.user.isGM){
			//If GM and from sheet and CTRL clicked publish a message asking for the click.
			if( fromSheet && event.ctrlKey){
				chatHelper.createMessage('Your keeper is requesting a check.<br>Wait for him to ask you before clicking it!<br>', event.currentTarget.outerHTML);
			} else if( canvas.tokens.controlled.length){
				canvas.tokens.controlled.forEach( token =>{
					// if( token.actor.user && !event.shiftKey){ 
					// 	ui.notifications.info( `GM is requesting ${token.actor.name} to perform a ${params.type} check for ${token.actor.user.name}`);
					// } else {
					// if( token.actor.user) ui.notifications.info( `GM is performing a ${options.type} check for ${token.actor.name} in lieu of ${token.actor.user.name}`);
					// else ui.notifications.info( `GM is performing a ${options.type} check for ${token.actor.name}`);
					switch (options.check) {
					case 'check':
						if( ['charac', 'char', 'characteristic', 'characteristics'].includes( options.type.toLowerCase())) return token.actor.characteristicCheck( options.name, event.shiftKey, options);
						if( ['skill'].includes( options.type.toLowerCase())) return token.actor.skillCheck( options.name, event.shiftKey, options);
						if( ['attribute', 'attrib'].includes( options.type.toLowerCase())) return token.actor.attributeCheck( options.name, event.shiftKey, options);
						break;

					case 'sanloss':{
						const check = new CoC7SanCheck( token.actor.id, options.sanMin, options.sanMax, Number(options.difficulty), Number(options.modifier));
						check.toMessage( event.shiftKey);
					}
						break;
					
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
					if( ['skill'].includes( options.type.toLowerCase())) return actor.skillCheck( options.name, event.shiftKey, options);
					if( ['attribute', 'attrib', 'attribs'].includes( options.type.toLowerCase())) return actor.attributeCheck( options.name, event.shiftKey, options);
					break;

				case 'sanloss':{
					const check = new CoC7SanCheck( actor.id, options.sanMin, options.sanMax, Number(options.difficulty), Number(options.modifier));
					check.toMessage( event.shiftKey);
				}
					break;
					
				default:
					return;
				}
			}
			else ui.notifications.warning(game.i18n.localize('CoC7.WarnNoControlledActor'));
		}
		return;
	}
}