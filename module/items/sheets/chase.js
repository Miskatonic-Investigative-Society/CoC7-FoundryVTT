import { CoC7Chat } from '../../chat.js';
import { chatHelper } from '../../chat/helper.js';

export class CoC7ChaseSheet extends ItemSheet {
	// constructor( ...args) {
	// 	super( ...args);
	// }

	/**
     * Extend and override the default options used by the Simple Item Sheet
     * @returns {Object}
     */
	static get defaultOptions() {
		const options = mergeObject(super.defaultOptions, {
			classes: ['coc7', 'sheetV2', 'item', 'chase'],
			width: 500,
			height: 500,
			tabs: [{navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'skills'}]
		});

		return options;

		// closeOnSubmit: false,
		// submitOnClose: true,
	}

  
	/* -------------------------------------------- */

	/** @override */
	get template() {
		return 'systems/CoC7/templates/items/chase.html';
	}

	/** @override */
	getData(options={}) {
		const data = super.getData(options);
		data.participants = [];
		this.participants.forEach( p => {
			data.participants.push( new _participant( p));
		});
		return data;
	}

	get participants(){
		return this.item.data.data.participants;
	}

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);

		html.on('dblclick', '.open-actor', CoC7Chat._onOpenActor.bind(this));

		html.find( '.participant').on('dragenter', (event)=> this._onDragEnterParticipant(event));
		html.find( '.participant').on('dragover', (event)=> this._onDragEnterParticipant(event));
		html.find( '.participant').on('dragleave', (event)=> this._onDragLeaveParticipant(event));
		html.find( '.participant').on('drop', (event)=> this._onDragLeaveParticipant(event));

		html.find( '.p-side').click(this._onChangeSide.bind(this));
		html.find( '.delete-participant').click(this._onDeleteParticipant.bind(this));
		html.find( '.delete-driver').click(this._onDeleteDriver.bind(this));

		const participantDragDrop = new DragDrop({
			dropSelector: '.participant',
			callbacks: { drop: this._onDropParticipant.bind(this) }
		});
		participantDragDrop.bind(html[0]);

		const newParticipantDragDrop = new DragDrop({
			dropSelector: '.new-participant',
			callbacks: { drop: this._onAddParticipant.bind(this) }
		});
		newParticipantDragDrop.bind(html[0]);
	}

	/* -------------------------------------------- */
	/*  Form Submission                             */
	/* -------------------------------------------- */

	/** @override */
	_getSubmitData(updateData={}) {

		// Create the expanded update data object
		const fd = new FormDataExtended(this.form, {editors: this.editors});
		let data = fd.toObject();
		if ( updateData ) data = mergeObject(data, updateData);
		else data = expandObject(data);

		if( data.data.participants){
			const participants = duplicate( this.participants);
			// Handle participants array
			for ( let [k, v] of Object.entries( data.data.participants) ) {
				const index = Number( k);
				const original = participants[Number(index)];
				const cleaned = clean(v);
				mergeObject( original, cleaned);
				participants[index] = original;
			}
		
			data.data.participants = participants;
		}
		// const participants = data.data?.participants;
		// if( participants) data.data.participants = Object.values( participants).map( p => clean(p));
		
		// Return the flattened submission data
		return flattenObject(data);
	}

	/** @override */
	// async _onSubmit(...args) {
	// 	await super._onSubmit(...args);
	// }

	async _updateObject(event, formData) {
		const target = event.currentTarget;
		const override = 'true' == target?.dataset?.override;
		if( override){
			const [,type,sIndex,subType,data] = target.name.split('.');
			const index = Number( sIndex);
			if( 'participants' == type && !isNaN(index) && 'check' == subType){
				if( 'name' == data){
					const participants = this.item.data.data.participants? duplicate( this.item.data.data.participants):[];
					if( participants[index].check){
						delete participants[index].check.id;
						delete participants[index].check.type;
					} else participants[index].check = {};
					participants[index].check.name = target.value;
					await this.item.update( { 'data.participants': participants});
				}
			}
		}
		super._updateObject( event, formData);
	}

	async _onDropParticipant( event){
		const target = event.currentTarget;
		const index = target.dataset?.index;
		if( !index) return;
		const dataString = event.dataTransfer.getData('text/plain');
		const data = JSON.parse( dataString);
		await this.alterParticipant(data, Number(index));
		ui.notifications.info( `Dropped ${data.type}`);
	}

	async _onAddParticipant( event){
		const dataString = event.dataTransfer.getData('text/plain');
		const data = JSON.parse( dataString);
		await this.addParticipant( data);
	}

	async _onDragEnterParticipant( event) {
		const target = event.currentTarget;
		target.classList.add( 'drag-over');
	}

	async _onDragLeaveParticipant( event) {
		const target = event.currentTarget;
		target.classList.remove( 'drag-over');
	}

	async _onChangeSide( event){
		const target = event.currentTarget;
		const participant = target.closest('.participant');
		const index = participant.dataset.index;
		const participants = this.item.data.data.participants?duplicate( this.item.data.data.participants):[];
		participants[index].chaser = !participants[index].chaser;
		await this.item.update( { 'data.participants': participants});
	}

	async _onDeleteDriver( event){
		const target = event.currentTarget;
		const driver = target.closest('.driver');
		const index = driver.dataset.index;
		const participants = this.item.data.data.participants?duplicate( this.item.data.data.participants):[];		
		const participant = participants[index];
		delete participant.actorKey;
		await this.item.update( { 'data.participants': participants});
	}

	async _onDeleteParticipant( event){
		const target = event.currentTarget;
		const participant = target.closest('.participant');
		const index = participant.dataset.index;
		const participants = this.item.data.data.participants?duplicate( this.item.data.data.participants):[];
		participants.splice(index, 1);
		await this.item.update( { 'data.participants': participants});
	}

	async alterParticipant( data, index){
		const actorKey = (data.sceneId && data.tokenId)?`${data.sceneId}.${data.tokenId}`:data.actorId||data.actorKey||data.id;
		const participant = {};
		const actor = chatHelper.getActorFromKey( actorKey);
		if( actor){
			if( 'vehicle' == actor.data.type) participant.vehicleKey = actorKey;
			else participant.actorKey = actorKey;
		}

		switch (data.type?.toLowerCase()) {
		case 'actor':
			break;
		case 'item':
			participant.check = {
				id: data.data._id,
				type:'item'
			};
			break;
		case 'characteristic':
			participant.check = {
				id: data.name,
				type:'characteristic'
			};
			break;
		case 'attribute':
			participant.check = {
				id: data.name,
				type:'attribute'
			};
			break;
							
		default:
			break;
		}

		const participants = this.item.data.data.participants?duplicate( this.item.data.data.participants):[];
		const oldParticipant = participants[index];
		if( oldParticipant.mov) delete oldParticipant.mov;
		mergeObject( oldParticipant, participant);
		await this.item.update( { 'data.participants': participants});
	}

	async addParticipant( data){

		const actorKey = (data.sceneId && data.tokenId)?`${data.sceneId}.${data.tokenId}`:data.actorId||data.actorKey||data.id;
		const participant = {};
		const actor = chatHelper.getActorFromKey( actorKey);
		if( actor){
			if( 'vehicle' == actor.data.type) participant.vehicleKey = actorKey;
			else participant.actorKey = actorKey;
		}

		// const participant = {
		// 	actorKey : (data.sceneId && data.tokenId)?`${data.sceneId}.${data.tokenId}`:data.actorId||data.actorKey||data.id
		// };
		// const actor = chatHelper.getActorFromKey( participant.actorKey);
		// if( !actor) delete participant.actorKey;
		
		switch (data.type?.toLowerCase()) {
		case 'actor':
			break;
		case 'item':{
			if( data.id){
				const item = game.items.get( data.id);
				if( 'skill' != item?.data?.type) return;
			}

			participant.check = {
				id: data.data?._id||data.id,
				type:'item'
			};
		}
			break;
		case 'characteristic':
			participant.check = {
				id: data.name,
				type:'characteristic'
			};
			break;
		case 'attribute':
			participant.check = {
				id: data.name,
				type:'attribute'
			};
			break;
						
		default:
			break;
		}

		const participants = this.item.data.data.participants?duplicate( this.item.data.data.participants):[];
		participants.push( participant);
		await this.item.update( { 'data.participants': participants});
	}
}

