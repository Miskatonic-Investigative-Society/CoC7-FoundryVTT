import { CoC7Dice } from './dice.js';
import { CoC7Check } from './check.js';
import { COC7 } from './config.js';
import { CoC7MeleeInitiator} from './chat/combat/melee-initiator.js';
import {  CoC7MeleeTarget} from './chat/combat/melee-target.js';
import { CoC7MeleeResoltion } from './chat/combat/melee-resolution.js';
import { CoC7RangeInitiator } from './chat/rangecombat.js';
import { CoC7Roll, chatHelper } from './chat/helper.js';
import { CoC7DamageRoll } from './chat/damagecards.js';
import { CoC7ConCheck } from './chat/concheck.js';
import { CoC7Parser } from './apps/parser.js';
import { SanCheckCard } from './chat/cards/san-check.js';

export class CoC7Chat{

	//TODO remplacer les getElementsByxxxx par querySelector
	
	/* -------------------------------------------- *
	 *  Init sockets                                *
	 *----------------------------------------------*/

	static ready()
	{
		// console.log('-->CoC7Chat.ready');
		game.CoC7 = 'init';
	}

	// static onMessage( data) {
	// 	console.log('-->CoC7Chat.onMessage');
	// 	console.log(`message received send&er :${data.user} message type : ${data.action} for message :${data.messageId}`);
	// }

	/* -------------------------------------------- *
	 *  Chat Message Helpers                        *
	 * -------------------------------------------- */


	static chatListeners(app, html) {
		// console.log('-->CoC7Chat.chatListeners');
		html.on('click', '.card-buttons button', CoC7Chat._onChatCardAction.bind(this));
		// html.on('click', '.card-buttons button', CoC7Chat._onChatCardTest.bind(this));
		html.on('click', '.card-title', CoC7Chat._onChatCardToggleContent.bind(this));
		html.on('click', '.radio-switch', CoC7Chat._onChatCardRadioSwitch.bind(this));
		html.on('click', '.panel-switch', CoC7Chat._onChatCardToggleSwitch.bind(this));

		html.on('click', '.simple-flag', CoC7Chat._onChatCardToggleSwitch.bind(this));
		html.on('click', '.volley-size', CoC7Chat._onChatCardVolleySize.bind(this));

		html.on('click', '.dropdown-element', CoC7Chat._onDropDownElementSelected.bind(this));
		html.on('click', '.simple-toggle', CoC7Chat._onToggleSelected.bind(this));
		// html.on('click', '.is-outnumbered', CoC7Chat._onOutnumberedSelected.bind(this));

		html.on('click', '.target-selector', CoC7Chat._onTargetSelect.bind(this));

		html.on('dblclick', '.open-actor', CoC7Chat._onOpenActor.bind(this));
		
		html.on('click', '.coc7-link', CoC7Parser._onCheck.bind(this));
		html.on('dragstart', 'a.coc7-link', CoC7Parser._onDragCoC7Link.bind(this));

		html.on('click', 'coc7-inline-result', CoC7Chat._onInline.bind(this));

	}


	static _onOpenActor( event){
		event.preventDefault();
		const actorKey = event.currentTarget.dataset.actorKey;
		if( actorKey){
			const actor = chatHelper.getActorFromKey( actorKey);
			if(actor.owner)	actor.sheet.render(true);
		}
	}


	static async onUpdateChatMessage( chatMessage){
		ui.chat.scrollBottom();

		// if( chatMessage.getFlag( 'CoC7', 'reveled')){
		// }
		if( game.user.isGM){
			const card = $(chatMessage.data.content)[0];
			if( card.classList.contains('melee'))
			{
				if( 'true' == card.dataset.resolved){
					if( card.classList.contains('initiator')){
						if( card.dataset.targetCard){
							const initiator = CoC7MeleeInitiator.getFromMessageId( chatMessage.id);
							const target = CoC7MeleeTarget.getFromMessageId( initiator.targetCard);
							if( target.resolved){
								const resolutionCard = new CoC7MeleeResoltion( chatMessage.id, target.messageId, target.resolutionCard);
								await resolutionCard.resolve();
								if( !initiator.checkRevealed) await initiator.revealCheck();

							}
						}
						else { 
							const initiator = CoC7MeleeInitiator.getFromMessageId( chatMessage.id);
							if( initiator.resolutionCard){
								const resolutionCard = new CoC7MeleeResoltion( chatMessage.id, null, initiator.resolutionCard);
								await resolutionCard.resolve();
								if( !initiator.checkRevealed) await initiator.revealCheck();
							}
						}
					}
					if( card.classList.contains('target')){
						const target = CoC7MeleeTarget.getFromMessageId( chatMessage.id);
						const resolutionCard = new CoC7MeleeResoltion( target.parentMessageId, chatMessage.id, target.resolutionCard);
						await resolutionCard.resolve();
						if( !target.meleeInitiator.checkRevealed) await target.meleeInitiator.revealCheck();
					}

				}
			}

		}
		
	}

	static async renderMessageHook(message, html) {
		ui.chat.scrollBottom();


		if( message.getFlag( 'CoC7', 'checkRevealed')){
			html.find('.dice-roll').removeClass('gm-visible-only');
			html[0].dataset.checkRevealed = true;

			// const htmlMessage = $(chatMessage.data.content);
			// const roll = new CoC7Check;
			// CoC7Roll.getFromElement(htmlMessage.find('.dice-roll')[0], roll );
			// roll.showDiceRoll();
	

		}

		//Handle showing dropdown selection
		html.find('.dropbtn').click(event => event.currentTarget.closest('.dropdown').querySelector('.dropdown-content').classList.toggle('show'));
		html.find('.dropdown').mouseleave( event => event.currentTarget.querySelector('.dropdown-content').classList.remove('show'));

		// console.log('************************************************************-->CoC7Chat.messageListeners message :' + message.id);
		// message.data.content = "";
		// data.message.content = "";

		//When a new card is published, check wether it's a roll that modifies an other card.
		if( game.user.isGM){
			const card = html[0].querySelector('.coc7.chat-card');
			if( card){
				if( card.classList.contains('roll-card') && !(card.dataset.processed == 'true') && card.dataset.refMessageId){

					const roll = CoC7Roll.getFromElement( card);

					if( card.dataset.side =='target') roll.defendantId = card.dataset.tokenId ? card.dataset.tokenId : card.dataset.actorId;
					if( card.dataset.side =='initiator') roll.initiatorId = card.dataset.tokenId ? card.dataset.tokenId : card.dataset.actorId;
					card.dataset.processed = 'true';

					CoC7Chat.updateCombatCardTarget( roll);
				}
			}
		}



		const userOnly = html.find('.target-only');
		for( let element of userOnly )
		{
			if( !game.user.isGM){
				element.style.display = 'none';
				const actorId = element.getAttribute('data-actor-id');
				if( actorId ){ 
					if( game.actors.get(actorId).owner)
					{ element.style.display = 'block';}
				}
			}
		}


		const gmOnly = html.find('.gm-only');
		for( let zone of gmOnly )
		{
			if( !game.user.isGM){ zone.style.display = 'none';}
		}

		const userVisibleOnly = html.find('.user-visible-only');
		for( let elem of userVisibleOnly)
		{
			if( game.user.isGM) elem.style.display='none';
		}

		const gmVisibleOnly = html.find('.gm-visible-only');
		for( let elem of gmVisibleOnly)
		{
			if( !game.user.isGM) elem.style.display='none';
		}

		if( !game.user.isGM) // GM can see everything
		{
			const ownerOnly = html.find('.owner-only');
			for( let zone of ownerOnly )
			{
				const cardActor = CoC7Chat._getChatCardActor(zone.closest('.chat-card'));
				
				// const actor = game.actors.get( actorId);
				if( !cardActor.owner) {zone.style.display = 'none';} //if current user doesn't own this he can't interract
				// if( !CoC7Chat.isCardOwner( zone.closest('.chat-card'))) {zone.style.display = 'none';}
			}

			const gmSelectOnly = html.find('.gm-select-only');
			for( let select of gmSelectOnly)
			{
				select.classList.add( 'inactive');
				select.classList.remove('simple-flag');
			}
		}
	}

