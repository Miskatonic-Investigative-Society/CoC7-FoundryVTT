/* global CONFIG foundry game */
import { FOLDER_ID } from '../constants.js'

const SETTINGS = {
  pulpRules: {
    name: '',
    hint: '',
    scope: 'world',
    config: false,
    default: false,
    type: Boolean
  },
  initiativeRule: {
    name: 'SETTINGS.InitiativeRule',
    hint: 'SETTINGS.InitiativeRuleHint',
    scope: 'world',
    config: false,
    default: 'basic',
    type: String,
    choices: {
      basic: 'SETTINGS.InitiativeRuleBasic',
      optional: 'SETTINGS.InitiativeRuleOptional'
    },
    onChange: rule => CoC7SettingsGameRules.setInitiativeOptions(rule)
  },
  developmentRollForLuck: {
    name: 'SETTINGS.developmentRollForLuck',
    hint: 'SETTINGS.developmentRollForLuckHint',
    scope: 'world',
    config: false,
    default: false,
    type: Boolean
  },
  allowMythosHardened: {
    name: 'SETTINGS.allowMythosHardenedTitle',
    hint: 'SETTINGS.allowMythosHardenedHint',
    scope: 'world',
    config: false,
    default: false,
    type: Boolean
  },
  pulpRuleDoubleMaxHealth: {
    name: 'CoC7.Settings.PulpRules.DoubleMaxHealth.Name',
    hint: 'CoC7.Settings.PulpRules.DoubleMaxHealth.Hint',
    scope: 'world',
    config: false,
    default: false,
    type: Boolean
  },
  pulpRuleDevelopmentRollLuck: {
    name: 'CoC7.Settings.PulpRules.DevelopmentRollLuck.Name',
    hint: 'CoC7.Settings.PulpRules.DevelopmentRollLuck.Hint',
    scope: 'world',
    config: false,
    default: false,
    type: Boolean
  },
  pulpRuleArchetype: {
    name: 'CoC7.Settings.PulpRules.Archetype.Name',
    hint: 'CoC7.Settings.PulpRules.Archetype.Hint',
    scope: 'world',
    config: false,
    default: false,
    type: Boolean
  },
  pulpRuleOrganization: {
    name: 'CoC7.Settings.PulpRules.Organization.Name',
    hint: 'CoC7.Settings.PulpRules.Organization.Hint',
    scope: 'world',
    config: false,
    default: false,
    type: Boolean
  },
  pulpRuleTalents: {
    name: 'CoC7.Settings.PulpRules.Talents.Name',
    hint: 'CoC7.Settings.PulpRules.Talents.Hint',
    scope: 'world',
    config: false,
    default: false,
    type: Boolean
  },
  pulpRuleFasterRecovery: {
    name: 'CoC7.Settings.PulpRules.FasterRecovery.Name',
    hint: 'CoC7.Settings.PulpRules.FasterRecovery.Hint',
    scope: 'world',
    config: false,
    default: false,
    type: Boolean
  },
  pulpRuleIgnoreMajorWounds: {
    name: 'CoC7.Settings.PulpRules.IgnoreMajorWounds.Name',
    hint: 'CoC7.Settings.PulpRules.IgnoreMajorWounds.Hint',
    scope: 'world',
    config: false,
    default: false,
    type: Boolean
  },
  pulpRuleIgnoreAgePenalties: {
    name: 'CoC7.Settings.PulpRules.IgnoreAgePenalties.Name',
    hint: 'CoC7.Settings.PulpRules.IgnoreAgePenalties.Hint',
    scope: 'world',
    config: false,
    default: false,
    type: Boolean
  }
}

