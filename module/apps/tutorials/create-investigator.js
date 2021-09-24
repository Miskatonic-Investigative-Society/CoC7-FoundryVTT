/* global game, ui */
export const createInvestigator = {
  name: 'CoC7.Tutorial.CreateInvestigator.Name',
  requirements: async () => {
    if (game.scenes.contents.length === 0) {
      ui.notifications.warn(game.i18n.localize('CoC7.Tutorial.CreateInvestigator.SceneRequired'))
      return false
    }
    if ((game.settings.get('core', 'sheetClasses').Actor?.character || 'CoC7.CoC7CharacterSheetV2') !== 'CoC7.CoC7CharacterSheetV2') {
      ui.notifications.warn('CoC7.Tutorial.CreateInvestigator.SheetRequired')
      return false
    }
    return true
  },
  setup: async () => {
    await game.settings.set('CoC7', 'charCreationEnabled', false)
    await game.settings.set('CoC7', 'developmentEnabled', false)
  },
  steps: {
    0: {
      prompt: 'CoC7.Tutorial.CreateInvestigator.0',
      pointAt: ['up', 'a[data-tab=actors].item'],
      next: {
        hook: 'changeSidebarTab',
        tabName: 'actors'
      }
    },
    1: {
      prompt: 'CoC7.Tutorial.CreateInvestigator.1',
      pointAt: ['up', '#actors button.create-entity'],
      next: {
        hook: 'renderApplication',
        class: 'Dialog'
      }
    },
    2: {
      prompt: 'CoC7.Tutorial.CreateInvestigator.2',
      setup: ({ id = '' } = {}) => {
        const selector = game.CoC7Tutorial.setPointer({ prefixId: id })
        const text = 'Example Investigator'
        $(selector).click(function () {
          $(this).val(text).off('click')
          game.CoC7Tutorial.nextStep({ id: id })
        })
      },
      pointAt: ['up', 'input[name=name]']
    },
    3: {
      prompt: 'CoC7.Tutorial.CreateInvestigator.3',
      setup: ({ id = '' } = {}) => {
        game.CoC7Tutorial.setPointer({ prefixId: id })
      },
      pointAt: ['down', 'button.dialog-button.ok'],
      next: {
        hook: 'renderActorSheet',
        class: 'CoC7CharacterSheetV2',
        check: ({ id = '' } = {}) => {
          game.CoC7Tutorial.setVariable('actorSheetId', id)
          game.CoC7Tutorial.setVariable('actorId', id.replace(/^actor-/, ''))
          return true
        }
      }
    },
    4: {
      prompt: 'CoC7.Tutorial.CreateInvestigator.4',
      pointAt: ['up', 'a[data-tab=compendium].item'],
      next: {
        hook: 'changeSidebarTab',
        tabName: 'compendium'
      }
    },
    5: {
      prompt: 'CoC7.Tutorial.CreateInvestigator.5',
      pointAt: ['right', 'li.compendium-pack[data-pack=CoC7\\.items]'],
      outline: 'li.compendium-pack[data-pack=CoC7\\.items]',
      next: {
        hook: 'renderApplication',
        class: 'Compendium',
        check: ({ id = '' } = {}) => {
          game.CoC7Tutorial.setVariable('compendiumId', id)
          return true
        }
      }
    },
    6: {
      prompt: 'CoC7.Tutorial.CreateInvestigator.6',
      dragAt: ['left', 'li.directory-item[data-document-id=CcH7CdXGtGTjMSCg]'],
      outline: 'li.directory-item[data-document-id=CcH7CdXGtGTjMSCg]',
      next: {
        hook: 'renderApplication',
        class: 'CharacRollDialog'
      }
    },
    7: {
      prompt: 'CoC7.Tutorial.CreateInvestigator.7',
      setup: ({ id = '' } = {}) => {
        const selector = game.CoC7Tutorial.setPointer({ prefixId: id })
        $(selector).click(function () {
          $(this).off('click')
          game.CoC7Tutorial.nextStep({ id: id })
        })
      },
      pointAt: ['up', 'button[data-action=roll]']
    },
    8: {
      prompt: 'CoC7.Tutorial.CreateInvestigator.8',
      setup: ({ id = '' } = {}) => {
        const selector = game.CoC7Tutorial.setPointer({ prefixId: id })
        $(selector).click(function () {
          $(this).off('click')
          $('#tutorial-pointer').hide()
        })
      },
      pointAt: ['up', 'button[data-action=validate]'],
      next: {
        hook: 'renderApplication',
        class: 'Dialog'
      }
    },
    9: {
      prompt: 'CoC7.Tutorial.CreateInvestigator.9',
      setup: ({ id = '' } = {}) => {
        const selector = game.CoC7Tutorial.setPointer({ prefixId: id })
        const text = game.i18n.localize('CoC7.Tutorial.CreateInvestigator.ArtCraft1')
        $(selector).click(function () {
          $(this).val(text).off('click')
          game.CoC7Tutorial.nextStep({ id: id })
        })
      },
      pointAt: ['up', 'input[name=new-skill-name]']
    },
    10: {
      prompt: 'CoC7.Tutorial.CreateInvestigator.10',
      setup: ({ id = '' } = {}) => {
        const selector = game.CoC7Tutorial.setPointer({ prefixId: id })
        $(selector).click(function () {
          $(this).off('click')
          $('#tutorial-pointer').hide()
        })
      },
      pointAt: ['down', 'button.dialog-button.validate'],
      next: {
        hook: 'renderApplication',
        class: 'Dialog'
      }
    },
    11: {
      prompt: 'CoC7.Tutorial.CreateInvestigator.11',
      setup: ({ id = '' } = {}) => {
        const selector = game.CoC7Tutorial.setPointer({ prefixId: id })
        const text = game.i18n.localize('CoC7.Tutorial.CreateInvestigator.Pilot1')
        $(selector).click(function () {
          $(this).val(text).off('click')
          game.CoC7Tutorial.nextStep({ id: id })
        })
      },
      pointAt: ['up', 'input[name=new-skill-name]']
    },
    12: {
      prompt: 'CoC7.Tutorial.CreateInvestigator.12',
      setup: ({ id = '' } = {}) => {
        const selector = game.CoC7Tutorial.setPointer({ prefixId: id })
        $(selector).click(function () {
          $(this).off('click')
          $('#tutorial-pointer').hide()
        })
      },
      pointAt: ['down', 'button.dialog-button.validate'],
      next: {
        hook: 'renderApplication',
        class: 'Dialog'
      }
    },
    13: {
      prompt: 'CoC7.Tutorial.CreateInvestigator.13',
      setup: ({ id = '' } = {}) => {
        const selector = game.CoC7Tutorial.setPointer({ prefixId: id })
        const text = game.i18n.localize('CoC7.Tutorial.CreateInvestigator.Science1')
        $(selector).click(function () {
          $(this).val(text).off('click')
          game.CoC7Tutorial.nextStep({ id: id })
        })
      },
      pointAt: ['up', 'input[name=new-skill-name]']
    },
    14: {
      prompt: 'CoC7.Tutorial.CreateInvestigator.14',
      setup: ({ id = '' } = {}) => {
        const selector = game.CoC7Tutorial.setPointer({ prefixId: id })
        $(selector).click(function () {
          $(this).off('click')
          $('#tutorial-pointer').hide()
        })
      },
      pointAt: ['down', 'button.dialog-button.validate'],
      next: {
        hook: 'renderApplication',
        class: 'Dialog'
      }
    },
    15: {
      prompt: 'CoC7.Tutorial.CreateInvestigator.15',
      setup: ({ id = '' } = {}) => {
        const selector = game.CoC7Tutorial.setPointer({ prefixId: id })
        const text = game.i18n.localize('CoC7.Tutorial.CreateInvestigator.Survival1')
        $(selector).click(function () {
          $(this).val(text).off('click')
          game.CoC7Tutorial.nextStep({ id: id })
        })
      },
      pointAt: ['up', 'input[name=new-skill-name]']
    },
    16: {
      prompt: 'CoC7.Tutorial.CreateInvestigator.16',
      setup: ({ id = '' } = {}) => {
        const selector = game.CoC7Tutorial.setPointer({ prefixId: id })
        $(selector).click(function () {
          $(this).off('click')
          $('#tutorial-pointer').hide()
        })
      },
      pointAt: ['down', 'button.dialog-button.validate'],
      next: {
        hook: 'setupFinishedCoC7'
      }
    },
    17: {
      prompt: 'CoC7.Tutorial.CreateInvestigator.17',
      dragAt: ['left', 'li.directory-item[data-document-id=NOsh6EdNSjpjahDF]'],
      outline: 'li.directory-item[data-document-id=NOsh6EdNSjpjahDF]',
      next: {
        hook: 'renderApplication',
        class: 'SkillSelectDialog'
      }
    },
    18: {
      prompt: 'CoC7.Tutorial.CreateInvestigator.18',
      setup: ({ id = '' } = {}) => {
        const selector = game.CoC7Tutorial.setPointer({ prefixId: id })
        $(selector).click(function () {
          $(this).off('click')
          game.CoC7Tutorial.nextStep({ id: id })
        })
      },
      pointAt: ['left', 'div.item-controls:eq(0) a.select-skill']
    },
    19: {
      prompt: 'CoC7.Tutorial.CreateInvestigator.19',
      setup: ({ id = '' } = {}) => {
        game.CoC7Tutorial.setPointer({ prefixId: id })
      },
      pointAt: ['left', 'div.item-controls:eq(1) a.select-skill'],
      next: {
        hook: 'renderApplication',
        class: 'SkillSelectDialog'
      }
    },
    20: {
      prompt: 'CoC7.Tutorial.CreateInvestigator.20',
      setup: ({ id = '' } = {}) => {
        game.CoC7Tutorial.setPointer({ prefixId: id })
      },
      pointAt: ['left', 'div.item-controls:eq(0) a.select-skill'],
      next: {
        hook: 'renderApplication',
        class: 'SkillSelectDialog'
      }
    },
    21: {
      prompt: 'CoC7.Tutorial.CreateInvestigator.21',
      setup: ({ id = '' } = {}) => {
        game.CoC7Tutorial.setPointer({ prefixId: id })
      },
      pointAt: ['left', 'div.item-controls:eq(10) a.select-skill'],
      next: {
        hook: 'renderApplication',
        class: 'Dialog'
      }
    },
    22: {
      prompt: 'CoC7.Tutorial.CreateInvestigator.22',
      setup: ({ id = '' } = {}) => {
        const selector = game.CoC7Tutorial.setPointer({ prefixId: id })
        const text = game.i18n.localize('CoC7.Tutorial.CreateInvestigator.ArtCraft2')
        $(selector).click(function () {
          $(this).val(text).off('click')
          game.CoC7Tutorial.nextStep({ id: id })
        })
      },
      pointAt: ['up', 'input[name=new-skill-name]']
    },
    23: {
      prompt: 'CoC7.Tutorial.CreateInvestigator.23',
      setup: ({ id = '' } = {}) => {
        const selector = game.CoC7Tutorial.setPointer({ prefixId: id })
        $(selector).click(function () {
          $(this).off('click')
          $('#tutorial-pointer').hide()
        })
      },
      pointAt: ['down', 'button.dialog-button.validate'],
      next: {
        hook: 'renderApplication',
        class: 'Dialog'
      }
    },
    24: {
      prompt: 'CoC7.Tutorial.CreateInvestigator.24',
      setup: ({ id = '' } = {}) => {
        const selector = game.CoC7Tutorial.setPointer({ prefixId: id })
        const text = game.i18n.localize('CoC7.Tutorial.CreateInvestigator.ArtCraft3')
        $(selector).click(function () {
          $(this).val(text).off('click')
          game.CoC7Tutorial.nextStep({ id: id })
        })
      },
      pointAt: ['up', 'input[name=new-skill-name]']
    },
    25: {
      prompt: 'CoC7.Tutorial.CreateInvestigator.25',
      setup: ({ id = '' } = {}) => {
        const selector = game.CoC7Tutorial.setPointer({ prefixId: id })
        $(selector).click(function () {
          $(this).off('click')
          $('#tutorial-pointer').hide()
        })
      },
      pointAt: ['down', 'button.dialog-button.validate'],
      next: {
        hook: 'occupationFinishedCoC7'
      }
    },
    26: {
      showIf: () => {
        return game.settings.get('CoC7', 'pulpRules')
      },
      prompt: 'CoC7.Tutorial.CreateInvestigator.26',
      dragAt: ['left', 'li.directory-item[data-document-id=lu04TIRrg9P3vRqY]'],
      outline: 'li.directory-item[data-document-id=lu04TIRrg9P3vRqY]',
      next: {
        hook: 'renderApplication',
        class: 'CharacSelectDialog'
      }
    },
    27: {
      showIf: () => {
        return game.settings.get('CoC7', 'pulpRules')
      },
      prompt: 'CoC7.Tutorial.CreateInvestigator.27',
      setup: ({ id = '' } = {}) => {
        game.CoC7Tutorial.setPointer({ prefixId: id })
      },
      pointAt: ['left', 'li.selectable:eq(0)'],
      next: {
        hook: 'renderApplication',
        class: 'Dialog'
      }
    },
    28: {
      showIf: () => {
        return game.settings.get('CoC7', 'pulpRules')
      },
      prompt: 'CoC7.Tutorial.CreateInvestigator.28',
      setup: ({ id = '' } = {}) => {
        const selector = game.CoC7Tutorial.setPointer({ prefixId: id })
        const text = game.i18n.localize('CoC7.Tutorial.CreateInvestigator.ArtCraft4')
        $(selector).click(function () {
          $(this).val(text).off('click')
          game.CoC7Tutorial.nextStep({ id: id })
        })
      },
      pointAt: ['up', 'input[name=new-skill-name]']
    },
    29: {
      showIf: () => {
        return game.settings.get('CoC7', 'pulpRules')
      },
      prompt: 'CoC7.Tutorial.CreateInvestigator.29',
      setup: ({ id = '' } = {}) => {
        const selector = game.CoC7Tutorial.setPointer({ prefixId: id })
        $(selector).click(function () {
          $(this).off('click')
          $('#tutorial-pointer').hide()
        })
      },
      pointAt: ['down', 'button.dialog-button.validate'],
      next: {
        hook: 'archetypeFinishedCoC7'
      }
    },
    30: {
      showIf: () => {
        return !game.settings.get('CoC7', 'pulpRules')
      },
      prompt: 'CoC7.Tutorial.CreateInvestigator.30',
      pointAt: ['left', 'li.scene-control[data-control=main-menu]'],
      next: {
        hook: 'renderSceneMenuCoC7',
        gmtools: true
      }
    },
    31: {
      showIf: () => {
        return game.settings.get('CoC7', 'pulpRules')
      },
      prompt: 'CoC7.Tutorial.CreateInvestigator.31',
      pointAt: ['left', 'li.scene-control[data-control=main-menu]'],
      next: {
        hook: 'renderSceneMenuCoC7',
        gmtools: true
      }
    },
    32: {
      prompt: 'CoC7.Tutorial.CreateInvestigator.32',
      pointAt: ['left', 'li.control-tool[data-tool=charcreate]'],
      next: {
        hook: 'renderActorSheet',
        class: 'CoC7CharacterSheetV2',
        check: ({ id = '' } = {}) => {
          return (id === game.CoC7Tutorial.getVariable('actorSheetId') && game.settings.get('CoC7', 'charCreationEnabled'))
        }
      }
    },
    33: {
      prompt: 'CoC7.Tutorial.CreateInvestigator.33',
      setup: () => {
        const selector = game.CoC7Tutorial.setPointer({ prefixId: game.CoC7Tutorial.getVariable('actorSheetId') })
        $(selector).click(function () {
          $(this).off('click')
          game.CoC7Tutorial.nextStep()
        })
      },
      pointAt: ['up', 'a[data-tab=development]']
    },
    34: {
      showIf: () => {
        return !game.settings.get('CoC7', 'pulpRules')
      },
      prompt: 'CoC7.Tutorial.CreateInvestigator.34',
      setup: () => {
        game.CoC7Tutorial.setPointer({ prefixId: game.CoC7Tutorial.getVariable('actorSheetId') })
        game.CoC7Tutorial.setOutline({ prefixId: game.CoC7Tutorial.getVariable('actorSheetId') })
      },
      pointAt: ['down', 'div.right-panel'],
      outline: 'div.development-infos div.skill-points',
      next: {
        hook: 'renderActorSheet',
        class: 'CoC7CharacterSheetV2',
        check: ({ id = '' } = {}) => {
          if (id === game.CoC7Tutorial.getVariable('actorSheetId')) {
            const actor = game.actors.get(game.CoC7Tutorial.getVariable('actorId'))
            if (typeof actor !== 'undefined') {
              return (actor.personalPointsSpent === actor.data.data.development.personal && actor.occupationPointsSpent === actor.data.data.development.occupation)
            }
          }
          return false
        }
      }
    },
    35: {
      showIf: () => {
        return game.settings.get('CoC7', 'pulpRules')
      },
      prompt: 'CoC7.Tutorial.CreateInvestigator.35',
      setup: () => {
        game.CoC7Tutorial.setPointer({ prefixId: game.CoC7Tutorial.getVariable('actorSheetId') })
        game.CoC7Tutorial.setOutline({ prefixId: game.CoC7Tutorial.getVariable('actorSheetId') })
      },
      pointAt: ['down', 'div.right-panel'],
      outline: 'div.development-infos div.skill-points',
      next: {
        hook: 'renderActorSheet',
        class: 'CoC7CharacterSheetV2',
        check: ({ id = '' } = {}) => {
          if (id === game.CoC7Tutorial.getVariable('actorSheetId')) {
            const actor = game.actors.get(game.CoC7Tutorial.getVariable('actorId'))
            if (typeof actor !== 'undefined') {
              return (actor.personalPointsSpent === actor.data.data.development.personal && actor.occupationPointsSpent === actor.data.data.development.occupation && actor.archetypePointsSpent === actor.data.data.development.archetype)
            }
          }
          return false
        }
      }
    },
    36: {
      showIf: () => {
        return game.settings.get('CoC7', 'pulpRules')
      },
      prompt: 'CoC7.Tutorial.CreateInvestigator.36',
      dragAt: ['left', 'li.directory-item[data-document-id=yqvwz769ZeJplOW7]'],
      outline: 'li.directory-item[data-document-id=yqvwz769ZeJplOW7]',
      next: {
        hook: 'renderActorSheet',
        class: 'CoC7CharacterSheetV2',
        check: ({ id = '' } = {}) => {
          if (id === game.CoC7Tutorial.getVariable('actorSheetId')) {
            const actor = game.actors.get(game.CoC7Tutorial.getVariable('actorId'))
            if (typeof actor !== 'undefined') {
              return (actor.items.filter(item => item.type === 'talent').length > 0)
            }
          }
          return false
        }
      }
    },
    37: {
      showIf: () => {
        return game.settings.get('CoC7', 'pulpRules')
      },
      prompt: 'CoC7.Tutorial.CreateInvestigator.37',
      dragAt: ['left', 'li.directory-item[data-document-id=NVz7eCFnoH8J12qH]'],
      outline: 'li.directory-item[data-document-id=NVz7eCFnoH8J12qH]',
      next: {
        hook: 'renderActorSheet',
        class: 'CoC7CharacterSheetV2',
        check: ({ id = '' } = {}) => {
          if (id === game.CoC7Tutorial.getVariable('actorSheetId')) {
            const actor = game.actors.get(game.CoC7Tutorial.getVariable('actorId'))
            if (typeof actor !== 'undefined') {
              return (actor.items.filter(item => item.type === 'talent').length > 1)
            }
          }
          return false
        }
      }
    },
    38: {
      prompt: 'CoC7.Tutorial.CreateInvestigator.38',
      setup: () => {
        const selector = game.CoC7Tutorial.setPointer({ prefixId: game.CoC7Tutorial.getVariable('compendiumId') })
        $(selector).click(function () {
          $(this).off('click')
          game.CoC7Tutorial.nextStep()
        })
      },
      pointAt: ['left', 'a.header-button.close']
    },
    39: {
      prompt: 'CoC7.Tutorial.CreateInvestigator.39',
      pointAt: ['left', 'li.control-tool[data-tool=charcreate]'],
      next: {
        hook: 'toggleCharCreation',
        isCharCreation: false
      }
    },
    40: {
      prompt: 'CoC7.Tutorial.CreateInvestigator.40'
    }
  }
}
