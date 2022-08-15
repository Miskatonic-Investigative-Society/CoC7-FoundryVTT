/* global mergeObject */
import { CoC7Tour } from '../apps/coc7-tour.js'

export class EnableVariantRulesEn extends CoC7Tour {
  constructor (config) {
    super(mergeObject({
      title: 'Enable optional/variant rules.',
      description: 'Learn how to enable Pulp Cthulhu rules, or other variant rules',
      canBeResumed: false,
      display: true,
      steps: [
        {
          id: 'goto-settings',
          selector: '[data-tab="settings"]',
          title: 'COC7.Tour.GotoSettingsTitle',
          content: 'COC7.Tour.GotoSettingsContent',
          action: 'click'
        },
        {
          id: 'goto-configure',
          selector: '[data-action="configure"]',
          title: 'COC7.Tour.GotoConfigureTitle',
          content: 'COC7.Tour.GotoConfigureContent',
          action: 'click'
        },
        {
          id: 'goto-system-settings',
          selector: '[data-tab="system"]',
          title: 'COC7.Tour.GotoSystemSettingsTitle',
          content: 'COC7.Tour.GotoSystemSettingsContent',
          action: 'click'
        },
        {
          id: 'goto-game-rules',
          selector: '[data-key="CoC7.gameRules"]',
          title: 'COC7.Tour.GotoGameRulesTitle',
          content: 'COC7.Tour.GotoGameRulesContent',
          action: 'click'
        },
        {
          id: 'save-game-rules',
          selector: '#rules-settings [name=submit]',
          title: 'COC7.Tour.SaveGameRulesTitle',
          content: 'COC7.Tour.SaveGameRulesContent'
        },
        {
          id: 'save-system-settings-rules',
          selector: '#client-settings [name=submit]',
          title: 'COC7.Tour.SaveSystemSettingsTitle',
          content: 'COC7.Tour.SaveSystemSettingsContent'
        }
      ],
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
    }, config))
  }
}
