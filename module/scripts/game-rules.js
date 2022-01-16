/* global CONFIG, FormApplication, game, mergeObject */
const SETTINGS = {
  // pulpRules: {
  //   name: 'SETTINGS.PulpRules',
  //   hint: 'SETTINGS.PulpRulesHint',
  //   scope: 'world',
  //   config: true,
  //   default: false,
  //   type: Boolean
  // }
  optionalDevelopmentRollForLuck: {
    name: 'SETTINGS.developmentRollForLuck',
    hint: 'SETTINGS.developmentRollForLuckHint',
    scope: 'world',
    config: false,
    default: false,
    type: Boolean
  },
  optionalInitiativeRule: {
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
  pulpRuleDoubleMaxHealth: {
    name: 'CoC7.Settings.PulpRules.DoubleMaxHealth.Name',
    hint: 'CoC7.Settings.PulpRules.DoubleMaxHealth.Hint',
    scope: 'world',
    config: false,
    default: false,
    type: Boolean
  },
  houseRulesOpposedRollTieBreaker: {
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
    decimals: decimals
  }
}

export class CoC7GameRuleSettings extends FormApplication {
  static get defaultOptions () {
    return mergeObject(super.defaultOptions, {
      title: 'CoC7.Settings.Rules.Title',
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
      if (k.match(/^pulpRule/)) {
        pulpRules[(options[k].value)] = true
      }
    }
    options.pulpSelection = (pulpRules.true ? (pulpRules.false ? 'some' : 'all') : 'none')
    return options
  }

  static registerSettings () {
    for (const [k, v] of Object.entries(SETTINGS)) {
      game.settings.register('CoC7', k, v)
    }
    _setInitiativeOptions(game.settings.get('CoC7', 'houseRulesInitiativeRule'))
  }

  activateListeners (html) {
    super.activateListeners(html)
    html.find('#pulpRulesSelect').on('change', (event) => this.onChangePulpSelect(event))
    html.find('input.pulpRulesSelect[type=checkbox]').on('click', (event) => this.onClickPulp(event))
  }

  onChangePulpSelect (event) {
    const val = $(event.currentTarget).val()
    if (val === 'none' || val === 'all') {
      $('#rules-settings').find('input.pulpRulesSelect[type=checkbox]').each(function () {
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
    $('#rules-settings').find('input.pulpRulesSelect[type=checkbox]').each(function () {
      const checkbox = $(this)
      if (checkbox.prop('checked')) {
        pulpRules.true = true
      } else {
        pulpRules.false = true
      }
    })
    $('#pulpRulesSelect').val((pulpRules.true ? (pulpRules.false ? 'some' : 'all') : 'none'))
  }
}
