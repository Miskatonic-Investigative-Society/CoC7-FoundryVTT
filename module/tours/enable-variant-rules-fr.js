import { EnableVariantRulesEn } from './enable-variant-rules-en.js'

export class EnableVariantRulesFr extends EnableVariantRulesEn {
  constructor (config) {
    super({
      title: 'Activez les règles optionnelles.',
      description: 'Activez les règles optionelles et Pulp Cthulhu',
      localization: {
        'COC7.Tour.GotoSettingsTitle': 'Paramètres',
        'COC7.Tour.GotoSettingsContent': 'Ouvrir l\'onglet "Paramètres"',
        'COC7.Tour.GotoConfigureTitle': 'Configuration des options',
        'COC7.Tour.GotoConfigureContent': 'Cliquez sur "Configuration des options"',
        'COC7.Tour.GotoSystemSettingsTitle': 'Système de jeu',
        'COC7.Tour.GotoSystemSettingsContent': 'Ouvrez l\'onglet "Système de jeu"',
        'COC7.Tour.GotoGameRulesTitle': 'Configurer les variantes/règles optionnelles',
        'COC7.Tour.GotoGameRulesContent': 'Clickez sur le boutton "Configurer les variantes/règles optionnelles"',
        'COC7.Tour.SaveGameRulesTitle': 'Sauvegarder les modifications',
        'COC7.Tour.SaveGameRulesContent': 'Apres avoir choisis les options cliquez sur le bouton "Sauvegarder les modifications"'
      }
    })
  }
}