	// static async resolveCombatCard( card){ //TODO : To be removed ?
	// 	const initiatorData = card.querySelector('.initiator-action-result').dataset;
	// 	const initiator = CoC7Chat._getActorFromKey( initiatorData.initiatorid);
	// 	let initiatorSuccess = {};
	// 	if( !initiator) return null;
	// 	const initiatorWeapon = initiator.getOwnedItem( initiatorData.itemid);
	// 	initiatorSuccess.successLevel = parseInt( initiatorData.successlevel);
	// 	initiatorSuccess.difficulty = parseInt( initiatorData.difficulty);
		
	// 	if( initiatorSuccess.successLevel >= 1) initiatorSuccess.netSuccess = initiatorSuccess.successLevel - initiatorSuccess.difficulty + 1;
	// 	else initiatorSuccess.netSuccess = 0;



	// 	const targets = card.querySelectorAll('.defender-action-result');

	// 	if( 0 == targets.length ){
	// 		let flavor='';
	// 		if( initiatorSuccess.successLevel >= 1){
	// 			let db = '';
	// 			if( initiator.db == 0 ) db='';
	// 			else if( initiator.db == -2 && initiatorWeapon.data.data.properties.ahdb ) db='-1';
	// 			else if( initiator.db == -2 && initiatorWeapon.data.data.properties.addb ) db='-2';
	// 			else if( initiator.db == -1 && initiatorWeapon.data.data.properties.ahdb ) db='';
	// 			else if( initiator.db == -1 && initiatorWeapon.data.data.properties.addb ) db='-1';
	// 			else if( initiatorWeapon.data.data.properties.addb ) db = `+${initiator.db}`;
	// 			else if( initiatorWeapon.data.data.properties.ahdb ) db = `+${initiator.db}/2`;
	// 			let formula = initiatorWeapon.data.data.range.normal.damage + db;
	// 			flavor=`<div class='card-result'>${initiator.name} used ${initiatorWeapon.name} and deals <a class="inline-roll roll" data-mode="roll" data-flavor="" data-formula="${formula}" title="${formula}"><i class="fas fa-dice-d20"></i>${formula}</a> damage</div>`;
	// 		} else {
	// 			flavor=`<div class='card-result'>${initiator.name} used ${initiatorWeapon.name} and missed.</div>`;
	// 		}
	// 		let result = card.querySelector('.initiator-action-result');
	// 		let oldResult = result.querySelector('.card-result');
	// 		if( oldResult) oldResult.remove();
	// 		$(result).append(flavor);
	// 	}

	// 	[].forEach.call( targets, target => {
	// 		const targetActor = CoC7Chat._getActorFromKey( target.dataset.defendantid);
	// 		if( !targetActor){
	// 			ui.notifications.error( 'Actor does not exist');
	// 			return null;
	// 		}

	// 		let targetSuccess = {};
	// 		targetSuccess.successLevel = parseInt( target.dataset.successlevel);
	// 		targetSuccess.difficulty = parseInt( target.dataset.difficulty);
			
	// 		if( targetSuccess.successLevel >= 1) targetSuccess.netSuccess = targetSuccess.successLevel - targetSuccess.difficulty + 1;
	// 		else targetSuccess.netSuccess = 0;
	
	// 		let flavor;
	// 		let formula;
	// 		let db;
	// 		switch (target.dataset.action) {
	// 		case 'maneuver':
	// 			if( initiatorSuccess.netSuccess >= targetSuccess.netSuccess && initiatorSuccess.successLevel >= 1){
	// 				db = '';
	// 				if( initiator.db == 0 ) db='';
	// 				else if( initiator.db == -2 && initiatorWeapon.data.data.properties.ahdb ) db='-1';
	// 				else if( initiator.db == -2 && initiatorWeapon.data.data.properties.addb ) db='-2';
	// 				else if( initiator.db == -1 && initiatorWeapon.data.data.properties.ahdb ) db='';
	// 				else if( initiator.db == -1 && initiatorWeapon.data.data.properties.addb ) db='-1';
	// 				else if( initiatorWeapon.data.data.properties.addb ) db = `+${initiator.db}`;
	// 				else if( initiatorWeapon.data.data.properties.ahdb ) db = `+${initiator.db}/2`;
	// 				formula = initiatorWeapon.data.data.range.normal.damage + db;
	// 				//						flavor=`<div class='card-result'>${targetActor.name} maneuver failled. ${initiator.name} deals <span class='damage-roll rollable' data-target='${target.dataset.defendantid}' data-formula='${formula}'>${formula}</span> damage</div>`;
	// 				flavor=`<div class='card-result'>${targetActor.name} maneuver failled. ${initiator.name} deals <a class="inline-roll roll" data-mode="roll" data-flavor="" data-formula="${formula}" title="${formula}"><i class="fas fa-dice-d20"></i>${formula}</a> damage</div>`;
	// 			} else if(targetSuccess.netSuccess > initiatorSuccess.netSuccess && targetSuccess.successLevel >= 1) {
	// 				flavor=`<div class='card-result'>${targetActor.name} maneuver succeded. ${initiator.name} attack missed.</div>`;
						
	// 			} else {
	// 				flavor='<div class=\'card-result\'>Both fail. Nothing happened</div>';
	// 			}
	// 			break;
	// 		case 'fightBack':
	// 			if( initiatorSuccess.netSuccess >= targetSuccess.netSuccess && initiatorSuccess.successLevel >= 1){
	// 				db = '';
	// 				if( initiator.db == 0 ) db='';
	// 				else if( initiator.db == -2 && initiatorWeapon.data.data.properties.ahdb ) db='-1';
	// 				else if( initiator.db == -2 && initiatorWeapon.data.data.properties.addb ) db='-2';
	// 				else if( initiator.db == -1 && initiatorWeapon.data.data.properties.ahdb ) db='';
	// 				else if( initiator.db == -1 && initiatorWeapon.data.data.properties.addb ) db='-1';
	// 				else if( initiatorWeapon.data.data.properties.addb ) db = `+${initiator.db}`;
	// 				else if( initiatorWeapon.data.data.properties.ahdb ) db = `+${initiator.db}/2`;
	// 				formula = initiatorWeapon.data.data.range.normal.damage + db;
	// 				flavor=`<div class='card-result'>${initiator.name} deals ${targetActor.name} <a class="inline-roll roll" data-mode="roll" data-flavor="" data-formula="${formula}" title="${formula}"><i class="fas fa-dice-d20"></i>${formula}</a> damage</div>`;
	// 			} else if(targetSuccess.netSuccess > initiatorSuccess.netSuccess && targetSuccess.successLevel >= 1) {
	// 				db = '';
	// 				const targetWeapon = targetActor.getOwnedItem( target.dataset.itemid);
	// 				if( !targetWeapon){
	// 					ui.notifications.error( 'Weapon not found');
	// 				}
	// 				if( targetActor.db == 0 ) db='';
	// 				else if( targetActor.db == -2 && targetWeapon.data.data.properties.ahdb ) db='-1';
	// 				else if( targetActor.db == -2 && targetWeapon.data.data.properties.addb ) db='-2';
	// 				else if( targetActor.db == -1 && targetWeapon.data.data.properties.ahdb ) db='';
	// 				else if( targetActor.db == -1 && targetWeapon.data.data.properties.addb ) db='-1';
	// 				else if( targetWeapon.data.data.properties.addb ) db = `+${targetActor.db}`;
	// 				else if( targetWeapon.data.data.properties.ahdb ) db = `+${targetActor.db}/2`;
	// 				formula = targetWeapon.data.data.range.normal.damage + db;
	// 				flavor=`<div class='card-result'>${targetActor.name} deals ${initiator.name} <a class="inline-roll roll" data-mode="roll" data-flavor="" data-formula="${formula}" title="${formula}"><i class="fas fa-dice-d20"></i>${formula}</a> damage</div>`;
						
