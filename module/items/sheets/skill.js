/* global foundry, game, ItemSheet, TextEditor */
import { addCoCIDSheetHeaderButton } from '../../scripts/coc-id-button.js'
import CoC7ActiveEffect from '../../active-effect.js'
import { COC7 } from '../../config.js'
import { CoC7Utilities } from '../../utilities.js'
import { isCtrlKey } from '../../chat/helper.js'

/**
 * Extend the basic ItemSheet with some very simple modifications
 */
export class CoC7SkillSheet extends ItemSheet {
  constructor (...args) {
    super(...args)
    this._sheetTab = 'items'
  }

  /**
   * Extend and override the default options used by the Simple Item Sheet
   * @returns {Object}
   */
  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['coc7', 'sheet', 'item'],
      width: 520,
      height: 480,
      scrollY: ['.tab.description'],
      tabs: [
        {
          navSelector: '.sheet-navigation',
          contentSelector: '.sheet-body',
          initial: 'description'
        }
      ]
    })
  }

  /** @override */
  get template () {
    return `systems/CoC7/templates/items/${this.item.type}-sheet.html`
  }

  _getHeaderButtons () {
    const headerButtons = super._getHeaderButtons()
    addCoCIDSheetHeaderButton(headerButtons, this)
    return headerButtons
  }

  /**
   * Prepare data for rendering the Item sheet
   * The prepared data object contains both the actor data as well as additional sheet options
   */
  async getData () {
    // this.item.checkSkillProperties();
    const sheetData = super.getData()

    sheetData.hasOwner = this.item.isEmbedded === true
    sheetData.hadNonCharacterOwner = sheetData.hasOwner && this.actor?.type !== 'character'

    sheetData.effects = CoC7ActiveEffect.prepareActiveEffectCategories(
      this.item.effects
    )

    sheetData._properties = []
    for (const [key, value] of Object.entries(COC7.skillProperties)) {
      sheetData._properties.push({
        id: key,
        name: value,
        isEnabled: this.item.system.properties[key] === true
      })
    }

    sheetData._eras = []
    for (const [key, value] of Object.entries(COC7.eras)) {
      sheetData._eras.push({
        id: key,
        name: game.i18n.localize(value),
        isEnabled: (this.item.flags?.CoC7?.cocidFlag?.eras ?? {})[key] === true
      })
    }
    sheetData._eras.sort(CoC7Utilities.sortByNameKey)

    sheetData.isSpecialized = this.item.system.properties.special
    sheetData.canModifySpec =
      !this.item.system.properties.firearm &&
      !this.item.system.properties.fighting

    sheetData.enrichedDescriptionValue = await TextEditor.enrichHTML(
      sheetData.data.system.description.value,
      {
        async: true,
        secrets: sheetData.editable
      }
    )

    sheetData.enrichedDescriptionKeeper = await TextEditor.enrichHTML(
      sheetData.data.system.description.keeper,
      {
        async: true,
        secrets: sheetData.editable
      }
    )

    sheetData.isKeeper = game.user.isGM
    return sheetData
  }

  /* -------------------------------------------- */

  /**
   * Activate event listeners using the prepared sheet HTML
   * @param html {HTML}   The prepared HTML object ready to be rendered into the DOM
   */
  activateListeners (html) {
    super.activateListeners(html)
    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return

    html.find('.toggle-switch').click(this._onClickToggle.bind(this))
  }

  /* -------------------------------------------- */

  async _onClickToggle (event) {
    event.preventDefault()
    const propertyId = event.currentTarget.closest('.toggle-switch').dataset.property
    await this.item.toggleProperty(
      propertyId,
      isCtrlKey(event)
    )
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
  //   const ford = foundry.utils.expandObject(formData);
  //   const formAttrs = foundry.utils.expandObject(formData).data.attributes || {};
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

  async _updateObject (event, formData) {
    const skillName = formData['system.skillName'] || this.item.system.skillName
    if (this.item.system.properties?.special) {
      const specialization = formData['system.specialization'] || this.item.system.specialization
      formData.name = specialization + ' (' + skillName + ')'
    } else {
      formData.name = skillName
    }
    return super._updateObject(event, formData)
  }
}