export default class CoC7SettingsGameRules extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: 'rules-settings',
    tag: 'form',
    window: {
      title: 'SETTINGS.TitleRules',
      contentClasses: [
        'standard-form'
      ]
    },
    form: {
      closeOnSubmit: true,
      handler: CoC7SettingsGameRules.#onSubmit
    },
    position: {
      width: 550
    },
    actions: {
      reset: CoC7SettingsGameRules.#onReset
    }
  }

  static PARTS = {
    form: {
      template: 'systems/' + FOLDER_ID + '/templates/apps/rule-settings.hbs',
      scrollable: ['']
    },
    footer: {
      template: 'templates/generic/form-footer.hbs'
    }
  }

  /**
   * Set initiative rule to use
   * @param {string} rule
   */
  static setInitiativeOptions (rule) {
    let decimals = 0
    switch (rule) {
      case 'optional':
        decimals = 2
        break
      case 'basic':
        decimals = 0
        break
    }
    CONFIG.Combat.initiative = {
      formula: '@dex',
      decimals
    }
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
          const fields = foundry.data.fields
          context.fields = {}
          context.values = {}
          const pulpRulesSetTo = {
            true: false,
            false: false
          }
          for (const [k, v] of Object.entries(SETTINGS)) {
            context.values[k] = game.settings.get(FOLDER_ID, k)
            if (k.match(/^pulpRule.{2,}$/)) {
              pulpRulesSetTo[context.values[k]] = true
            }
            switch (k) {
              case 'pulpRules':
                // set this after pulpRulesSetTo complete
                break
              default:
                switch (v.type) {
                  case Boolean:
                    context.fields[k] = new fields.BooleanField({
                      label: v.name,
                      hint: v.hint,
                      initial: v.default
                    }, {
                      name: k
                    })
                    break
                  case String:
                    context.fields[k] = new fields.StringField({
                      label: v.name,
                      hint: v.hint,
                      initial: v.default,
                      choices: v.choices
                    }, {
                      name: k
                    })
                    break
                }
            }
          }
          context.values.pulpRulesSetTo = (pulpRulesSetTo.true ? (pulpRulesSetTo.false ? 'some' : 'all') : 'none')
          context.fields.pulpRulesSetTo = new fields.StringField({
            choices: {
              none: 'CoC7.Settings.PulpRules.None',
              some: 'CoC7.Settings.PulpRules.Some',
              all: 'CoC7.Settings.PulpRules.All'
            },
            label: 'SETTINGS.PulpRules',
            hint: 'SETTINGS.PulpRulesHint',
            initial: 'none',
            required: true
          }, {
            name: 'pulpRulesSetTo'
          })
        }
        break
      case 'footer':
        context.buttons = [
          {
            type: 'reset',
            label: 'Reset',
            icon: 'fa-solid fa-arrow-rotate-left',
            action: 'reset'
          },
          {
            type: 'submit',
            label: 'Save Changes',
            icon: 'fa-solid fa-floppy-disk'
          }
        ]
        break
    }

    return context
  }

  /**
   * Register Settings
   */
  static registerSettings () {
    for (const [k, v] of Object.entries(SETTINGS)) {
      game.settings.register(FOLDER_ID, k, v)
    }
    CoC7SettingsGameRules.setInitiativeOptions(game.settings.get(FOLDER_ID, 'initiativeRule'))
  }

  /**
   * Render an HTMLElement for the Application.
   * An Application subclass must implement this method in order for the Application to be renderable.
   * @param {ApplicationRenderContext} context      Context data for the render operation
   * @param {RenderOptions} options                 Options which configure application rendering behavior
   * @returns {Promise<any>}                        The result of HTML rendering may be implementation specific.
   */
  async _renderHTML (context, options) {
    const parts = await super._renderHTML(context, options)
    parts.form.querySelector('select[name=pulpRulesSetTo]')?.addEventListener('change', (event) => {
      const val = event.currentTarget.value
      if (val === 'none' || val === 'all') {
        parts.form.querySelectorAll('.pulpRulesSelect input[type=checkbox]').forEach((element) => {
          element.checked = (val === 'all')
        })
      }
    })
    parts.form.querySelectorAll('.pulpRulesSelect input[type=checkbox]').forEach((element) => element.addEventListener('change', (event) => {
      const pulpRulesSetTo = {
        true: false,
        false: false
      }
      parts.form.querySelectorAll('.pulpRulesSelect input[type=checkbox]').forEach((element) => {
        pulpRulesSetTo[element.checked ? 'true' : 'false'] = true
      })
      parts.form.querySelector('select[name=pulpRulesSetTo]').value = (pulpRulesSetTo.true ? (pulpRulesSetTo.false ? 'some' : 'all') : 'none')
    }))
    return parts
  }

  /**
   * Reset the form back to default values.
   * @this {UIConfig}
   * @param {InputEvent} event
   * @returns {Promise<void>}
   */
  static async #onReset (event) {
    await this.render({
      force: false
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
    const submitData = foundry.utils.expandObject(formData.object)
    const pulpRules = {
      true: false,
      false: false
    }
    for (const [k, v] of Object.entries(submitData)) {
      if (k !== 'pulpRulesSetTo') {
        await game.settings.set(FOLDER_ID, k, v)
        if (k.match(/^pulpRule.{2,}$/)) {
          pulpRules[v] = true
        }
      }
    }
    game.settings.set(FOLDER_ID, 'pulpRules', pulpRules.true && !pulpRules.false)
  }
}