	// 			} else {
	// 				flavor='<div class=\'card-result\'>Both fail. Nothing happened.</div>';
	// 			}
	// 			break;
				
	// 		case 'dodging':
	// 			if( initiatorSuccess.netSuccess > targetSuccess.netSuccess && initiatorSuccess.successLevel >= 1){
	// 				db = '';
	// 				if( initiator.db <= 0 ) db='';
	// 				else if( initiator.db == -2 && initiatorWeapon.data.data.properties.ahdb ) db='-1';
	// 				else if( initiator.db == -2 && initiatorWeapon.data.data.properties.addb ) db='-2';
	// 				else if( initiator.db == -1 && initiatorWeapon.data.data.properties.ahdb ) db='';
	// 				else if( initiator.db == -1 && initiatorWeapon.data.data.properties.addb ) db='-1';
	// 				else if( initiatorWeapon.data.data.properties.addb ) db = `+${initiator.db}`;
	// 				else if( initiatorWeapon.data.data.properties.ahdb ) db = `+0.5*${initiator.db}`;
	// 				formula = initiatorWeapon.data.data.range.normal.damage + db;
	// 				flavor=`<div class='card-result'>${initiator.name} deals ${targetActor.name} <a class="inline-roll roll" data-mode="roll" data-flavor="" data-formula="${formula}" title="${formula}"><i class="fas fa-dice-d20"></i>${formula}</a> damage</div>`;
	// 			} else if(targetSuccess.netSuccess >= initiatorSuccess.netSuccess && targetSuccess.successLevel >= 1) {
	// 				flavor=`<div class='card-result'>${targetActor.name} successfully dodged ${initiator.name} attack</div>`;
						
	// 			} else {
	// 				flavor='<div class=\'card-result\'>Both fail. Nothing happened.</div>';
	// 			}
				
	// 			break;
	// 		default:
	// 			break;
	// 		}
	// 		const oldResult = target.querySelector('.card-result');
	// 		if( oldResult) oldResult.remove();
	// 		$(target).append(flavor);
	// 	});

	// 	return card;		
	// }

	static actionTypeString = {
		fightBack: 'CoC7.fightBack',
		maneuver: 'CoC7.maneuver',
		dodging: 'CoC7.dodge'
	}
	
	// static async updateCombatCardTarget( rollData){ //TODO : To be removed ?
	// 	const message = game.messages.get( rollData.referenceMessageId);
	// 	if( message == null) return;
	// 	const card = $( message.data.content )[ 0 ];
	// 	let cardIsReady = false;
	// 	if( card){
	// 		if( rollData.side == 'target'){
	// 			const targetZones = card.querySelectorAll('.defender-action-select');
	// 			const initiatorZone = card.querySelector('.initiator-action-select');

	// 			let targetZone = null;
	// 			let resolved = true;

	// 			[].forEach.call( targetZones, zone => {
	// 				if( zone.dataset.tokenId == rollData.defendantId || zone.dataset.actorId == rollData.defendantId)
	// 				{
	// 					targetZone = zone;
	// 				} else if( !zone.classList.contains('resolved')) resolved = false;

	// 			});
				
	// 			if( !targetZone) return;

	// 			const defendant = CoC7Chat._getActorFromKey( rollData.defendantId);
	// 			const initiator = CoC7Chat._getChatCardActor( card);
	// 			rollData.defendant = defendant;
	// 			rollData.initiator = initiator;
	// 			rollData.netSuccess = parseInt(rollData.successLevel) - parseInt(rollData.difficulty);
	// 			rollData.success = parseInt(rollData.successLevel) > 0;
	// 			rollData.successString = `${defendant.name} : ${game.i18n.localize(CoC7Chat.actionTypeString[rollData.action])}`;

	// 			rollData.rollIcons = [];
	// 			if( rollData.critical){
	// 				rollData.rollColor = 'goldenrod';
	// 				rollData.rollTitle = game.i18n.localize('CoC7.CriticalSuccess');
	// 				for( let index = 0; index < 4; index++){
	// 					rollData.rollIcons.push( 'medal');
	// 				}
	// 			} else if( rollData.fumble) {
	// 				rollData.rollColor = 'darkred';
	// 				rollData.rollTitle = game.i18n.localize('CoC7.Fumble');
	// 				for( let index = 0; index < 4; index++){
	// 					rollData.rollIcons.push( 'spider');
	// 				}
	// 			}else if( rollData.success){
	// 				rollData.rollColor = 'goldenrod';
	// 				if( CoC7Check.successLevel.regular == rollData.successLevel ) rollData.rollTitle = game.i18n.localize('CoC7.RegularSuccess');
	// 				if( CoC7Check.successLevel.hard == rollData.successLevel ) rollData.rollTitle = game.i18n.localize('CoC7.HardSuccess');
	// 				if( CoC7Check.successLevel.extreme == rollData.successLevel ) rollData.rollTitle = game.i18n.localize('CoC7.ExtremeSuccess');
	// 				for (let index = 0; index < rollData.successLevel; index++) {
	// 					rollData.rollIcons.push( 'star');
	// 				} 
	// 			} else {
	// 				rollData.rollColor = 'black';
	// 				rollData.rollTitle = game.i18n.localize('CoC7.Failure');
	// 				rollData.rollIcons.push( 'skull');
	// 			}
				
	// 			rollData.rollNetIcons = [];
	// 			let netSuccessCount;
	// 			if( rollData.fumble) netSuccessCount = Math.abs(-1 - parseInt(rollData.difficulty));
	// 			else netSuccessCount = Math.abs(rollData.netSuccess);
	// 			for (let index = 0; index < netSuccessCount; index++) {
	// 				rollData.rollNetIcons.push( rollData.netSuccess < 0 ? 'minus':'plus');
	// 			}
	// 			rollData.netColor = rollData.netSuccess < 0 ? 'darkred'	: 'green';
									



	// 			const template = 'systems/CoC7/templates/chat/parts/defender-result.html';
	// 			const htmlItem = await renderTemplate(template, rollData);

	// 			targetZone.innerHTML = htmlItem;
	// 			targetZone.classList.add('resolved');
	// 			targetZone.classList.remove('target-only');
	// 			if( resolved){
	// 				card.querySelector('.defenders-actions-container').classList.add('resolved');
	// 				if( initiatorZone.classList.contains('resolved'))
	// 				{
	// 					card.dataset.resolved = true;
	// 					card.classList.add('card-ready');
	// 					cardIsReady = true;
	// 				}
	// 			}
	// 		}

	// 		if( rollData.side == 'initiator'){
	// 			const initiatorZone = card.querySelector('.initiator-action-select');

