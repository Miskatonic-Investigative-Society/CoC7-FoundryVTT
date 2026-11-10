export const FOLDER_ID = 'CoC7'

export const ERAS = {
  standard: {
    label: 'CoC7.Era1920',
    icon: 'game-icon game-icon-mustache'
  },
  modern: {
    label: 'CoC7.EraModern',
    icon: 'game-icon game-icon-billed-cap'
  },
  modernPulp: {
    label: 'CoC7.EraModernPulp',
    icon: 'game-icon game-icon-captain-hat-profile'
  },
  pulp: {
    label: 'CoC7.EraPulp',
    icon: 'game-icon game-icon-fedora'
  },
  downDarkerTrails: {
    label: 'CoC7.EraDownDarkerTrails',
    icon: 'game-icon game-icon-western-hat'
  },
  downDarkerTrailsPulp: {
    label: 'CoC7.EraDownDarkerTrailsPulp',
    icon: 'game-icon game-icon-bandit'
  },
  darkAges: {
    label: 'CoC7.EraDarkAges',
    icon: 'game-icon game-icon-barbute'
  },
  darkAgesPulp: {
    label: 'CoC7.EraDarkAgesPulp',
    icon: 'game-icon game-icon-heavy-helm'
  },
  regency: {
    label: 'CoC7.EraRegency',
    icon: 'game-icon game-icon-top-hat'
  },
  regencyPulp: {
    label: 'CoC7.EraRegencyPulp',
    icon: 'game-icon game-icon-carnival-mask'
  },
  reignOfTerror: {
    label: 'CoC7.EraReignOfTerror',
    icon: 'game-icon game-icon-guillotine'
  },
  gasLight: {
    label: 'CoC7.EraGasLight',
    icon: 'game-icon game-icon-old-lantern'
  },
  gasLightPulp: {
    label: 'CoC7.EraGasLightPulp',
    icon: 'game-icon game-icon-wall-light'
  },
  invictus: {
    label: 'CoC7.EraInvictus',
    icon: 'game-icon game-icon-centurion-helmet'
  }
}

export const MONETARY_FORMAT_KEYS = {
  decimalLeft: 'decimalLeft',
  decimalRight: 'decimalRight',
  integerLeft: 'integerLeft',
  integerRight: 'integerRight',
  lsd: 'lsd',
  roman: 'roman'
}

export const MONETARY_FORMATS = {
  decimalLeft: 'CoC7.MonetaryFormatDecimalLeft',
  decimalRight: 'CoC7.MonetaryFormatDecimalRight',
  integerLeft: 'CoC7.MonetaryFormatIntegerLeft',
  integerRight: 'CoC7.MonetaryFormatIntegerRight',
  lsd: 'CoC7.MonetaryFormatLsd',
  roman: 'CoC7.MonetaryFormatRoman'
}

export const MONETARY_TYPE_KEYS = {
  none: 'none',
  asses: 'asses',
  sestertii: 'sestertii',
  quinarii: 'quinarii',
  denarii: 'denarii',
  d: 'd',
  s: 's',
  value: 'value',
  multiplier: 'multiplier'
}

export const MONETARY_TYPES = {
  none: {
    label: 'CoC7.MonetaryTypeNone',
    filter: []
  },
  asses: {
    label: 'CoC7.MonetaryTypeAsses',
    filter: ['roman']
  },
  sestertii: {
    label: 'CoC7.MonetaryTypeSestertii',
    filter: ['roman']
  },
  quinarii: {
    label: 'CoC7.MonetaryTypeQuinarii',
    filter: ['roman']
  },
  denarii: {
    label: 'CoC7.MonetaryTypeDenarii',
    filter: ['roman']
  },
  d: {
    label: 'CoC7.MonetaryTypeDeniers',
    filter: ['lsd']
  },
  s: {
    label: 'CoC7.MonetaryTypeSous',
    filter: ['lsd']
  },
  value: {
    label: 'CoC7.MonetaryTypeOne',
    filter: []
  },
  multiplier: {
    label: 'CoC7.MonetaryTypeCreditRating',
    filter: []
  }
}

