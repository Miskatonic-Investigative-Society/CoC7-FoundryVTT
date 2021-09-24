/* global game */
export const importNPC = {
  name: 'CoC7.Tutorial.ImportNPC.Name',
  steps: {
    0: {
      prompt: 'CoC7.Tutorial.ImportNPC.0',
      pointAt: ['up', 'a[data-tab=actors].item'],
      next: {
        hook: 'changeSidebarTab',
        tabName: 'actors'
      }
    },
    1: {
      prompt: 'CoC7.Tutorial.ImportNPC.1',
      pointAt: ['down', 'a.actor-import'],
      next: {
        hook: 'renderApplication',
        class: 'CoC7ActorImporterDialog'
      }
    },
    2: {
      prompt: 'CoC7.Tutorial.ImportNPC.2',
      setup: (options) => {
        const text = 'Example Character, age 27\nSTR 75 CON 60 SIZ 80 DEX 70 APP 60 INT 80\nPOW 50 EDU 85 SAN 55 HP 14 DB: 1D4\nBuild: 1 Move: 7 MP: 10 Luck: 40 Armor: 1\nSAN loss: 1d4/1d8 # Attacks: 3\nCombat\nBite 50% (25/10), damage 1D6\nBrawl 30% (15/6), damage 1D3\nDerringer 40% (20/8), damage 1D8+1\nDodge 50% (25/10)\nSkills\nAnimal Handling 55%, Charm 30%, First Aid 25%, Disguise 20%,\nListen 50%, Medicine 45%, Persuade 25%, Psychology 75%,\nScience (Astronomy) 90%, Science (Botany) 35%, Science (Zoology) 10%,\nSpot Hidden 35%, Stealth 10%\nLanguages: English 80%, Eklo 5%.\nSpells: Summon NPC, Dispel NPC.'
        $('#coc-pasted-character-data').click(function () {
          $(this).val(text).blur().off('click')
          game.CoC7Tutorial.nextStep()
        })
        game.CoC7Tutorial.setPointer()
        game.CoC7Tutorial.setOutline()
      },
      pointAt: ['left', '#coc-pasted-character-data'],
      outline: '#coc-pasted-character-data'
    },
    3: {
      prompt: 'CoC7.Tutorial.ImportNPC.3',
      pointAt: ['down', 'button.dialog-button.import'],
      next: {
        hook: 'renderActorSheet',
        class: 'CoC7NPCSheet'
      }
    },
    4: {
      prompt: 'CoC7.Tutorial.ImportNPC.4',
      setup: ({ id = '' } = {}) => {
        game.CoC7Tutorial.setPointer({ drag: false, prefixId: id })
      },
      pointAt: ['up', 'a.lock'],
      next: {
        hook: 'actorLockClickedCoC7'
      }
    },
    5: {
      prompt: 'CoC7.Tutorial.ImportNPC.5'
    }
  }
}
