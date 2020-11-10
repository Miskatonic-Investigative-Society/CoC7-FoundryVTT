import { CoC7ActorSheet } from './base.js';


/**
 * Extend the basic ActorSheet with some very simple modifications
 */
export class CoC7CharacterSheet extends CoC7ActorSheet {
	/**
	 * Prepare data for rendering the Actor sheet
	 * The prepared data object contains both the actor data as well as additional sheet options
	*/
	getData() {
		const data = super.getData();

		if( this.actor.occupation){
			data.data.infos.occupation = this.actor.occupation.name;
			data.data.infos.occupationSet = true;
		} else data.data.infos.occupationSet = false;

		if( this.actor.archetype){
			data.data.infos.archetype = this.actor.archetype.name;
			data.data.infos.archetypeSet = true;
		} else data.data.infos.archetypeSet = false;

		data.totalExperience = this.actor.experiencePoints;
		data.totalOccupation = this.actor.occupationPointsSpent;
		data.invalidOccupationPoints = ( this.actor.occupationPointsSpent != Number(this.actor.data.data.development?.occupation));
		data.totalArchetype = this.actor.archetypePointsSpent;
		data.invalidArchetypePoints = ( this.actor.archetypePointsSpent != Number(this.actor.data.data.development?.archetype));
		data.totalPersonal = this.actor.personalPointsSpent;
		data.invalidPersonalPoints = ( this.actor.personalPointsSpent != Number(this.actor.data.data.development?.personal));
		data.creditRatingMax = Number(this.actor.occupation?.data.data.creditRating.max);
		data.creditRatingMin = Number(this.actor.occupation?.data.data.creditRating.min);
		data.invalidCreditRating = ( this.actor.creditRatingSkill?.data.data.adjustments?.occupation > data.creditRatingMax || this.actor.creditRatingSkill?.data.data.adjustments?.occupation < data.creditRatingMin);
		data.pulpTalentCount = data.itemsByType.talent?.length ? data.itemsByType.talent?.length : 0;
		data.minPulpTalents = this.actor.archetype?.data.data.talents ? this.actor.archetype?.data.data.talents : 0;
		data.invalidPulpTalents = data.pulpTalentCount < data.minPulpTalents;


		data.hasSkillFlaggedForExp = this.actor.hasSkillFlaggedForExp;

		data.allowDevelopment = game.settings.get('CoC7', 'developmentEnabled');
		data.allowCharCreation = game.settings.get( 'CoC7', 'charCreationEnabled');
		data.showDevPannel = data.allowDevelopment || data.allowCharCreation;

		data.manualCredit = this.actor.getActorFlag('manualCredit');
		if( !data.manualCredit){
			data.credit = {};
			let factor;
			let moneySymbol;
			if( !data.data.credit){ 
				factor = 1;
				moneySymbol = '$';
			}
			else {
				factor = parseInt(data.data.credit.multiplier)? parseInt(data.data.credit.multiplier): 1;
				moneySymbol = data.data.credit.monetarySymbol? data.data.credit.monetarySymbol: '$';
			}

			data.credit.spendingLevel = `${this.actor.spendingLevel*factor}${moneySymbol}`;
			data.credit.assets = `${this.actor.assets*factor}${moneySymbol}`;
			data.credit.cash = `${this.actor.cash*factor}${moneySymbol}`;
		}

		return data;
	}

	/* -------------------------------------------- */

	activateListeners(html) {
		super.activateListeners(html);

		if ( this.actor.owner ) {
			html.find('.skill-name.rollable.flagged4dev').click( async (event) => this._onSkillDev(event));
			html.find('.reset-occupation').click( async () => await this.actor.resetOccupation());
			html.find('.reset-archetype').click( async () => await this.actor.resetArchetype());
			html.find('.open-item').click( event => this._onItemDetails(event));
		}
	}


	async _onSkillDev( event){
		event.preventDefault();
		const skillId = event.currentTarget.closest( '.item').dataset.itemId;
		await this.actor.developSkill( skillId, event.shiftKey);
	}

	_onItemDetails( event){
		event.preventDefault();
		const type = event.currentTarget.dataset.type;
		const item = this.actor[type];
		if( item) item.sheet.render(true);
	}

	/**
   	 * Extend and override the default options used by the 5e Actor Sheet
   	 * @returns {Object}
	*/
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ['coc7', 'sheet', 'actor', 'character'],
			template: 'systems/CoC7/templates/actors/character-sheet.html',
			width: 600,
			height: 650,
			dragDrop: [{dragSelector: '.item', dropSelector: null}],
			tabs: [{navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'skills'}]
		});
	}
}
