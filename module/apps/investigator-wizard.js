/* global $, Actor, ChatMessage, CONST, FormApplication, foundry, game, Hooks, renderTemplate, Roll, TextEditor, ui */
import { AverageRoll } from '../apps/average-roll.js'
import { COC7 } from '../config.js'
import { CoCActor } from '../actors/actor.js'
import { CoC7OccupationSheet } from '../items/sheets/occupation.js'
import { CoC7Utilities } from '../utilities.js'
import { SkillSpecializationSelectDialog } from '../apps/skill-specialization-select-dialog.js'

export class CoC7InvestigatorWizard extends FormApplication {
  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'investigator-wizard-application',
      classes: ['coc7', 'dialog', 'investigator-wizard'],
      title: game.i18n.localize('CoC7.InvestigatorWizard.Title'),
      template: 'systems/CoC7/templates/apps/investigator-wizard.hbs',
      width: 520,
      height: 600,
      closeOnSubmit: false,
      scrollY: ['.scrollsection'],
      dragDrop: [{ dragSelector: '.draggable', dropSelector: null }]
    })
  }

  get pageList () {
    return {
      PAGE_NONE: -1,
      PAGE_INTRODUCTION: 0,
      PAGE_CONFIGURATION: 1,
      PAGE_SETUPS: 2,
      PAGE_ARCHETYPES: 3,
      PAGE_CHARACTISTICS: 4,
      PAGE_ATTRIBUTES: 5,
      PAGE_VIEW_ATTRIBUTES: 6,
      PAGE_OCCUPATIONS: 7,
      PAGE_OCCUPATION_SKILLS: 8,
      PAGE_ARCHETYPE_SKILLS: 9,
      PAGE_POINTS_SKILLS: 10,
      PAGE_INVESTIGATOR: 11,
      PAGE_BACKSTORY: 12,
      PAGE_CREATE: 13
    }
  }

  get characteristicsMethods () {
    return {
      METHOD_DEFAULT: 1,
      METHOD_ROLL: 1,
      METHOD_POINTS: 2,
      METHOD_VALUES: 3,
      METHOD_CHOOSE: 4
    }
  }

  get cocidCreditRating () {
    return 'i.skill.credit-rating'
  }

  get cocidLanguageOwn () {
    return 'i.skill.language-own'
  }

  get pageOrder () {
    const pages = this.pageList
    let pageOrder = [
      pages.PAGE_INTRODUCTION
    ]
    if (game.user.isGM) {
      pageOrder.push(pages.PAGE_CONFIGURATION)
    }
    if (this.object.defaultSetup === '') {
      pageOrder.push(pages.PAGE_SETUPS)
    }
    if (game.settings.get('CoC7', 'pulpRuleArchetype')) {
      pageOrder.push(pages.PAGE_ARCHETYPES)
    }
    pageOrder.push(pages.PAGE_CHARACTISTICS)
    if (!game.settings.get('CoC7', 'pulpRuleIgnoreAgePenalties')) {
      pageOrder.push(pages.PAGE_ATTRIBUTES)
    }
    pageOrder = pageOrder.concat([
      pages.PAGE_VIEW_ATTRIBUTES,
      pages.PAGE_OCCUPATIONS,
      pages.PAGE_OCCUPATION_SKILLS
    ])
    if (game.settings.get('CoC7', 'pulpRuleArchetype')) {
      pageOrder.push(pages.PAGE_ARCHETYPE_SKILLS)
    }
    pageOrder = pageOrder.concat([
      pages.PAGE_POINTS_SKILLS,
      pages.PAGE_INVESTIGATOR,
      pages.PAGE_BACKSTORY,
      pages.PAGE_CREATE
    ])
    return pageOrder
  }

  static async loadCacheItemByCoCID () {
    return new Promise((resolve, reject) => {
      game.system.api.cocid.fromCoCIDRegexBest({ cocidRegExp: /^i\./, type: 'i', showLoading: true }).then((items) => {
        const list = {}
        for (const item of items) {
          list[item.flags.CoC7.cocidFlag.id] = item
        }
        resolve(list)
      })
    })
  }

  async filterCacheItemByCoCID (regexp) {
    return Object.entries(await this.object.cacheCoCID).filter(entry => entry[0].match(regexp)).map(entry => entry[1])
  }

  async getCacheItemByCoCID (id) {
    return (await this.object.cacheCoCID)[id] ?? false
  }

  async expandItemArray (itemList) {
    const items = itemList.filter(it => typeof it !== 'string')
    const cocids = itemList.filter(it => typeof it === 'string')
    if (cocids.length) {
      const source = await this.object.cacheCoCID
      const missing = []
      for (const cocid of cocids) {
        if (typeof source[cocid] !== 'undefined') {
          items.push(source[cocid])
        } else {
          missing.push(cocid)
        }
      }
      if (missing.length) {
        const era = game.i18n.format(COC7.eras[this.object.defaultEra] ?? 'CoC7.CoCIDFlag.error.unknown-era', { era: this.object.defaultEra })
        ui.notifications.warn(game.i18n.format('CoC7.CoCIDFlag.error.documents-not-found', { cocids: missing.join(', '), lang: game.i18n.lang, era }))
      }
    }
    return items
  }

  getAgeAdjustments () {
    for (const key in this.object.setupModifiers) {
      this.object.setupModifiers[key] = 0
    }
    // edu: optional - number of edu improvement checks
    // deduct: optional - deduct [total] between [from]
    // reduce: optional - deduct [totla] from [from]
    // luck: optional - reroll luck and take higher
    if (!game.settings.get('CoC7', 'pulpRuleIgnoreAgePenalties')) {
      if (this.object.age >= 40) {
        const key = Math.floor(this.object.age / 10)
        this.object.requiresAgeAdjustments = {
          edu: {
            total: (key - 2 > 4 ? 4 : key - 2),
            rolled: false
          },
          deduct: {
            total: (key > 1 ? 5 * Math.pow(2, key - 4) : 0),
            from: ['str', 'con', 'dex'],
            values: {}
          },
          reduce: {
            total: (key - 3) * 5,
            from: 'app'
          }
        }
      } else if (this.object.age >= 20) {
        this.object.requiresAgeAdjustments = {
          edu: {
            total: 1,
            rolled: false
          }
        }
      } else if (this.object.age >= 15) {
        this.object.requiresAgeAdjustments = {
          deduct: {
            total: 5,
            from: ['str', 'siz'],
            values: {}
          },
          reduce: {
            total: 5,
            from: 'edu'
          },
          luck: true
        }
      }
      if (typeof this.object.requiresAgeAdjustments.reduce !== 'undefined') {
        this.object.setupModifiers[this.object.requiresAgeAdjustments.reduce.from] = -this.object.requiresAgeAdjustments.reduce.total
      }
    }
  }

  async getData () {
    const sheetData = await super.getData()

    sheetData.isKeeper = game.user.isGM

    sheetData.pages = this.pageList

    sheetData.canNext = false
    sheetData.createButton = false

    let setup
    let archetype
    let occupation

    let showMonetary = false

    switch (sheetData.object.step) {
      case sheetData.pages.PAGE_INTRODUCTION:
        sheetData.era = game.i18n.format(COC7.eras[sheetData.object.defaultEra] ?? 'CoC7.CoCIDFlag.error.unknown-era', { era: sheetData.object.defaultEra })
        sheetData.canNext = true
        break

      case sheetData.pages.PAGE_CONFIGURATION:
        if (game.user.isGM) {
          sheetData.setups = await this.filterCacheItemByCoCID(/^i\.setup\./)
          sheetData.setupOptions = sheetData.setups.reduce((c, d) => { c.push({ key: d.flags.CoC7.cocidFlag.id, name: d.name }); return c }, [])
          sheetData.occupations = await this.filterCacheItemByCoCID(/^i\.occupation\./)
          sheetData.archetypes = await this.filterCacheItemByCoCID(/^i\.archetype\./)
          setup = sheetData.setups.find(s => s.flags.CoC7.cocidFlag.id === sheetData.object.defaultSetup)
          if (typeof setup === 'undefined') {
            sheetData.object.defaultSetup = ''
            sheetData.object.setup = ''
          } else {
            sheetData.description = await TextEditor.enrichHTML(
              setup.system.description.value,
              {
                async: true,
                secrets: game.user.isGM
              }
            )
          }
          sheetData.ownership = {
            [CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE]: 'OWNERSHIP.NONE',
            [CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED]: 'OWNERSHIP.LIMITED',
            [CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER]: 'OWNERSHIP.OBSERVER',
            [CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER]: 'OWNERSHIP.OWNER'
          }
          sheetData._eras = []
          for (const [key, value] of Object.entries(COC7.eras)) {
            sheetData._eras.push({
              id: key,
              name: game.i18n.localize(value)
            })
          }
          sheetData.characteristicsMethods = this.characteristicsMethods
          sheetData.characteristicsMethod = sheetData.characteristicsMethods.METHOD_DEFAULT
          if (sheetData.object.enforcePointBuy) {
            sheetData.characteristicsMethod = sheetData.characteristicsMethods.METHOD_POINTS
          } else if (this.object.chooseRolledValues) {
            sheetData.characteristicsMethod = sheetData.characteristicsMethods.METHOD_CHOOSE
          } else if (this.object.quickFireValues.length) {
            sheetData.characteristicsMethod = sheetData.characteristicsMethods.METHOD_VALUES
          }
          sheetData._eras.sort(CoC7Utilities.sortByNameKey)
          sheetData.hasArchetypes = game.settings.get('CoC7', 'pulpRuleArchetype')
          sheetData.canNext = true
        }
        break

      case sheetData.pages.PAGE_SETUPS:
        if (sheetData.object.defaultSetup === '') {
          sheetData.setups = await this.filterCacheItemByCoCID(/^i\.setup\./)
          sheetData.setups.sort(CoC7Utilities.sortByNameKey)
          sheetData.setupOptions = sheetData.setups.reduce((c, d) => { c.push({ key: d.flags.CoC7.cocidFlag.id, name: d.name }); return c }, [])
          if (sheetData.object.setup !== '') {
            setup = sheetData.setups.find(s => s.flags.CoC7.cocidFlag.id === sheetData.object.setup)
            if (typeof setup !== 'undefined') {
              sheetData.description = await TextEditor.enrichHTML(
                setup.system.description.value,
                {
                  async: true,
                  secrets: game.user.isGM
                }
              )
              sheetData.canNext = true
            }
          }
        }
        break

      case sheetData.pages.PAGE_ARCHETYPES:
        sheetData.archetypes = await this.filterCacheItemByCoCID(/^i\.archetype\./)
        if (sheetData.archetypes.length === 0) {
          sheetData.canNext = true
        } else {
          sheetData.archetypes.sort(CoC7Utilities.sortByNameKey)
          sheetData.archetypeOptions = sheetData.archetypes.reduce((c, d) => { c.push({ key: d.flags.CoC7.cocidFlag.id, name: d.name }); return c }, [])
          if (sheetData.object.archetype !== '') {
            archetype = sheetData.archetypes.find(s => s.flags.CoC7.cocidFlag.id === sheetData.object.archetype)
            if (typeof archetype !== 'undefined') {
              sheetData.description = await TextEditor.enrichHTML(
                archetype.system.description.value,
                {
                  async: true,
                  secrets: game.user.isGM
                }
              )
              sheetData.bonusPoints = archetype.system.bonusPoints
              const coreCharacteristics = []
              for (const coreCharacteristic in archetype.system.coreCharacteristics) {
                if (archetype.system.coreCharacteristics[coreCharacteristic]) {
                  coreCharacteristics.push(coreCharacteristic)
                }
              }
              if (coreCharacteristics.length === 0) {
                this.object.coreCharacteristic = ''
              } else if (coreCharacteristics.length === 1) {
                this.object.coreCharacteristic = coreCharacteristics[0]
              }
              sheetData.coreCharacteristic = coreCharacteristics.map(c => c.toLocaleUpperCase()).join(' ' + game.i18n.localize('CoC7.Or') + ' ')
              const skills = []
              archetype.system.skills = await this.expandItemArray(archetype.system.skills)
              for (const skill of archetype.system.skills) {
                skills.push(skill.name)
              }
              sheetData.skills = skills.join(', ')
              sheetData.suggestedOccupations = await TextEditor.enrichHTML(
                archetype.system.suggestedOccupations,
                {
                  async: true,
                  secrets: game.user.isGM
                }
              )
              sheetData.suggestedTraits = await TextEditor.enrichHTML(
                archetype.system.suggestedTraits,
                {
                  async: true,
                  secrets: game.user.isGM
                }
              )
              sheetData.canNext = true
            }
          }
        }
        break

      case sheetData.pages.PAGE_CHARACTISTICS:
        sheetData.characteristicsMethods = this.characteristicsMethods
        sheetData.characteristicsMethod = sheetData.characteristicsMethods.METHOD_ROLL
        if (sheetData.object.setup !== '') {
          setup = await this.getCacheItemByCoCID(this.object.setup)
          if (typeof setup !== 'undefined') {
            if (setup.system.characteristics.points.enabled || this.object.enforcePointBuy) {
              sheetData.characteristicsMethod = sheetData.characteristicsMethods.METHOD_POINTS
            } else if (this.object.chooseRolledValues) {
              sheetData.characteristicsMethod = sheetData.characteristicsMethods.METHOD_CHOOSE
            } else if (this.object.quickFireValues.length) {
              sheetData.characteristicsMethod = sheetData.characteristicsMethods.METHOD_VALUES
            }
            sheetData.setup = {
              total: 0,
              points: setup.system.characteristics.points.value,
              characteristics: [
                {
                  key: 'str',
                  roll: setup.system.characteristics.rolls.str,
                  label: 'CHARAC.Strength'
                },
                {
                  key: 'con',
                  roll: setup.system.characteristics.rolls.con,
                  label: 'CHARAC.Constitution'
                },
                {
                  key: 'siz',
                  roll: setup.system.characteristics.rolls.siz,
                  label: 'CHARAC.Size'
                },
                {
                  key: 'dex',
                  roll: setup.system.characteristics.rolls.dex,
                  label: 'CHARAC.Dexterity'
                },
                {
                  key: 'app',
                  roll: setup.system.characteristics.rolls.app,
                  label: 'CHARAC.Appearance'
                },
                {
                  key: 'int',
                  roll: setup.system.characteristics.rolls.int,
                  label: 'CHARAC.Intelligence'
                },
                {
                  key: 'pow',
                  roll: setup.system.characteristics.rolls.pow,
                  label: 'CHARAC.Power'
                },
                {
                  key: 'edu',
                  roll: setup.system.characteristics.rolls.edu,
                  label: 'CHARAC.Education'
                }
              ],
              luck: {
                roll: setup.system.characteristics.rolls.luck,
                label: 'CoC7.Luck'
              }
            }
            sheetData.coreCharacteristics = []
            if (sheetData.object.archetype !== '') {
              archetype = await this.getCacheItemByCoCID(this.object.archetype)
              if (typeof archetype !== 'undefined') {
                for (const coreCharacteristic in archetype.system.coreCharacteristics) {
                  if (archetype.system.coreCharacteristics[coreCharacteristic]) {
                    sheetData.coreCharacteristics.push({
                      key: coreCharacteristic,
                      name: game.i18n.format(sheetData.setup.characteristics.find(c => c.key === coreCharacteristic)?.label ?? 'Unknown')
                    })
                  }
                }
                sheetData.coreCharacteristics.sort(CoC7Utilities.sortByNameKey)
                if (this.object.coreCharacteristic !== '') {
                  if (archetype.system.coreCharacteristicsFormula.enabled) {
                    sheetData.setup.characteristics.find(c => c.key === this.object.coreCharacteristic).roll = archetype.system.coreCharacteristicsFormula.value
                  }
                }
              }
            }
            let empties = false
            for (const key in sheetData.object.setupPoints) {
              if (sheetData.object.setupPoints[key] !== '') {
                if (key !== 'luck') {
                  sheetData.setup.total += parseInt(sheetData.object.setupPoints[key], 10)
                }
              } else {
                empties = true
              }
            }
            if (this.object.coreCharacteristic) {
              sheetData.coreCharacteristic = this.object.coreCharacteristic.toLocaleUpperCase()
            }
            if (!empties && this.object.age >= 15) {
              if ([sheetData.characteristicsMethods.METHOD_ROLL, sheetData.characteristicsMethods.METHOD_VALUES, sheetData.characteristicsMethods.METHOD_CHOOSE].includes(sheetData.characteristicsMethod)) {
                sheetData.canNext = true
              } else if (sheetData.setup.total.toString() === sheetData.setup.points.toString()) {
                sheetData.canNext = true
              }
            }
          }
        }
        break

      case sheetData.pages.PAGE_ATTRIBUTES:
        sheetData.pulpRuleIgnoreAgePenalties = game.settings.get('CoC7', 'pulpRuleIgnoreAgePenalties')
        sheetData.canNext = true
        sheetData.points = {}
        for (const key in this.object.setupModifiers) {
          sheetData.points[key] = {
            value: parseInt(this.object.setupPoints[key], 10) + parseInt(this.object.setupModifiers[key], 10),
            min: -parseInt(this.object.setupPoints[key], 10) + 1,
            label: CoC7Utilities.getCharacteristicNames(key).label
          }
        }
        if (typeof this.object.requiresAgeAdjustments.edu !== 'undefined' && !this.object.requiresAgeAdjustments.edu.rolled) {
          sheetData.canNext = false
        }
        if (typeof this.object.requiresAgeAdjustments.deduct !== 'undefined') {
          sheetData.deductTotal = 0
          for (const key of this.object.requiresAgeAdjustments.deduct.from) {
            sheetData.deductTotal = sheetData.deductTotal - parseInt(this.object.setupModifiers[key], 10)
          }
          sheetData.deductFrom = this.object.requiresAgeAdjustments.deduct.from.map(n => game.i18n.localize('CHARAC.' + n.toUpperCase())).join(', ').replace(/(, )([^,]+)$/, '$1' + game.i18n.localize('CoC7.Or') + ' $2').replace(/^([^,]+),([^,]+)$/, '$1$2')
          if (sheetData.deductTotal !== this.object.requiresAgeAdjustments.deduct.total) {
            sheetData.canNext = false
          }
        }
        if (typeof this.object.requiresAgeAdjustments.reduce !== 'undefined') {
          sheetData.reduceFrom = game.i18n.localize('CHARAC.' + this.object.requiresAgeAdjustments.reduce.from.toUpperCase())
        }
        if (typeof this.object.requiresAgeAdjustments.luck !== 'undefined') {
          sheetData.luckValue = Math.max(this.object.setupPoints.luck, this.object.setupModifiers.luck)
          if (this.object.setupModifiers.luck === 0) {
            sheetData.canNext = false
          }
        }
        break

      case sheetData.pages.PAGE_VIEW_ATTRIBUTES:
        sheetData.points = {}
        for (const key in this.object.setupModifiers) {
          sheetData.points[key] = {
            value: parseInt(this.object.setupPoints[key], 10) + parseInt(this.object.setupModifiers[key], 10),
            prefix: '',
            suffix: '%',
            label: CoC7Utilities.getCharacteristicNames(key).label
          }
        }
        sheetData.points.db = {
          value: CoCActor.dbFromCharacteristics(sheetData.points),
          prefix: '',
          suffix: '',
          label: 'CoC7.BonusDamage'
        }
        if (isNaN(sheetData.points.db.value) || Number(sheetData.points.db.value) >= 0) {
          sheetData.points.db.prefix = '+'
        }
        sheetData.points.build = {
          value: CoCActor.buildFromCharacteristics(sheetData.points),
          prefix: '',
          suffix: '',
          label: 'CoC7.Build'
        }
        if (Number(sheetData.points.build.value) >= 0) {
          sheetData.points.build.prefix = '+'
        }
        sheetData.points.hp = {
          value: CoCActor.hpFromCharacteristics(sheetData.points, 'character'),
          prefix: '',
          suffix: '',
          label: 'CoC7.HitPoints'
        }
        sheetData.points.hp.prefix = sheetData.points.hp.value + '/'
        sheetData.points.mp = {
          value: CoCActor.mpFromCharacteristics(sheetData.points),
          prefix: '',
          suffix: '',
          label: 'CoC7.MagicPoints'
        }
        sheetData.points.mp.prefix = sheetData.points.mp.value + '/'
        sheetData.points.san = {
          value: sheetData.points.pow.value,
          prefix: '',
          suffix: '/99',
          label: 'CoC7.Sanity'
        }
        sheetData.points.mov = {
          value: CoCActor.movFromCharacteristics(sheetData.points, 'character', this.object.age),
          prefix: '',
          suffix: '',
          label: 'CoC7.Movement'
        }
        sheetData.canNext = true
        break

      case sheetData.pages.PAGE_OCCUPATIONS:
        sheetData.occupations = await this.filterCacheItemByCoCID(/^i\.occupation\./)
        sheetData.occupations.sort(CoC7Utilities.sortByNameKey)
        sheetData.occupationOptions = sheetData.occupations.reduce((c, d) => { c.push({ key: d.flags.CoC7.cocidFlag.id, name: d.name }); return c }, [])
        if (sheetData.object.occupation !== '') {
          occupation = sheetData.occupations.find(s => s.flags.CoC7.cocidFlag.id === sheetData.object.occupation)
          if (typeof occupation !== 'undefined') {
            sheetData.description = await TextEditor.enrichHTML(
              occupation.system.description.value,
              {
                async: true,
                secrets: game.user.isGM
              }
            )
            sheetData.occupationPointsString = CoC7OccupationSheet.occupationPointsString(occupation.system.occupationSkillPoints)
            sheetData.creditRating = occupation.system.creditRating
            sheetData.personal = occupation.system.personal
            sheetData.personalText = occupation.system.personalText
            sheetData.skills = await this.expandItemArray(occupation.system.skills)
            sheetData.groups = {}
            for (let index = 0; index < occupation.system.groups.length; index++) {
              sheetData.groups[index] = {
                options: occupation.system.groups[index].options,
                skills: []
              }
              sheetData.groups[index].skills = await this.expandItemArray(occupation.system.groups[index].skills)
            }
            sheetData.points = 0
            const options = []
            for (const [key, carac] of Object.entries(occupation.system.occupationSkillPoints)) {
              if (carac.selected) {
                if (carac.optional) {
                  options.push(carac.multiplier * (parseInt(this.object.setupPoints[key], 10) + parseInt(this.object.setupModifiers[key], 10)))
                } else {
                  sheetData.points += carac.multiplier * (parseInt(this.object.setupPoints[key], 10) + parseInt(this.object.setupModifiers[key], 10))
                }
              }
            }
            if (options.length > 0) {
              sheetData.points += Math.max(...options)
            }
            sheetData.canNext = true
          }
        }
        break

      case sheetData.pages.PAGE_INVESTIGATOR:
        sheetData.language = (typeof this.object.skillItems[this.cocidLanguageOwn] !== 'undefined')
        if (sheetData.language) {
          sheetData.languageName = this.object.skillItems[this.cocidLanguageOwn].item.name
        } else {
          sheetData.languageName = ''
        }
        sheetData.canNext = true
        break

      case sheetData.pages.PAGE_OCCUPATION_SKILLS:
        sheetData.default = 0
        sheetData.selected = 0
        sheetData.skillItems = []
        for (const key in this.object.skillItems) {
          let group = 'other'
          const rows = sheetData.object.skillItems[key].rows.length
          const isMultiple = sheetData.object.skillItems[key].flags.isMultiple
          if (isMultiple) {
            sheetData.skillItems.push({
              key,
              index: -1,
              name: sheetData.object.skillItems[key].item.name,
              group,
              toggle: false,
              isCreditRating: false,
              isMultiple: true,
              isPickable: false
            })
          }
          for (let index = 0; index < rows; index++) {
            let isPickable = false
            if (sheetData.object.skillItems[key].rows[index].isOccupationDefault) {
              group = 'default'
              if (isMultiple) {
                isPickable = true
              }
              sheetData.default++
            } else if (sheetData.object.skillItems[key].rows[index].inOccupationGroup !== false) {
              group = sheetData.object.skillItems[key].rows[index].inOccupationGroup
              if (isMultiple) {
                isPickable = true
              }
            } else {
              group = 'other'
            }
            let toggle = sheetData.object.skillItems[key].rows[index].occupationToggle
            if (isPickable) {
              toggle = false
            }
            let specialization = sheetData.object.skillItems[key].item.system.specialization
            let skillName = sheetData.object.skillItems[key].item.system.skillName
            let picked = false
            let deleteable = false
            if (typeof sheetData.object.skillItems[key].rows[index].selected === 'string') {
              picked = true
              skillName = sheetData.object.skillItems[key].rows[index].selected
            } else if (sheetData.object.skillItems[key].rows[index].selected !== false) {
              picked = true
              specialization = sheetData.object.skillItems[key].rows[index].selected.system.specialization
              skillName = sheetData.object.skillItems[key].rows[index].selected.system.skillName
            }
            if (toggle || (isPickable && picked)) {
              sheetData.selected++
            }
            let name = sheetData.object.skillItems[key].item.name
            if (key === this.cocidLanguageOwn) {
              name = specialization + ' (' + skillName + ')'
            } else if (!isPickable && picked) {
              name = specialization + ' (' + skillName + ')'
            }
            if (!isPickable && picked) {
              deleteable = !sheetData.object.skillItems[key].rows[index].archetypeToggle
            }
            sheetData.skillItems.push({
              key,
              index,
              name,
              group: group.toString(),
              toggle,
              isCreditRating: sheetData.object.skillItems[key].rows[index].isCreditRating,
              isMultiple: false,
              isPickable,
              picked,
              deleteable,
              specialization,
              skillName
            })
          }
        }
        sheetData.max = (parseInt(sheetData.default, 10) || 0) + (parseInt(sheetData.object.personal, 10) || 0) + Object.values(sheetData.object.occupationGroups).reduce((s, v) => s + (parseInt(v, 10) || 0), 0)
        sheetData.skillItems.sort(CoC7Utilities.sortByNameKey)
        if (sheetData.selected === sheetData.max) {
          sheetData.canNext = true
        }
        break

      case sheetData.pages.PAGE_ARCHETYPE_SKILLS:
        sheetData.max = 0
        sheetData.selected = 0
        sheetData.skillItems = []
        for (const key in this.object.skillItems) {
          let group = 'other'
          const rows = sheetData.object.skillItems[key].rows.length
          const isMultiple = sheetData.object.skillItems[key].flags.isMultiple
          if (isMultiple) {
            sheetData.skillItems.push({
              key,
              index: -1,
              name: sheetData.object.skillItems[key].item.name,
              group,
              toggle: false,
              isCreditRating: false,
              isMultiple: true,
              isPickable: false
            })
          }
          for (let index = 0; index < rows; index++) {
            let isPickable = false
            if (sheetData.object.skillItems[key].rows[index].isArchetypeDefault) {
              group = 'default'
              if (isMultiple) {
                isPickable = true
              }
              sheetData.max++
            } else {
              group = 'other'
            }
            let toggle = sheetData.object.skillItems[key].rows[index].archetypeToggle
            if (isPickable) {
              toggle = false
            }
            let specialization = sheetData.object.skillItems[key].item.system.specialization
            let skillName = sheetData.object.skillItems[key].item.system.skillName
            let picked = false
            let deleteable = false
            if (typeof sheetData.object.skillItems[key].rows[index].selected === 'string') {
              picked = true
              skillName = sheetData.object.skillItems[key].rows[index].selected
            } else if (sheetData.object.skillItems[key].rows[index].selected !== false) {
              picked = true
              specialization = sheetData.object.skillItems[key].rows[index].selected.system.specialization
              skillName = sheetData.object.skillItems[key].rows[index].selected.system.skillName
            }
            if (toggle || (isPickable && picked)) {
              sheetData.selected++
            }
            let name = sheetData.object.skillItems[key].item.name
            if (key === this.cocidLanguageOwn) {
              name = specialization + ' (' + skillName + ')'
            } else if (!isPickable && picked) {
              name = specialization + ' (' + skillName + ')'
            }
            if (!isPickable && picked) {
              deleteable = !sheetData.object.skillItems[key].rows[index].occupationToggle
            }
            sheetData.skillItems.push({
              key,
              index,
              name,
              group: group.toString(),
              toggle,
              isCreditRating: false,
              isMultiple: false,
              isPickable,
              picked,
              deleteable,
              specialization,
              skillName
            })
          }
        }
        sheetData.skillItems.sort(CoC7Utilities.sortByNameKey)
        if (sheetData.selected === sheetData.max) {
          sheetData.canNext = true
        }
        break

      case sheetData.pages.PAGE_POINTS_SKILLS:
        sheetData.skills = []
        sheetData.creditRatingOkay = !(this.object.creditRating.max > 0)
        sheetData.personal = {
          count: 0,
          total: 2 * (parseInt(this.object.setupPoints.int, 10) + parseInt(this.object.setupModifiers.int, 10)),
          remaining: 0
        }
        sheetData.occupation = {
          count: 0,
          total: 0,
          remaining: 0
        }
        sheetData.archetype = {
          count: 0,
          total: 0,
          remaining: 0
        }
        if (sheetData.object.setup !== '') {
          showMonetary = (await this.getCacheItemByCoCID(sheetData.object.setup)).system.monetary.values.length > 0
        }
        if (sheetData.object.occupation !== '') {
          occupation = await this.getCacheItemByCoCID(this.object.occupation)
          if (occupation) {
            const options = []
            for (const [key, carac] of Object.entries(occupation.system.occupationSkillPoints)) {
              if (carac.selected) {
                if (carac.optional) {
                  options.push(carac.multiplier * (parseInt(this.object.setupPoints[key], 10) + parseInt(this.object.setupModifiers[key], 10)))
                } else {
                  sheetData.occupation.total += carac.multiplier * (parseInt(this.object.setupPoints[key], 10) + parseInt(this.object.setupModifiers[key], 10))
                }
              }
            }
            if (options.length > 0) {
              sheetData.occupation.total += Math.max(...options)
            }
          }
        }
        if (this.object.archetype !== '') {
          const archetype = await game.system.api.cocid.fromCoCID(this.object.archetype)
          if (archetype.length === 1) {
            sheetData.archetype.total = archetype[0].system.bonusPoints
          }
        }
        if (Object.keys(this.object.skillItems).length > 0) {
          for (const key in this.object.skillItems) {
            const skill = this.object.skillItems[key]
            for (let index = 0, im = skill.rows.length; index < im; index++) {
              const row = skill.rows[index]
              if (!skill.flags.isMultiple || row.selected !== false) {
                let item = foundry.utils.duplicate(skill.item)
                if (row.selected !== false && typeof row.selected !== 'string') {
                  item = foundry.utils.duplicate(row.selected)
                }
                let base = item.system.base
                if (!Number.isNumeric(base)) {
                  for (const key in this.object.setupPoints) {
                    const regEx = new RegExp('@' + key, 'i')
                    base = base.replace(regEx, parseInt(this.object.setupPoints[key], 10) + parseInt(this.object.setupModifiers[key], 10))
                  }
                }
                if (!Number.isNumeric(base)) {
                  base = Math.floor(new AverageRoll('(' + base + ')')[(!foundry.utils.isNewerVersion(game.version, '12') ? 'evaluate' : 'evaluateSync')/* // FoundryVTT v11 */]({ minimize: true, maximize: true }).total)
                }
                let totalPoints = parseInt(base, 10)
                if (Number(row.personalPoints) > 0) {
                  const num = Number(row.personalPoints)
                  sheetData.personal.count += num
                  totalPoints = totalPoints + num
                }
                if (Number(row.occupationPoints) > 0) {
                  const num = Number(row.occupationPoints)
                  sheetData.occupation.count += num
                  totalPoints = totalPoints + num
                }
                if (Number(row.archetypePoints) > 0) {
                  const num = Number(row.archetypePoints)
                  sheetData.archetype.count += num
                  totalPoints = totalPoints + num
                }
                if (Number(row.experiencePoints) > 0) {
                  const num = Number(row.experiencePoints)
                  totalPoints = totalPoints + num
                }
                let name = item.name
                if (key === this.cocidLanguageOwn) {
                  name = item.system.specialization + ' (' + item.system.skillName + ')'
                } else if (skill.flags.isCreditRating) {
                  name = name + ' [' + this.object.creditRating.min + ' - ' + this.object.creditRating.max + ']'
                  if (totalPoints >= this.object.creditRating.min && totalPoints <= this.object.creditRating.max) {
                    sheetData.creditRatingOkay = true
                  }
                } else if (typeof row.selected === 'string') {
                  name = item.system.specialization + ' (' + row.selected + ')'
                }
                sheetData.skills.push({
                  key,
                  index,
                  name,
                  isOccupation: row.occupationToggle,
                  isArchetype: row.archetypeToggle,
                  base,
                  personalPoints: row.personalPoints,
                  occupationPoints: row.occupationPoints,
                  archetypePoints: row.archetypePoints,
                  experiencePoints: row.experiencePoints,
                  totalPoints,
                  showCreditRating: showMonetary && key === this.cocidCreditRating
                })
              }
            }
          }
          sheetData.skills.sort(CoC7Utilities.sortByNameKey)
          if (sheetData.creditRatingOkay) {
            sheetData.canNext = true
          }
        }

        sheetData.personal.remaining = sheetData.personal.total - sheetData.personal.count
        sheetData.occupation.remaining = sheetData.occupation.total - sheetData.occupation.count
        sheetData.archetype.remaining = sheetData.archetype.total - sheetData.archetype.count
        break

      case sheetData.pages.PAGE_BACKSTORY:
        {
          const allBackstories = await this.object.cacheBackstories
          sheetData.backstories = {}
          for (let index = 0; index < this.object.bioSections.length; index++) {
            let rolls = ''
            if (this.object.bioSections[index].name.startsWith('rt..')) {
              rolls = this.object.bioSections[index].name
            } else {
              const match = this.object.bioSections[index].name.match(/^CoC7\.CoCIDFlag\.keys\.(rt\.\..+)$/)
              if (match) {
                rolls = match[1]
              }
            }
            sheetData.backstories[index] = {
              index,
              name: this.object.bioSections[index].name,
              rolls: (rolls !== '' && game.system.api.cocid.findCocIdInList(rolls, allBackstories).length ? rolls : ''),
              value: this.object.bioSections[index].value
            }
          }
        }
        sheetData.canNext = true
        sheetData.createButton = game.user.hasPermission('ACTOR_CREATE')
        break

      case sheetData.pages.PAGE_CREATE:
        sheetData.canNext = true
        sheetData.createButton = true
        break
    }

    return sheetData
  }

  activateListeners (html) {
    super.activateListeners(html)
    html.keypress(e => /textarea/i.test((e.target || e.srcElement).tagName) || (e.keyCode || e.which || e.charCode || 0) !== 13)
    html.find('.submit_on_change').change(this._onChangeSubmit.bind(this))
    html.find('.roll-characteristic').click(this._onRollCharacteristic.bind(this))
    html.find('.increase-10-characteristic').click(this._onIncreaseCharacteristic10.bind(this))
    html.find('.increase-characteristic').click(this._onIncreaseCharacteristic.bind(this))
    html.find('.decrease-characteristic').click(this._onDecreaseCharacteristic.bind(this))
    html.find('.decrease-10-characteristic').click(this._onDecreaseCharacteristic10.bind(this))
    html.find('button.roll_all').click(this._onRollAll.bind(this))
    html.find('button.roll_choose').click(this._onRollChoose.bind(this))
    html.find('button.roll_edu').click(this._onRollEdu.bind(this))
    html.find('button.roll_luck').click(this._onRollLuck.bind(this))
    html.find('.item input.submit_on_blur').blur(this._onChangeSubmit.bind(this))
    html.find('.item input.save-characteristic-on-blur').blur(this._onChangeSaveCharacteristic.bind(this))
    html.find('.item.toggleable').click(this._onToggleSkill.bind(this))
    html.find('.item.clickable').click(this._onClickPickSkill.bind(this))
    html.find('.skills-list input').click(this._onClickSkillSpecial.bind(this))
    html.find('.skills-list .remove-skill').click(this._onClickRemoveSkill.bind(this))
    html.find('.item input.skill-adjustment').blur(this._onChangeSkillPoints.bind(this))
    html.find('textarea.backstory-text').keyup(this._onChangeBackstoryText.bind(this))
    html.find('button.backstory-roll').click(this._onRollBackstory.bind(this))
    html.find('button.backstory-reset').click(this._onResetBackstory.bind(this))
  }

  async rollMessage (rolls) {
    if (rolls.length) {
      const html = []
      for (const roll of rolls) {
        html.push(await renderTemplate(Roll.CHAT_TEMPLATE, {
          formula: (CoC7Utilities.getCharacteristicNames(roll[0])?.label ?? roll[0]) + ': ' + roll[1],
          tooltip: await roll[2].getTooltip(),
          total: roll[2].total
        }))
      }
      ChatMessage.create({
        user: game.user.id,
        speaker: {
          alias: game.user.name
        },
        content: html.join('<div>&nbsp;</div>'),
        whisper: ChatMessage.getWhisperRecipients('GM')
      })
    }
  }

  addItemToList (item, { isOccupationDefault = false, inOccupationGroup = false, occupationToggle = false, isArchetypeDefault = false, archetypeToggle = false, isCreditRating = false } = {}) {
    const key = (item.flags.CoC7?.cocidFlag?.id ?? item.name)
    if (item.type !== 'skill') {
      this.object.investigatorItems.push(item)
      return
    }
    const isMultiple = !!(item.system.properties.special && ((item.system.properties.requiresname && !(item.system.properties.onlyone ?? false)) || item.system.properties.picknameonly || item.name === game.i18n.format('CoC7.AnySpecName')))
    const flags = {
      isOccupationDefault,
      inOccupationGroup,
      isArchetypeDefault,
      isCreditRating,
      occupationToggle,
      archetypeToggle
    }
    const rows = {
      occupationPoints: '',
      archetypePoints: '',
      experiencePoints: '',
      personalPoints: '',
      selected: false
    }
    if (typeof this.object.skillItems[key] === 'undefined') {
      this.object.skillItems[key] = {
        item,
        flags: foundry.utils.mergeObject(flags, { isMultiple }, { inplace: false }),
        rows: []
      }
      if (!isMultiple || !(isOccupationDefault === false && inOccupationGroup === false && isArchetypeDefault === false)) {
        this.object.skillItems[key].rows.push(foundry.utils.mergeObject(flags, rows, { inplace: false }))
      }
    } else {
      if (!isMultiple) {
        for (const flag in flags) {
          this.object.skillItems[key].rows[0][flag] = this.object.skillItems[key].rows[0][flag] || flags[flag]
        }
      } else {
        this.object.skillItems[key].rows.push(foundry.utils.mergeObject(flags, rows, { inplace: false }))
      }
      for (const flag in flags) {
        this.object.skillItems[key].flags[flag] = this.object.skillItems[key].flags[flag] || flags[flag]
      }
    }
    if (!isMultiple && flags.isCreditRating) {
      this.object.skillItems[key].rows[0].occupationPoints = this.object.creditRating.min
    }
  }

  clearSetupPoints () {
    for (const key in this.object.setupPoints) {
      this.object.setupPoints[key] = ''
    }
    this.object.rolledValues = []
  }

  async setSkillLists () {
    this.object.skillItems = {}
    this.object.occupationGroups = {}
    this.object.investigatorItems = []
    this.object.placeable = foundry.utils.duplicate(this.object.quickFireValues)
    const setup = await this.getCacheItemByCoCID(this.object.setup)
    const occupation = await this.getCacheItemByCoCID(this.object.occupation)
    let archetype = false
    if (this.object.archetype !== '') {
      archetype = await this.getCacheItemByCoCID(this.object.archetype)
    }
    if (setup && occupation && (!game.settings.get('CoC7', 'pulpRuleArchetype') || archetype)) {
      this.object.bioSections = []
      for (let index = 0; index < setup.system.bioSections.length; index++) {
        this.object.bioSections.push({
          name: setup.system.bioSections[index],
          value: ''
        })
      }
      this.object.personal = occupation.system.personal
      this.object.personalText = occupation.system.personalText
      this.object.creditRating = occupation.system.creditRating
      let items = []
      items = await this.expandItemArray(setup.system.items)
      for (let index = 0, im = items.length; index < im; index++) {
        this.addItemToList(items[index])
      }
      items = await this.expandItemArray(occupation.system.skills)
      for (let index = 0, im = items.length; index < im; index++) {
        this.addItemToList(items[index], { isOccupationDefault: true, occupationToggle: true })
      }
      for (let group = 0, gm = occupation.system.groups.length; group < gm; group++) {
        this.object.occupationGroups[group] = occupation.system.groups[group].options
        items = await this.expandItemArray(occupation.system.groups[group].skills)
        for (let index = 0, im = items.length; index < im; index++) {
          this.addItemToList(items[index], { inOccupationGroup: group })
        }
      }
      if (archetype) {
        items = await this.expandItemArray(archetype.system.skills)
        for (let index = 0, im = items.length; index < im; index++) {
          this.addItemToList(items[index], { isArchetypeDefault: true, archetypeToggle: true })
        }
      }
      if (Number(this.object.creditRating.max) > 0) {
        const nameCreditRating = game.i18n.format('CoC7.CoCIDFlag.keys.' + this.cocidCreditRating)
        const flags = { isOccupationDefault: true, occupationToggle: true, isCreditRating: true }
        if (typeof this.object.skillItems[this.cocidCreditRating] !== 'undefined') {
          this.addItemToList(this.object.skillItems[this.cocidCreditRating].item, flags)
        } else if (typeof this.object.skillItems[nameCreditRating] !== 'undefined') {
          this.addItemToList(this.object.skillItems[nameCreditRating].item, flags)
        } else {
          const skill = await game.system.api.cocid.fromCoCID(this.cocidCreditRating)
          if (skill.length) {
            this.addItemToList(skill[0], flags)
          }
        }
      }
    }
  }

  _onDragStart (event) {
    if (event.currentTarget.dataset.characteristicKey) {
      const dragData = { type: 'investigatorCharacteristic', key: event.currentTarget.dataset.characteristicKey, value: event.currentTarget.dataset.value }
      event.dataTransfer.setData('text/plain', JSON.stringify(dragData))
    } else if (event.currentTarget.dataset.offset) {
      const dragData = { type: 'investigatorValue', offset: event.currentTarget.dataset.offset }
      event.dataTransfer.setData('text/plain', JSON.stringify(dragData))
    }
  }

  _canDragStart (selector) {
    return true
  }

  _canDragDrop (selector) {
    return true
  }

  async _onDrop (event) {
    try {
      const dataList = JSON.parse(event.dataTransfer.getData('text/plain'))
      if (dataList.type === 'investigatorCharacteristic') {
        dataList.destination = event.target.closest('li').dataset.characteristicKey
        if (typeof dataList.destination === 'undefined') {
          dataList.destination = event.target.closest('li').dataset.empty
        }
        dataList.okay = false
        if (dataList.destination === 'x') {
          const offset = this.object.rolledValues.findIndex(i => i.assigned === true)
          if (offset > -1) {
            this.object.rolledValues[offset] = {
              value: this.object.setupPoints[dataList.key],
              assigned: false
            }
            this.object.setupPoints[dataList.key] = ''
          }
          dataList.okay = true
        } else if (dataList.key === '-' && typeof this.object.setupPoints[dataList.destination] !== 'undefined') {
          const index = this.object.placeable.indexOf(parseInt(dataList.value, 10))
          if (index !== -1) {
            this.object.placeable.splice(index, 1)
          }
          if (this.object.setupPoints[dataList.destination] !== '') {
            this.object.placeable.push(parseInt(this.object.setupPoints[dataList.destination], 10))
          }
          this.object.setupPoints[dataList.destination] = parseInt(dataList.value, 10)
          this.object.placeable.sort().reverse()
          dataList.okay = true
        } else if (typeof this.object.setupPoints[dataList.key] !== 'undefined' && dataList.destination === '-') {
          if (this.object.setupPoints[dataList.key] !== '') {
            this.object.placeable.push(parseInt(this.object.setupPoints[dataList.key], 10))
            this.object.setupPoints[dataList.key] = ''
            this.object.placeable.sort().reverse()
            dataList.okay = true
          }
        } else if (typeof this.object.setupPoints[dataList.key] !== 'undefined' && typeof this.object.setupPoints[dataList.destination] !== 'undefined') {
          const temp = (this.object.setupPoints[dataList.key] === '' ? '' : parseInt(this.object.setupPoints[dataList.key], 10))
          this.object.setupPoints[dataList.key] = (this.object.setupPoints[dataList.destination] === '' ? '' : parseInt(this.object.setupPoints[dataList.destination], 10))
          this.object.setupPoints[dataList.destination] = temp
          dataList.okay = true
        }
        if (dataList.okay) {
          this.render(true)
          return
        }
      } else if (dataList.type === 'investigatorValue') {
        dataList.destination = event.target.closest('li').dataset.characteristicKey
        dataList.okay = false
        if (typeof dataList.destination !== 'undefined' && this.object.rolledValues[dataList.offset].assigned === false) {
          let old
          if (this.object.setupPoints[dataList.destination] !== '') {
            old = this.object.setupPoints[dataList.destination]
          }
          this.object.setupPoints[dataList.destination] = this.object.rolledValues[dataList.offset].value
          if (typeof old !== 'undefined') {
            this.object.rolledValues[dataList.offset].value = old
          } else {
            this.object.rolledValues[dataList.offset].assigned = true
          }
          dataList.okay = true
        }
        if (dataList.okay) {
          this.render(true)
          return
        }
      }
    } catch (err) {
    }
    const dataList = await CoC7Utilities.getDataFromDropEvent(event, 'Item')
    if ([this.pageList.PAGE_ARCHETYPE_SKILLS, this.pageList.PAGE_OCCUPATION_SKILLS].includes(this.object.step)) {
      for (const item of dataList) {
        if (item.type === 'skill') {
          this.addItemToList(item)
          this.render(true)
        }
      }
    }
  }

  _onClickSkillSpecial (event) {
    event.stopPropagation()
  }

  _onClickRemoveSkill (event) {
    event.stopPropagation()
    const key = event.currentTarget?.parentNode?.dataset?.key
    const index = event.currentTarget?.parentNode?.dataset?.index
    if (typeof this.object.skillItems[key]?.rows[index] !== 'undefined') {
      this.object.skillItems[key].rows.splice(index, index)
      this.render(true)
    }
  }

  async _onToggleSkill (event) {
    const key = event.currentTarget?.dataset?.key
    const index = event.currentTarget?.dataset?.index
    const toggleKey = event.currentTarget?.dataset?.toggleKey
    if (typeof this.object.skillItems[key]?.rows[index] !== 'undefined') {
      this.object.skillItems[key].rows[index][toggleKey] = !this.object.skillItems[key].rows[index][toggleKey]
      this.render(true)
    }
  }

  async _onClickPickSkill (event) {
    const key = event.currentTarget?.dataset?.key
    const index = event.currentTarget?.dataset?.index
    const toggleKey = event.currentTarget?.dataset?.toggleKey
    if (typeof this.object.skillItems[key] !== 'undefined') {
      if (index > -1) {
        this.object.skillItems[key].rows[index][toggleKey] = false
        this.object.skillItems[key].rows[index].selected = false
        this.render(true)
      }
      let skillList = []
      const group = game.system.api.cocid.guessGroupFromKey(key)
      if (group) {
        skillList = (await game.system.api.cocid.fromCoCIDRegexBest({ cocidRegExp: new RegExp('^' + CoC7Utilities.quoteRegExp(group) + '.+$'), type: 'i' })).filter(item => {
          return !(item.system.properties?.special && !!(item.system.properties?.requiresname || item.system.properties?.picknameonly))
        })
        if (skillList.length > 1) {
          skillList.sort(CoC7Utilities.sortByNameKey)
        }
      }
      const skillData = await SkillSpecializationSelectDialog.create({
        skills: skillList,
        allowCustom: (this.object.skillItems[key].item.system.properties?.requiresname ?? false),
        fixedBaseValue: true,
        specializationName: this.object.skillItems[key].item.system.specialization,
        label: this.object.skillItems[key].item.name
      })
      if (index > -1) {
        if (skillData.selected !== '') {
          this.object.skillItems[key].rows[index].selected = skillList.find(i => i.id === skillData.selected)
          this.object.skillItems[key].rows[index][toggleKey] = true
        } else if (skillData.name !== '') {
          this.object.skillItems[key].rows[index].selected = skillData.name
          this.object.skillItems[key].rows[index][toggleKey] = true
        }
      } else {
        let selected = false
        if (skillData.selected !== '') {
          selected = skillList.find(i => i.id === skillData.selected)
        } else if (skillData.name !== '') {
          selected = skillData.name
        }
        this.object.skillItems[key].rows.push({
          isOccupationDefault: false,
          inOccupationGroup: false,
          isArchetypeDefault: false,
          isCreditRating: false,
          occupationToggle: (toggleKey === 'occupationToggle'),
          archetypeToggle: (toggleKey === 'archetypeToggle'),
          occupationPoints: '',
          archetypePoints: '',
          experiencePoints: '',
          personalPoints: '',
          selected
        })
      }
      this.render(true)
    }
  }

  async _onChangeSkillPoints (event) {
    const input = $(event.currentTarget)
    const adjustment = input.data('adjustment')
    const li = input.closest('li')
    const key = li.data('key')
    const index = li.data('index')
    if (typeof this.object.skillItems[key]?.rows[index][adjustment] !== 'undefined') {
      this.object.skillItems[key].rows[index][adjustment] = input.val()
    }
    this.render(true)
  }

  async _onChangeBackstoryText (event) {
    const textarea = $(event.currentTarget)
    const index = textarea.data('index')
    if (typeof this.object.bioSections[index] !== 'undefined') {
      this.object.bioSections[index].value = textarea.val()
    }
  }

  async _onRollBackstory (event) {
    const button = $(event.currentTarget)
    const index = button.data('index')
    const key = button.data('key')
    if (typeof this.object.bioSections[index] !== 'undefined') {
      const rolltable = await game.system.api.cocid.fromCoCID(key)
      if (rolltable.length === 1) {
        const tableResults = await rolltable[0].roll()
        for (const tableResult of tableResults.results) {
          if (tableResult.type === CONST.TABLE_RESULT_TYPES.TEXT) {
            this.object.bioSections[index].value = (this.object.bioSections[index].value + '\n' + tableResult.text.trim()).trim()
          }
        }
      }
    }
    this.render(true)
  }

  async _onResetBackstory (event) {
    const button = $(event.currentTarget)
    const index = button.data('index')
    if (typeof this.object.bioSections[index] !== 'undefined') {
      this.object.bioSections[index].value = ''
    }
    this.render(true)
  }

  async _onRollLuck (event) {
    const setup = await this.getCacheItemByCoCID(this.object.setup)
    if (setup) {
      const die = await new Roll(setup.system.characteristics.rolls.luck.toString()).evaluate()
      this.object.setupModifiers.luck = [die.total]
      const html = await renderTemplate(Roll.CHAT_TEMPLATE, {
        formula: game.i18n.localize('CoC7.InvestigatorWizard.RollTwiceForLuck') + ': ' + setup.system.characteristics.rolls.luck.toString(),
        tooltip: await die.getTooltip(),
        total: die.total
      })
      ChatMessage.create({
        user: game.user.id,
        speaker: {
          alias: game.user.name
        },
        content: html,
        whisper: ChatMessage.getWhisperRecipients('GM')
      })
      this.render(true)
    }
  }

  async _onRollEdu (event) {
    event.preventDefault()
    if (typeof this.object.requiresAgeAdjustments.edu !== 'undefined') {
      if (!this.object.requiresAgeAdjustments.edu.rolled && this.object.requiresAgeAdjustments.edu.total) {
        let value = parseInt(this.object.setupPoints.edu, 10)
        const message = []
        for (let rolls = this.object.requiresAgeAdjustments.edu.total; rolls > 0; rolls--) {
          const die = await new Roll('1d100').evaluate()
          if (die.total > value) {
            const augmentDie = await new Roll('1d10').evaluate()
            message.push(`<span class="upgrade-success">${game.i18n.format(
              'CoC7.DevSuccess',
              {
                item: game.i18n.localize('CHARAC.Education'),
                die: die.total,
                score: value,
                augment: augmentDie.total
              }
            )}</span><br>`)
            value = value + parseInt(augmentDie.total, 10)
          } else {
            message.push(`<span class="upgrade-failed">${game.i18n.format(
              'CoC7.DevFailure',
              {
                item: game.i18n.localize('CHARAC.Education'),
                die: die.total,
                score: value
              }
            )}</span><br>`)
          }
        }
        ChatMessage.create({
          flavor: game.i18n.localize('CoC7.RollAll4Dev'),
          user: game.user.id,
          speaker: {
            alias: game.user.name
          },
          content: message.join(''),
          whisper: ChatMessage.getWhisperRecipients('GM')
        })
        this.object.setupModifiers.edu = value - parseInt(this.object.setupPoints.edu, 10)
        this.object.requiresAgeAdjustments.edu.rolled = true
        this.render(true)
      }
    }
  }

  async _onRollAll (event) {
    event.preventDefault()
    const rolls = []
    for (const key of ['str', 'con', 'siz', 'dex', 'app', 'int', 'pow', 'edu', 'luck']) {
      const result = await this.rollCharacteristic(key)
      if (result !== false) {
        rolls.push(result)
      }
    }
    this.rollMessage(rolls)
    this.render(true)
  }

  async _onRollChoose (event) {
    event.preventDefault()
    if (this.object.setup !== '') {
      const setup = await this.getCacheItemByCoCID(this.object.setup)
      if (typeof setup !== 'undefined') {
        const rollFormulas = {}
        for (const key of ['str', 'con', 'siz', 'dex', 'app', 'int', 'pow', 'edu']) {
          rollFormulas[key] = setup.system.characteristics.rolls[key]
        }
        if (this.object.archetype !== '') {
          const archetype = await this.getCacheItemByCoCID(this.object.archetype)
          if (typeof archetype !== 'undefined') {
            if (this.object.coreCharacteristic !== '') {
              if (archetype.system.coreCharacteristicsFormula.enabled) {
                rollFormulas[this.object.coreCharacteristic] = archetype.system.coreCharacteristicsFormula.value
              }
            }
          }
        }
        this.object.rolledValues = []
        const html = []
        for (const key in rollFormulas) {
          const roll = new Roll(rollFormulas[key].toString())
          await roll.evaluate()
          this.object.rolledValues.push({
            value: roll.total,
            assigned: false
          })
          html.push(await renderTemplate(Roll.CHAT_TEMPLATE, {
            formula: rollFormulas[key].toString(),
            tooltip: await roll.getTooltip(),
            total: roll.total
          }))
        }
        ChatMessage.create({
          user: game.user.id,
          speaker: {
            alias: game.user.name
          },
          content: html.join('<div>&nbsp;</div>'),
          whisper: ChatMessage.getWhisperRecipients('GM')
        })
      }
    }
    this.render(true)
  }

  async _onIncreaseCharacteristic10 (event) {
    event.preventDefault()
    const li = event.currentTarget.closest('.item')
    if (typeof li.dataset.offset !== 'undefined' && typeof li.dataset.min !== 'undefined' && typeof li.dataset.max !== 'undefined') {
      this.modifyOffset(li.dataset.offset, 10, li.dataset.min, li.dataset.max)
    } else if (typeof li.dataset.key !== 'undefined') {
      this.modifyCharacteristic(li.dataset.key, 10)
    }
    this.render(true)
  }

  async _onIncreaseCharacteristic (event) {
    event.preventDefault()
    const li = event.currentTarget.closest('.item')
    if (typeof li.dataset.offset !== 'undefined' && typeof li.dataset.min !== 'undefined' && typeof li.dataset.max !== 'undefined') {
      this.modifyOffset(li.dataset.offset, 1, li.dataset.min, li.dataset.max)
    } else if (typeof li.dataset.key !== 'undefined') {
      this.modifyCharacteristic(li.dataset.key, 1)
    }
    this.render(true)
  }

  async _onDecreaseCharacteristic (event) {
    event.preventDefault()
    const li = event.currentTarget.closest('.item')
    if (typeof li.dataset.offset !== 'undefined' && typeof li.dataset.min !== 'undefined' && typeof li.dataset.max !== 'undefined') {
      this.modifyOffset(li.dataset.offset, -1, li.dataset.min, li.dataset.max)
    } else if (typeof li.dataset.key !== 'undefined') {
      this.modifyCharacteristic(li.dataset.key, -1)
    }
    this.render(true)
  }

  _onDecreaseCharacteristic10 (event) {
    event.preventDefault()
    const li = event.currentTarget.closest('.item')
    if (typeof li.dataset.offset !== 'undefined' && typeof li.dataset.min !== 'undefined' && typeof li.dataset.max !== 'undefined') {
      this.modifyOffset(li.dataset.offset, -10, li.dataset.min, li.dataset.max)
    } else if (typeof li.dataset.key !== 'undefined') {
      this.modifyCharacteristic(li.dataset.key, -10)
    }
    this.render(true)
  }

  modifyOffset (key, value, min, max) {
    this.object.setupModifiers[key] = Math.max(Math.min(parseInt(this.object.setupModifiers[key], 10) + value, parseInt(max, 10)), parseInt(min, 10))
  }

  modifyCharacteristic (key, value) {
    const li = this._element[0].querySelector(`li.item[data-key=${key}]`)
    const input = li?.querySelector('input')
    if (input) {
      input.value = Number(input.value) + value
      this.object.setupPoints[key] = Number(input.value)
    }
  }

  async _onRollCharacteristic (event) {
    event.preventDefault()
    const li = event.currentTarget.closest('.item')
    const characKey = li.dataset.key
    const result = await this.rollCharacteristic(characKey)
    if (result !== false) {
      this.rollMessage([result])
    }
    this.render(true)
  }

  async rollCharacteristic (key) {
    const li = $(`#investigator-wizard-application li.item[data-key=${key}]`)
    const input = li.find('input')
    const formula = li.data('roll')
    if (input && formula) {
      if (this.object.rerollsEnabled || this.object.setupPoints[key] === '') {
        const roll = new Roll(formula.toString())
        await roll.evaluate()
        input.val(roll.total)
        this.object.setupPoints[key] = Number(roll.total)
        return [key, formula.toString(), roll]
      }
    }
    return false
  }

  /** @override
   * A subclass of the FormApplication must implement the _onChangeSubmit method.
   */
  _onChangeSubmit (event) {
    this._onSubmit(event)
  }

  _onChangeSaveCharacteristic (event) {
    const obj = $(event.currentTarget)
    const name = obj.prop('name')
    if (typeof this.object.setupPoints[name] !== 'undefined') {
      this.object.setupPoints[name] = obj.val()
      let empties = false
      let total = 0
      for (const key in this.object.setupPoints) {
        if (this.object.setupPoints[key] !== '') {
          if (key !== 'luck') {
            total += parseInt(this.object.setupPoints[key], 10)
          }
        } else {
          empties = true
        }
      }
      const objTotal = obj.closest('ol.item-list').find('span.total')
      const max = parseInt(objTotal.siblings('span.value').text(), 10)
      objTotal.text(total)
      if (total === max && !empties) {
        if (obj.closest('form').find('button.submit-button[data-button=next]').length === 0) {
          this.render(true)
        }
      } else {
        if (obj.closest('form').find('button.submit-button[data-button=next]').length > 0) {
          this.render(true)
        }
      }
    }
  }

  getPageNumber (direction) {
    const pageOrder = this.pageOrder
    const key = parseInt(Object.keys(pageOrder).find(key => pageOrder[key] === this.object.step), 10) + direction
    return pageOrder[key]
  }

  /** @override
   * A subclass of the FormApplication must implement the _updateObject method.
   */
  async _updateObject (event, formData) {
    if (['back', 'next'].includes(event.submitter?.dataset.button)) {
      if (event.submitter.className.indexOf('currently-submitting') > -1) {
        return
      }
      event.submitter.className = event.submitter.className + ' currently-submitting'
    }
    if (typeof formData['default-setup'] !== 'undefined' && typeof formData['world-era'] !== 'undefined' && typeof formData['default-ownership'] !== 'undefined') {
      if (this.object.defaultSetup !== formData['default-setup']) {
        this.object.defaultSetup = formData['default-setup']
        game.settings.set('CoC7', 'InvestigatorWizardSetup', this.object.defaultSetup)
        this.object.setup = this.object.defaultSetup
        this.clearSetupPoints()
        await this.setSkillLists()
      }
      if (this.object.defaultOwnership !== formData['default-ownership']) {
        this.object.defaultOwnership = formData['default-ownership']
        game.settings.set('CoC7', 'InvestigatorWizardOwnership', this.object.defaultOwnership)
      }
      if (this.object.defaultEra !== formData['world-era']) {
        const obj = $(this.element.find('form'))
        const started = Date.now()
        obj.find('.dialog-buttons:first').hide()
        obj.find('.scrollsection:first').hide()
        obj.find('.erachange:first').show()
        this.object.defaultEra = formData['world-era']
        await game.settings.set('CoC7', 'worldEra', this.object.defaultEra)
        this.object.cacheCoCID = await CoC7InvestigatorWizard.loadCacheItemByCoCID()
        // To prevent flashing show message for at least 500 ms
        const buffer = 500 - (Date.now() - started)
        // Don't bother if less than 10ms remaining
        if (buffer > 10) {
          await new Promise(resolve => setTimeout(resolve, buffer))
        }
      }
      if ((typeof formData['characteristics-method'] !== 'undefined')) {
        const type = Number(formData['characteristics-method'])
        if (type === this.characteristicsMethods.METHOD_DEFAULT) {
          this.object.enforcePointBuy = false
          this.object.chooseRolledValues = false
          this.object.quickFireValues = []
        } else if (type === this.characteristicsMethods.METHOD_POINTS) {
          this.object.enforcePointBuy = true
          this.object.chooseRolledValues = false
          this.object.quickFireValues = []
        } else if (type === this.characteristicsMethods.METHOD_VALUES) {
          this.object.enforcePointBuy = false
          this.object.chooseRolledValues = false
          if (game.settings.get('CoC7', 'pulpRuleArchetype')) {
            this.object.quickFireValues = [90, 80, 70, 60, 60, 50, 50, 40]
          } else {
            this.object.quickFireValues = [80, 70, 60, 60, 50, 50, 50, 40]
          }
        } else if (type === this.characteristicsMethods.METHOD_CHOOSE) {
          this.object.enforcePointBuy = false
          this.object.chooseRolledValues = true
          this.object.quickFireValues = []
        }
        game.settings.set('CoC7', 'InvestigatorWizardPointBuy', this.object.enforcePointBuy)
        game.settings.set('CoC7', 'InvestigatorWizardQuickFire', this.object.quickFireValues)
        game.settings.set('CoC7', 'InvestigatorWizardChooseValues', this.object.chooseRolledValues)
      }
      this.object.rerollsEnabled = (typeof formData['rerolls-enabled'] === 'string')
      game.settings.set('CoC7', 'InvestigatorWizardRerolls', this.object.rerollsEnabled)
      for (let i = 0, im = this.object.quickFireValues.length; i < im; i++) {
        const num = Number(formData['quick-fire-values-' + i])
        if (num > 0) {
          this.object.quickFireValues[i] = num
        }
      }
      this.object.quickFireValues.sort().reverse()
      this.object.placeable = foundry.utils.duplicate(this.object.quickFireValues)
      if (typeof formData['default-enabled'] === 'string') {
        if (this.object.defaultQuantity.toString() === '0') {
          this.object.defaultQuantity = 1
          game.settings.set('CoC7', 'InvestigatorWizardQuantity', this.object.defaultQuantity)
        } else {
          this.object.defaultQuantity = formData['default-quantity']
          game.settings.set('CoC7', 'InvestigatorWizardQuantity', this.object.defaultQuantity)
        }
      } else if (this.object.defaultQuantity.toString() !== '0') {
        this.object.defaultQuantity = 0
        game.settings.set('CoC7', 'InvestigatorWizardQuantity', this.object.defaultQuantity)
      }
    } else if (typeof formData['coc-setup'] !== 'undefined') {
      if (this.object.setup !== formData['coc-setup']) {
        this.object.setup = formData['coc-setup']
        this.clearSetupPoints()
        await this.setSkillLists()
      }
    } else if (typeof formData['coc-archetype'] !== 'undefined') {
      if (this.object.archetype !== formData['coc-archetype']) {
        this.object.archetype = formData['coc-archetype']
        this.object.coreCharacteristic = ''
        this.clearSetupPoints()
        await this.setSkillLists()
      }
    } else if (typeof formData['coc-occupation'] !== 'undefined') {
      if (this.object.occupation !== formData['coc-occupation']) {
        this.object.occupation = formData['coc-occupation']
        await this.setSkillLists()
      }
    } else {
      for (const key in this.object.setupPoints) {
        if (typeof formData[key] !== 'undefined' && this.object.setupPoints[key] !== formData[key]) {
          this.object.setupPoints[key] = formData[key]
        }
      }
      if (typeof formData['coc-core-characteristic'] !== 'undefined' && this.object.coreCharacteristic !== formData['coc-core-characteristic']) {
        this.object.coreCharacteristic = formData['coc-core-characteristic']
        this.clearSetupPoints()
        this.object.placeable = foundry.utils.duplicate(this.object.quickFireValues)
      }
    }
    const flatKeys = ['name', 'age', 'residence', 'birthplace', 'language', 'avatar', 'token']
    for (const key of flatKeys) {
      if (typeof formData[key] !== 'undefined' && this.object[key] !== formData[key]) {
        this.object[key] = formData[key]
        if (key === 'age') {
          this.getAgeAdjustments()
        }
      }
    }
    if (event.submitter?.dataset.button === 'back') {
      const pageNumber = this.getPageNumber(-1)
      if (typeof pageNumber !== 'undefined') {
        this.object.step = pageNumber
        // When moving step reset scroll height
        const obj = this.element.find('.scrollsection')
        if (obj.length && obj[0].scrollTop) {
          obj[0].scrollTop = 0
        }
      }
    } else if (event.submitter?.dataset.button === 'next') {
      if (this.object.step === this.pageList.PAGE_CREATE || (this.object.step === this.pageList.PAGE_BACKSTORY && game.user.hasPermission('ACTOR_CREATE'))) {
        this.attemptToCreate()
        return
      } else {
        const pageNumber = this.getPageNumber(1)
        if (typeof pageNumber !== 'undefined') {
          this.object.step = pageNumber
          // When moving step reset scroll height
          const obj = this.element.find('.scrollsection')
          if (obj.length && obj[0].scrollTop) {
            obj[0].scrollTop = 0
          }
        }
      }
    }
    this.render(true)
  }

  async attemptToCreate () {
    const actorData = await this.normalizeCharacterData(this.object)
    if (game.user.hasPermission('ACTOR_CREATE')) {
      const actor = await CoC7InvestigatorWizard.createCharacter(actorData)
      actor.sheet.render(true)
      this.close()
    } else {
      const keepers = game.users.filter(u => u.active && u.isGM)
      if (keepers.length) {
        actorData.ownership[game.user.id] = CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
        const data = {
          type: 'character-wizard',
          listener: keepers[0].id,
          payload: actorData
        }
        game.socket.emit('system.CoC7', data)
        ui.notifications.info(
          game.i18n.localize('CoC7.InvestigatorWizard.CreatingInvestigator')
        )
        this.close()
      } else {
        ui.notifications.error(
          game.i18n.localize('CoC7.ErrorMissingKeeperUser')
        )
      }
    }
  }

  async normalizeCharacterData (data) {
    const weaponSkills = {
      melee: {},
      rngd: {}
    }
    const items = []
    for (const key in data.skillItems) {
      const skill = data.skillItems[key]
      for (let index = 0, im = skill.rows.length; index < im; index++) {
        const row = skill.rows[index]
        if (!skill.flags.isMultiple || row.selected !== false) {
          let item = foundry.utils.duplicate(skill.item)
          if (row.selected !== false && typeof row.selected !== 'string') {
            item = foundry.utils.duplicate(row.selected)
            row.selected = false
          }
          if (row.occupationToggle) {
            item.system.flags.occupation = true
          }
          if (row.archetypeToggle) {
            item.system.flags.archetype = true
          }
          let base = item.system.base
          if (!Number.isNumeric(base)) {
            for (const key in data.setupPoints) {
              const regEx = new RegExp('@' + key, 'i')
              base = base.replace(regEx, parseInt(data.setupPoints[key], 10) + parseInt(data.setupModifiers[key], 10))
            }
          }
          if (!Number.isNumeric(base)) {
            base = Math.floor(new AverageRoll('(' + base + ')')[(!foundry.utils.isNewerVersion(game.version, '12') ? 'evaluate' : 'evaluateSync')/* // FoundryVTT v11 */]({ minimize: true, maximize: true }).total)
          }
          item.system.base = base
          item.system.adjustments = item.system.adjustments ?? {}
          if (Number(row.personalPoints) > 0) {
            item.system.adjustments.personal = parseInt(row.personalPoints, 10)
          }
          if (Number(row.occupationPoints) > 0) {
            item.system.adjustments.occupation = parseInt(row.occupationPoints, 10)
          }
          if (Number(row.archetypePoints) > 0) {
            item.system.adjustments.archetype = parseInt(row.archetypePoints, 10)
          }
          if (Number(row.experiencePoints) > 0) {
            item.system.adjustments.experience = parseInt(row.experiencePoints, 10)
          }
          if (key === this.cocidLanguageOwn) {
            item.system.skillName = data.language
            item.name = item.system.specialization + ' (' + item.system.skillName + ')'
          } else if (typeof row.selected === 'string') {
            item.system.skillName = row.selected
            item._id = foundry.utils.randomID()
            item.name = item.system.specialization + ' (' + item.system.skillName + ')'
            if (typeof item.flags.CoC7?.cocidFlag?.id !== 'undefined') {
              item.flags.CoC7.cocidFlag.id = game.system.api.cocid.guessId(item)
            }
          }
          if (item.system.properties?.fighting) {
            weaponSkills.melee[item.name] = item._id
            weaponSkills.melee[item.system.skillName] = item._id
          } else if (item.system.properties?.firearm || item.system.properties?.ranged) {
            weaponSkills.rngd[item.name] = item._id
            weaponSkills.rngd[item.system.skillName] = item._id
          }
          items.push(item)
        }
      }
    }
    for (const sourceItem of data.investigatorItems) {
      const item = foundry.utils.duplicate(sourceItem)
      if (item.system.properties.melee) {
        if (typeof weaponSkills.melee[item.system.skill.main.name] !== 'undefined') {
          item.system.skill.main.id = weaponSkills.melee[item.system.skill.main.name]
        }
        if (typeof weaponSkills.melee[item.system.skill.alternativ.name] !== 'undefined') {
          item.system.skill.alternativ.id = weaponSkills.melee[item.system.skill.alternativ.name]
        }
      } else if (item.system.properties.rngd) {
        if (typeof weaponSkills.rngd[item.system.skill.main.name] !== 'undefined') {
          item.system.skill.main.id = weaponSkills.rngd[item.system.skill.main.name]
        }
        if (typeof weaponSkills.rngd[item.system.skill.alternativ.name] !== 'undefined') {
          item.system.skill.alternativ.id = weaponSkills.rngd[item.system.skill.alternativ.name]
        }
      }
      items.push(item)
    }
    let monetary = {}
    const setup = await this.getCacheItemByCoCID(this.object.setup)
    if (setup) {
      monetary = foundry.utils.duplicate(setup.system.monetary)
    }
    const development = {
      personal: 2 * (parseInt(data.setupPoints.int, 10) + parseInt(data.setupModifiers.int, 10)),
      occupation: 0,
      archetype: 0
    }
    if (data.archetype !== '') {
      const archetype = await game.system.api.cocid.fromCoCID(data.archetype)
      if (archetype.length === 1) {
        items.push(archetype[0].toObject())
        development.archetype = archetype[0].system.bonusPoints
      }
    }
    if (data.occupation !== '') {
      const occupation = await game.system.api.cocid.fromCoCID(data.occupation)
      if (occupation.length === 1) {
        items.push(occupation[0].toObject())
        const options = []
        for (const [key, carac] of Object.entries(occupation[0].system.occupationSkillPoints)) {
          if (carac.selected) {
            if (carac.optional) {
              options.push(carac.multiplier * (parseInt(data.setupPoints[key], 10) + parseInt(data.setupModifiers[key], 10)))
            } else {
              development.occupation += carac.multiplier * (parseInt(data.setupPoints[key], 10) + parseInt(data.setupModifiers[key], 10))
            }
          }
        }
        if (options.length > 0) {
          development.occupation += Math.max(...options)
        }
      }
    }
    const biography = []
    const backstory = []
    if (game.settings.get('CoC7', 'oneBlockBackstory')) {
      for (let index = 0, im = data.bioSections.length; index < im; index++) {
        backstory.push('<h3>' + game.i18n.localize(data.bioSections[index].name) + '</h3>' + '<p>' + data.bioSections[index].value.split(/[\r\n]+/).join('</p><p>') + '</p>')
      }
    } else {
      for (let index = 0, im = data.bioSections.length; index < im; index++) {
        biography.push({
          title: data.bioSections[index].name,
          value: data.bioSections[index].value
        })
      }
    }
    const actorData = {
      type: 'character',
      name: data.name,
      img: data.avatar,
      system: {
        characteristics: {
          str: {
            value: parseInt(data.setupPoints.str, 10) + parseInt(data.setupModifiers.str, 10)
          },
          con: {
            value: parseInt(data.setupPoints.con, 10) + parseInt(data.setupModifiers.con, 10)
          },
          siz: {
            value: parseInt(data.setupPoints.siz, 10) + parseInt(data.setupModifiers.siz, 10)
          },
          dex: {
            value: parseInt(data.setupPoints.dex, 10) + parseInt(data.setupModifiers.dex, 10)
          },
          app: {
            value: parseInt(data.setupPoints.app, 10) + parseInt(data.setupModifiers.app, 10)
          },
          int: {
            value: parseInt(data.setupPoints.int, 10) + parseInt(data.setupModifiers.int, 10)
          },
          pow: {
            value: parseInt(data.setupPoints.pow, 10) + parseInt(data.setupModifiers.pow, 10)
          },
          edu: {
            value: parseInt(data.setupPoints.edu, 10) + parseInt(data.setupModifiers.edu, 10)
          }
        },
        attribs: {
          lck: {
            value: Math.max(parseInt(data.setupPoints.luck, 10), parseInt(data.setupModifiers.luck, 10))
          },
          san: {
            value: parseInt(data.setupPoints.pow, 10) + parseInt(data.setupModifiers.pow, 10)
          }
        },
        infos: {
          age: data.age,
          residence: data.residence,
          birthplace: data.birthplace
        },
        development,
        biography,
        backstory: backstory.join('<p></p>'),
        monetary
      },
      prototypeToken: {
        name: data.name,
        actorLink: true,
        texture: {
          src: data.token
        },
        disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
        sight: {
          enabled: true
        }
      },
      items,
      ownership: {
        default: parseInt(data.defaultOwnership, 10)
      }
    }
    return actorData
  }

  static async createCharacterFromData (actorData) {
    const actor = await CoC7InvestigatorWizard.createCharacter(actorData)
    const functionId = Hooks.on('renderActorSheet', (app, html, data) => {
      if (app.object.id === actor.id) {
        game.socket.emit('system.CoC7', {
          type: 'open-character',
          listener: Object.keys(actorData.ownership).find(k => k !== 'default'),
          payload: actor.id
        })
        Hooks.off('renderActorSheet', functionId)
      }
    })
    actor.sheet.render(true)
  }

  static async createCharacter (actorData) {
    const actor = await Actor.create(actorData)
    await actor.update({
      'system.attribs.hp.value': actor.rawHpMax,
      'system.attribs.mp.value': actor.rawMpMax,
      'system.attribs.san.max': actor.rawMpMax
    })
    await actor.resetDailySanity()
    return actor
  }

  /**
   * create it's the default way to create the CoC7CharacterWizard
   */
  static async create (options = {}) {
    // Attempt to fix bad setting
    if (game.settings.get('CoC7', 'InvestigatorWizardChooseValues') !== true && game.settings.get('CoC7', 'InvestigatorWizardChooseValues') !== false) {
      await game.settings.set('CoC7', 'InvestigatorWizardChooseValues', game.settings.get('CoC7', 'InvestigatorWizardChooseValues')[0] ?? false)
    }
    // Try and prerequst as many CoCIDs due to the way they have to be loaded
    options = foundry.utils.mergeObject({
      step: 0,
      defaultSetup: game.settings.get('CoC7', 'InvestigatorWizardSetup'),
      defaultQuantity: game.settings.get('CoC7', 'InvestigatorWizardQuantity'),
      defaultOwnership: game.settings.get('CoC7', 'InvestigatorWizardOwnership'),
      defaultEra: game.settings.get('CoC7', 'worldEra'),
      rerollsEnabled: game.settings.get('CoC7', 'InvestigatorWizardRerolls'),
      enforcePointBuy: game.settings.get('CoC7', 'InvestigatorWizardPointBuy'),
      quickFireValues: game.settings.get('CoC7', 'InvestigatorWizardQuickFire'),
      chooseRolledValues: game.settings.get('CoC7', 'InvestigatorWizardChooseValues'),
      placeable: foundry.utils.duplicate(game.settings.get('CoC7', 'InvestigatorWizardQuickFire')),
      cacheCoCID: CoC7InvestigatorWizard.loadCacheItemByCoCID(),
      cacheBackstories: game.system.api.cocid.fromCoCIDRegexBest({ cocidRegExp: /^rt\.\.backstory-/, type: 'rt' }),
      cacheItems: {},
      setup: game.settings.get('CoC7', 'InvestigatorWizardSetup'),
      skillItems: {},
      occupationGroups: {},
      investigatorItems: [],
      setupPoints: {
        str: '',
        con: '',
        siz: '',
        dex: '',
        app: '',
        int: '',
        pow: '',
        edu: '',
        luck: ''
      },
      setupModifiers: {
        str: 0,
        con: 0,
        siz: 0,
        dex: 0,
        app: 0,
        int: 0,
        pow: 0,
        edu: 0,
        luck: 0
      },
      rolledValues: [],
      archetype: '',
      coreCharacteristic: '',
      occupation: '',
      bioSections: [],
      personal: 0,
      personalText: '',
      creditRating: {
        min: 0,
        max: 0
      },
      name: '',
      age: '',
      requiresAgeAdjustments: false,
      residence: '',
      birthplace: '',
      language: '',
      avatar: 'icons/svg/mystery-man.svg',
      token: 'icons/svg/mystery-man.svg'
    }, options)
    new CoC7InvestigatorWizard(options).render(true)
  }
}
