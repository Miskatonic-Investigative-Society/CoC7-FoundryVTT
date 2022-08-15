import { EnableVariantRulesEn } from './enable-variant-rules-en.js'

export class EnableVariantRulesFr extends EnableVariantRulesEn {
  constructor (config) {
    super({
      title: 'Enable optional/variant rules.',
      description: 'Learn how to enable Pulp Cthulhu rules, or other variant rules',
      localization: {
        'COC7.Tour.GotoSettingsTitle': 'Game Settings',
        'COC7.Tour.GotoSettingsContent': 'Go to the Game Settings tab',
        'COC7.Tour.GotoConfigureTitle': 'Configure Settings',
        'COC7.Tour.GotoConfigureContent': 'Click on the Configure Settings button',
        'COC7.Tour.GotoSystemSettingsTitle': 'System Settings',
        'COC7.Tour.GotoSystemSettingsContent': 'Go to the System Settings tab',
        'COC7.Tour.GotoGameRulesTitle': 'Configure Variant/Optional Rules',
        'COC7.Tour.GotoGameRulesContent': 'Click on the Configure Variant/Optional Rules button',
        'COC7.Tour.SaveGameRulesTitle': 'Save rule changes',
        'COC7.Tour.SaveGameRulesContent': 'Once you have made your changes click on the Save Changes button',
        'COC7.Tour.SaveSystemSettingsTitle': 'Save system settings',
        'COC7.Tour.SaveSystemSettingsContent': 'Finally click on the Save Changes button'
      }
    })
  }
}
