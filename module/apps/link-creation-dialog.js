import { CoCActor } from '../actors/actor.js';
import { chatHelper } from '../chat/helper.js';
import { CoC7Check } from '../check.js';
import { CoC7Link } from './link.js';

export class CoC7LinkCreationDialog extends FormApplication{

	/** @override */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			id: 'link-creation',
			classes: ['coc7'],
			title: game.i18n.localize('CoC7.CreateLink'),
			dragDrop: [{dragSelector: null, dropSelector: '.container'}],
			template: 'systems/CoC7/templates/apps/link-creation.html',
			closeOnSubmit: false,
			submitOnClose: true,
			submitOnChange: true,
			width: 400,
			height: 'auto',
			choices: {},
			allowCustom: true,
			minimum: 0,
			maximum: null
		});
	}

	static async fromLinkData( linkData, options={}){
		const link = await CoC7Link.fromData( linkData);
		return new CoC7LinkCreationDialog(link, options);
	}

	/** @override */
	async getData() {
		const data = await super.getData();

		data.link = this.link;
		data.data = this.link.data;
		data.fromGame = this.link.is.item || (this.link.is.check && this.link.check == CoC7Link.CHECK_TYPE.SKILL);
		data.askId = data.fromGame && (this.link.data.fromDirectory || this.link.data.fromCompendium);
		data.askPack = data.fromGame && this.link.data.fromCompendium;
		data.isSetFromGame = data.askId || data.askPack;

		//Prepare difficulty select data
		data.difficultyLevel = CoC7Check.difficultyLevel;
		data.selectedDifficulty = {
			unknown: CoC7Check.difficultyLevel.unknown == this.link.data.difficulty,
			regular: CoC7Check.difficultyLevel.regular == this.link.data.difficulty,
			hard: CoC7Check.difficultyLevel.hard == this.link.data.difficulty,
			extreme: CoC7Check.difficultyLevel.extreme == this.link.data.difficulty,
			critical: CoC7Check.difficultyLevel.critical == this.link.data.difficulty
		};
		if( !this.link.data.difficulty){
			if( 'unknown' === game.settings.get('CoC7', 'defaultCheckDifficulty')) data.selectedDifficulty.unknown = true;
			else data.selectedDifficulty.regular = true;
		}

		//Prepare link type
		data.linkType = [
			{
				key: CoC7Link.LINK_TYPE.CHECK,
				label: game.i18n.localize( 'CoC7.Check'),
				selected: this.link.is.check

			},{
				key: CoC7Link.LINK_TYPE.SANLOSS,
				label: game.i18n.localize( 'CoC7.SanityCheck'),
				selected: this.link.is.sanloss

			},{
				key: CoC7Link.LINK_TYPE.ITEM,
				label: game.i18n.localize( 'CoC7.ItemWeapon'),
				selected: this.link.is.item
	
			}
		];

		//Prepare check type data
		data.checkType = CoC7Link.CHECK_TYPE;
		data.selectedCheckType = {
			characteristic: CoC7Link.CHECK_TYPE.CHARACTERISTIC == this.link.check,
			attribute: CoC7Link.CHECK_TYPE.ATTRIBUTE == this.link.check,
			skill: CoC7Link.CHECK_TYPE.SKILL == this.link.check,
		};
		if( !this.link.check) data.selectedCheckType.characteristic = true;

		//Prepare characteristics
		data.characteristics = CoCActor.getCharacteristicDefinition();
		for (let i = 0; i < data.characteristics.length; i++) {
			if( data.data.characteristicKey == data.characteristics[i].key||
				data.data.characteristicKey == data.characteristics[i].shortName ||
				data.data.characteristicKey == data.characteristics[i].label ) data.characteristics[i].selected = true;
			else data.characteristics[i].selected = false;			
		}

		//Prepare characteristics
		data.attributes = [
			{
				key: 'lck',
				label: game.i18n.localize( 'CoC7.Luck'),
				selected: data.data.attributeKey == 'lck'
			},
			{
				key: 'san',
				label: game.i18n.localize( 'CoC7.Sanity'),
				selected: data.data.attributeKey == 'san'
			}
		];
		

		return data;
	}

	get link(){
		return this.object;
	}

	activateListeners(html) {
		html.find('.submit-button').click(this._onClickSubmit.bind(this));
		
		// Replaced in options by dragDrop: [{dragSelector: null, dropSelector: '.container'}]
		// const dragDrop = new DragDrop({
		// 	dropSelector: '.container',
		// 	callbacks: { drop: this._onDrop.bind(this) }
		// });
		// const test = dragDrop.bind(html[0]);

		super.activateListeners( html);
	}

	async _onDrop( event){
		const dataString = event.dataTransfer.getData('text/plain');
		const data = JSON.parse( dataString);
		if( data.CoC7Type == 'link'){
			await this.link.updateFromLink( data);
			this.render(true);
		} else {
			if( data.actorId){
				const actorKey = data.sceneId&&data.tokenId?`${data.sceneId}.${data.tokenId}`:data.actorId;
				const actor = chatHelper.getActorFromKey( actorKey);
				if( actor.hasPlayerOwner){
					this.link.hasPlayerOwner = true;
					this.link.actorKey = actor.actorKey;
				} else this.link.hasPlayerOwner = false;
			}
			if( 'Item' == data.type){
				if( !data.data){
					if( data.id) {
						this.link._linkData.id = data.id;
						this.link._linkData.fromDirectory = true;
					}
					if( data.pack){
						this.link._linkData.pack = data.pack;
						this.link._linkData.fromDirectory = false;
						this.link._linkData.fromCompendium = true;
					}
					await this.link.fetchItem();
					this.render( true);
				} else switch( data.data.type){
				case 'skill':
					this.link._linkData.fromDirectory = false;
					this.link._linkData.fromCompendium = false;
					this.link.type = CoC7Link.LINK_TYPE.CHECK;
					this.link.check = CoC7Link.CHECK_TYPE.SKILL;
					this.link.name = data.data.name;
					this.render(true);
					break;
				case'weapon':
					this.link._linkData.fromDirectory = false;
					this.link._linkData.fromCompendium = false;
					this.link.type = CoC7Link.LINK_TYPE.ITEM;
					this.link.name = data.data.name;
					this.render(true);

					break;
				default:
					break;

				}
			}
		}
	}

	_onClickSubmit(event){
		const action = event.currentTarget.dataset.action;
		if( !this.link.link){
			ui.notifications.warning( 'Link is invalid !');
			return;
		}
		switch (action) {
		case 'clipboard':
			navigator.clipboard.writeText(this.link.link);
			break;

		case 'chat':{
			const option = {};
			option.speaker = {
				alias: game.user.name
			};
			chatHelper.createMessage( null, game.i18n.format('CoC7.MessageCheckRequestedWait', {check: this.link.link}), option);
		}
			break;

		case 'whisper-owner':{
			const option = {};
			option.speaker = {
				alias: game.user.name,
			};
			option.whisper = this.link.actor.owners;
			chatHelper.createMessage( null, game.i18n.format('CoC7.MessageTargetCheckRequested', {name: this.link.actor.name, check: this.link.link}), option);
		}
			break;

		case 'whisper-selected':{
			if( !canvas.tokens.controlled.length) {
				ui.notifications.warn('No tokens selected');
				return;}
			const option = {};
			option.speaker = {
				alias: game.user.name,
			};
			canvas.tokens.controlled.forEach( t =>{
				if( t.actor.hasPlayerOwner){
					option.whisper = t.actor.owners;
					chatHelper.createMessage( null, game.i18n.format('CoC7.MessageTargetCheckRequested', {name: t.actor.name, check: this.link.link}), option);
				}
			});
		}
			break;
		
		default:
			break;
		}
		this.close();
	}

	/** @override
	 * A subclass of the FormApplication must implement the _updateObject method.
	 */
	async _updateObject(event, formData) {
		const target = event.currentTarget;
		const group = target?.closest( '.form-group');
		const groupName = group?.dataset.group;
		if( 'origin' == groupName){ // Deprecated
			if( target.name == 'fromCompendium') {
				this.link._linkData.fromCompendium = !this.link._linkData.fromCompendium;
				if( this.link._linkData.fromCompendium) this.link._linkData.fromDirectory = false;
			}
			if( target.name == 'fromDirectory') {
				this.link._linkData.fromDirectory = !this.link._linkData.fromDirectory;
				if( this.link._linkData.fromDirectory) this.link._linkData.fromCompendium = false;
			}
			await this.link.fetchItem();
		} else {
			const formDataEx = expandObject( formData);
			if( formDataEx.check) formDataEx.check = Number(formDataEx.check);
			if( formDataEx.difficulty) formDataEx.difficulty = Number(formDataEx.difficulty);
			if( formDataEx.type) formDataEx.type = Number(formDataEx.type);
			const diffData = diffObject(this.link.data, formDataEx);
			await this.link.update( diffData);
		}
		this.render(true);
	}

	// /** @override */
	// _getSubmitData(updateData={}) {
	// 	ui.notifications.info(`_getSubmitData: ${updateData}`);

	// 	// Create the expanded update data object
	// 	const fd = new FormDataExtended(this.form, {editors: this.editors});
	// 	let data = fd.toObject();
	// 	if ( updateData ) data = mergeObject(data, updateData);
	// 	else data = expandObject(data);
	
	// 	// Handle Damage array
	// 	const damage = data.data?.damage;
	// 	if ( damage ) damage.parts = Object.values(damage?.parts || {}).map(d => [d[0] || '', d[1] || '']);
	
	// 	// Return the flattened submission data
	// 	return flattenObject(data);
	// }

	// /** @override */
	// _onSubmit

	static async create(){
		const link = new CoC7Link();
		new CoC7LinkCreationDialog(link, {}).render(true);
	}
}
