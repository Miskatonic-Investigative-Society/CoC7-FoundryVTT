/* global $, CONFIG, FormApplication, foundry, game */
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
    onChange: rule => _setInitiativeOptions(rule)
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
  },
  opposedRollTieBreaker: {
    name: 'SETTINGS.OpposedRollTieBreaker',
    hint: 'SETTINGS.OpposedRollTieBreakerHint',
    scope: 'world',
    config: false,
    default: false,
    type: Boolean
  }
}

function _setInitiativeOptions (rule) {
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
    formula: null,
    decimals
  }
}

export class CoC7GameRuleSettings extends FormApplication {
  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
      title: 'SETTINGS.TitleRules',
      id: 'rules-settings',
      template: 'systems/CoC7/templates/system/rule-settings.html',
      width: 550,
      height: 'auto',
      closeOnSubmit: true
    })
  }

  getData () {
    const options = {}
    const pulpRules = {
      true: false,
      false: false
    }
    for (const [k, v] of Object.entries(SETTINGS)) {
      options[k] = {
        value: game.settings.get('CoC7', k),
        setting: v
      }
      if (k.match(/^pulpRule.{2,}$/)) {
        pulpRules[options[k].value] = true
      }
    }
    options.pulpSelection = pulpRules.true
      ? pulpRules.false
        ? 'some'
        : 'all'
      : 'none'

    options.initiativeRuleOptions = [
      {
        key: 'basic',
        label: 'SETTINGS.InitiativeRuleBasic'
      },
      {
        key: 'optional',
        label: 'SETTINGS.InitiativeRuleOptional'
      }
    ]

    options.pulpSelectionOptions = [
      {
        key: 'none',
        label: 'None'
      },
      {
        key: 'some',
        label: 'Partial'
      },
      {
        key: 'all',
        label: 'All'
      }
    ]
    return options
  }

  static registerSettings () {
    for (const [k, v] of Object.entries(SETTINGS)) {
      game.settings.register('CoC7', k, v)
    }
    _setInitiativeOptions(game.settings.get('CoC7', 'initiativeRule'))
  }

  activateListeners (html) {
    super.activateListeners(html)
    html
      .find('#pulpRulesSelect')
      .on('change', event => this.onChangePulpSelect(event))
    html
      .find('input.pulpRulesSelect[type=checkbox]')
      .on('click', event => this.onClickPulp(event))
    html
      .find('button[name=reset]')
      .on('click', event => this.onResetDefaults(event))
  }

  onChangePulpSelect (event) {
    const val = $(event.currentTarget).val()
    if (val === 'none' || val === 'all') {
      $('#rules-settings')
        .find('input.pulpRulesSelect[type=checkbox]')
        .each(function () {
          const checkbox = $(this)
          if (val === 'none') {
            checkbox.prop('checked', false)
          } else {
            checkbox.prop('checked', true)
          }
        })
    }
  }

  onClickPulp (event) {
    const pulpRules = {
      true: false,
      false: false
    }
    $('#rules-settings')
      .find('input.pulpRulesSelect[type=checkbox]')
      .each(function () {
        const checkbox = $(this)
        if (checkbox.prop('checked')) {
          pulpRules.true = true
        } else {
          pulpRules.false = true
        }
      })
    $('#pulpRulesSelect').val(
      pulpRules.true ? (pulpRules.false ? 'some' : 'all') : 'none'
    )
  }

  async onResetDefaults (event) {
    event.preventDefault()
    for await (const [k, v] of Object.entries(SETTINGS)) {
      await game.settings.set('CoC7', k, v?.default)
    }
    return this.render()
  }

  async _updateObject (event, data) {
    const pulpRules = {
      true: false,
      false: false
    }
    for await (const key of Object.keys(SETTINGS)) {
      game.settings.set('CoC7', key, data[key])
      if (key.match(/^pulpRule.{2,}$/)) {
        pulpRules[data[key]] = true
      }
    }
    game.settings.set('CoC7', 'pulpRules', pulpRules.true && !pulpRules.false)
  }
}
