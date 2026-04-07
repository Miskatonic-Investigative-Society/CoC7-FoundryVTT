/* global CONFIG foundry game */
import { FOLDER_ID } from '../constants.js'
import CoC7Utilities from './utilities.js'

export default class CoC7RollAsModifierDialog extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  /**
   * @inheritdoc
   */
  constructor (...args) {
    const coc7Config = args.pop()
    super(...args)
    this.coc7Config = coc7Config
    this.coc7Config.allSkills = {}
    game.CoC7.cocid.fromCoCIDRegexBest({ cocidRegExp: /^i\.skill\./, type: 'i', showLoading: true }).then((items) => {
      for (const item of items) {
        this.coc7Config.allSkills[item.flags.CoC7.cocidFlag.id] = item.name
      }
      if (this.coc7Config.type === 'SKILL') {
        this.render({ force: true })
      }
    })
  }

  /**
   * Active Effect Method
   * @returns {object}
   */
  static get ACTIVE_EFFECT_METHODS () {
    return {
      NONE: 'NONE',
      GROUPED: 'GROUPED',
      INDIVIDUAL: 'INDIVIDUAL'
    }
  }

  /**
   * Active Effect Method
   * @returns {object}
   */
  static get ACTIVE_EFFECT_METHOD_NAMES () {
    return {
      [CoC7RollAsModifierDialog.ACTIVE_EFFECT_METHODS.NONE]: 'CoC7.RollAsModifier.ActiveEffect.None',
      [CoC7RollAsModifierDialog.ACTIVE_EFFECT_METHODS.GROUPED]: 'CoC7.RollAsModifier.ActiveEffect.Grouped',
      [CoC7RollAsModifierDialog.ACTIVE_EFFECT_METHODS.INDIVIDUAL]: 'CoC7.RollAsModifier.ActiveEffect.Individual'
    }
  }

  /**
   * Modifiable Attributes
   * @returns {object}
   */
  static get ATTRIBUTES () {
    return ['hp', 'mp', 'lck', 'san', 'armor']
  }

  /**
   * Modifiable Attributes
   * @returns {object}
   */
  static get CHARACTERISTICS () {
    return ['str', 'con', 'siz', 'dex', 'app', 'int', 'pow', 'edu']
  }

  /**
   * Modifier Types
   * @returns {object}
   */
  static get MODIFIERS () {
    return {
      NONE: 'NONE',
      DAMAGE_MODIFY: 'DAMAGE_MODIFY',
      HEAL_MODIFY: 'HEAL_MODIFY'
    }
  }

  /**
   * Modifier Types
   * @returns {object}
   */
  static get MODIFIER_NAMES () {
    return {
      [CoC7RollAsModifierDialog.MODIFIERS.NONE]: 'CoC7.RollAsModifier.Modifier.None',
      [CoC7RollAsModifierDialog.MODIFIERS.DAMAGE_MODIFY]: 'CoC7.RollAsModifier.Modifier.DamageNumber',
      [CoC7RollAsModifierDialog.MODIFIERS.HEAL_MODIFY]: 'CoC7.RollAsModifier.Modifier.HealNumber'
    }
  }

  /**
   * Damage To
   * @returns {object}
   */
  static get TYPES () {
    return {
      ATTRIBUTE: 'ATTRIBUTE',
      CHARACTERISTIC: 'CHARACTERISTIC',
      SKILL: 'SKILL'
    }
  }

  /**
   * Damage To
   * @returns {object}
   */
  static get TYPE_NAMES () {
    return {
      [CoC7RollAsModifierDialog.TYPES.ATTRIBUTE]: 'CoC7.RollAsModifier.Type.Attribute',
      [CoC7RollAsModifierDialog.TYPES.CHARACTERISTIC]: 'CoC7.RollAsModifier.Type.Characteristic',
      [CoC7RollAsModifierDialog.TYPES.SKILL]: 'CoC7.RollAsModifier.Type.Skill'
    }
  }

  static DEFAULT_OPTIONS = {
    tag: 'form',
    classes: ['coc7', 'dialog', 'roll-as-modifier'],
    window: {
      title: 'CoC7.RollAsModifier.Title',
      contentClasses: [
        'standard-form'
      ]
    },
    form: {
      closeOnSubmit: false,
      handler: CoC7RollAsModifierDialog.#onSubmit
    },
    position: {
      width: 500
    }
  }

  static PARTS = {
    form: {
      template: 'systems/' + FOLDER_ID + '/templates/apps/roll-as-modifier.hbs',
      scrollable: ['']
    },
    footer: {
      template: 'templates/generic/form-footer.hbs'
    }
  }

  /**
   * Create popup
   * @param {document} message
   * @returns {string}
   */
  static async create ({ message } = {}) {
    const modifier = message.flags[FOLDER_ID]?.load?.modifier ?? CoC7RollAsModifierDialog.MODIFIERS.DAMAGE_MODIFY
    const type = message.flags[FOLDER_ID]?.load?.type ?? CoC7RollAsModifierDialog.TYPES.ATTRIBUTE
    const activeEffect = message.flags[FOLDER_ID]?.load?.activeEffect ?? CoC7RollAsModifierDialog.ACTIVE_EFFECT_METHODS.NONE
    const value = message.flags[FOLDER_ID]?.load?.value ?? 'hp'
    return await new Promise(resolve => {
      new CoC7RollAsModifierDialog({}, {}, {
        activeEffect,
        message,
        modifier,
        resolve,
        type,
        value: {
          ATTRIBUTE: (type === CoC7RollAsModifierDialog.TYPES.ATTRIBUTE ? value : ''),
          CHARACTERISTIC: (type === CoC7RollAsModifierDialog.TYPES.CHARACTERISTIC ? value : ''),
          SKILL: (type === CoC7RollAsModifierDialog.TYPES.SKILL ? value : '')
        }
      }).render({ force: true })
    })
  }

  /**
   * Submit the configuration form.
   * @param {SubmitEvent} event
   * @param {HTMLFormElement} form
   * @param {FormDataExtended} formData
   * @returns {Promise<void>}
   */
  static async #onSubmit (event, form, formData) {
    this.coc7Config.value[this.coc7Config.type] = formData.object.value
    if (event.submitter.dataset.action !== 'validate') {
      switch (event.submitter.dataset.set) {
        case 'activeEffect':
        case 'modifier':
          this.coc7Config[event.submitter.dataset.set] = event.submitter.dataset.property
          break
        case 'type':
          this.coc7Config.type = event.submitter.dataset.property
          break
      }
      this.render({ force: true })
      return
    }
    let name = ''
    switch (this.coc7Config.type) {
      case CoC7RollAsModifierDialog.TYPES.ATTRIBUTE:
        name = CONFIG.Actor.dataModels.character.schema.getField('attribs').getField(this.coc7Config.value[this.coc7Config.type]).hint
        break
      case CoC7RollAsModifierDialog.TYPES.CHARACTERISTIC:
        name = CONFIG.Actor.dataModels.character.schema.getField('characteristics').getField(this.coc7Config.value[this.coc7Config.type]).hint
        break
      case CoC7RollAsModifierDialog.TYPES.SKILL:
        name = this.coc7Config.allSkills[this.coc7Config.value[this.coc7Config.type]]
        break
    }

    this.coc7Config.resolve({
      activeEffect: this.coc7Config.activeEffect,
      modifier: this.coc7Config.modifier,
      name,
      type: this.coc7Config.type,
      value: this.coc7Config.value[this.coc7Config.type]
    })
    this.close()
  }

  /**
   * @inheritdoc
   * @param {string} partId
   * @param {ApplicationRenderContext} context
   * @param {HandlebarsRenderOptions} options
   * @returns {Promise<ApplicationRenderContext>}
   */
  async _preparePartContext (partId, context, options) {
    context = await super._preparePartContext(partId, context, options)

    switch (partId) {
      case 'form':
        {
          context._modifier = []
          context.modifier = this.coc7Config.modifier
          const options = Object.keys(CoC7RollAsModifierDialog.MODIFIER_NAMES)
          for (const id of options) {
            context._modifier.push({
              id,
              name: CoC7RollAsModifierDialog.MODIFIER_NAMES[id],
              tooltip: '',
              isEnabled: this.coc7Config.modifier === id
            })
          }
        }
        {
          context._type = []
          context.type = this.coc7Config.type
          const options = Object.keys(CoC7RollAsModifierDialog.TYPE_NAMES)
          for (const id of options) {
            context._type.push({
              id,
              name: CoC7RollAsModifierDialog.TYPE_NAMES[id],
              tooltip: '',
              isEnabled: this.coc7Config.type === id
            })
          }
        }
        {
          context._activeEffect = []
          context.activeEffect = this.coc7Config.activeEffect
          const options = Object.keys(CoC7RollAsModifierDialog.ACTIVE_EFFECT_METHOD_NAMES)
          for (const id of options) {
            context._activeEffect.push({
              id,
              name: CoC7RollAsModifierDialog.ACTIVE_EFFECT_METHOD_NAMES[id],
              tooltip: '',
              isEnabled: this.coc7Config.activeEffect === id
            })
          }
        }
        context._values = []
        context.value = this.coc7Config.value[this.coc7Config.type] ?? ''
        switch (this.coc7Config.type) {
          case CoC7RollAsModifierDialog.TYPES.ATTRIBUTE:
            {
              const options = CoC7RollAsModifierDialog.ATTRIBUTES
              for (const key of options) {
                const val = CONFIG.Actor.dataModels.character.defineSchema().attribs.getField(key).hint ?? false
                if (val) {
                  context._values.push({
                    key,
                    name: game.i18n.localize(val)
                  })
                }
              }
            }
            break
          case CoC7RollAsModifierDialog.TYPES.CHARACTERISTIC:
            {
              const options = CoC7RollAsModifierDialog.CHARACTERISTICS
              for (const key of options) {
                const val = CONFIG.Actor.dataModels.character.defineSchema().characteristics.getField(key).hint ?? false
                if (val) {
                  context._values.push({
                    key,
                    name: game.i18n.localize(val)
                  })
                }
              }
            }
            break
          case CoC7RollAsModifierDialog.TYPES.SKILL:
            for (const key of Object.keys(this.coc7Config.allSkills)) {
              context._values.push({
                key,
                name: game.i18n.localize(this.coc7Config.allSkills[key])
              })
            }
        }
        context._values.sort(CoC7Utilities.sortByNameKey)
        break
      case 'footer':
        context.buttons = [
          {
            type: 'submit',
            action: 'close',
            label: 'CoC7.Cancel',
            icon: 'fa-solid fa-times'
          },
          {
            type: 'submit',
            action: 'validate',
            label: 'CoC7.Validate',
            icon: 'fa-solid fa-check'
          }
        ]
        break
    }
    return context
  }

  /**
   * @inheritdoc
   * @param {RenderOptions} options
   * @returns {Promise<HTMLElement>}
   */
  async _renderFrame (options) {
    const frame = await super._renderFrame(options)

    /* // FoundryV12 polyfill */
    if (!foundry.utils.isNewerVersion(game.version, 13)) {
      frame.setAttribute('open', true)
    }

    return frame
  }
}