	// 			if( !initiatorZone) return;
	// 			const initiator = CoC7Chat._getChatCardActor( card);
	// 			rollData.initiator = initiator;
	// 			rollData.netSuccess = parseInt(rollData.successLevel) - parseInt(rollData.difficulty);
	// 			rollData.success = parseInt(rollData.successLevel) > 0;
	// 			rollData.successString = `${initiator.name} :`;

	// 			rollData.rollIcons = [];
	// 			if( rollData.critical){
	// 				rollData.rollColor = 'goldenrod';
	// 				rollData.rollTitle = game.i18n.localize('CoC7.CriticalSuccess');
	// 				for( let index = 0; index < 4; index++){
	// 					rollData.rollIcons.push( 'medal');
	// 				}
	// 			} else if( rollData.fumble) {
	// 				rollData.rollColor = 'darkred';
	// 				rollData.rollTitle = game.i18n.localize('CoC7.Fumble');
	// 				for( let index = 0; index < 4; index++){
	// 					rollData.rollIcons.push( 'spider');
	// 				}
	// 			}else if( rollData.success){
	// 				rollData.rollColor = 'goldenrod';
	// 				if( CoC7Check.successLevel.regular == rollData.successLevel ) rollData.rollTitle = game.i18n.localize('CoC7.RegularSuccess');
	// 				if( CoC7Check.successLevel.hard == rollData.successLevel ) rollData.rollTitle = game.i18n.localize('CoC7.HardSuccess');
	// 				if( CoC7Check.successLevel.extreme == rollData.successLevel ) rollData.rollTitle = game.i18n.localize('CoC7.ExtremeSuccess');
	// 				for (let index = 0; index < rollData.successLevel; index++) {
	// 					rollData.rollIcons.push( 'star');
	// 				} 
	// 			} else {
	// 				rollData.rollColor = 'black';
	// 				rollData.rollTitle = game.i18n.localize('CoC7.Failure');
	// 				rollData.rollIcons.push( 'skull');
	// 			}
				
	// 			rollData.rollNetIcons = [];
	// 			let netSuccessCount;
	// 			if( rollData.fumble) netSuccessCount = Math.abs(-1 - parseInt(rollData.difficulty));
	// 			else netSuccessCount = Math.abs(rollData.netSuccess);
	// 			for (let index = 0; index < netSuccessCount; index++) {
	// 				rollData.rollNetIcons.push( rollData.netSuccess < 0 ? 'minus':'plus');
	// 			}
	// 			rollData.netColor = rollData.netSuccess < 0 ? 'darkred'	: 'green';

	// 			const template = 'systems/CoC7/templates/chat/parts/initiator-result.html';
	// 			const htmlItem = await renderTemplate(template, rollData);

	// 			initiatorZone.innerHTML = htmlItem;
	// 			initiatorZone.classList.remove('owner-only');
	// 			initiatorZone.classList.add('resolved');
	// 			[].forEach.call(card.querySelectorAll('.is-outnumbered'), outNumButton => outNumButton.remove());
	// 			if( card.querySelector('.defenders-actions-container').classList.contains('resolved') || 0 == card.querySelectorAll('.defender-action-select').length )
	// 			{
	// 				card.dataset.resolved = true;
	// 				card.classList.add('card-ready');
	// 				cardIsReady = true;
	// 			}

	// 		}

	// 		if( cardIsReady){
	// 			await CoC7Chat.resolveCombatCard(card);
	// 		}

	// 		message.update({ content: card.outerHTML }).then(msg => {
	// 			ui.chat.updateMessage( msg, false);
	// 		});		
	// 	}
	// }

	static _onTargetSelect( event){
		const index = parseInt(event.currentTarget.dataset.key);
		const targetsSelector = event.currentTarget.closest('.targets-selector');
		targetsSelector.querySelectorAll('img').forEach( i =>{
			i.style.border='none';
		});
		targetsSelector.querySelector(`[data-key="${index}"]`).querySelector('img').style.border='1px solid #000';
		const targets = event.currentTarget.closest('.targets');
		targets.querySelectorAll('.target').forEach( t => {
			t.style.display='none';
			t.dataset.active='false';
		});
		const targetToDisplay = targets.querySelector(`[data-target-key="${index}"]`);
		targetToDisplay.style.display='block';
		targetToDisplay.dataset.active='true';
		// const chatCard = event.currentTarget.closest('.chat-card.range');
		// const rangeInitiator = CoC7RangeInitiator.getFromCard( chatCard);
	}

	// static _onOutnumberedSelected( event){ //TODO: To be removed
	// 	let actionButton;
	// 	const card = event.currentTarget.closest('.close-combat-card');
	// 	if( event.currentTarget.dataset.side == 'initiator') {
	// 		actionButton = event.currentTarget.closest('.initiator-action-select').querySelector('button');
	// 	}
	// 	else if(  event.currentTarget.dataset.side == 'target')
	// 	{
	// 		actionButton = card.querySelector('.initiator-action-select').querySelector('button');
	// 	}

	// 	if( event.currentTarget.classList.contains('switched-on')){
	// 		event.currentTarget.classList.remove('switched-on');
	// 		event.currentTarget.dataset.selected='false';
	// 		actionButton.dataset[event.currentTarget.dataset.flag] = 'false';
	// 	}
	// 	else
	// 	{
	// 		event.currentTarget.classList.add('switched-on');
	// 		event.currentTarget.dataset.selected='true';
	// 		actionButton.dataset[event.currentTarget.dataset.flag] = 'true';
	// 	}
	// 	CoC7Chat.updateChatCard( card);
	// }

	static _onDropDownElementSelected( event){

		event.preventDefault();

		const card = event.currentTarget.closest('.chat-card');
		if( card.classList.contains('target')){
			CoC7MeleeTarget.updateSelected( card, event);
			return;
		}

		//clear all drop down and highlight this particular one
		const dropDownBoxes = event.currentTarget.closest('.response-selection').querySelectorAll('.toggle-switch');
		[].forEach.call( dropDownBoxes, dpdnBox => dpdnBox.classList.remove('switched-on'));
		event.currentTarget.closest('.toggle-switch').classList.add('switched-on');

		//close dropdown
		event.currentTarget.closest('.dropdown-content').classList.toggle('show');

		//Display the roll button
		const selectedBox = event.currentTarget.closest('.defender-action-select').querySelector('.selected-action');
		selectedBox.style.display = 'block';
		const button = selectedBox.querySelector('button');

		//Pass the initiator Id - Build can be retrieved from that

		//Pass the initiator item
		
		//Pass the defendant Id

		//Pass the defendant action
		button.dataset.action = 'defending';
		button.dataset.actionType = event.currentTarget.dataset.action;
		button.dataset.defenderChoice = event.currentTarget.dataset.action;
		button.dataset.skillId = event.currentTarget.dataset.skillId;
		button.dataset.skillValue = event.currentTarget.dataset.skillValue;
		button.dataset.skillName = event.currentTarget.dataset.skillName;
		button.dataset.itemId = event.currentTarget.dataset.weaponId;
		button.dataset.itemName = event.currentTarget.dataset.weaponName;

		//Put some text in the button
		switch (event.currentTarget.dataset.action) {
		case 'maneuver':
			button.innerText = `${game.i18n.localize(COC7.combatCards[event.currentTarget.dataset.action])} : ${event.currentTarget.dataset.skillName} (${event.currentTarget.dataset.skillValue}%)`;
			break;
		case 'fightBack':
			button.innerText = `${game.i18n.localize(COC7.combatCards[event.currentTarget.dataset.action])} : ${event.currentTarget.dataset.weaponName} (${event.currentTarget.dataset.skillValue}%)`;
			break;
		
		default:
			break;
		}
		//Save action for the roll
	}