export function clean( obj){
	for (var propName in obj) {
		let tp = getType( obj[propName]);
		if( 'Object' == tp){
			obj[propName] = clean( obj[propName]);
		}

		if( 'Object' == tp && !Object.entries(obj[propName]).length)
			delete obj[propName];
		else if (obj[propName] === null || obj[propName] === undefined) 
			delete obj[propName];
		else if( 'string' == tp && !obj[propName].length)
			delete obj[propName];
		else if( 'string' == tp && !isNaN(Number(obj[propName])))
			obj[propName] = Number(obj[propName]);

	}
	return obj;
}

export class _participant{
	constructor( data={}){
		this.data = data;
	}

	get actor(){
		if( !this._actor) this._actor = chatHelper.getActorFromKey( this.data.actorKey);
		return this._actor;
	}

	get driver(){
		if( !this._driver) this._driver = chatHelper.getActorFromKey( this.data.actorKey);
		return this._driver;
	}

	get vehicle(){
		if( this.data.vehicleKey) this._vehicle = chatHelper.getActorFromKey( this.data.vehicleKey);
		return this._vehicle;
	}

	get hasActor(){
		return( !!this.actor);
	}

	get hasVehicle(){
		return( !!this.vehicle);
	}

	get name(){
		if( this.hasVehicle) return this.vehicle.name;
		if( this.hasActor) return this.actor.name;
		return this.data.name||undefined;
	}

