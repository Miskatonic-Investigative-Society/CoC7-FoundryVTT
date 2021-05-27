import { CoC7Parser } from '../../apps/parser.js';
import { COC7 } from '../../config.js';
// import { CoCActor } from '../../actors/actor.js';

/**
 * Extend the basic ItemSheet with some very simple modifications
 */
export class CoC7BookSheet extends ItemSheet {
	/**
   * Activate event listeners using the prepared sheet HTML
   * @param html {HTML}   The prepared HTML object ready to be rendered into the DOM
   */
	activateListeners(html) {
		super.activateListeners(html);
		// Everything below here is only needed if the sheet is editable
		if (!this.options.editable) return;
		html.on('drop', (event) => this._onDrop(event));
		html.find('.spell .spell-name h4').click(event => this._onSpellSummary(event));
		html.find('.item-delete').click(this._onSpellDelete.bind(this));
		html.find('.increase-progress').click(this._increaseProgress.bind(this));
		html.find('.attempt-initial-reading').click(this._attemptInitialReading.bind(this));
	}

	async _onDrop(event){
		event.preventDefault();  
		event.stopPropagation();
		if( event.originalEvent) return;
		let data;
		try {
			data = JSON.parse(event.dataTransfer.getData('text/plain'));
			if (data.type !== 'Item') return;
		} catch (err) {
			return false;
		}

		let item;

		if (data.pack) {
			const pack = game.packs.get(data.pack);
			if (pack.metadata.entity !== 'Item') return;
			item = await pack.getEntity(data.id);
		} else if (data.data) {
			item = data;
		} else {
			item = game.items.get(data.id);
		}
		
		if (!item || !('spell' === item.data.type)) return;
		const spells = this.item.data.data.spells ? duplicate( this.item.data.data.spells) : [];
		spells.push( duplicate(item.data));
		await this.item.update( { 'data.spells' : spells});
		// const spells = this.item.data.data.spells;
		// spells.push( duplicate(item.data));
		// const update = {};
		// update.spells = spells;
		// await this.item.update( update);
		// this.item.createEmbeddedEntity('OwnedItem', duplicate(item.data));
		// }
	}

	async _increaseProgress() {
		await this.item.increaseBookProgress();
	}

	async _attemptInitialReading() {
		const language = this.item.data.data.language;
		const difficulty = this.item.data.data.difficultyLevel;
		if (await this.actor.attemptInitialReading(language, difficulty)) {
			console.log('yes!')
			await this.item.update({'data.initialReading': true});
			const initialMythos = this.item.data.data.gain.cthulhuMythos.CMI;
			const sanLoss = this.item.data.data.sanLoss;
			await this.actor.gainInitialReading(initialMythos, sanLoss);
		} else {
			const title = 'Blá';
			const message = 'Blá, blá';
			const speaker = {actor: this.actor};
			await chatHelper.createMessage(title, message, {speaker: speaker});
		}
	}

	_onSpellSummary(event) {
		event.preventDefault();
		let li = $(event.currentTarget).parents('.spell'),
			spell = this.item.data.data.spells.find(s => { return s._id === li.data('spell-id');});
		if (typeof spell.data.description === 'string') {
			spell.data.description = {
				value: spell.data.description
			};
		}
		let chatData = TextEditor.enrichHTML(spell.data.description.value);
		chatData = CoC7Parser.enrichHTML(chatData);
	
		// Toggle summary
		if ( li.hasClass('expanded') ) {
			let summary = li.children('.item-summary');
			summary.slideUp(200, () => summary.remove());
		} else {
			let div = $(`<div class="item-summary">${chatData}</div>`);
			let props = $('<div class="item-properties"></div>');
			// chatData.properties.forEach(p => props.append(`<span class="tag">${p}</span>`));
			div.append(props);
			li.append(div.hide());
			div.slideDown(200);
		}
		li.toggleClass('expanded');
	}

	async _onSpellDelete(event){
		let spellIndex = $(event.currentTarget).parents('.spell').data('spell-id');
		if( spellIndex) await this.removeSpell(spellIndex);
	}

	async removeSpell( spellId){
		const spellIndex = this.item.data.data.spells.findIndex( s => { return s._id === spellId;});
		if( -1 < spellIndex){
			const spells = this.item.data.data.spells ? duplicate( this.item.data.data.spells) : [];
			spells.splice(spellIndex, 1);
			await this.item.update( { 'data.spells' : spells});
		}
	}

	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ['coc7', 'sheet', 'book'],
			width: 520,
			height: 480,
			resizable: false,
			dragDrop: [{dragSelector: '.spell', dropSelector: null}],
			scrollY: ['.tab.description'],
			tabs: [{navSelector: '.sheet-navigation', contentSelector: '.sheet-body', initial: 'description'}]
		});
	}

	get template() {
		return 'systems/CoC7/templates/items/book.html';
	}

	_onDragStart(event) {
		let li = event.currentTarget.closest('.spell'),
			spell = this.item.data.data.spells.find(s => { return s._id === li.dataset.spellId;});

		const dragData = { type: 'Item', data: spell };
		event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
	}

	getData(){
		const data = super.getData();

		data.isGM = game.user.isGM;
		data.isOwned = this.item.isOwned;

		data.initialReading = this.item.data.data.initialReading;
		data.fullStudy = this.item.fullStudy;

		Handlebars.registerHelper('or', function (v1, v2, options) {
			return v1 || v2 ? options.fn(this) : options.inverse(this);
		});

		data.itemProperties = [];
		
		for (let [key, value] of Object.entries(data.data.type)) {
			if( value) data.itemProperties.push( COC7.bookType[key]?COC7.bookType[key]:null);
		}
		return data;
	}


}