	static async _onInline( event){
		event.preventDefault();
		const a = event.currentTarget;
		
		if ( a.classList.contains('inline-result') ) {
			if ( a.classList.contains('expanded') ) {
				return CoC7Check._collapseInlineResult(a);
			} else {
				return CoC7Check._expandInlineResult(a);
			}
		}
	}

	static _onToggleSelected( event){

		const card = event.currentTarget.closest('.chat-card');
		if( card.classList.contains('target')){
			CoC7MeleeTarget.updateSelected( card, event);
			return;
		}

		if( event.currentTarget.dataset.skillId == ''){
			ui.notifications.error(game.i18n.localize('CoC7.ErrorNoDodgeSkill'));
			return;
		}

		//clear all drop down and highlight this particular one
		const dropDownBoxes = event.currentTarget.closest('.response-selection').querySelectorAll('.toggle-switch');
		[].forEach.call( dropDownBoxes, dpdnBox => dpdnBox.classList.remove('switched-on'));
		event.currentTarget.classList.add('switched-on'); //Need to test if it's really a dodge !!!

		//Save action for the roll
		const selectedBox = event.currentTarget.closest('.defender-action-select').querySelector('.selected-action');
		selectedBox.style.display = 'block';
		const button = selectedBox.querySelector('button');

		button.dataset.action = 'defending';
		button.dataset.actionType = 'dodging';
		button.dataset.defenderChoice = event.currentTarget.dataset.action;
		button.dataset.skillId = event.currentTarget.dataset.skillId;
		button.dataset.skillValue = event.currentTarget.dataset.skillValue;
		button.dataset.skillName = event.currentTarget.dataset.skillName;

		button.innerText = `${game.i18n.localize(COC7.combatCards[event.currentTarget.dataset.action])} : ${event.currentTarget.dataset.skillName} (${event.currentTarget.dataset.skillValue}%)`;
	}


	static _onChatCardRadioSwitch( event){
		// console.log('-->CoC7Chat._onChatCardRadioSwitch');
		event.preventDefault();
		let optionList = event.currentTarget.parentElement.getElementsByClassName('radio-switch');	
		let index;
		for (index = 0; index < optionList.length; index++) {
			let element = optionList[index];
			if( element.dataset.property == event.currentTarget.dataset.property){
				element.classList.add('switched-on');
			}
			else{
				element.classList.remove('switched-on');
			}
		}
		event.currentTarget.parentElement.dataset.selected = event.currentTarget.dataset.property;
	}

	static async _onChatCardVolleySize( event){
		const card = event.currentTarget.closest('.chat-card');
		
		if( card.classList.contains( 'range')){
			if( card.classList.contains('initiator')){
				const rangeCard = CoC7RangeInitiator.getFromCard( card);
				if( event.currentTarget.classList.contains('increase')) rangeCard.changeVolleySize( 1);
				else if( event.currentTarget.classList.contains('decrease'))  rangeCard.changeVolleySize( -1);
			}
		}

	}

	static async _onChatCardToggleSwitch( event){
		event.preventDefault();

		const card = event.currentTarget.closest('.chat-card');
		if( card.classList.contains( 'melee')){
			if( card.classList.contains('initiator')){
				CoC7MeleeInitiator.updateCardSwitch( event);
			}

			if( card.classList.contains('target')){
				CoC7MeleeTarget.updateCardSwitch( event);
			}
		}

		if( card.classList.contains( 'range')){
			if( card.classList.contains('initiator')){
				CoC7RangeInitiator.updateCardSwitch( event);
			}
		}

		if( card.classList.contains('damage')){
			// CoC7Item.updateCardSwitch( event);
		}

		if( card.classList.contains('roll-card')){
			CoC7Check.updateCardSwitch(event);
		}


		// let visible = event.currentTarget.parentElement.dataset.selected == "true" ? true : false;
		// let panel = event.currentTarget.parentElement.getElementsByClassName( 'panel-content');
		// if( visible){
		// 	//hide panel
		// 	event.currentTarget.classList.remove('switched-on');
		// 	panel[0].style.display = 'none';
		// 	event.currentTarget.parentElement.dataset.selected = false;
		// }
		// else
		// {
		// 	//show panel
		// 	event.currentTarget.classList.add('switched-on');
		// 	panel[0].style.display = 'block';
		// 	event.currentTarget.parentElement.dataset.selected = true;
		// }
	}


	// static async _onContextMenu(event) {
	// 	console.log('-->CoC7Chat._onContextMenu');

	// 	const HTMLmessage = event.currentTarget.closest(".message");
	// 	const dropZoneName = event.currentTarget.parentElement.getAttribute("id");
	// 	const itemId = event.currentTarget.dataset.itemId;

	// 	CoC7Chat.removeFromProtagonists( HTMLmessage, dropZoneName, itemId);
	// }

	// static removeFromProtagonists( HTMLmessage, side, itemId){
	// 	// const oldChatMessage = game.messages.get( chatMessageId);
	// 	// let oldMessageHTML = document.createElement('div');
	// 	// oldMessageHTML.innerHTML = oldChatMessage.data.content;
	// 	// let newHTMLMessage = oldMessageHTML.firstChild;

	// 	let chatCard = HTMLmessage.getElementsByClassName('chat-card')[0];
	// 	let protagonistsList = chatCard.getElementsByTagName('div')[side];

	// 	const protagonistsArray = [...protagonistsList.children];

	// 	const element = protagonistsArray.find( element => element.dataset.itemId == itemId);
	// 	element.remove();

	// 	let newMessage = {
	// 		user: game.user._id,
	// 		hideData: true,
	// 		content: chatCard.outerHTML
	// 	}

	// 	const chatMessageId = HTMLmessage.dataset.messageId;
	// 	const chatMessage = game.messages.get( chatMessageId);


	// 	let newChatMessage = chatMessage.update(newMessage);
	// 	ui.chat.updateMessage( newChatMessage, false);
	// }

	// static async _onDragItemStart( event){
	// 	console.log('-->CoC7Chat._onDragItemStart');
	// 	const itemId = event.currentTarget.dataset.itemId;
	// 	const actorId = event.currentTarget.dataset.actorId;
	// 	const tokenId = event.currentTarget.dataset.tokenId;
	// 	const HTMLmessage = event.currentTarget.closest(".message");
	// 	const chatMessageId = HTMLmessage.dataset.messageId;
	// 	const side = event.currentTarget.parentElement.getAttribute("id");

	// 	var transferedData = {
	// 		'itemId': itemId,
	// 		'actorId': actorId,
	// 		'token': tokenId ? tokenId : null,
	// 		'origin': 'ChatMessage',
	// 		'chatMessageId': chatMessageId
	// 	}
	// 	event.dataTransfer.setData("text", JSON.stringify( transferedData));

	// 	//CoC7Chat.removeFromProtagonists( HTMLmessage, side, itemId);
	// 	//TODO : transferer l'effacement de la liste d'origine apres que l'élément est été créé.
	// }