	get mov(){
		if( !this.data.mov) {
			if( this.hasVehicle) this.data.mov = this.vehicle.mov;
			else if( this.hasActor) this.data.mov = this.actor.mov;
		}
		if( this.data.mov)
			if( !isNaN( Number(this.data.mov)))
				this.data.hasValidMov = true;
			else
				this.data.hasValidMov = false;
		return this.data.mov||undefined;
	}

	get chaser(){
		return !!this.data.chaser;
	}

	get hasDriver(){
		return this.hasVehicle && this.hasActor;
	}

	// get options(){
	// 	return {
	// 		exclude: [],
	// 		excludeStartWith: '_'
	// 	};
	// }

	// get dataString(){
	// 	return JSON.stringify(this, (key,value)=>{
	// 		if( null === value) return undefined;
	// 		if( this.options.exclude?.includes(key)) return undefined;
	// 		if( key.startsWith(this.options.excludeStartWith)) return undefined;
	// 		return value;
	// 	});
	// }

	get check(){
		const check = {};
		if( this.data.check?.name) check.name = this.data.check.name;
		if( this.hasActor){
			check.options=[];
			['con'].forEach( c =>{
				const characterisitc = this.actor.getCharacteristic( c);
				if( characterisitc?.value) check.options.push( characterisitc.label);
			});

			this.actor.driveSkills.forEach( s => {
				check.options.push( s.name);				
			});

			this.actor.pilotSkills.forEach( s => {
				check.options.push( s.name);				
			});
			check.hasOptions = !!check.options.length;

			if( this.data.check?.id){
				const item = this.actor.find( this.data.check.id);
				if( item){
					if( 'item' == item.type && 'skill' == item.value.data?.type ){
						check.ref = item.value;
						check.name = item.value.name;
						check.type = 'skill';
						check.isSkill = true;
						check.refSet = true;
						check.score = item.value.value;
					}
					if( 'characteristic' == item.type){
						check.ref = item.value;
						check.name = item.value.label;
						check.type = 'characteristic';
						check.isCharacteristic = true;
						check.refSet = true;
						check.score = item.value.value;
					}
					if( 'attribute' == item.type){
						check.ref = item.value;
						check.name = item.value.label;
						check.type = 'attribute';
						check.isAttribute = true;
						check.refSet = true;
						check.score = item.value.value;
					}
				}
			} else if( this.data.check?.name){
				const item = this.actor.find( this.data.check.name);
				if( item){
					if( 'item' == item.type && 'skill' == item.value.data?.type ){
						check.ref = item.value;
						check.name = item.value.name;
						check.type = 'skill';
						check.isSkill = true;
						check.refSet = true;
						check.score = item.value.value;
					}
					if( 'characteristic' == item.type){
						check.ref = item.value;
						check.name = item.value.label;
						check.type = 'characteristic';
						check.isCharacteristic = true;
						check.refSet = true;
						check.score = item.value.value;
					}
					if( 'attribute' == item.type){
						check.ref = item.value;
						check.name = item.value.label;
						check.type = 'attribute';
						check.isAttribute = true;
						check.refSet = true;
						check.score = item.value.value;
					}
				}
			}
		} else if( this.data.check?.id){
			const item = game.items.get( this.data.check.id);
			if( item){
				if( 'skill' == item.data?.type ){
					check.ref = item;
					check.name = item.name;
					check.type = 'skill';
					check.isSkill = true;
					check.refSet = true;
				}
			}
		}
		return check;
	}
}