export const STATUS_EFFECTS = {
  tempoInsane: 'tempoInsane',
  indefInsane: 'indefInsane',
  unconscious: 'unconscious',
  criticalWounds: 'criticalWounds',
  dying: 'dying',
  prone: 'prone',
  dead: 'dead'
}

export const FIGHTING_NAMES = {
  fighting: 'CoC7.FightingSpecializationName',
  firearm: 'CoC7.FirearmSpecializationName',
  ranged: 'CoC7.RangedSpecializationName'
}

export const DICE_POOL_REASONS = {
  outnumbered: {
    active: true,
    ifAttacker: false,
    ifDefender: true,
    forBonus: true,
    forPenalty: false,
    forMelee: true,
    forRanged: false,
    label: 'CoC7.OutNumbered',
    tooltip: 'CoC7.TitleOutNumbered'
  },
  surprised: {
    active: true,
    ifAttacker: false,
    ifDefender: true,
    forBonus: true,
    forPenalty: false,
    forMelee: true,
    forRanged: false,
    label: 'CoC7.combatCard.surprised',
    tooltip: 'CoC7.TitleSurprised'
  },
  sizeBig: {
    active: true,
    ifAttacker: true,
    ifDefender: false,
    forBonus: true,
    forPenalty: false,
    forMelee: false,
    forRanged: true,
    label: 'CoC7.rangeCombatCard.BigTarget',
    tooltip: 'CoC7.rangeCombatCard.BigTargetTooltip'
  },
  sizeSmall: {
    active: true,
    ifAttacker: true,
    ifDefender: false,
    forBonus: false,
    forPenalty: true,
    forMelee: false,
    forRanged: true,
    label: 'CoC7.combatCard.SmallTarget',
    tooltip: 'CoC7.combatCard.SmallTargetTooltip'
  },
  cover: {
    active: true,
    ifAttacker: false,
    ifDefender: false,
    forBonus: false,
    forPenalty: true,
    forMelee: false,
    forRanged: true,
    label: 'CoC7.rangeCombatCard.Cover',
    tooltip: 'CoC7.rangeCombatCard.CoverTitle'
  },
  surprisedRanged: {
    active: true,
    ifAttacker: false,
    ifDefender: true,
    forBonus: true,
    forPenalty: false,
    forMelee: false,
    forRanged: true,
    label: 'CoC7.combatCard.surprised',
    tooltip: 'CoC7.rangeCombatCard.SurprisedTargetTitle'
  },
  pointBlankRange: {
    active: true,
    ifAttacker: false,
    ifDefender: false,
    forBonus: true,
    forPenalty: false,
    forMelee: false,
    forRanged: true,
    label: 'CoC7.rangeCombatCard.PointBlankRange',
    tooltip: 'CoC7.rangeCombatCard.PointBlankRangeTitle'
  },
  inMelee: {
    active: true,
    ifAttacker: true,
    ifDefender: false,
    forBonus: false,
    forPenalty: true,
    forMelee: false,
    forRanged: true,
    label: 'CoC7.rangeCombatCard.InMelee',
    tooltip: 'CoC7.rangeCombatCard.InMeleeTitle'
  },
  fast: {
    active: true,
    ifAttacker: false,
    ifDefender: false,
    forBonus: false,
    forPenalty: true,
    forMelee: false,
    forRanged: true,
    label: 'CoC7.rangeCombatCard.FastMovingTarget',
    tooltip: 'CoC7.rangeCombatCard.FastMovingTargetTitle'
  },
  shootingInDark: {
    active: true,
    ifAttacker: true,
    ifDefender: false,
    forBonus: false,
    forPenalty: true,
    forMelee: false,
    forRanged: true,
    label: 'CoC7.rangeCombatCard.ShootingInDark',
    tooltip: 'CoC7.rangeCombatCard.ShootingInDarkTooltip'
  },
  shootWithOffhand: {
    active: () => game.settings.get(FOLDER_ID, 'ddtRuleShootingWithOffHand'),
    ifAttacker: true,
    ifDefender: false,
    forBonus: false,
    forPenalty: true,
    forMelee: false,
    forRanged: true,
    label: 'CoC7.rangeCombatCard.ShootingWithOffHand',
    tooltip: 'CoC7.Settings.DDTRules.ShootingWithOffHand.Hint'
  },
  reloading: {
    active: true,
    ifAttacker: true,
    ifDefender: false,
    forBonus: false,
    forPenalty: true,
    forMelee: false,
    forRanged: true,
    label: 'CoC7.rangeCombatCard.ReloadingFirearm',
    tooltip: 'CoC7.rangeCombatCard.ReloadingFirearmTooltip'
  }
}