	/**
	 * Get the Actor which is the author of a chat card
	 * @param {HTMLElement} card    The chat card being used
	 * @return {Actor|null}         The Actor entity or null
	 * @private
	 */
	static _getChatCardActor(card) {

		//if dataset.object is there => need to unescape things !!
		//if not use the dataset directly.
		const cardData = card.dataset.object?JSON.parse(unescape((card.dataset.object))):card.dataset;

		if( cardData.actorKey) return CoC7Chat._getActorFromKey( cardData.actorKey);

		// Case 1 - a synthetic actor from a Token
		const tokenKey = cardData.tokenId;
		if (tokenKey) {
			const [sceneId, tokenId] = tokenKey.split('.');
			const scene = game.scenes.get(sceneId);
			if (!scene) return null;
			const tokenData = scene.getEmbeddedEntity('Token', tokenId);
			if (!tokenData) return null;
			const token = new Token(tokenData);
			return token.actor;
		}

		// Case 2 - use Actor ID directory
		const actorId = cardData.actorId;
		if( actorId) return game.actors.get(actorId);

		const message = card.closest('.message');
		const messageId = message? message.dataset.messageId: null;
		if( messageId){
			const chatMessage = game.messages.get( messageId);
			if( chatMessage.user) return chatMessage.user.character;
		}

		return null;

	}

	static isCardOwner( card){
		const message = card.closest('.message');
		const messageId = message? message.dataset.messageId: null;
		if( messageId){
			const chatMessage = game.messages.get( messageId);
			return chatMessage.ownner  || false;
		}

		return false;
	}

	static _getActorFromKey(key) {

		// Case 1 - a synthetic actor from a Token
		if (key.includes('.')) {
			const [sceneId, tokenId] = key.split('.');
			const scene = game.scenes.get(sceneId);
			if (!scene) return null;
			const tokenData = scene.getEmbeddedEntity('Token', tokenId);
			if (!tokenData) return null;
			const token = new Token(tokenData);
			return token.actor;
		}

		// Case 2 - use Actor ID directory
		return game.actors.get(key) || null;
	}

	static getActorFromToken( tokenKey)
	{
		const token = CoC7Chat.getToken( tokenKey);
		return token ? token.actor : null;
	}

	static getToken( tokenKey){
		if (tokenKey) {
			const [sceneId, tokenId] = tokenKey.split('.');
			const scene = game.scenes.get(sceneId);
			if (!scene) return null;
			const tokenData = scene.getEmbeddedEntity('Token', tokenId);
			if (!tokenData) return null;
			const token = new Token(tokenData);
			return token;
		}
		return null;
	}


	// static async _onDrop( event) {
	// 	console.log('-->CoC7Chat._onDrop');
	// 	let data;
	// 	try {
	// 		data = JSON.parse(event.dataTransfer.getData('text/plain'));
	// 	} catch (err) {
	// 		return false;
	// 	}

	// 	const token = this.getToken( data.token); //TODO check getToken is static method !
	// 	const actor = token ? token.actor : game.actors.get( data.actorId);
	// 	const item = actor.getOwnedItem( data.itemId);

	// 	const dropZone = event.currentTarget;
	// 	const dropZoneName = dropZone.getAttribute("id");
	// 	const message = dropZone.closest(".message");
	// 	const messageId = message.dataset.messageId;

	// 	// if( !CoC7Chat.messageContainsItem( messageId, data.itemId))
	// 	// {
	// 		const templateData = {
	// 			img: 'icons/svg/mystery-man.svg',
	// 			actor: actor,
	// 			item: item,
	// 			tokenId: data.token ? data.token : null,
	// 			token: token
	// 		}

	// 		const template = 'systems/CoC7/templates/chat/parts/item.html';
	// 		const htmlItem = await renderTemplate(template, templateData);

	// 		let oldMesssage = game.messages.get(messageId);
	// 		// let oldMessageHtml = document.createElement('div');
	// 		// oldMessageHtml.innerHTML = dropZone.closest('.chat-card').outerHTML;
	// 		let newHtmlMessage = dropZone.closest('.chat-card');

	// 		let msg = newHtmlMessage.getElementsByTagName('div')[dropZoneName];
	// 		msg.insertAdjacentHTML('beforeend', htmlItem);

	// 		let newMessage = {
	// 			user: game.user._id,
	// 			hideData: true,
	// 			content: newHtmlMessage.outerHTML
	// 		}

	// 		let resultMsg = oldMesssage.update(newMessage);
	// 		ui.chat.updateMessage( resultMsg, false);
	// 	// }
	// }
	
	/**
	 * update a chat message with a new HTML content and populate it.
	 * @param {HTMLElement} card 
	 */
	static async updateChatCard( card, messId = null){
		const messageId = messId == null ? card.closest('.message').dataset.messageId: messId;
		let message = game.messages.get( messageId);

		const msg = await message.update({ content: card.outerHTML });
		await ui.chat.updateMessage( msg, false);
		return msg;
	}


	static parseChatCard( card)  //DEPRECATED !
	{
		//TODO control de validité des éléments
		//TODO implement
		const rollType = card.children.rolltype.dataset.selected;
		const backersList = card.getElementsByClassName('backers-list').backers.children;
		const backersCondition = card.getElementsByClassName('adversaries-condition').adversariescondition.dataset.selected;
		const adversariesList = card.getElementsByClassName('backers-list').backers.children;
		const adversariesCondition = card.getElementsByClassName('adversaries-condition').adversariescondition.dataset.selected;
		const chatMessageId = card.closest('.message').dataset.messageId;
		const actorId = card.dataset.actorId;
		const itemId = card.dataset.itemId;
		const tokenId = card.dataset.tokenId;
		const value = card.dataset.value;

		let index;
		let backers = [];
		let adversaries = [];
		for (index = 0; index < backersList.length; index++) backers.push(Object.assign({}, backersList[index].dataset));
		for (index = 0; index < adversariesList.length; index++) adversaries.push(Object.assign({}, backersList[index].dataset));

		let actors = {};
		actors.main = {};
		actors.main.itemId = itemId;
		actors.main.actorId = actorId;
		actors.main.value = value;
		actors.main.tokenId = tokenId;
		actors.backers = backers;
		actors.adversaries = adversaries;

		let victoryConditions = {};
		victoryConditions.backers = backersCondition;
		victoryConditions.adversaries = adversariesCondition;

		CoC7Dice.skillRoll( rollType, actors, victoryConditions, chatMessageId);

		return null;
	}

	// /**
	//  * Handle execution of a chat card action via a click event on one of the card buttons
	//  * @param {Event} event       The originating click event
	//  * @returns {Promise}         A promise which resolves once the handler workflow is complete
	//  * @private
	//  */

	// static _onChatCardTest(event) {
	// 	console.log('-->CoC7Chat._onChatCardAction');
	// 	event.preventDefault();

	// 	const card = event.currentTarget.closest(".chat-card");
	// 	const messageId = card.closest('.message').dataset.messageId;
	// 	const message = game.messages.get( messageId);

	// 	card.querySelector('.card-buttons').remove();


	// 	message.update({ content: card.outerHTML }).then(msg => {
	// 		ui.chat.updateMessage( msg, false);
	// 	});
	// }
	
