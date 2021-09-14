/* global CONFIG, game */
import { CoC7DecaderDie } from '../apps/decader-die.js'

export function registerSettings () {
  /**
   * Rules
   */
  game.settings.register('CoC7', 'pulpRules', {
    name: 'SETTINGS.PulpRules',
    hint: 'SETTINGS.PulpRulesHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  game.settings.register('CoC7', 'developmentRollForLuck', {
    name: 'SETTINGS.developmentRollForLuck',
    hint: 'SETTINGS.developmentRollForLuckHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  game.settings.register('CoC7', 'opposedRollTieBreaker', {
    name: 'SETTINGS.OpposedRollTieBreaker',
    hint: 'SETTINGS.OpposedRollTieBreakerHint',
    scope: 'wolrd',
    config: true,
    default: false,
    type: Boolean
  })

  /**
   * Initiative
   */
  /** Set the initiative rule */
  game.settings.register('CoC7', 'initiativeRule', {
    name: 'SETTINGS.InitiativeRule',
    hint: 'SETTINGS.InitiativeRuleHint',
    scope: 'world',
    config: true,
    default: 'basic',
    type: String,
    choices: {
      basic: 'SETTINGS.InitiativeRuleBasic',
      optional: 'SETTINGS.InitiativeRuleOptional'
    },
    onChange: rule => _setInitiativeOptions(rule)
  })
  /** Set displaying dices for init roll */
  game.settings.register('CoC7', 'displayInitDices', {
    name: 'SETTINGS.displayInitDices',
    hint: 'SETTINGS.displayInitDicesHint',
    scope: 'world',
    config: true,
    default: true,
    type: Boolean
  })
  /** Set displaying dices for init roll */
  game.settings.register('CoC7', 'displayInitAsText', {
    name: 'SETTINGS.displayInitAsText',
    hint: 'SETTINGS.displayInitAsTextHint',
    scope: 'world',
    config: true,
    default: true,
    type: Boolean
  })

  /**
   * Roll customisaions
   */
  /** Standby rolls made by GM from player sheet */
  game.settings.register('CoC7', 'stanbyGMRolls', {
    name: 'SETTINGS.StanbyGMRolls',
    hint: 'SETTINGS.StanbyGMRollsHint',
    scope: 'world',
    config: true,
    default: true,
    type: Boolean
  })
  /** Allow usage of a flat dice modifier */
  game.settings.register('CoC7', 'allowFlatDiceModifier', {
    name: 'SETTINGS.AllowFlatDiceModifier',
    hint: 'SETTINGS.AllowFlatDiceModifierHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  /** Allow usage of a flat threshold modifier */
  game.settings.register('CoC7', 'allowFlatThresholdModifier', {
    name: 'SETTINGS.AllowFlatThresholdModifier',
    hint: 'SETTINGS.AllowFlatThresholdModifierHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  game.settings.register('CoC7', 'defaultCheckDifficulty', {
    name: 'SETTINGS.DefaultDifficulty',
    hint: 'SETTINGS.DefaultDifficultyHint',
    scope: 'world',
    config: true,
    default: 'regular',
    type: String,
    choices: {
      regular: 'SETTINGS.CheckDifficultyRegular',
      unknown: 'SETTINGS.CheckDifficultyUnknown'
    }
  })
  game.settings.register('CoC7', 'selfRollWhisperTarget', {
    name: 'SETTINGS.SelfRollWhisperTarget',
    hint: 'SETTINGS.SelfRollWhisperTargetHint',
    scope: 'world',
    config: true,
    default: 'everyone',
    type: String,
    choices: {
      nobody: 'SETTINGS.DoNotAdvise',
      owners: 'SETTINGS.AdviseOwnersOnly',
      everyone: 'SETTINGS.AdviseAllPlayer'
    }
  })

  /**
   * Chat Cards
   */
  /** Set the need to display actor image on chat cards */
  game.settings.register('CoC7', 'displayActorOnCard', {
    name: 'SETTINGS.DisplayActorOnCard',
    hint: 'SETTINGS.DisplayActorOnCardHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  game.settings.register('CoC7', 'displayCheckSuccessLevel', {
    name: 'SETTINGS.DisplayCheckSuccessLevel',
    scope: 'client',
    config: true,
    default: true,
    type: Boolean
  })
  game.settings.register('CoC7', 'displayResultType', {
    name: 'SETTINGS.DisplayResultType',
    scope: 'client',
    config: true,
    default: false,
    type: Boolean
  })
  /** Set the use of token instead of portraits */
  game.settings.register('CoC7', 'useToken', {
    name: 'SETTINGS.UseToken',
    hint: 'SETTINGS.UseTokenHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })

  /**
   * Scene Settings
   */
  game.settings.register('CoC7', 'enableStatusIcons', {
    name: 'SETTINGS.EnableStatusIcons',
    hint: 'SETTINGS.EnableStatusIconsHint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true
  })
  game.settings.register('CoC7', 'gridSpaces', {
    name: 'SETTINGS.RestrictGridSpaces',
    hint: 'SETTINGS.RestrictGridSpacesHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })

  /**
   * Sheet settings
   */
  game.settings.register('CoC7', 'displayPlayerNameOnSheet', {
    name: 'SETTINGS.displayPlayerNameOnSheet',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  /** Allow player to unlock the sheet outside of creation mode */
  game.settings.register('CoC7', 'playerUnlockSheetMode', {
    name: 'SETTINGS.PlayerUnlockSheetMode',
    scope: 'world',
    config: true,
    default: 'always',
    type: String,
    choices: {
      always: 'SETTINGS.AlwaysEditable',
      creation: 'SETTINGS.CreationModeOnly',
      never: 'SETTINGS.NeverEditable'
    }
  })
  /** Allow player to modify status */
  game.settings.register('CoC7', 'statusPlayerEditable', {
    name: 'SETTINGS.StatusPlayerEditable',
    hint: 'SETTINGS.StatusPlayerEditableHint',
    scope: 'world',
    config: true,
    default: true,
    type: Boolean
  })
  game.settings.register('CoC7', 'oneBlockBackstory', {
    name: 'SETTINGS.OneBlockBackStory',
    hint: 'SETTINGS.OneBlockBackStoryHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  game.settings.register('CoC7', 'overrideSheetArtwork', {
    name: 'SETTINGS.OverrideSheetArtwork',
    hint: 'SETTINGS.OverrideSheetArtworkHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  if (game.settings.get('CoC7', 'overrideSheetArtwork')) {
    game.settings.register('CoC7', 'artWorkSheetBackground', {
      name: 'SETTINGS.ArtWorkSheetBackground',
      hint: 'SETTINGS.ArtWorkSheetBackgroundHint',
      scope: 'world',
      config: true,
      default: "url('./assets/images/background.webp') 4 repeat",
      type: String
    })
    game.settings.register('CoC7', 'artWorkSheetBackgroundType', {
      name: 'SETTINGS.ArtWorkSheetBackgroundType',
      scope: 'world',
      config: true,
      default: 'slice',
      type: String,
      choices: {
        slice: 'SETTINGS.BackgroundSlice',
        auto: 'SETTINGS.BackgroundAuto',
        contain: 'SETTINGS.BackgroundContain',
        cover: 'SETTINGS.BackgroundCover'
      }
    })
    game.settings.register('CoC7', 'artWorkOtherSheetBackground', {
      name: 'SETTINGS.ArtWorkOtherSheetBackground',
      hint: 'SETTINGS.ArtWorkOtherSheetBackgroundHint',
      scope: 'world',
      config: true,
      default: "url( './assets/images/background.webp')",
      type: String
    })
    game.settings.register('CoC7', 'artworkSheetImage', {
      name: 'SETTINGS.ArtworkSheetImage',
      hint: 'SETTINGS.ArtworkSheetImageHint',
      scope: 'world',
      config: true,
      default: "url('./assets/images/tentacles.webp')",
      type: String
    })
    game.settings.register('CoC7', 'artworkFrontColor', {
      name: 'SETTINGS.ArtworkFrontColor',
      hint: 'SETTINGS.ArtworkFrontColorHint',
      scope: 'world',
      config: true,
      default: 'rgba(43,55,83,1)',
      type: String
    })
    game.settings.register('CoC7', 'artworkBackgroundColor', {
      name: 'SETTINGS.ArtworkBackgroundColor',
      hint: 'SETTINGS.ArtworkBackgroundColorHint',
      scope: 'world',
      config: true,
      default: 'rgba(103,11,11,1)',
      type: String
    })
    game.settings.register('CoC7', 'artworkInteractiveColor', {
      name: 'SETTINGS.ArtworkInteractiveColor',
      hint: 'SETTINGS.ArtworkInteractiveColorHint',
      scope: 'world',
      config: true,
      default: 'rgba(103,11,11,1)',
      type: String
    })
    game.settings.register('CoC7', 'artworkFixedSkillLength', {
      name: 'SETTINGS.ArtworkFixedSkillLength',
      hint: 'SETTINGS.ArtworkFixedSkillLengthHint',
      scope: 'world',
      config: true,
      default: true,
      type: Boolean
    })
    game.settings.register('CoC7', 'artworkMainFont', {
      name: 'SETTINGS.ArtworkMainFont',
      scope: 'world',
      config: true,
      default: '',
      type: String
    })
    game.settings.register('CoC7', 'artworkMainFontBold', {
      name: 'SETTINGS.ArtworkMainFontBold',
      scope: 'world',
      config: true,
      default: '',
      type: String
    })
    game.settings.register('CoC7', 'artworkMainFontSize', {
      name: 'SETTINGS.ArtworkMainFontSize',
      scope: 'world',
      config: true,
      default: 16,
      type: Number
    })
  }

  /**
   * Weapons
   */
  game.settings.register('CoC7', 'disregardUsePerRound', {
    name: 'SETTINGS.DisregardUsePerRound',
    hint: 'SETTINGS.DisregardUsePerRoundHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  game.settings.register('CoC7', 'disregardAmmo', {
    name: 'SETTINGS.DisregardAmmo',
    hint: 'SETTINGS.DisregardAmmoHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })

  /**
   * Dice So Nice
   */
  if (game.modules.get('dice-so-nice')?.active) {
    game.settings.register('CoC7', 'syncDice3d', {
      name: 'SETTINGS.SyncDice3D',
      hint: 'SETTINGS.SyncDice3DHint',
      scope: 'world',
      config: true,
      default: true,
      type: Boolean
    })
    const [version] = game.modules.get('dice-so-nice')?.data.version.split('.')
    if (!isNaN(Number(version)) && Number(version) >= 3) {
      game.settings.register('CoC7', 'tenDieBonus', {
        name: 'SETTINGS.TenDieBonus',
        hint: 'SETTINGS.TenDieBonusHint',
        scope: 'client',
        config: true,
        default: 'bronze',
        type: String
      })
      game.settings.register('CoC7', 'tenDiePenalty', {
        name: 'SETTINGS.TenDiePenalty',
        hint: 'SETTINGS.TenDiePenaltyHint',
        scope: 'client',
        config: true,
        default: 'bloodmoon',
        type: String
      })
    }
  }

  /**
   * Developer and debug settings
   */
  game.settings.register('CoC7', 'debugmode', {
    name: 'SETTINGS.DebugMode',
    hint: 'SETTINGS.DebugModeHint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false
  })
  game.settings.register('CoC7', 'experimentalFeatures', {
    name: 'SETTINGS.ShowExperimentalFeatures',
    hint: 'SETTINGS.ShowExperimentalFeaturesHint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false
  })
  /**
   * Other settings
   */
  game.settings.register('CoC7', 'developmentEnabled', {
    name: 'Dev phased allowed',
    scope: 'world',
    config: false,
    type: Boolean,
    default: false
  })
  game.settings.register('CoC7', 'charCreationEnabled', {
    name: 'Char creation allowed',
    scope: 'world',
    config: false,
    type: Boolean,
    default: false
  })
  game.settings.register('CoC7', 'systemUpdateVersion', {
    name: 'System update version',
    scope: 'world',
    config: false,
    type: Number,
    default: '0.2'
  })
  game.settings.register('CoC7', 'xpEnabled', {
    name: 'Enable XP gain',
    scope: 'world',
    config: false,
    type: Boolean,
    default: true
  })
  /** Set an initiative formula for the system */
  CONFIG.Combat.initiative = {
    formula: '@characteristics.dex.value',
    decimals: 4
  }
  CONFIG.debug.hooks = !!game.settings.get('CoC7', 'debugmode')
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
  _setInitiativeOptions(game.settings.get('CoC7', 'initiativeRule'))

  CONFIG.Dice.terms.t = CoC7DecaderDie
}