/* // FoundryVTT V13 */
export const CHAT_MESSAGE_MODE = Object.keys(CONFIG.ChatMessage.modes ?? CONFIG.Dice.rollModes).reduce((c, k) => { c[k.replace(/roll$/, '').toUpperCase()] = k; return c }, {})

export const TARGET_ALLOWED = [
  'character',
  'creature',
  'npc',
  'vehicle'
]

export const TRADE_ALLOWED = [
  'character',
  'creature',
  'npc',
  'container'
]

export const SPELL_COST_TYPE_KEYS = {
  additionalCasterPromptAdd: {
    label: 'CoC7.Spell.Cost.AdditionalCasterPromptAdd',
    group: 'CoC7.Spell.Group.AdditionalCasters'
  },
  additionalCasterCost: {
    label: 'CoC7.Spell.Cost.AdditionalCasterCost',
    group: 'CoC7.Spell.Group.AdditionalCasters'
  },
  additionalCasterPromptRequireNumber: {
    label: 'CoC7.Spell.Cost.AdditionalCasterPromptRequireNumber',
    group: 'CoC7.Spell.Group.AdditionalCasters'
  },
  additionalInformation: {
    label: 'CoC7.Spell.Cost.AdditionalInformation',
    group: 'CoC7.Spell.Group.CasterCosts'
  },
  castingTime: {
    label: 'CoC7.Spell.Cost.CastingTime',
    group: 'CoC7.Spell.Group.CastingTime'
  },
  casterCost: {
    label: 'CoC7.Spell.Cost.CasterCost',
    group: 'CoC7.Spell.Group.CasterCosts'
  },
  promptRequireNumber: {
    label: 'CoC7.Spell.Cost.PromptRequireNumber',
    group: 'CoC7.Spell.Group.Prompt'
  },
  promptShowText: {
    label: 'CoC7.Spell.Cost.PromptShowText',
    group: 'CoC7.Spell.Group.Prompt'
  },
  promptShowVariable: {
    label: 'CoC7.Spell.Cost.PromptShowVariable',
    group: 'CoC7.Spell.Group.Prompt'
  },
  promptToggleButton: {
    label: 'CoC7.Spell.Cost.PromptToggleButton',
    group: 'CoC7.Spell.Group.Prompt'
  },
  setVariable: {
    label: 'CoC7.Spell.Cost.SetVariable',
    group: 'CoC7.Spell.Group.System'
  },
  triggerPrompt: {
    label: 'CoC7.Spell.Cost.TriggerPrompt',
    group: 'CoC7.Spell.Group.Prompt'
  }
}

export const TALENT_ADJUSTMENT_TYPES = {
  addSkillChoice: {
    label: 'CoC7.Talent.Type.AddSkillChoice'
  },
  disableCombatPool: {
    label: 'CoC7.Talent.Type.DisableCombatPool'
  },
  luckButton: {
    label: 'CoC7.Talent.Type.LuckButton'
  },
  showOnCombatAttacker: {
    label: 'CoC7.Talent.Type.ShowOnCombatAttacker'
  },
  showOnCombatDefender: {
    label: 'CoC7.Talent.Type.ShowOnCombatDefender'
  },
  showOnFailure: {
    label: 'CoC7.Talent.Type.ShowOnFailure'
  },
  showOnInvestigatorCheck: {
    label: 'CoC7.Talent.Type.ShowOnInvestigatorCheck'
  },
  showOnSkillCheck: {
    label: 'CoC7.Talent.Type.ShowOnSkillCheck'
  },
  takingDamage: {
    label: 'CoC7.Talent.Type.TakingDamage'
  },
  takingSanityLoss: {
    label: 'CoC7.Talent.Type.TakingSanityLoss'
  }
}

export const JOURNAL_STYLES = {}