	static async _onChatCardAction(event) {

		// console.log('-->CoC7Chat._onChatCardAction');
		event.preventDefault();

		const button = event.currentTarget;
		const card = button.closest('.chat-card');
		const originMessage = button.closest('.message');
		// const messageId = originMessage.dataset.messageId;
		const action = button.dataset.action;

		if ( !CoC7Chat._getChatCardActor(card) ) return;

		switch( action){
		case 'useLuck':{
			const luckAmount = parseInt(button.dataset.luckAmount);
			const newSuccessLevel = parseInt(event.currentTarget.dataset.newSuccessLevel);

			if( card.classList.contains('melee')){
				let meleeCard;
				if( card.classList.contains('target')) meleeCard = CoC7MeleeTarget.getFromCard( card);
				if( card.classList.contains('initiator')) meleeCard = CoC7MeleeInitiator.getFromCard( card);
				meleeCard.upgradeRoll( luckAmount, newSuccessLevel, card); //TODO : Check if this needs to be async
			} else if( card.classList.contains('range')){
				const rangeCard = CoC7RangeInitiator.getFromCard( card);
				const rollResult = button.closest('.roll-result');
				const rollIndex = rollResult ? parseInt(rollResult.dataset.index) : null;
				if( button.classList.contains('pass-check')) {
					rangeCard.passRoll(rollIndex);
				} else {
					const upgradeIndex = parseInt(button.dataset.index);
					rangeCard.upgradeRoll( rollIndex, upgradeIndex); //TODO : Check if this needs to be async	
				}			
			} else if( card.classList.contains('roll-card') || null != card.querySelector('.roll-result')) {
				const check = await CoC7Check.getFromCard( card);
				if( button.classList.contains('pass-check')) {
					const luckAmount = parseInt( button.dataset.luckAmount);
					check.forcePass(luckAmount);
				} else {
					const upgradeIndex = parseInt(button.dataset.index);
					await check.upgradeCheck(upgradeIndex);
				}
			}
			else
			{
				let actor = CoC7Chat._getChatCardActor(card);
				const detailedResultPlaceHolder = card.querySelector('.result-details');

				if( actor.spendLuck( luckAmount)){

					let result = card.querySelector('.dice-total');
					card.dataset.successLevel = newSuccessLevel;
					card.dataset.processed = 'false'; //trigger 3 updates de card
					switch (newSuccessLevel) {
					case CoC7Check.successLevel.regular:
						result.innerText = game.i18n.localize('CoC7.RegularSuccess');
						detailedResultPlaceHolder.innerText = game.i18n.format('CoC7.RollResult.LuckSpendText', {luckAmount: luckAmount, successLevel: game.i18n.localize('CoC7.RegularDifficulty')});
						break;
						
					case CoC7Check.successLevel.hard:
						result.innerText = game.i18n.localize('CoC7.HardSuccess');
						detailedResultPlaceHolder.innerText = game.i18n.format('CoC7.RollResult.LuckSpendText', {luckAmount: luckAmount, successLevel: game.i18n.localize('CoC7.HardDifficulty')});
						break;
						
					case CoC7Check.successLevel.extreme:
						result.innerText = game.i18n.localize('CoC7.ExtremeSuccess');
						detailedResultPlaceHolder.innerText = game.i18n.format('CoC7.RollResult.LuckSpendText', {luckAmount: luckAmount, successLevel: game.i18n.localize('CoC7.ExtremeDifficulty')});
						break;
						
					case CoC7Check.successLevel.critical:
						result.innerText = game.i18n.localize('CoC7.CriticalSuccess');
						detailedResultPlaceHolder.innerText = game.i18n.format('CoC7.RollResult.LuckSpendText', {luckAmount: luckAmount, successLevel: game.i18n.localize('CoC7.CriticalDifficulty')});
						break;
						
					default:
						break;
					}
					result.classList.replace( 'failure', 'success');
					result.classList.remove( 'fumble');
					card.querySelector('.card-buttons').remove();
					card.querySelector('.dice-tooltip').style.display = 'none';
					await CoC7Chat.updateChatCard( card);
				}
				else
					ui.notifications.error(game.i18n.format('CoC7.ErrorNotEnoughLuck', {actor: actor.name}));
			}
			break;
		}
		case 'push': {
			let newCard = card.cloneNode(true); // TODO not necessary
			let result = newCard.querySelector('.dice-total');
			result.innerText = result.innerText + ' pushing skill';
			result.classList.remove('failure');
			newCard.querySelector('.card-buttons').remove();
			newCard.dataset.pushedRoll = true;
			await CoC7Chat.updateChatCard( newCard, originMessage.dataset.messageId);
			CoC7Check.push( card);
			break;
		}
		case 'defending': {
			let defenderKey =  event.currentTarget.closest('.defender-action-select').dataset.tokenId;
			let defender;
			if( !defenderKey){
				defenderKey = event.currentTarget.closest('.defender-action-select').dataset.actorId;
				defender = game.actors.get(defenderKey);
			}
			else{
				defender =this.getActorFromToken(defenderKey);
			}

			const responseType = event.currentTarget.dataset.actionType;
			const outnumbered = event.currentTarget.dataset.outnumbered === 'true';
			let check = new CoC7Check();
			check.referenceMessageId = originMessage.dataset.messageId;
			check.rollType= 'opposed';
			check.side = 'target';
			check.action = responseType;
			switch (responseType) {
			case 'dodging':
				check.actor = defender;
				check.skill = event.currentTarget.dataset.skillId;
				check.difficulty = CoC7Check.difficultyLevel.regular;
				if( outnumbered) check.diceModifier = -1;

				check.roll();
				check.toMessage();
				break;
			case 'fightBack':
				check.actor = defender;
				check.skill = event.currentTarget.dataset.skillId;
				check.difficulty = CoC7Check.difficultyLevel.regular;
				check.item = event.currentTarget.dataset.itemId;
				if( outnumbered) check.diceModifier = -1;

				check.roll();
				check.toMessage();
				break;
			case 'maneuver':{
				let actor = CoC7Chat._getChatCardActor(card);
				if( defender.build <= actor.build - 3) {
					ui.notifications.error(game.i18n.localize('CoC7.ErrorManeuverNotPossible'));
					return;
				}
				check.actor = defender;
				check.skill = event.currentTarget.dataset.skillId;
				check.difficulty = CoC7Check.difficultyLevel.regular;
				if( outnumbered) check.diceModifier = -1;
				if( defender.build < actor.build) check.diceModifier = check.diceModifier - (actor.build - defender.build);
						
				if( check.diceModifier < -2){
					check.difficulty = check.difficulty + Math.abs( check.diceModifier) - 2;
					check.diceModifier = -2;
				}

				check.roll();
				check.toMessage();
				break;
			}
			default:
				break;
			}
			break;
		}					
		// case 'initiator-roll': { //Roll against each target
		// 	let initiatorRollActor = CoC7Chat.getActorFromToken( event.currentTarget.dataset.tokenId);
		// 	if( initiatorRollActor == null) initiatorRollActor = game.actors.get( event.currentTarget.dataset.actorId);
		
		// 	const initiatorCheck = new CoC7Check();
		// 	initiatorCheck.referenceMessageId = originMessage.dataset.messageId;
		// 	initiatorCheck.rollType= 'opposed';
		// 	initiatorCheck.side = 'initiator';
		// 	initiatorCheck.action = 'attack';
		// 	initiatorCheck.actor = initiatorRollActor;
		// 	initiatorCheck.difficulty = CoC7Check.difficultyLevel.regular;
		// 	if( event.currentTarget.dataset.outnumbered === 'true') initiatorCheck.diceModifier = +1;

		// 	initiatorCheck.item = event.currentTarget.dataset.itemId;

		// 	initiatorCheck.roll();
		// 	initiatorCheck.toMessage();

		// 	break;
		// }
		case 'melee-initiator-roll':{
			const initiator = CoC7MeleeInitiator.getFromCard( card);
			await initiator.performSkillCheck( event.currentTarget.dataset.skill);
			await initiator.publishCheckResult();
			break;
		}
		case 'melee-target-roll':{
			const target = CoC7MeleeTarget.getFromCard( card);
			await target.performSkillCheck( event.currentTarget.dataset.skill);
			await target.publishCheckResult();
			break;
		}
		case 'roll-melee-damage':{
			const damageCard = new CoC7DamageRoll( button.dataset.weapon, button.dataset.dealer, button.dataset.target, 'true' == button.dataset.critical );
			if( originMessage.dataset.messageId) damageCard.messageId = originMessage.dataset.messageId;
			damageCard.rollDamage();
			if( originMessage.dataset.messageId) {
				card.querySelectorAll('.card-buttons').forEach( b => b.remove());
				await CoC7Chat.updateChatCard( card);
			}
			break;
		}
		case 'range-initiator-shoot':{
			const rangeInitiator = CoC7RangeInitiator.getFromCard( card);
			rangeInitiator.addShotAtCurrentTarget();
			await rangeInitiator.updateChatCard();
			break;
		}
		case 'range-initiator-roll':{
			const rangeInitiator = CoC7RangeInitiator.getFromCard( card);
			await rangeInitiator.resolveCard();
			break;
		}
		case 'roll-range-damage':{
			const rangeInitiator = CoC7RangeInitiator.getFromCard( card);
			await rangeInitiator.rollDamage();
			break;
		}
		case 'deal-melee-damage':{
			const targetKey = card.dataset.targetKey;
			const amount = card.dataset.result;
			const targetActor = chatHelper.getActorFromKey( targetKey);
			await targetActor.dealDamage( amount);
			const buttons = card.querySelector('.card-buttons');
			const diceTotal = card.querySelector('.dice-total');
			$(diceTotal).append('<i class="fas fa-check"></i>');
			if( buttons) buttons.remove();
			await CoC7Chat.updateChatCard( card);

			break;
		}

		case 'deal-range-damage':{
			const rangeInitiator = CoC7RangeInitiator.getFromCard( card);
			await rangeInitiator.dealDamage();
			break;
		}

		case 'testcheck':{
			const check = await CoC7Check.getFromCard( card);
			check.forcePass();
			break;
		}

		case 'force-pass':{
			const check = await CoC7Check.getFromCard( card);
			check.forcePass();
			break;
		}

		case 'force-fail':{
			const check = await CoC7Check.getFromCard( card);
			check.forceFail();
			break;
		}

		case 'increase-success-level':{
			const check = await CoC7Check.getFromCard( card);
			check.increaseSuccessLevel();
			break;
		}

		case 'decrease-success-level':{
			const check = await CoC7Check.getFromCard( card);
			check.decreaseSuccessLevel();
			break;
		}

		case 'reveal-check':{
			const check = await CoC7Check.getFromCard( card);
			check.isBlind = false;
			check.computeCheck();
			if(event.metaKey || event.ctrlKey || event.keyCode == 91 || event.keyCode == 224) check.updateChatCard( true);
			else  check.updateChatCard();
			break;
		}

		case 'flag-for-development':{
			const check = await CoC7Check.getFromCard( card);
			await check.flagForDevelopement();
			check.computeCheck();
			check.updateChatCard();
			break;
		}

		case 'reset-creature-san-data':{
			const sanCheck = SanCheckCard.getFromCard( card);
			await sanCheck.resetCreatureSanData();
			await sanCheck.updateChatCard();
			break;
		}

		case 'reset-specie-san-data':{
			const sanCheck = SanCheckCard.getFromCard( card);
			await sanCheck.resetSpecieSanData();
			await sanCheck.updateChatCard();
			break;
		}

		case 'roll-san-check':{
			const sanCheck = SanCheckCard.getFromCard( card);
			await sanCheck.rollSan();
			await sanCheck.updateChatCard();
			break;
		}

		case 'advance-state':{
			const sanCheck = SanCheckCard.getFromCard( card);
			await sanCheck.advanceState(button.dataset.state/*, button.dataset.param*/);
			await sanCheck.updateChatCard();
			break;

		}

		case 'roll-san-loss':{
			const sanCheck = SanCheckCard.getFromCard( card);
			await sanCheck.rollSanLoss();
			sanCheck.updateChatCard();
			break;
		}

		case 'roll-int-check':{
			const sanCheck = SanCheckCard.getFromCard( card);
			await sanCheck.rollInt();
			sanCheck.updateChatCard();
			break;
		}
		
		// case 'apply-san-loss':{
		// 	const sanCheck = CoC7SanCheck.getFromCard( card);
		// 	await sanCheck.applySanLoss();
		// 	sanCheck.updateChatCard();
		// 	break;
		// }

		// case 'reveal-san-check':{
		// 	const sanCheck = CoC7SanCheck.getFromCard( card);
		// 	sanCheck.isBlind = false;
		// 	sanCheck.updateChatCard();
		// 	break;
		// }

		case 'roll-con-check':{
			const conCheck = CoC7ConCheck.getFromCard(card);
			await conCheck.rollCon();
			conCheck.updateChatCard();
			break;
		}

		case 'reveal-con-check':{
			const conCheck = CoC7ConCheck.getFromCard( card);
			conCheck.isBlind = false;
			conCheck.updateChatCard();
			break;
		}

		default:
			break;
		}
	}

