/* global Actor ChatMessage CONFIG CONST DragDrop foundry game Hooks renderTemplate Roll TextEditor ui */
import { FOLDER_ID, ERAS } from '../constants.js'
import CoC7DicePool from './dice-pool.js'
import CoC7ModelsActorDocumentClass from '../models/actor/document-class.js'
import CoC7ModelsItemOccupationSystem from '../models/item/occupation-system.js'
import CoC7SkillSpecializationSelectDialog from './skill-specialization-select-dialog.js'
import CoC7SystemSocket from './system-socket.js'
import CoC7Utilities from './utilities.js'

export default class CoC7InvestigatorWizard extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  /**
   * @inheritdoc
   */
  constructor (...args) {
    const coc7Config = args.pop()
    super(...args)
    this.coc7Config = coc7Config
  }

  static DEFAULT_OPTIONS = {
    id: 'investigator-wizard-application',
    tag: 'form',
    classes: ['coc7', 'dialog', 'investigator-wizard'],
    window: {
      contentClasses: [
        'standard-form'
      ],
      title: 'CoC7.InvestigatorWizard.Title'
    },
    form: {
      closeOnSubmit: false,
      handler: CoC7InvestigatorWizard.#onSubmit
    },
    position: {
      width: 540,
      height: 650
    }
  }

  static PARTS = {
    form: {
      template: 'systems/' + FOLDER_ID + '/templates/apps/investigator-wizard/body.hbs',
      scrollable: [
        '.scroll-section'
      ]
    },
    footer: {
      template: 'templates/generic/form-footer.hbs'
    }
  }

  /**
   * List of page numbers
   * @returns {object}
   */
  static get PageList () {
    return {
      PAGE_NONE: -1,
      PAGE_INTRODUCTION: 0,
      PAGE_CONFIGURATION: 1,
      PAGE_SETUPS: 2,
      PAGE_ARCHETYPES: 3,
      PAGE_CHARACTERISTICS: 4,
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

  /**
   * List of characteristic generation methods
   * @returns {object}
   */
  static get CharacteristicsMethods () {
    return {
      METHOD_DEFAULT: 1,
      METHOD_ROLL: 1,
      METHOD_POINTS: 2,
      METHOD_VALUES: 3,
      METHOD_CHOOSE: 4
    }
  }

  /**
   * CoC ID for Credit Rating
   * @returns {string}
   */
  get cocidCreditRating () {
    return 'i.skill.credit-rating'
  }

  /**
   * CoC ID for Cthulhu Mythos
   * @returns {string}
   */
  get cocidCthulhuMythos () {
    return 'i.skill.cthulhu-mythos'
  }

  /**
   * CoC ID for Language Own
   * system.properties.own is now preferred
   * @returns {string}
   */
  get cocidLanguageOwn () {
    return 'i.skill.language-own'
  }

  /**
   * Get page order based on world settings
   * @returns {object}
   */
  get pageOrder () {
    const pages = CoC7InvestigatorWizard.PageList
    let pageOrder = [
      pages.PAGE_INTRODUCTION
    ]
    if (game.user.isGM) {
      pageOrder.push(pages.PAGE_CONFIGURATION)
    }
    if (this.coc7Config.defaultSetup === '') {
      pageOrder.push(pages.PAGE_SETUPS)
    }
    if (game.settings.get(FOLDER_ID, 'pulpRuleArchetype')) {
      pageOrder.push(pages.PAGE_ARCHETYPES)
    }
    pageOrder.push(pages.PAGE_CHARACTERISTICS)
    if (!game.settings.get(FOLDER_ID, 'pulpRuleIgnoreAgePenalties')) {
      pageOrder.push(pages.PAGE_ATTRIBUTES)
    }
    pageOrder = pageOrder.concat([
      pages.PAGE_VIEW_ATTRIBUTES,
      pages.PAGE_OCCUPATIONS,
      pages.PAGE_OCCUPATION_SKILLS
    ])
    if (game.settings.get(FOLDER_ID, 'pulpRuleArchetype')) {
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

  /**
   * Load cached items
   * @returns {Promise<object>}
   */
  static async loadCacheItemByCoCID () {
    return new Promise((resolve, reject) => {
      game.CoC7.cocid.fromCoCIDRegexBest({ cocidRegExp: /^i\./, type: 'i', showLoading: true }).then((items) => {
        const list = {}
        for (const item of items) {
          list[item.flags.CoC7.cocidFlag.id] = item
        }
        resolve(list)
      })
    })
  }

  /**
   * Filter cached CoC IDs
   * @param {RegExp} regexp
   * @returns {Array}
   */
  async filterCacheItemByCoCID (regexp) {
    return Object.entries(await this.coc7Config.cacheCoCID).filter(entry => entry[0].match(regexp)).map(entry => entry[1])
  }

  /**
   * Get Cached Item
   * @param {string} id
   * @returns {Document|false}
   */
  async getCacheItemByCoCID (id) {
    return (await this.coc7Config.cacheCoCID)[id] ?? false
  }

  /**
   * Convert Item cocid strings into Item documents and merge them into the items array
   * @param {Array} items
   * @param {Array} cocids
   * @returns {Array}
   */
  async mergeItemArrays (items, cocids) {
    const documents = [].concat(items)
    if (cocids.length) {
      const source = await this.coc7Config.cacheCoCID
      const missing = []
      for (const cocid of cocids) {
        if (typeof source[cocid] !== 'undefined') {
          documents.push(source[cocid])
        } else {
          missing.push(cocid)
        }
      }
      if (missing.length) {
        const era = game.i18n.format(ERAS[this.coc7Config.defaultEra]?.name ?? 'CoC7.CoCIDFlag.error.unknown-era', { era: this.coc7Config.defaultEra })
        /* // FoundryVTT V12 */
        ui.notifications.warn(game.i18n.format('CoC7.CoCIDFlag.error.documents-not-found', { cocids: missing.join(', '), lang: game.i18n.lang, era }))
      }
    }
    return documents
  }

  /**
   * Set age adjustment object based on age
   */
  getAgeAdjustments () {
    for (const key in this.coc7Config.setupModifiers) {
      this.coc7Config.setupModifiers[key] = 0
    }
    // edu: optional - number of edu improvement checks
    // deduct: optional - deduct [total] between [from]
    // reduce: optional - deduct [total] from [from]
    // luck: optional - reroll luck and take higher
    if (!game.settings.get(FOLDER_ID, 'pulpRuleIgnoreAgePenalties')) {
      if (this.coc7Config.age >= 40) {
        const key = Math.floor(this.coc7Config.age / 10)
        this.coc7Config.requiresAgeAdjustments = {
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
      } else if (this.coc7Config.age >= 20) {
        this.coc7Config.requiresAgeAdjustments = {
          edu: {
            total: 1,
            rolled: false
          }
        }
      } else if (this.coc7Config.age >= 15) {
        this.coc7Config.requiresAgeAdjustments = {
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
      if (typeof this.coc7Config.requiresAgeAdjustments.reduce !== 'undefined') {
        this.coc7Config.setupModifiers[this.coc7Config.requiresAgeAdjustments.reduce.from] = -this.coc7Config.requiresAgeAdjustments.reduce.total
      }
    }
  }

  /**
   * @inheritdoc
   * @param {RenderOptions} options
   * @returns {Promise<ApplicationRenderContext>}
   */
  async _prepareContext (options) {
    const context = await super._prepareContext(options)

    context.isKeeper = game.user.isGM
    context.pages = CoC7InvestigatorWizard.PageList
    context.canNext = false
    context.createButton = false
    context.coc7Config = this.coc7Config

    switch (context.coc7Config.step) {
      case context.pages.PAGE_INTRODUCTION:
        context.era = game.i18n.format(ERAS[context.coc7Config.defaultEra]?.name ?? 'CoC7.CoCIDFlag.error.unknown-era', { era: context.coc7Config.defaultEra })
        context.canNext = true
        break

      case context.pages.PAGE_CONFIGURATION:
        if (game.user.isGM) {
          context.setups = await this.filterCacheItemByCoCID(/^i\.setup\./)
          context.setupOptions = context.setups.reduce((c, d) => { c.push({ key: d.flags.CoC7.cocidFlag.id, name: d.name }); return c }, [])
          context.occupations = await this.filterCacheItemByCoCID(/^i\.occupation\./)
          context.archetypes = await this.filterCacheItemByCoCID(/^i\.archetype\./)
          const setup = context.setups.find(s => s.flags.CoC7.cocidFlag.id === context.coc7Config.defaultSetup)
          if (typeof setup === 'undefined') {
            context.coc7Config.defaultSetup = ''
            context.coc7Config.setup = ''
          } else {
            /* // FoundryVTT V12 */
            context.description = await (foundry.applications.ux?.TextEditor.implementation ?? TextEditor).enrichHTML(
              setup.system.description.value,
              {
                async: true,
                secrets: game.user.isGM
              }
            )
          }
          context.ownership = {
            [CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE]: 'OWNERSHIP.NONE',
            [CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED]: 'OWNERSHIP.LIMITED',
            [CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER]: 'OWNERSHIP.OBSERVER',
            [CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER]: 'OWNERSHIP.OWNER'
          }
          context._eras = []
          for (const [key, era] of Object.entries(ERAS)) {
            context._eras.push({
              id: key,
              name: game.i18n.localize(era.name)
            })
          }
          context.characteristicsMethods = CoC7InvestigatorWizard.CharacteristicsMethods
          context.characteristicsMethod = context.characteristicsMethods.METHOD_DEFAULT
          if (context.coc7Config.enforcePointBuy) {
            context.characteristicsMethod = context.characteristicsMethods.METHOD_POINTS
          } else if (context.coc7Config.chooseRolledValues) {
            context.characteristicsMethod = context.characteristicsMethods.METHOD_CHOOSE
          } else if (context.coc7Config.quickFireValues.length) {
            context.characteristicsMethod = context.characteristicsMethods.METHOD_VALUES
          }
          context._eras.sort(CoC7Utilities.sortByNameKey)
          context.hasArchetypes = game.settings.get(FOLDER_ID, 'pulpRuleArchetype')
          context.canNext = true
        }
        break

      case context.pages.PAGE_SETUPS:
        if (context.coc7Config.defaultSetup === '') {
          context.setups = await this.filterCacheItemByCoCID(/^i\.setup\./)
          context.setups.sort(CoC7Utilities.sortByNameKey)
          context.setupOptions = context.setups.reduce((c, d) => { c.push({ key: d.flags.CoC7.cocidFlag.id, name: d.name }); return c }, [])
          if (context.coc7Config.setup !== '') {
            const setup = context.setups.find(s => s.flags.CoC7.cocidFlag.id === context.coc7Config.setup)
            if (typeof setup !== 'undefined') {
              /* // FoundryVTT V12 */
              context.description = await (foundry.applications.ux?.TextEditor.implementation ?? TextEditor).enrichHTML(
                setup.system.description.value,
                {
                  async: true,
                  secrets: game.user.isGM
                }
              )
              context.canNext = true
            }
          }
        }
        break

      case context.pages.PAGE_ARCHETYPES:
        context.archetypes = await this.filterCacheItemByCoCID(/^i\.archetype\./)
        if (context.archetypes.length === 0) {
          context.canNext = true
        } else {
          context.archetypes.sort(CoC7Utilities.sortByNameKey)
          context.archetypeOptions = context.archetypes.reduce((c, d) => { c.push({ key: d.flags.CoC7.cocidFlag.id, name: d.name }); return c }, [])
          if (context.coc7Config.archetype !== '') {
            const archetype = context.archetypes.find(s => s.flags.CoC7.cocidFlag.id === context.coc7Config.archetype)
            if (typeof archetype !== 'undefined') {
              /* // FoundryVTT V12 */
              context.description = await (foundry.applications.ux?.TextEditor.implementation ?? TextEditor).enrichHTML(
                archetype.system.description.value,
                {
                  async: true,
                  secrets: game.user.isGM
                }
              )
              context.bonusPoints = archetype.system.bonusPoints
              const coreCharacteristics = []
              for (const coreCharacteristic in archetype.system.coreCharacteristics) {
                if (archetype.system.coreCharacteristics[coreCharacteristic]) {
                  coreCharacteristics.push(coreCharacteristic)
                }
              }
              if (coreCharacteristics.length === 0) {
                this.coc7Config.coreCharacteristic = ''
              } else if (coreCharacteristics.length === 1) {
                this.coc7Config.coreCharacteristic = coreCharacteristics[0]
              }
              context.coreCharacteristic = coreCharacteristics.map(c => c.toLocaleUpperCase()).join(' ' + game.i18n.localize('CoC7.Or') + ' ')
              const skills = []
              archetype.system.skills = await this.mergeItemArrays(archetype.system.itemDocuments, archetype.system.itemKeys)
              for (const skill of archetype.system.skills) {
                skills.push(skill.name)
              }
              context.skills = skills.join(', ')
              /* // FoundryVTT V12 */
              context.suggestedOccupations = await (foundry.applications.ux?.TextEditor.implementation ?? TextEditor).enrichHTML(
                archetype.system.suggestedOccupations,
                {
                  async: true,
                  secrets: game.user.isGM
                }
              )
              /* // FoundryVTT V12 */
              context.suggestedTraits = await (foundry.applications.ux?.TextEditor.implementation ?? TextEditor).enrichHTML(
                archetype.system.suggestedTraits,
                {
                  async: true,
                  secrets: game.user.isGM
                }
              )
              context.canNext = true
            }
          }
        }
        break

      case context.pages.PAGE_CHARACTERISTICS:
        context.characteristicsMethods = CoC7InvestigatorWizard.CharacteristicsMethods
        context.characteristicsMethod = context.characteristicsMethods.METHOD_ROLL
        if (context.coc7Config.setup !== '') {
          const setup = await this.getCacheItemByCoCID(this.coc7Config.setup)
          if (typeof setup !== 'undefined') {
            if (setup.system.characteristics.points.enabled || this.coc7Config.enforcePointBuy) {
              context.characteristicsMethod = context.characteristicsMethods.METHOD_POINTS
            } else if (this.coc7Config.chooseRolledValues) {
              context.characteristicsMethod = context.characteristicsMethods.METHOD_CHOOSE
            } else if (this.coc7Config.quickFireValues.length) {
              context.characteristicsMethod = context.characteristicsMethods.METHOD_VALUES
            }
            context.setup = {
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
            context.coreCharacteristics = []
            if (context.coc7Config.archetype !== '') {
              const archetype = await this.getCacheItemByCoCID(this.coc7Config.archetype)
              if (typeof archetype !== 'undefined') {
                for (const coreCharacteristic in archetype.system.coreCharacteristics) {
                  if (archetype.system.coreCharacteristics[coreCharacteristic]) {
                    context.coreCharacteristics.push({
                      key: coreCharacteristic,
                      name: game.i18n.format(context.setup.characteristics.find(c => c.key === coreCharacteristic)?.label ?? 'Unknown')
                    })
                  }
                }
                context.coreCharacteristics.sort(CoC7Utilities.sortByNameKey)
                if (this.coc7Config.coreCharacteristic !== '') {
                  if (archetype.system.coreCharacteristicsFormula.enabled) {
                    context.setup.characteristics.find(c => c.key === this.coc7Config.coreCharacteristic).roll = archetype.system.coreCharacteristicsFormula.value
                  }
                }
              }
            }
            let empties = false
            for (const key in context.coc7Config.setupPoints) {
              if (context.coc7Config.setupPoints[key] !== '') {
                if (key !== 'luck') {
                  context.setup.total += parseInt(context.coc7Config.setupPoints[key], 10)
                }
              } else {
                empties = true
              }
            }
            if (this.coc7Config.coreCharacteristic) {
              context.coreCharacteristic = this.coc7Config.coreCharacteristic.toLocaleUpperCase()
            }
            if (!empties && this.coc7Config.age >= 15) {
              if ([context.characteristicsMethods.METHOD_ROLL, context.characteristicsMethods.METHOD_VALUES, context.characteristicsMethods.METHOD_CHOOSE].includes(context.characteristicsMethod)) {
                context.canNext = true
              } else if (context.setup.total.toString() === context.setup.points.toString()) {
                context.canNext = true
              }
            }
          }
        }
        break

      case context.pages.PAGE_ATTRIBUTES:
        context.pulpRuleIgnoreAgePenalties = game.settings.get(FOLDER_ID, 'pulpRuleIgnoreAgePenalties')
        context.canNext = true
        context.points = {}
        for (const key in this.coc7Config.setupModifiers) {
          context.points[key] = {
            value: parseInt(this.coc7Config.setupPoints[key], 10) + parseInt(this.coc7Config.setupModifiers[key], 10),
            min: -parseInt(this.coc7Config.setupPoints[key], 10) + 1,
            label: CoC7Utilities.getCharacteristicNames(key).label
          }
        }
        if (typeof this.coc7Config.requiresAgeAdjustments.edu !== 'undefined' && !this.coc7Config.requiresAgeAdjustments.edu.rolled) {
          context.canNext = false
        }
        if (typeof this.coc7Config.requiresAgeAdjustments.deduct !== 'undefined') {
          context.deductTotal = 0
          for (const key of this.coc7Config.requiresAgeAdjustments.deduct.from) {
            context.deductTotal = context.deductTotal - parseInt(this.coc7Config.setupModifiers[key], 10)
          }
          context.deductFrom = this.coc7Config.requiresAgeAdjustments.deduct.from.map(n => game.i18n.localize('CHARAC.' + n.toUpperCase())).join(', ').replace(/(, )([^,]+)$/, '$1' + game.i18n.localize('CoC7.Or') + ' $2').replace(/^([^,]+),([^,]+)$/, '$1$2')
          if (context.deductTotal !== this.coc7Config.requiresAgeAdjustments.deduct.total) {
            context.canNext = false
          }
        }
        if (typeof this.coc7Config.requiresAgeAdjustments.reduce !== 'undefined') {
          context.reduceFrom = game.i18n.localize('CHARAC.' + this.coc7Config.requiresAgeAdjustments.reduce.from.toUpperCase())
        }
        if (typeof this.coc7Config.requiresAgeAdjustments.luck !== 'undefined') {
          context.luckValue = Math.max(this.coc7Config.setupPoints.luck, this.coc7Config.setupModifiers.luck)
          if (this.coc7Config.setupModifiers.luck === 0) {
            context.canNext = false
          }
        }
        break

      case context.pages.PAGE_VIEW_ATTRIBUTES:
        context.points = {}
        for (const key in this.coc7Config.setupModifiers) {
          context.points[key] = {
            value: parseInt(this.coc7Config.setupPoints[key], 10) + parseInt(this.coc7Config.setupModifiers[key], 10),
            prefix: '',
            suffix: '%',
            label: CoC7Utilities.getCharacteristicNames(key).label
          }
        }
        context.points.db = {
          value: CoC7ModelsActorDocumentClass.dbFromCharacteristics(context.points),
          prefix: '',
          suffix: '',
          label: 'CoC7.BonusDamage'
        }
        if (isNaN(context.points.db.value) || Number(context.points.db.value) >= 0) {
          context.points.db.prefix = '+'
        }
        context.points.build = {
          value: CoC7ModelsActorDocumentClass.buildFromCharacteristics(context.points),
          prefix: '',
          suffix: '',
          label: 'CoC7.Build'
        }
        if (Number(context.points.build.value) >= 0) {
          context.points.build.prefix = '+'
        }
        context.points.hp = {
          value: CoC7ModelsActorDocumentClass.hpFromCharacteristics(context.points, 'character'),
          prefix: '',
          suffix: '',
          label: 'CoC7.HitPoints'
        }
        context.points.hp.prefix = context.points.hp.value + '/'
        context.points.mp = {
          value: CoC7ModelsActorDocumentClass.mpFromCharacteristics(context.points),
          prefix: '',
          suffix: '',
          label: 'CoC7.MagicPoints'
        }
        context.points.mp.prefix = context.points.mp.value + '/'
        context.points.san = {
          value: context.points.pow.value,
          prefix: '',
          suffix: '/99',
          label: 'CoC7.Sanity'
        }
        context.points.mov = {
          value: CoC7ModelsActorDocumentClass.movFromCharacteristics(context.points, 'character', this.coc7Config.age),
          prefix: '',
          suffix: '',
          label: 'CoC7.Movement'
        }
        this.coc7Config.parsedValues = {
          armor: 0,
          sanMax: 99
        }
        for (const key in context.points) {
          this.coc7Config.parsedValues[(key === 'luck' ? 'lck' : key)] = context.points[key].value
          if (context.points[key].prefix !== '' && context.points[key].prefix !== '+') {
            this.coc7Config.parsedValues[key + 'Max'] = context.points[key].value
          }
        }
        context.canNext = true
        break

      case context.pages.PAGE_OCCUPATIONS:
        context.occupations = await this.filterCacheItemByCoCID(/^i\.occupation\./)
        context.occupations.sort(CoC7Utilities.sortByNameKey)
        context.occupationOptions = context.occupations.reduce((c, d) => { c.push({ key: d.flags.CoC7.cocidFlag.id, name: d.name }); return c }, [])
        if (context.coc7Config.occupation !== '') {
          const occupation = context.occupations.find(s => s.flags.CoC7.cocidFlag.id === context.coc7Config.occupation)
          if (typeof occupation !== 'undefined') {
            /* // FoundryVTT V12 */
            context.description = await (foundry.applications.ux?.TextEditor.implementation ?? TextEditor).enrichHTML(
              occupation.system.description.value,
              {
                async: true,
                secrets: game.user.isGM
              }
            )
            context.occupationPointsString = CoC7ModelsItemOccupationSystem.getOccupationPointsString(occupation.system.occupationSkillPoints)
            context.creditRating = occupation.system.creditRating
            context.personal = occupation.system.personal
            context.personalText = occupation.system.personalText
            context.skills = await this.mergeItemArrays(occupation.system.itemDocuments, occupation.system.itemKeys)
            context.groups = {}
            for (let index = 0; index < occupation.system.groups.length; index++) {
              context.groups[index] = {
                options: occupation.system.groups[index].options,
                skills: []
              }
              context.groups[index].skills = await this.mergeItemArrays(occupation.system.groups[index].itemDocuments, occupation.system.groups[index].itemKeys)
            }
            context.points = 0
            const options = []
            for (const [key, value] of Object.entries(occupation.system.occupationSkillPoints)) {
              if (value.selected) {
                if (value.optional) {
                  options.push(value.multiplier * (parseInt(this.coc7Config.setupPoints[key], 10) + parseInt(this.coc7Config.setupModifiers[key], 10)))
                } else {
                  context.points += value.multiplier * (parseInt(this.coc7Config.setupPoints[key], 10) + parseInt(this.coc7Config.setupModifiers[key], 10))
                }
              }
            }
            if (options.length > 0) {
              context.points += Math.max(...options)
            }
            context.canNext = true
          }
        }
        break

      case context.pages.PAGE_OCCUPATION_SKILLS:
        context.default = 0
        context.selected = 0
        context.skillItems = []
        for (const key in this.coc7Config.skillItems) {
          let group = 'other'
          const rows = context.coc7Config.skillItems[key].rows.length
          const isMultiple = context.coc7Config.skillItems[key].flags.isMultiple
          if (isMultiple) {
            context.skillItems.push({
              key,
              index: -1,
              name: context.coc7Config.skillItems[key].item.name,
              group,
              toggle: false,
              isCreditRating: false,
              isMultiple: true,
              isPickable: false
            })
          }
          for (let index = 0; index < rows; index++) {
            let isPickable = false
            if (context.coc7Config.skillItems[key].rows[index].isOccupationDefault) {
              group = 'default'
              if (isMultiple) {
                isPickable = true
              }
              context.default++
            } else if (context.coc7Config.skillItems[key].rows[index].inOccupationGroup !== false) {
              group = context.coc7Config.skillItems[key].rows[index].inOccupationGroup
              if (isMultiple) {
                isPickable = true
              }
            } else {
              group = 'other'
            }
            let toggle = context.coc7Config.skillItems[key].rows[index].occupationToggle
            if (isPickable) {
              toggle = false
            }
            let specialization = context.coc7Config.skillItems[key].item.system.specialization
            let skillName = context.coc7Config.skillItems[key].item.system.skillName
            let picked = false
            let deletable = false
            if (typeof context.coc7Config.skillItems[key].rows[index].selected === 'string') {
              picked = true
              skillName = context.coc7Config.skillItems[key].rows[index].selected
            } else if (context.coc7Config.skillItems[key].rows[index].selected !== false) {
              picked = true
              specialization = context.coc7Config.skillItems[key].rows[index].selected.system.specialization
              skillName = context.coc7Config.skillItems[key].rows[index].selected.system.skillName
            }
            if (toggle || (isPickable && picked)) {
              context.selected++
            }
            let name = context.coc7Config.skillItems[key].item.name
            if (key === this.cocidLanguageOwn) {
              name = specialization + ' (' + skillName + ')'
            } else if (!isPickable && picked) {
              name = specialization + ' (' + skillName + ')'
            }
            if (!isPickable && picked) {
              deletable = !context.coc7Config.skillItems[key].rows[index].archetypeToggle
            }
            context.skillItems.push({
              key,
              index,
              name,
              group: group.toString(),
              toggle,
              isCreditRating: context.coc7Config.skillItems[key].rows[index].isCreditRating,
              isMultiple: false,
              isPickable,
              picked,
              deletable,
              specialization,
              skillName
            })
          }
        }
        context.max = (parseInt(context.default, 10) || 0) + (parseInt(context.coc7Config.personal, 10) || 0) + Object.values(context.coc7Config.occupationGroups).reduce((s, v) => s + (parseInt(v, 10) || 0), 0)
        context.skillItems.sort(CoC7Utilities.sortByNameKey)
        if (context.selected === context.max) {
          context.canNext = true
        }
        break

      case context.pages.PAGE_ARCHETYPE_SKILLS:
        context.max = 0
        context.selected = 0
        context.skillItems = []
        for (const key in this.coc7Config.skillItems) {
          let group = 'other'
          const rows = context.coc7Config.skillItems[key].rows.length
          const isMultiple = context.coc7Config.skillItems[key].flags.isMultiple
          if (isMultiple) {
            context.skillItems.push({
              key,
              index: -1,
              name: context.coc7Config.skillItems[key].item.name,
              group,
              toggle: false,
              isCreditRating: false,
              isMultiple: true,
              isPickable: false
            })
          }
          for (let index = 0; index < rows; index++) {
            let isPickable = false
            if (context.coc7Config.skillItems[key].rows[index].isArchetypeDefault) {
              group = 'default'
              if (isMultiple) {
                isPickable = true
              }
              context.max++
            } else {
              group = 'other'
            }
            let toggle = context.coc7Config.skillItems[key].rows[index].archetypeToggle
            if (isPickable) {
              toggle = false
            }
            let specialization = context.coc7Config.skillItems[key].item.system.specialization
            let skillName = context.coc7Config.skillItems[key].item.system.skillName
            let picked = false
            let deletable = false
            if (typeof context.coc7Config.skillItems[key].rows[index].selected === 'string') {
              picked = true
              skillName = context.coc7Config.skillItems[key].rows[index].selected
            } else if (context.coc7Config.skillItems[key].rows[index].selected !== false) {
              picked = true
              specialization = context.coc7Config.skillItems[key].rows[index].selected.system.specialization
              skillName = context.coc7Config.skillItems[key].rows[index].selected.system.skillName
            }
            if (toggle || (isPickable && picked)) {
              context.selected++
            }
            let name = context.coc7Config.skillItems[key].item.name
            if (key === this.cocidLanguageOwn) {
              name = specialization + ' (' + skillName + ')'
            } else if (!isPickable && picked) {
              name = specialization + ' (' + skillName + ')'
            }
            if (!isPickable && picked) {
              deletable = !context.coc7Config.skillItems[key].rows[index].occupationToggle
            }
            context.skillItems.push({
              key,
              index,
              name,
              group: group.toString(),
              toggle,
              isCreditRating: false,
              isMultiple: false,
              isPickable,
              picked,
              deletable,
              specialization,
              skillName
            })
          }
        }
        context.skillItems.sort(CoC7Utilities.sortByNameKey)
        if (context.selected === context.max) {
          context.canNext = true
        }
        break

      case context.pages.PAGE_POINTS_SKILLS:
        {
          context.skills = []
          context.creditRatingOkay = !(this.coc7Config.creditRating.max > 0)
          context.personal = {
            count: 0,
            total: 2 * (parseInt(this.coc7Config.setupPoints.int, 10) + parseInt(this.coc7Config.setupModifiers.int, 10)),
            remaining: 0
          }
          context.occupation = {
            count: 0,
            total: 0,
            remaining: 0
          }
          context.archetype = {
            count: 0,
            total: 0,
            remaining: 0
          }
          let showMonetary = false
          if (context.coc7Config.setup !== '') {
            showMonetary = (await this.getCacheItemByCoCID(context.coc7Config.setup)).system.monetary.values.length > 0
          }
          if (context.coc7Config.occupation !== '') {
            const occupation = await this.getCacheItemByCoCID(this.coc7Config.occupation)
            if (occupation) {
              const options = []
              for (const [key, value] of Object.entries(occupation.system.occupationSkillPoints)) {
                if (value.selected) {
                  if (value.optional) {
                    options.push(value.multiplier * (parseInt(this.coc7Config.setupPoints[key], 10) + parseInt(this.coc7Config.setupModifiers[key], 10)))
                  } else {
                    context.occupation.total += value.multiplier * (parseInt(this.coc7Config.setupPoints[key], 10) + parseInt(this.coc7Config.setupModifiers[key], 10))
                  }
                }
              }
              if (options.length > 0) {
                context.occupation.total += Math.max(...options)
              }
            }
          }
          if (this.coc7Config.archetype !== '') {
            const archetype = await game.CoC7.cocid.fromCoCID(this.coc7Config.archetype)
            if (archetype.length === 1) {
              context.archetype.total = archetype[0].system.bonusPoints
            }
          }
          if (Object.keys(this.coc7Config.skillItems).length > 0) {
            const skills = {}
            const parsedValues = foundry.utils.duplicate(context.coc7Config.parsedValues)
            for (const key in this.coc7Config.skillItems) {
              const skill = this.coc7Config.skillItems[key]
              for (let index = 0, im = skill.rows.length; index < im; index++) {
                const row = skill.rows[index]
                if (!skill.flags.isMultiple || row.selected !== false) {
                  let item = foundry.utils.duplicate(skill.item)
                  if (row.selected !== false && typeof row.selected !== 'string') {
                    item = foundry.utils.duplicate(row.selected)
                  }
                  item.system.adjustments.personal = Number(row.personalPoints)
                  item.system.adjustments.occupation = Number(row.occupationPoints)
                  item.system.adjustments.archetype = Number(row.archetypePoints)
                  item.system.adjustments.experience = Number(row.experiencePoints)
                  skills[key + '.' + index] = item
                  if (key === this.cocidCthulhuMythos) {
                    parsedValues.sanMax = 99 - Number(row.personalPoints) + Number(row.occupationPoints) + Number(row.archetypePoints) + Number(row.experiencePoints)
                  }
                }
              }
            }
            if (typeof skills[this.cocidCthulhuMythos + '.0'] !== 'undefined') {
              await CoC7Utilities.setMultipleSkillBases(parsedValues, [skills[this.cocidCthulhuMythos + '.0']])
              parsedValues.sanMax = Math.max(0, parsedValues.sanMax - skills[this.cocidCthulhuMythos + '.0'].system.adjustments.base)
            }
            await CoC7Utilities.setMultipleSkillBases(parsedValues, skills)

            for (const key in this.coc7Config.skillItems) {
              const skill = this.coc7Config.skillItems[key]
              for (let index = 0, im = skill.rows.length; index < im; index++) {
                if (typeof skills[key + '.' + index] !== 'undefined') {
                  const row = skill.rows[index]
                  const item = foundry.utils.duplicate(skills[key + '.' + index])
                  const base = item.system.adjustments.base
                  let totalPoints = parseInt(base, 10)
                  if (Number(row.personalPoints) > 0) {
                    const num = Number(row.personalPoints)
                    context.personal.count += num
                    totalPoints = totalPoints + num
                  }
                  if (Number(row.occupationPoints) > 0) {
                    const num = Number(row.occupationPoints)
                    context.occupation.count += num
                    totalPoints = totalPoints + num
                  }
                  if (Number(row.archetypePoints) > 0) {
                    const num = Number(row.archetypePoints)
                    context.archetype.count += num
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
                    name = name + ' [' + this.coc7Config.creditRating.min + ' - ' + this.coc7Config.creditRating.max + ']'
                    if (totalPoints >= this.coc7Config.creditRating.min && totalPoints <= this.coc7Config.creditRating.max) {
                      context.creditRatingOkay = true
                    }
                  } else if (typeof row.selected === 'string') {
                    name = item.system.specialization + ' (' + row.selected + ')'
                  }
                  context.skills.push({
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
            context.skills.sort(CoC7Utilities.sortByNameKey)
            if (context.creditRatingOkay) {
              context.canNext = true
            }
          }

          context.personal.remaining = context.personal.total - context.personal.count
          context.occupation.remaining = context.occupation.total - context.occupation.count
          context.archetype.remaining = context.archetype.total - context.archetype.count
        }
        break

      case context.pages.PAGE_INVESTIGATOR:
        context.own = {}
        for (const key in this.coc7Config.own) {
          const options = await this.coc7Config.own[key].options
          context.own[key] = foundry.utils.duplicate(this.coc7Config.own[key])
          context.own[key].options = []
          for (const item of options) {
            if (item.flags.CoC7.cocidFlag.id !== key && !item.system.properties.requiresname && !item.system.properties.picknameonly && !item.system.properties.own) {
              context.own[key].options.push({
                name: item.name,
                key: item.flags.CoC7.cocidFlag.id
              })
            }
          }
          context.own[key].options.sort(CoC7Utilities.sortByNameKey)
        }
        context.canNext = true
        break

      case context.pages.PAGE_BACKSTORY:
        {
          const allBackstories = await this.coc7Config.cacheBackstories
          context.backstories = {}
          const bioSectionKeys = Object.entries(Object.assign(foundry.utils.flattenObject(game.i18n._fallback.CoC7?.CoCIDFlag?.keys ?? {}), foundry.utils.flattenObject(game.i18n.translations.CoC7?.CoCIDFlag?.keys ?? {}))).filter(e => e[0].startsWith('rt..'))
          for (let index = 0; index < this.coc7Config.bioSections.length; index++) {
            let rolls = ''
            if (this.coc7Config.bioSections[index].name.startsWith('rt..')) {
              rolls = this.coc7Config.bioSections[index].name
            } else {
              const match = this.coc7Config.bioSections[index].name.match(/^CoC7\.CoCIDFlag\.keys\.(rt\.\..+)$/)
              if (match) {
                rolls = match[1]
              } else {
                const match = bioSectionKeys.find(e => e[1] === this.coc7Config.bioSections[index].name)
                if (match) {
                  rolls = match[0]
                }
              }
            }
            context.backstories[index] = {
              index,
              name: this.coc7Config.bioSections[index].name,
              rolls: (rolls !== '' && game.CoC7.cocid.findCocIdInList(rolls, allBackstories).length ? rolls : ''),
              value: this.coc7Config.bioSections[index].value
            }
          }
        }
        context.canNext = true
        context.createButton = game.user.hasPermission('ACTOR_CREATE')
        break

      case context.pages.PAGE_CREATE:
        context.canNext = true
        context.createButton = true
        break
    }
    return context
  }

  /**
   * @inheritdoc
   * @param {string} partId
   * @param {ApplicationRenderContext} context
   * @param {HandlebarsRenderOptions} options
   * @returns {Promise<ApplicationRenderContext>}
   */
  async _preparePartContext (partId, context, options) {
    context = await super._preparePartContext(partId, context, options)

    switch (partId) {
      case 'footer':
        context.buttons = []
        if (context.coc7Config.step > 0) {
          context.buttons.push({
            type: 'submit',
            action: 'back',
            label: 'CoC7.InvestigatorWizard.BackStep',
            icon: 'fa-solid fa-backward'
          })
        } else {
          context.buttons.push({
            type: 'nothing',
            cssClass: 'no-button'
          })
        }
        if (!context.canNext) {
          context.buttons.push({
            type: 'nothing',
            cssClass: 'no-button'
          })
        } else if (context.createButton) {
          context.buttons.push({
            type: 'submit',
            action: 'next',
            label: 'CoC7.InvestigatorWizard.CreateStep',
            icon: 'fa-solid fa-user'
          })
        } else {
          context.buttons.push({
            type: 'submit',
            action: 'next',
            label: 'CoC7.InvestigatorWizard.NextStep',
            icon: 'fa-solid fa-forward'
          })
        }
        break
    }

    return context
  }

  /**
   * @inheritdoc
   * @param {ApplicationRenderContext} context
   * @param {RenderOptions} options
   * @returns {Promise<void>}
   */
  async _onRender (context, options) {
    await super._onRender(context, options)

    const form = this.element

    switch (context.coc7Config.step) {
      case context.pages.PAGE_CONFIGURATION:
        form.querySelectorAll('.toggle-switch').forEach((element) => element.addEventListener('click', async (event) => {
          const key = event.currentTarget.dataset.property
          switch (key) {
            case 'default-enabled':
              if (this.coc7Config.defaultQuantity === 0) {
                this.coc7Config.defaultQuantity = 1
              } else {
                this.coc7Config.defaultQuantity = 0
              }
              game.settings.set(FOLDER_ID, 'InvestigatorWizardQuantity', this.coc7Config.defaultQuantity)
              this.render({ force: true })
              break
            case 'rerolls-enabled':
              this.coc7Config.rerollsEnabled = !this.coc7Config.rerollsEnabled
              game.settings.set(FOLDER_ID, 'InvestigatorWizardRerolls', this.coc7Config.rerollsEnabled)
              this.render({ force: true })
              break
            case 'characteristics-method':
              switch (Number(event.currentTarget.dataset.value)) {
                case CoC7InvestigatorWizard.CharacteristicsMethods.METHOD_DEFAULT:
                  this.coc7Config.enforcePointBuy = false
                  this.coc7Config.chooseRolledValues = false
                  this.coc7Config.quickFireValues = []
                  break
                case CoC7InvestigatorWizard.CharacteristicsMethods.METHOD_POINTS:
                  this.coc7Config.enforcePointBuy = true
                  this.coc7Config.chooseRolledValues = false
                  this.coc7Config.quickFireValues = []
                  break
                case CoC7InvestigatorWizard.CharacteristicsMethods.METHOD_VALUES:
                  this.coc7Config.enforcePointBuy = false
                  this.coc7Config.chooseRolledValues = false
                  this.coc7Config.quickFireValues = (game.settings.get(FOLDER_ID, 'pulpRuleArchetype') ? [90, 80, 70, 60, 60, 50, 50, 40] : [80, 70, 60, 60, 50, 50, 50, 40])
                  break
                case CoC7InvestigatorWizard.CharacteristicsMethods.METHOD_CHOOSE:
                  this.coc7Config.enforcePointBuy = false
                  this.coc7Config.chooseRolledValues = true
                  this.coc7Config.quickFireValues = []
                  break
              }
              game.settings.set(FOLDER_ID, 'InvestigatorWizardPointBuy', this.coc7Config.enforcePointBuy)
              game.settings.set(FOLDER_ID, 'InvestigatorWizardQuickFire', this.coc7Config.quickFireValues)
              game.settings.set(FOLDER_ID, 'InvestigatorWizardChooseValues', this.coc7Config.chooseRolledValues)
              this.render({ force: true })
              break
          }
        }))
        form.querySelectorAll('.quick-fire-values input').forEach((element) => element.addEventListener('blur', async (event) => {
          const match = event.target.name.match(/^quick-fire-values-(\d+)$/)
          const value = Number(event.target.value)
          if (match && value > 0) {
            this.coc7Config.quickFireValues[match[1]] = value
          }
          this.coc7Config.quickFireValues.sort().reverse()
          this.coc7Config.placeable = foundry.utils.duplicate(this.coc7Config.quickFireValues)
          this.render({ force: true })
        }))
        form.querySelector('input[name=default-quantity]')?.addEventListener('blur', async (event) => {
          this.coc7Config.defaultQuantity = Number(event.target.value)
          game.settings.set(FOLDER_ID, 'InvestigatorWizardQuantity', this.coc7Config.defaultQuantity)
          this.render({ force: true })
        })
        form.querySelector('select[name=default-ownership]')?.addEventListener('blur', async (event) => {
          this.coc7Config.defaultOwnership = Number(event.target.value)
          game.settings.set(FOLDER_ID, 'InvestigatorWizardOwnership', this.coc7Config.defaultOwnership)
          this.render({ force: true })
        })
        form.querySelector('select[name=world-era]')?.addEventListener('change', async (event) => {
          const started = Date.now()
          form.querySelector('.era-change').style.display = 'block'
          form.querySelector('.scroll-section').style.display = 'none'
          form.querySelector('footer.form-footer').style.display = 'none'
          this.coc7Config.defaultEra = event.target.value
          await game.settings.set(FOLDER_ID, 'worldEra', this.coc7Config.defaultEra)
          this.coc7Config.cacheCoCID = await CoC7InvestigatorWizard.loadCacheItemByCoCID()
          // To prevent flashing show message for at least 500 ms
          const buffer = 500 - (Date.now() - started)
          // Don't bother if less than 10ms remaining
          if (buffer > 10) {
            await new Promise(resolve => setTimeout(resolve, buffer))
          }
          this.render({ force: true })
        })
        form.querySelector('select[name=default-setup]')?.addEventListener('change', async (event) => {
          this.coc7Config.defaultSetup = event.target.value
          game.settings.set(FOLDER_ID, 'InvestigatorWizardSetup', this.coc7Config.defaultSetup)
          this.coc7Config.setup = this.coc7Config.defaultSetup
          this.clearSetupPoints()
          await this.setSkillLists()
          this.render({ force: true })
        })
        break

      case context.pages.PAGE_SETUPS:
        form.querySelector('select[name=coc-setup]')?.addEventListener('change', async (event) => {
          this.coc7Config.setup = event.target.value
          this.clearSetupPoints()
          await this.setSkillLists()
          this.render({ force: true })
        })
        break

      case context.pages.PAGE_ARCHETYPES:
        form.querySelector('select[name=coc-archetype]')?.addEventListener('change', async (event) => {
          this.coc7Config.archetype = event.target.value
          this.coc7Config.coreCharacteristic = ''
          this.clearSetupPoints()
          await this.setSkillLists()
          this.render({ force: true })
        })
        break

      case context.pages.PAGE_CHARACTERISTICS:
        /* // FoundryVTT V12 */
        new (foundry.applications.ux?.DragDrop ?? DragDrop)({
          dragSelector: '.draggable',
          permissions: {
            dragstart: true,
            drop: true
          },
          callbacks: {
            dragstart: this._onDragStart.bind(this),
            drop: this._onDragDrop.bind(this)
          }
        }).bind(this.element)
        form.querySelector('select[name=coc-core-characteristic]')?.addEventListener('change', async (event) => {
          this.coc7Config.coreCharacteristic = event.target.value
          this.clearSetupPoints()
          this.coc7Config.placeable = foundry.utils.duplicate(this.coc7Config.quickFireValues)
          this.render({ force: true })
        })
        form.querySelector('button.roll_choose')?.addEventListener('click', async (event) => {
          event.preventDefault()
          if (this.coc7Config.setup !== '') {
            const setup = await this.getCacheItemByCoCID(this.coc7Config.setup)
            if (typeof setup !== 'undefined') {
              const rollFormulas = {}
              for (const key of CONFIG.Actor.dataModels.character.schema.getField('characteristics').keys()) {
                rollFormulas[key] = setup.system.characteristics.rolls[key]
              }
              if (this.coc7Config.archetype !== '') {
                const archetype = await this.getCacheItemByCoCID(this.coc7Config.archetype)
                if (typeof archetype !== 'undefined') {
                  if (this.coc7Config.coreCharacteristic !== '') {
                    if (archetype.system.coreCharacteristicsFormula.enabled) {
                      rollFormulas[this.coc7Config.coreCharacteristic] = archetype.system.coreCharacteristicsFormula.value
                    }
                  }
                }
              }
              rollFormulas.luck = setup.system.characteristics.rolls.luck
              const rollCharacteristicValues = (!context.coc7Config.chooseRolledValues && !context.coc7Config.enforcePointBuy && setup.system.characteristics.rolls.enabled)
              if (!rollCharacteristicValues) {
                this.coc7Config.rolledValues = []
              }
              const rolls = []
              for (const [key, field] of CONFIG.Actor.dataModels.character.schema.getField('characteristics').entries()) {
                if (!rollCharacteristicValues || this.coc7Config.setupPoints[key] === '' || this.coc7Config.rerollsEnabled) {
                  const roll = await new Roll(rollFormulas[key].toString(), {}, { flavor: game.i18n.localize(field.hint) }).roll()
                  if (rollCharacteristicValues) {
                    this.coc7Config.setupPoints[key] = Number(roll.total)
                  } else {
                    this.coc7Config.rolledValues.push({
                      value: roll.total,
                      assigned: false
                    })
                  }
                  rolls.push(roll)
                }
              }
              if (rollCharacteristicValues && (this.coc7Config.setupPoints.luck === '' || this.coc7Config.rerollsEnabled)) {
                const roll = await new Roll(rollFormulas.luck.toString(), {}, { flavor: game.i18n.localize('CoC7.Luck') }).roll()
                this.coc7Config.setupPoints.luck = Number(roll.total)
                rolls.push(roll)
              }
              if (rolls.length) {
                ChatMessage.create({
                  user: game.user.id,
                  speaker: {
                    alias: game.user.name
                  },
                  rolls,
                  whisper: ChatMessage.getWhisperRecipients('GM')
                })
              }
            }
          }
          this.render({ force: true })
        })
        form.querySelectorAll('input.save-on-blur').forEach((element) => element.addEventListener('blur', async (event) => {
          const key = event.target.closest('.input-line').dataset.key
          switch (key) {
            case 'age':
              {
                const age = Number(event.target.value)
                if (age > 0) {
                  this.coc7Config.age = age
                  this.getAgeAdjustments()
                }
              }
              break
            default:
              {
                const value = Number(event.target.value)
                if (value > 0) {
                  this.coc7Config.setupPoints[key] = value
                }
              }
              break
          }
          this.render({ force: true })
        }))
        form.querySelectorAll('.item-control').forEach((element) => element.addEventListener('click', async (event) => {
          switch (event.currentTarget.dataset.action) {
            case 'roll-characteristic':
              {
                const inputLine = event.currentTarget.closest('.input-line')
                const key = inputLine.dataset.key
                const formula = inputLine.dataset.formula
                if (formula) {
                  let hint = CONFIG.Actor.dataModels.character.schema.getField('characteristics').get(key)?.hint
                  if (typeof hint === 'undefined') {
                    hint = (key === 'luck' ? 'CoC7.Luck' : '')
                  }
                  const roll = await new Roll(formula.toString(), {}, { flavor: game.i18n.localize(hint) }).roll()
                  inputLine.querySelector('input').value = roll.total
                  this.coc7Config.setupPoints[key] = Number(roll.total)
                  ChatMessage.create({
                    user: game.user.id,
                    speaker: {
                      alias: game.user.name
                    },
                    rolls: [roll],
                    whisper: ChatMessage.getWhisperRecipients('GM')
                  })
                  this.render({ force: true })
                }
              }
              break
            case 'modify-characteristic':
              {
                const inputLine = event.currentTarget.closest('.input-line')
                const key = inputLine.dataset.key
                const by = parseInt(event.currentTarget.dataset.by, 10)
                const input = inputLine.querySelector('input')
                let value = Number(input.value) + by
                if ((inputLine.dataset.min ?? '') !== '') {
                  value = Math.max(parseInt(inputLine.dataset.min, 10), value)
                }
                if ((inputLine.dataset.max ?? '') !== '') {
                  value = Math.min(parseInt(inputLine.dataset.max, 10), value)
                }
                input.value = this.coc7Config.setupPoints[key] = value
                this.render({ force: true })
              }
              break
          }
        }))
        break

      case context.pages.PAGE_ATTRIBUTES:
        form.querySelector('button.roll_edu')?.addEventListener('click', async (event) => {
          event.preventDefault()
          if (typeof this.coc7Config.requiresAgeAdjustments.edu !== 'undefined') {
            if (!this.coc7Config.requiresAgeAdjustments.edu.rolled && this.coc7Config.requiresAgeAdjustments.edu.total) {
              let value = parseInt(this.coc7Config.setupPoints.edu, 10)
              const message = []
              for (let rolls = this.coc7Config.requiresAgeAdjustments.edu.total; rolls > 0; rolls--) {
                const upgradeRoll = await CoC7DicePool.rollNewPool({ })
                if (upgradeRoll.total > value) {
                  const augmentDie = await new Roll('1d10').evaluate()
                  message.push(`<span class="coc7-upgrade-success">${game.i18n.format(
                    'CoC7.DevSuccess',
                    {
                      item: game.i18n.localize('CHARAC.Education'),
                      die: upgradeRoll.total,
                      score: value,
                      augment: augmentDie.total
                    }
                  )}</span><br>`)
                  value = value + parseInt(augmentDie.total, 10)
                } else {
                  message.push(`<span class="coc7-upgrade-failed">${game.i18n.format(
                    'CoC7.DevFailure',
                    {
                      item: game.i18n.localize('CHARAC.Education'),
                      die: upgradeRoll.total,
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
              this.coc7Config.setupModifiers.edu = value - parseInt(this.coc7Config.setupPoints.edu, 10)
              this.coc7Config.requiresAgeAdjustments.edu.rolled = true
              this.render({ force: true })
            }
          }
        })
        form.querySelectorAll('.item-control').forEach((element) => element.addEventListener('click', async (event) => {
          switch (event.currentTarget.dataset.action) {
            case 'modify-characteristic':
              {
                const inputLine = event.currentTarget.closest('.input-line')
                const key = inputLine.dataset.key
                const by = parseInt(event.currentTarget.dataset.by, 10)
                let value = Number(this.coc7Config.setupModifiers[key]) + by
                if ((inputLine.dataset.min ?? '') !== '') {
                  value = Math.max(parseInt(inputLine.dataset.min, 10), value)
                }
                if ((inputLine.dataset.max ?? '') !== '') {
                  value = Math.min(parseInt(inputLine.dataset.max, 10), value)
                }
                this.coc7Config.setupModifiers[key] = value
                this.render({ force: true })
              }
              break
          }
        }))
        form.querySelector('button.roll_luck')?.addEventListener('click', async (event) => {
          const setup = await this.getCacheItemByCoCID(this.coc7Config.setup)
          if (setup) {
            const die = await new Roll(setup.system.characteristics.rolls.luck.toString()).evaluate()
            this.coc7Config.setupModifiers.luck = [die.total]
            /* // FoundryVTT V12 */
            const html = await (foundry.applications.handlebars?.renderTemplate ?? renderTemplate)(Roll.CHAT_TEMPLATE, {
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
            this.render({ force: true })
          }
        })
        break

      case context.pages.PAGE_OCCUPATIONS:
        form.querySelector('select[name=coc-occupation]')?.addEventListener('change', async (event) => {
          this.coc7Config.occupation = event.target.value
          await this.setSkillLists()
          this.render({ force: true })
        })
        break

      case context.pages.PAGE_OCCUPATION_SKILLS:
      case context.pages.PAGE_ARCHETYPE_SKILLS:
        form.querySelectorAll('.clickable').forEach((element) => element.addEventListener('click', async (event) => {
          this._onClickPickSkill(event)
        }))
        form.querySelectorAll('.rollable').forEach((element) => element.addEventListener('click', async (event) => {
          this._onToggleSkill(event)
        }))
        form.querySelectorAll('.item-control').forEach((element) => element.addEventListener('click', async (event) => {
          switch (event.currentTarget.dataset.action) {
            case 'delete-skill':
              this._onClickDeleteSkill(event)
          }
        }))
        /* // FoundryVTT V12 */
        new (foundry.applications.ux?.DragDrop ?? DragDrop)({
          dragSelector: '.draggable',
          permissions: {
            dragstart: true,
            drop: true
          },
          callbacks: {
            dragstart: this._onDragStart.bind(this),
            drop: this._onDragDrop.bind(this)
          }
        }).bind(this.element)
        break

      case context.pages.PAGE_POINTS_SKILLS:
        form.querySelectorAll('.skill-adjustment').forEach((element) => element.addEventListener('blur', async (event) => {
          const input = event.currentTarget
          const adjustment = input.dataset.adjustment
          const row = input.closest('.points-row')
          const key = row.dataset.key
          const index = row.dataset.index
          if (typeof this.coc7Config.skillItems[key]?.rows[index][adjustment] !== 'undefined') {
            this.coc7Config.skillItems[key].rows[index][adjustment] = input.value
          }
          this.render({ force: true })
        }))
        break

      case context.pages.PAGE_INVESTIGATOR:
        form.querySelectorAll('file-picker').forEach((element) => element.addEventListener('change', async (event) => {
          this.coc7Config[event.currentTarget.name] = event.currentTarget.value
          this.render({ force: true })
        }))
        form.querySelectorAll('input.save-on-blur').forEach((element) => element.addEventListener('blur', async (event) => {
          switch (event.currentTarget.name) {
            case 'name':
            case 'residence':
            case 'birthplace':
              this.coc7Config[event.currentTarget.name] = event.currentTarget.value
              break
            default:
              if (typeof this.coc7Config.own[event.currentTarget.name] !== 'undefined') {
                this.coc7Config.own[event.currentTarget.name].value = event.currentTarget.value
              }
              break
          }
        }))
        form.querySelectorAll('select.save-on-change').forEach((element) => element.addEventListener('change', async (event) => {
          if (typeof this.coc7Config.own[event.currentTarget.dataset.key] !== 'undefined') {
            this.coc7Config.own[event.currentTarget.dataset.key].selected = event.currentTarget.value
          }
          this.render({ force: true })
        }))
        break

      case context.pages.PAGE_BACKSTORY:
        form.querySelectorAll('textarea.backstory-text').forEach((element) => element.addEventListener('blur', async (event) => {
          const textarea = event.currentTarget
          const index = textarea.dataset.index
          if (typeof this.coc7Config.bioSections[index] !== 'undefined') {
            this.coc7Config.bioSections[index].value = textarea.value
          }
        }))
        form.querySelectorAll('button.backstory-reset').forEach((element) => element.addEventListener('click', async (event) => {
          const index = event.currentTarget.dataset.index
          if (typeof this.coc7Config.bioSections[index] !== 'undefined') {
            this.coc7Config.bioSections[index].value = ''
          }
          this.render({ force: true })
        }))
        form.querySelectorAll('button.backstory-roll').forEach((element) => element.addEventListener('click', async (event) => {
          const button = event.currentTarget
          const index = button.dataset.index
          const key = button.dataset.key
          if (typeof this.coc7Config.bioSections[index] !== 'undefined') {
            const table = await game.CoC7.cocid.fromCoCID(key)
            if (table.length === 1) {
              const tableResults = await table[0].roll()
              for (const tableResult of tableResults.results) {
                if (tableResult.type === CONST.TABLE_RESULT_TYPES.TEXT) {
                  /* // FoundryVTT V12 */
                  this.coc7Config.bioSections[index].value = (this.coc7Config.bioSections[index].value + '\n' + (tableResult.description ?? tableResult.text).trim()).trim()
                }
              }
            }
          }
          this.render({ force: true })
        }))
        break
    }
  }

  /**
   * @inheritdoc
   * @param {RenderOptions} options
   * @returns {Promise<HTMLElement>}
   */
  async _renderFrame (options) {
    const frame = await super._renderFrame(options)

    /* // FoundryV12 polyfill */
    if (!foundry.utils.isNewerVersion(game.version, 13)) {
      frame.setAttribute('open', true)
    }

    return frame
  }

  /**
   * Add Item to List with configured toggles
   * @param {Document} item
   * @param {object} options
   * @param {boolean} options.isOccupationDefault
   * @param {boolean} options.inOccupationGroup
   * @param {boolean} options.occupationToggle
   * @param {boolean} options.isArchetypeDefault
   * @param {boolean} options.archetypeToggle
   * @param {boolean} options.isCreditRating
   */
  addItemToList (item, { isOccupationDefault = false, inOccupationGroup = false, occupationToggle = false, isArchetypeDefault = false, archetypeToggle = false, isCreditRating = false } = {}) {
    const key = (item.flags.CoC7?.cocidFlag?.id ?? item.name)
    if (item.type !== 'skill') {
      this.coc7Config.investigatorItems.push(item)
      return
    }
    const isMultiple = (item.system.properties.special && !item.system.properties.own && key !== this.cocidLanguageOwn && (item.system.properties.requiresname || item.system.properties.picknameonly || item.system.skillName === game.i18n.format('CoC7.AnySpecName')))
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
    if (typeof this.coc7Config.skillItems[key] === 'undefined') {
      this.coc7Config.skillItems[key] = {
        item,
        flags: foundry.utils.mergeObject(flags, { isMultiple }, { inplace: false }),
        rows: []
      }
      if (!isMultiple || !(isOccupationDefault === false && inOccupationGroup === false && isArchetypeDefault === false)) {
        this.coc7Config.skillItems[key].rows.push(foundry.utils.mergeObject(flags, rows, { inplace: false }))
      }
    } else {
      if (!isMultiple) {
        for (const flag in flags) {
          this.coc7Config.skillItems[key].rows[0][flag] = this.coc7Config.skillItems[key].rows[0][flag] || flags[flag]
        }
      } else {
        this.coc7Config.skillItems[key].rows.push(foundry.utils.mergeObject(flags, rows, { inplace: false }))
      }
      for (const flag in flags) {
        this.coc7Config.skillItems[key].flags[flag] = this.coc7Config.skillItems[key].flags[flag] || flags[flag]
      }
    }
    if (!isMultiple && flags.isCreditRating) {
      this.coc7Config.skillItems[key].rows[0].occupationPoints = this.coc7Config.creditRating.min
    }
  }

  /**
   * Clear setup points
   */
  clearSetupPoints () {
    for (const key in this.coc7Config.setupPoints) {
      this.coc7Config.setupPoints[key] = ''
    }
    this.coc7Config.rolledValues = []
  }

  /**
   * Set skill lists based on currently selected setup, occupation, and archetype
   */
  async setSkillLists () {
    this.coc7Config.skillItems = {}
    this.coc7Config.occupationGroups = {}
    this.coc7Config.investigatorItems = []
    this.coc7Config.placeable = foundry.utils.duplicate(this.coc7Config.quickFireValues)
    const setup = await this.getCacheItemByCoCID(this.coc7Config.setup)
    const occupation = await this.getCacheItemByCoCID(this.coc7Config.occupation)
    let archetype = false
    if (this.coc7Config.archetype !== '') {
      archetype = await this.getCacheItemByCoCID(this.coc7Config.archetype)
    }
    if (setup && occupation && (!game.settings.get(FOLDER_ID, 'pulpRuleArchetype') || archetype)) {
      this.coc7Config.bioSections = []
      for (let index = 0; index < setup.system.bioSections.length; index++) {
        this.coc7Config.bioSections.push({
          name: setup.system.bioSections[index],
          value: ''
        })
      }
      this.coc7Config.personal = occupation.system.personal
      this.coc7Config.personalText = occupation.system.personalText
      this.coc7Config.creditRating = occupation.system.creditRating
      let items = []
      items = await this.mergeItemArrays(setup.system.itemDocuments, setup.system.itemKeys)
      for (let index = 0, im = items.length; index < im; index++) {
        this.addItemToList(items[index])
      }
      items = await this.mergeItemArrays(occupation.system.itemDocuments, occupation.system.itemKeys)
      for (let index = 0, im = items.length; index < im; index++) {
        this.addItemToList(items[index], { isOccupationDefault: true, occupationToggle: true })
      }
      for (let group = 0, gm = occupation.system.groups.length; group < gm; group++) {
        this.coc7Config.occupationGroups[group] = occupation.system.groups[group].options
        items = await this.mergeItemArrays(occupation.system.groups[group].itemDocuments, occupation.system.groups[group].itemKeys)
        for (let index = 0, im = items.length; index < im; index++) {
          this.addItemToList(items[index], { inOccupationGroup: group })
        }
      }
      if (archetype) {
        items = await this.mergeItemArrays(archetype.system.itemDocuments, archetype.system.itemKeys)
        for (let index = 0, im = items.length; index < im; index++) {
          this.addItemToList(items[index], { isArchetypeDefault: true, archetypeToggle: true })
        }
      }
      if (Number(this.coc7Config.creditRating.max) > 0) {
        const nameCreditRating = game.i18n.format('CoC7.CoCIDFlag.keys.' + this.cocidCreditRating)
        const flags = { isOccupationDefault: true, occupationToggle: true, isCreditRating: true }
        if (typeof this.coc7Config.skillItems[this.cocidCreditRating] !== 'undefined') {
          this.addItemToList(this.coc7Config.skillItems[this.cocidCreditRating].item, flags)
        } else if (typeof this.coc7Config.skillItems[nameCreditRating] !== 'undefined') {
          this.addItemToList(this.coc7Config.skillItems[nameCreditRating].item, flags)
        } else {
          const skill = await game.CoC7.cocid.fromCoCID(this.cocidCreditRating)
          if (skill.length) {
            this.addItemToList(skill[0], flags)
          }
        }
      }
    }
  }

  /**
   * Set drag data
   * @param {DragEvent} event
   */
  _onDragStart (event) {
    if (event.currentTarget.dataset.characteristicKey) {
      const dragData = { type: 'investigatorCharacteristic', key: event.currentTarget.dataset.characteristicKey, value: event.currentTarget.dataset.value }
      event.dataTransfer.setData('text/plain', JSON.stringify(dragData))
    } else if (event.currentTarget.dataset.offset) {
      const dragData = { type: 'investigatorValue', offset: event.currentTarget.dataset.offset }
      event.dataTransfer.setData('text/plain', JSON.stringify(dragData))
    }
  }

  /**
   * Process dropped characteristic values or skill Items
   * @param {DropEvent} event
   */
  async _onDragDrop (event) {
    try {
      const dataList = JSON.parse(event.dataTransfer.getData('text/plain'))
      switch (dataList.type) {
        case 'investigatorCharacteristic':
          dataList.destination = event.target.closest('.drop-location').dataset.characteristicKey
          if (typeof dataList.destination === 'undefined') {
            dataList.destination = event.target.closest('.drop-location').dataset.empty
          }
          dataList.okay = false
          if (dataList.destination === 'x') {
            const offset = this.coc7Config.rolledValues.findIndex(i => i.assigned === true)
            if (offset > -1) {
              this.coc7Config.rolledValues[offset] = {
                value: this.coc7Config.setupPoints[dataList.key],
                assigned: false
              }
              this.coc7Config.setupPoints[dataList.key] = ''
            }
            dataList.okay = true
          } else if (dataList.key === '-' && typeof this.coc7Config.setupPoints[dataList.destination] !== 'undefined') {
            const index = this.coc7Config.placeable.indexOf(parseInt(dataList.value, 10))
            if (index !== -1) {
              this.coc7Config.placeable.splice(index, 1)
            }
            if (this.coc7Config.setupPoints[dataList.destination] !== '') {
              this.coc7Config.placeable.push(parseInt(this.coc7Config.setupPoints[dataList.destination], 10))
            }
            this.coc7Config.setupPoints[dataList.destination] = parseInt(dataList.value, 10)
            this.coc7Config.placeable.sort().reverse()
            dataList.okay = true
          } else if (typeof this.coc7Config.setupPoints[dataList.key] !== 'undefined' && dataList.destination === '-') {
            if (this.coc7Config.setupPoints[dataList.key] !== '') {
              this.coc7Config.placeable.push(parseInt(this.coc7Config.setupPoints[dataList.key], 10))
              this.coc7Config.setupPoints[dataList.key] = ''
              this.coc7Config.placeable.sort().reverse()
              dataList.okay = true
            }
          } else if (typeof this.coc7Config.setupPoints[dataList.key] !== 'undefined' && typeof this.coc7Config.setupPoints[dataList.destination] !== 'undefined') {
            const temp = (this.coc7Config.setupPoints[dataList.key] === '' ? '' : parseInt(this.coc7Config.setupPoints[dataList.key], 10))
            this.coc7Config.setupPoints[dataList.key] = (this.coc7Config.setupPoints[dataList.destination] === '' ? '' : parseInt(this.coc7Config.setupPoints[dataList.destination], 10))
            this.coc7Config.setupPoints[dataList.destination] = temp
            dataList.okay = true
          }
          if (dataList.okay) {
            this.render({ force: true })
            return
          }
          break
        case 'investigatorValue':
          dataList.destination = event.target.closest('.drop-location').dataset.characteristicKey
          dataList.okay = false
          if (typeof dataList.destination !== 'undefined' && this.coc7Config.rolledValues[dataList.offset].assigned === false) {
            let old
            if (this.coc7Config.setupPoints[dataList.destination] !== '') {
              old = this.coc7Config.setupPoints[dataList.destination]
            }
            this.coc7Config.setupPoints[dataList.destination] = this.coc7Config.rolledValues[dataList.offset].value
            if (typeof old !== 'undefined') {
              this.coc7Config.rolledValues[dataList.offset].value = old
            } else {
              this.coc7Config.rolledValues[dataList.offset].assigned = true
            }
            dataList.okay = true
          }
          if (dataList.okay) {
            this.render({ force: true })
            return
          }
          break
      }
    } catch (err) {
    }
    const dataList = await CoC7Utilities.getDataFromDropEvent(event, 'Item')
    if ([CoC7InvestigatorWizard.PageList.PAGE_ARCHETYPE_SKILLS, CoC7InvestigatorWizard.PageList.PAGE_OCCUPATION_SKILLS].includes(this.coc7Config.step)) {
      for (const item of dataList) {
        if (item.type === 'skill') {
          this.addItemToList(item)
          this.render({ force: true })
        }
      }
    }
  }

  /**
   * Remove picked (any) skill
   * @param {Event} event
   */
  async _onClickDeleteSkill (event) {
    event.stopPropagation()
    const key = event.currentTarget?.closest('.toggle')?.dataset?.key
    const index = event.currentTarget?.closest('.toggle')?.dataset?.index
    if (typeof this.coc7Config.skillItems[key]?.rows[index] !== 'undefined') {
      this.coc7Config.skillItems[key].rows.splice(index, 1)
      this.render({ force: true })
    }
  }

  /**
   * Toggle skill and refresh
   * @param {Event} event
   */
  async _onToggleSkill (event) {
    const key = event.currentTarget?.dataset?.key
    const index = event.currentTarget?.dataset?.index
    const toggleKey = event.currentTarget?.dataset?.toggleKey
    if (typeof this.coc7Config.skillItems[key]?.rows[index] !== 'undefined') {
      this.coc7Config.skillItems[key].rows[index][toggleKey] = !this.coc7Config.skillItems[key].rows[index][toggleKey]
      this.render({ force: true })
    }
  }

  /**
   * Pick Skill
   * @param {Event} event
   */
  async _onClickPickSkill (event) {
    const key = event.currentTarget?.dataset?.key
    const index = event.currentTarget?.dataset?.index
    const toggleKey = event.currentTarget?.dataset?.toggleKey
    if (typeof this.coc7Config.skillItems[key] !== 'undefined') {
      if (index > -1) {
        this.coc7Config.skillItems[key].rows[index][toggleKey] = false
        this.coc7Config.skillItems[key].rows[index].selected = false
      }
      let skillList = []
      const group = game.CoC7.cocid.guessGroupFromKey(key)
      if (group) {
        skillList = (await game.CoC7.cocid.fromCoCIDRegexBest({ cocidRegExp: new RegExp('^' + CoC7Utilities.quoteRegExp(group) + '.+$'), type: 'i' })).filter(item => {
          return !(item.system.properties?.special && !!(item.system.properties?.requiresname || item.system.properties?.picknameonly))
        })
        if (skillList.length > 1) {
          skillList.sort(CoC7Utilities.sortByNameKey)
        }
      }
      const skillData = await CoC7SkillSpecializationSelectDialog.create({
        skills: skillList,
        allowCustom: (this.coc7Config.skillItems[key].item.system.properties?.requiresname ?? false),
        fixedBaseValue: true,
        specializationName: this.coc7Config.skillItems[key].item.system.specialization,
        label: this.coc7Config.skillItems[key].item.name
      })
      if (index > -1) {
        if (skillData.selected !== '') {
          this.coc7Config.skillItems[key].rows[index].selected = skillList.find(i => i.id === skillData.selected)
          this.coc7Config.skillItems[key].rows[index][toggleKey] = true
        } else if (skillData.name !== '') {
          this.coc7Config.skillItems[key].rows[index].selected = skillData.name
          this.coc7Config.skillItems[key].rows[index][toggleKey] = true
        }
      } else {
        let selected = false
        let newCoCId = false
        if (skillData.selected !== '') {
          selected = skillList.find(i => i.id === skillData.selected)
        } else if (skillData.name !== '') {
          selected = skillData.name
          newCoCId = true
        }
        this.coc7Config.skillItems[key].rows.push({
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
          selected,
          newCoCId
        })
      }
      this.render({ force: true })
    }
  }

  /**
   * Get next/back page number
   * @param {int} direction
   * @returns {int}
   */
  getPageNumber (direction) {
    const pageOrder = this.pageOrder
    const key = parseInt(Object.keys(pageOrder).find(key => pageOrder[key] === this.coc7Config.step), 10) + direction
    return pageOrder[key]
  }

  /**
   * Submit the configuration form.
   * @param {SubmitEvent} event
   * @param {HTMLFormElement} form
   * @param {FormDataExtended} formData
   * @returns {Promise<void>}
   */
  static async #onSubmit (event, form, formData) {
    if (['back', 'next'].includes(event.submitter?.dataset.action)) {
      if (event.submitter.classList.contains('currently-submitting')) {
        return
      }
      event.submitter.classList.add('currently-submitting')
    }
    if (event.submitter?.dataset.action === 'back') {
      const pageNumber = this.getPageNumber(-1)
      if (typeof pageNumber !== 'undefined') {
        this.coc7Config.step = pageNumber
        // When moving step reset scroll height
        const obj = this.element.querySelector('.scroll-section')
        if (obj && obj.scrollTop) {
          obj.scrollTop = 0
        }
      }
    } else if (event.submitter?.dataset.action === 'next') {
      await this.coc7Config.cacheCoCID
      if (this.coc7Config.step === CoC7InvestigatorWizard.PageList.PAGE_CREATE || (this.coc7Config.step === CoC7InvestigatorWizard.PageList.PAGE_BACKSTORY && game.user.hasPermission('ACTOR_CREATE'))) {
        this.attemptToCreate()
        return
      } else {
        const pageNumber = this.getPageNumber(1)
        if (typeof pageNumber !== 'undefined') {
          switch (pageNumber) {
            case CoC7InvestigatorWizard.PageList.PAGE_INVESTIGATOR:
              {
                const own = {}
                for (const key in this.coc7Config.skillItems) {
                  const skill = this.coc7Config.skillItems[key]
                  for (let index = 0, im = skill.rows.length; index < im; index++) {
                    const row = skill.rows[index]
                    if (!skill.flags.isMultiple || row.selected !== false) {
                      let item = foundry.utils.duplicate(skill.item)
                      if (row.selected !== false && typeof row.selected !== 'string') {
                        item = foundry.utils.duplicate(row.selected)
                      }
                      if (item.system.properties.own || key === this.cocidLanguageOwn) {
                        const regEx = new RegExp('^' + CoC7Utilities.quoteRegExp(game.CoC7.cocid.guessGroupFromDocument(item)))
                        own[key] = {
                          name: item.name,
                          specialization: item.system.specialization,
                          options: game.CoC7.cocid.fromCoCIDRegexBest({ cocidRegExp: regEx, type: 'i' }),
                          selected: this.coc7Config.own[key]?.selected ?? '',
                          value: this.coc7Config.own[key]?.value ?? ''
                        }
                      }
                    }
                  }
                }
                this.coc7Config.own = own
              }
              break
          }
          this.coc7Config.step = pageNumber
          // When moving step reset scroll height
          const obj = this.element.querySelector('.scroll-section')
          if (obj && obj.scrollTop) {
            obj.scrollTop = 0
          }
        }
      }
    }
    this.render({ force: true })
  }

  /**
   * Attempt to create the character if unable to ACTOR_CREATE trigger a isGM socket request
   */
  async attemptToCreate () {
    const actorData = await this.normalizeCharacterData(this.coc7Config)
    if (game.user.hasPermission('ACTOR_CREATE')) {
      const actor = await CoC7InvestigatorWizard.createCharacter(actorData)
      actor.sheet.render({ force: true })
      this.close()
    } else {
      actorData.document.ownership[game.user.id] = CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
      if (CoC7SystemSocket.requestKeeperAction({
        type: 'characterWizard',
        payload: actorData
      })) {
        ui.notifications.info('CoC7.InvestigatorWizard.CreatingInvestigator', { localize: true })
        this.close()
      }
    }
  }

  /**
   * Convert form object into character data and skill/weapon items
   * @param {object} data
   * @returns {object}
   */
  async normalizeCharacterData (data) {
    const items = []
    const embeddedItems = []
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
          if (item.system.properties.own || key === this.cocidLanguageOwn) {
            if (data.own[key].selected !== '') {
              const options = await this.coc7Config.own[key].options
              const newItem = options.find(doc => doc.flags.CoC7.cocidFlag.id === data.own[key].selected)
              if (newItem) {
                const base = item.system.base
                item = foundry.utils.duplicate(newItem)
                item.system.base = base
              }
            } else {
              item.system.skillName = data.own[key].value
              item._id = foundry.utils.randomID()
              foundry.utils.setProperty(item, 'system.properties.requiresname', false)
              foundry.utils.setProperty(item, 'system.properties.picknameonly', false)
              item.name = item.system.specialization + ' (' + item.system.skillName + ')'
              row.newCoCId = true
            }
            foundry.utils.setProperty(item, 'system.properties.own', true)
          } else if (row.selected !== false) {
            item.system.skillName = row.selected
            item._id = foundry.utils.randomID()
            foundry.utils.setProperty(item, 'system.properties.requiresname', false)
            foundry.utils.setProperty(item, 'system.properties.picknameonly', false)
            item.name = item.system.specialization + ' (' + item.system.skillName + ')'
            row.newCoCId = true
          }
          if (row.newCoCId) {
            item.flags.CoC7.cocidFlag.id = 'i.skill.' + CoC7Utilities.toKebabCase(item.name)
          }
          embeddedItems.push(item)
        }
      }
    }
    for (const sourceItem of data.investigatorItems) {
      const item = foundry.utils.duplicate(sourceItem)
      if (item.type === 'weapon') {
        embeddedItems.push(item)
      } else {
        items.push(item)
      }
    }
    let monetary = {}
    const setup = await this.getCacheItemByCoCID(this.coc7Config.setup)
    if (setup) {
      monetary = foundry.utils.duplicate(setup.system.monetary)
    }
    const development = {
      personal: 2 * (parseInt(data.setupPoints.int, 10) + parseInt(data.setupModifiers.int, 10)),
      occupation: 0,
      archetype: 0
    }
    if (data.archetype !== '') {
      const archetype = await game.CoC7.cocid.fromCoCID(data.archetype)
      if (archetype.length === 1) {
        items.push(archetype[0].toObject())
        development.archetype = archetype[0].system.bonusPoints
      }
    }
    if (data.occupation !== '') {
      const occupation = await game.CoC7.cocid.fromCoCID(data.occupation)
      if (occupation.length === 1) {
        items.push(occupation[0].toObject())
        const options = []
        for (const [key, value] of Object.entries(occupation[0].system.occupationSkillPoints)) {
          if (value.selected) {
            if (value.optional) {
              options.push(value.multiplier * (parseInt(data.setupPoints[key], 10) + parseInt(data.setupModifiers[key], 10)))
            } else {
              development.occupation += value.multiplier * (parseInt(data.setupPoints[key], 10) + parseInt(data.setupModifiers[key], 10))
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
    if (game.settings.get(FOLDER_ID, 'oneBlockBackstory')) {
      for (let index = 0, im = data.bioSections.length; index < im; index++) {
        backstory.push('<h3>' + game.i18n.localize(data.bioSections[index].name) + '</h3>' + '<p>' + data.bioSections[index].value.split(/[\r\n]+/).join('</p><p>') + '</p>')
      }
    } else {
      for (let index = 0, im = data.bioSections.length; index < im; index++) {
        biography.push({
          title: game.i18n.localize(data.bioSections[index].name),
          value: data.bioSections[index].value
        })
      }
    }
    const actorData = {
      document: {
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
      },
      embeddedItems
    }
    actorData.document.system.attribs.san.value = actorData.document.system.characteristics.pow.value
    actorData.document.system.attribs.san.dailyLimit = Math.floor(actorData.document.system.characteristics.pow.value / 5)
    return actorData
  }

  /**
   * Attempt to create Actor for player
   * @param {object} actorData
   */
  static async createCharacterFromData (actorData) {
    const actor = await CoC7InvestigatorWizard.createCharacter(actorData)
    const functionId = Hooks.on('renderActorSheetV2', (app, html, data) => {
      if (app.document.id === actor.id) {
        game.socket.emit('system.CoC7', {
          type: 'open-character',
          listener: Object.keys(actorData.document.ownership).find(k => k !== 'default'),
          payload: actor.id
        })
        Hooks.off('renderActorSheetV2', functionId)
      }
    })
    actor.sheet.render({ force: true })
  }

  /**
   * Create Actor
   * @param {object} actorData
   * @returns {Document}
   */
  static async createCharacter (actorData) {
    const actor = await Actor.create(actorData.document)
    await actor.createEmbeddedDocuments('Item', actorData.embeddedItems)
    return actor
  }

  /**
   * create it's the default way to create the CoC7CharacterWizard
   * @param {object} options
   */
  static async create (options = {}) {
    // Attempt to fix bad setting
    if (game.settings.get(FOLDER_ID, 'InvestigatorWizardChooseValues') !== true && game.settings.get(FOLDER_ID, 'InvestigatorWizardChooseValues') !== false) {
      await game.settings.set(FOLDER_ID, 'InvestigatorWizardChooseValues', game.settings.get(FOLDER_ID, 'InvestigatorWizardChooseValues')[0] ?? false)
    }
    // Try and pre-request as many CoCIDs due to the way they have to be loaded
    options = foundry.utils.mergeObject({
      step: 0,
      defaultSetup: game.settings.get(FOLDER_ID, 'InvestigatorWizardSetup'),
      defaultQuantity: game.settings.get(FOLDER_ID, 'InvestigatorWizardQuantity'),
      defaultOwnership: game.settings.get(FOLDER_ID, 'InvestigatorWizardOwnership'),
      defaultEra: game.settings.get(FOLDER_ID, 'worldEra'),
      rerollsEnabled: game.settings.get(FOLDER_ID, 'InvestigatorWizardRerolls'),
      enforcePointBuy: game.settings.get(FOLDER_ID, 'InvestigatorWizardPointBuy'),
      quickFireValues: game.settings.get(FOLDER_ID, 'InvestigatorWizardQuickFire'),
      chooseRolledValues: game.settings.get(FOLDER_ID, 'InvestigatorWizardChooseValues'),
      placeable: foundry.utils.duplicate(game.settings.get(FOLDER_ID, 'InvestigatorWizardQuickFire')),
      cacheCoCID: CoC7InvestigatorWizard.loadCacheItemByCoCID(),
      cacheBackstories: game.CoC7.cocid.fromCoCIDRegexBest({ cocidRegExp: /^rt\.\.backstory-/, type: 'rt' }),
      cacheItems: {},
      setup: game.settings.get(FOLDER_ID, 'InvestigatorWizardSetup'),
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
      parsedValues: {},
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
      own: {},
      avatar: 'icons/svg/mystery-man.svg',
      token: 'icons/svg/mystery-man.svg'
    }, options)
    new CoC7InvestigatorWizard({}, {}, options).render({ force: true })
  }
}
