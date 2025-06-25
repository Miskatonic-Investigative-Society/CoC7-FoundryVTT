import { EnableVariantRulesEn } from './enable-variant-rules-en.js'

export class EnableVariantRulesEs extends EnableVariantRulesEn {
  constructor (config) {
    super({
      title: 'Activar ambientaciones y reglas opcionales.',
      description: 'Aprende cómo activar las reglas de Pulp Cthulhu u otras reglas ambientaciones y reglas opcionales',
      localization: {
        'COC7.Tour.GotoSettingsTitle': 'Ajustes del juego',
        'COC7.Tour.GotoSettingsContent': 'Ve a la pestaña de Ajustes del juego',
        'COC7.Tour.GotoConfigureTitle': 'Configurar ajustes',
        'COC7.Tour.GotoConfigureContent': 'Haz clic en el botón Configurar ajustes',
        'COC7.Tour.GotoSystemSettingsTitle': 'Ajustes del sistema',
        'COC7.Tour.GotoSystemSettingsContent': 'Ve a la pestaña de Ajustes del sistema',
        'COC7.Tour.GotoGameRulesTitle': 'Configurar ambientaciones y reglas opcionales',
        'COC7.Tour.GotoGameRulesContent': 'Haz clic en el botón Configurar ambientaciones y reglas opcionales',
        'COC7.Tour.SaveGameRulesTitle': 'Guardar cambios en las reglas',
        'COC7.Tour.SaveGameRulesContent': 'Una vez que hayas realizado tus cambios, haz clic en el botón Guardar cambios'
      }
    })
  }
}