	/**
	 * Handle toggling the visibility of chat card content when the name is clicked
	 * @param {Event} event   The originating click event
	 * @private
	*/
	static _onChatCardToggleContent(event) {
		event.preventDefault();
		const header = event.currentTarget;
		const card = header.closest('.chat-card');
		const content = card.querySelector('.card-content');
		if( content){
			if( !content.style.display) content.style.display = 'block';
			else content.style.display = content.style.display === 'none' ? 'block' : 'none';
		}
	}
	
	// static async updatechatMessageTargets( oldCard){ //TODO : To be removed ?
	// 	const htmlCardContent = jQuery.parseHTML( oldCard.data.content);
	// 	const targets = htmlCardContent[0].querySelector('.targets');
	// 	const initiator = this._getChatCardActor(htmlCardContent[0]);

	// 	//Cleat targets list.
	// 	while (targets.firstChild) {
	// 		targets.removeChild(targets.lastChild);
	// 	}

	// 	if (game.user.targets.size != 0){
	// 		for( let target of game.user.targets){
	// 			const templateData = {};

	// 			// let newTarget = $(`<div class="target">${target.name}</div>`);
	// 			if( target.actor.isToken){
	// 				// newTarget.attr('data-token-id', `${target.scene.id}.${target.id}`);
	// 				templateData.tokenId = `${target.scene.id}.${target.id}`;
	// 			}
	// 			else{
	// 				// newTarget.attr('data-actor-id', `${target.actor.id}`);
	// 				templateData.actorId = target.actor.id;
	// 			}
	// 			// $(targets).append(newTarget);

	// 			//Incorrect !! figthing back = using a (close combat ?) weapon, a maneuver uses a skill.
	// 			templateData.fightingSkills = target.actor.fightingSkills;
	// 			templateData.dodgeSkill = target.actor.dodgeSkill;
	// 			templateData.closeCombatWeapons = target.actor.closeCombatWeapons;
	// 			templateData.defenderBuild = target.actor.build;
	// 			templateData.initiatorBuild = initiator.build;
	// 			templateData.canManeuver = true;
	// 			templateData.initiator = initiator;
	// 			templateData.defender = target.actor;

	// 			const template = 'systems/CoC7/templates/chat/parts/defender-action.html';
	// 			const htmlDefenderActions = await renderTemplate(template, templateData);

	// 			let container = htmlCardContent[0].querySelector('.defenders-actions-container');
	// 			container.insertAdjacentHTML('beforeend', htmlDefenderActions);
	// 		}
	// 	}

	// 	const newCardData={
	// 		user: game.user._id,
	// 		content: htmlCardContent[0].outerHTML
	// 	};

	// 	oldCard.update(newCardData).then( resultMessage => {
	// 		ui.chat.updateMessage( resultMessage);
	// 		return resultMessage;
	// 	});
	// }

}