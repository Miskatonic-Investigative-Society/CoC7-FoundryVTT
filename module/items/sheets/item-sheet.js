import  { COC7 } from '../../config.js';

/**
 * Extend the basic ItemSheet with some very simple modifications
 */
export class CoCItemSheet extends ItemSheet {
	constructor(...args) {
		super(...args);
		this._sheetTab = 'items';
	}


	/**
   * Extend and override the default options used by the Simple Item Sheet
   * @returns {Object}
   */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ['coc7', 'sheet', 'item'],
			width: 520,
			height: 480,
			tabs: [{navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'skills'}]
		});
	}

  
	/* -------------------------------------------- */

	/** @override */
	get template() {
		const path = 'systems/CoC7/templates/items';
		return `${path}/${this.item.data.type}-sheet.html`;
	}

	/* -------------------------------------------- */
  
	/* -------------------------------------------- */

	/**
   * Prepare data for rendering the Item sheet
   * The prepared data object contains both the actor data as well as additional sheet options
   */
	getData() {
		// this.item.checkSkillProperties();
		const data = super.getData();
		data.hasOwner = this.item.actor != null;
		
		if( this.item.data.type == 'skill'){
			
			data._properties = [];
			for( let [key, value] of Object.entries(COC7['skillProperties']))
			{
				let property = {};
				property.id = key;
				property.name = value;
				property.isEnabled = this.item.data.data.properties[key] == true;
				data._properties.push(property);
			}

			data._eras = [];
			for( let [key, value] of Object.entries(COC7['eras']))
			{
				let era = {};
				era.id = key;
				era.name = value;
				era.isEnabled = this.item.data.data.eras[key] == true;
				data._eras.push(era);
			}

			data.isSpecialized = this.item.data.data.properties.special;
			data.canModifySpec = !this.item.data.data.properties.firearm && !this.item.data.data.properties.fighting;
		}    
		return data;
	}

	/* -------------------------------------------- */

	/**
   * Activate event listeners using the prepared sheet HTML
   * @param html {HTML}   The prepared HTML object ready to be rendered into the DOM
   */
	activateListeners(html) {
		super.activateListeners(html);
		// Everything below here is only needed if the sheet is editable
		if (!this.options.editable) return;

		html.find('.toggle-switch').click(this._onClickToggle.bind(this));
	}

	/* -------------------------------------------- */

	async _onClickToggle(event) {
		event.preventDefault();
		const propertyId = event.currentTarget.closest('.toggle-switch').dataset.property;
		await this.item.toggleProperty( propertyId, (event.metaKey || event.ctrlKey || event.keyCode == 91 || event.keyCode == 224));
	}


	// async _onClickAttributeControl(event) {
	//   event.preventDefault();
	//   const a = event.currentTarget;
	//   const action = a.dataset.action;
	//   const attrs = this.object.data.data.attributes;
	//   const form = this.form;

	//   // Add new attribute
	//   if (action === "create") {
	//     const nk = Object.keys(attrs).length + 1;
	//     let newKey = document.createElement("div");
	//     newKey.innerHTML = `<input type="text" name="data.attributes.attr${nk}.key" value="attr${nk}"/>`;
	//     newKey = newKey.children[0];
	//     form.appendChild(newKey);
	//     await this._onSubmit(event);
	//   }

	//   // Remove existing attribute
	//   else if (action === "delete") {
	//     const li = a.closest(".attribute");
	//     li.parentElement.removeChild(li);
	//     await this._onSubmit(event);
	//   }
	// }

	/* -------------------------------------------- */

	/**
   * Implement the _updateObject method as required by the parent class spec
   * This defines how to update the subject of the form when the form is submitted
   * @private
   */
	// _updateObject(event, formData) {
	//   // Handle the free-form attributes list
	//   const ford = expandObject(formData);
	//   const formAttrs = expandObject(formData).data.attributes || {};
	//   const attributes = Object.values(formAttrs).reduce((obj, v) => {
	//     let k = v["key"].trim();
	//     if (/[\s\.]/.test(k)) return ui.notifications.error("Attribute keys may not contain spaces or periods");
	//     delete v["key"];
	//     obj[k] = v;
	//     return obj;
	//   }, {});

	//   // Remove attributes which are no longer used
	//   for (let k of Object.keys(this.object.data.data.attributes)) {
	//     if (!attributes.hasOwnProperty(k)) attributes[`-=${k}`] = null;
	//   }

	//   // Re-combine formData
	//   formData = Object.entries(formData).filter(e => !e[0].startsWith("data.attributes")).reduce((obj, e) => {
	//     obj[e[0]] = e[1];
	//     return obj;
	//   }, { _id: this.object._id, "data.attributes": attributes });

	//   // Update the Item
	//   return this.object.update(formData);
	// }
}
