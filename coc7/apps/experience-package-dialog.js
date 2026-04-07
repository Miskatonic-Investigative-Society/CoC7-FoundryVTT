/* global DragDrop foundry fromUuid game Roll */
import { FOLDER_ID } from '../constants.js'

export default class CoC7ExperiencePackageDialog extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  /**
   * @inheritdoc
   */
  constructor (...args) {
    const coc7Config = args.pop()
    super(...args)
    this.coc7Config = coc7Config
  }

  static DEFAULT_OPTIONS = {
    tag: 'form',
    classes: ['coc7', 'dialog'],
    window: {
      title: 'CoC7.ExperiencePackageDialogTitle',
      contentClasses: [
        'standard-form'
      ]
    },
    form: {
      closeOnSubmit: false,
      handler: CoC7ExperiencePackageDialog.#onSubmit
    },
    position: {
      width: 500
    }
  }

  static PARTS = {
    form: {
      template: 'systems/' + FOLDER_ID + '/templates/apps/experience-package-dialog.hbs',
      scrollable: ['']
    },
    footer: {
      template: 'templates/generic/form-footer.hbs'
    }
  }

  /**
   * @inheritdoc
   * @param {ApplicationRenderContext} context
   * @param {RenderOptions} options
   * @returns {Promise<void>}
   */
  async _onRender (context, options) {
    await super._onRender(context, options)

    /* // FoundryVTT V12 */
    new (foundry.applications.ux?.DragDrop ?? DragDrop)({
      dropSelector: '.drop-item',
      permissions: {
        drop: game.user.isGM
      },
      callbacks: {
        drop: this._onItemDrop.bind(this)
      }
    }).bind(this.element)

    this.element.querySelectorAll('select').forEach((element) => element.addEventListener('change', this._onChangeBackstory.bind(this)))
    this.element.querySelectorAll('textarea').forEach((element) => element.addEventListener('keyup', this._onChangeBackstoryText.bind(this)))
    this.element.querySelectorAll('.backstoryBlock input[type=text]').forEach((element) => element.addEventListener('keyup', this._onChangeBackstoryInput.bind(this)))
    this.element.querySelectorAll('.backstoryBlock input[type=number]').forEach((element) => element.addEventListener('keyup', this._onChangeBackstoryInput.bind(this)))
    this.element.querySelectorAll('.item-control').forEach((element) => element.addEventListener('click', async (event) => {
      switch (event.currentTarget.dataset.action) {
        case 'item-delete':
          {
            const tag = event.currentTarget.closest('.item')
            const itemId = tag.dataset.itemId
            switch (tag.dataset.type) {
              case 'spell':
                {
                  const index = this.coc7Config.spells.findIndex(doc => doc._id === itemId)
                  if (index > -1) {
                    this.coc7Config.spells.splice(index, 1)
                    this.render({ force: true })
                  }
                }
                break
              case 'status':
                {
                  const index = this.coc7Config.backstory.findIndex(doc => doc.type === 'CoC7.PromptAddStatus' && doc.value._id === itemId)
                  if (index > -1) {
                    this.coc7Config.backstory[index].value = false
                    this.render({ force: true })
                  }
                }
                break
            }
          }
          break
        case 'toggle-switch':
          {
            const block = event.target.closest('.backstoryBlock')
            if (block) {
              const index = block.dataset.index
              if (index && this.coc7Config.backstory[index].type === 'CoC7.AddSanityLossEncounter') {
                this.coc7Config.backstory[index].value.apply = !this.coc7Config.backstory[index].value.apply
                this.render({ force: true })
              }
            }
          }
          break
      }
    }))
  }

  /**
   * Keep config object up to date
   * @param {Event} event
   */
  async _onChangeBackstoryText (event) {
    const index = event.target.closest('.backstoryBlock').dataset.index
    if (index && this.coc7Config.backstory[index].type === 'CoC7.PromptAddInjuryScar') {
      this.coc7Config.backstory[index].value = event.target.value
    }
  }

  /**
   * Keep config object up to date
   * @param {Event} event
   */
  async _onChangeBackstoryInput (event) {
    const index = event.target.closest('.backstoryBlock').dataset.index
    const key = event.target.dataset.name
    if (index && this.coc7Config.backstory[index].type === 'CoC7.AddSanityLossEncounter') {
      this.coc7Config.backstory[index].value[key] = event.target.value
    }
  }

  /**
   * Drop
   * @param {ClickEvent} event
   */
  async _onItemDrop (event) {
    const dataString = event.dataTransfer.getData('text/plain')
    if (dataString === '') {
      return
    }
    const data = JSON.parse(dataString)
    if (data.type === 'Item' && typeof data.uuid === 'string') {
      const doc = await fromUuid(data.uuid)
      if (doc.type === 'spell' && this.coc7Config.addSpells) {
        if (!this.coc7Config.spells.find(d => d._id === doc._id)) {
          this.coc7Config.spells.push(doc)
          this.render({ force: true })
        }
      } else if (doc.type === 'status') {
        const block = event.target.closest('.backstoryBlock')
        if (block) {
          const index = block.dataset.index
          if (index && this.coc7Config.backstory[index].type === 'CoC7.PromptAddStatus') {
            if (!this.coc7Config.backstory.find(d => d.value._id === doc._id)) {
              this.coc7Config.backstory[index].value = doc
              this.render({ force: true })
            }
          }
        }
      }
    }
  }

  /**
   * Configure Backstory when select changed
   * @param {Event} event
   */
  async _onChangeBackstory (event) {
    const index = event.currentTarget.dataset.backstoryIndex
    if (typeof this.coc7Config.backstory[index] !== 'undefined') {
      this.coc7Config.backstory[index].type = event.currentTarget.value
      switch (this.coc7Config.backstory[index].type) {
        case '':
        case 'CoC7.PromptAddStatus':
          this.coc7Config.backstory[index].value = false
          break
        case 'CoC7.PromptAddInjuryScar':
          this.coc7Config.backstory[index].value = ''
          break
        case 'CoC7.AddSanityLossEncounter':
          this.coc7Config.backstory[index].value = {
            reason: '',
            points: '',
            apply: true
          }
      }
      this.render({ force: true })
    }
  }

  /**
   * Create popup
   * @param {object} system Item experiencePackage system
   * @returns {object}
   */
  static async create (system) {
    const backstory = []
    for (let count = 0; count < system.backgroundQty; count++) {
      backstory.push({
        type: '',
        value: false
      })
    }
    const backstoryOptions = {
      'CoC7.PromptAddInjuryScar': 'CoC7.PromptAddInjuryScar',
      'CoC7.PromptAddStatus': 'CoC7.PromptAddStatus',
      'CoC7.AddSanityLossEncounter': 'CoC7.AddSanityLossEncounter'
    }

    return await new Promise(resolve => {
      new CoC7ExperiencePackageDialog({}, {}, {
        addSpells: system.addSpells,
        backstory,
        backstoryOptions,
        cthulhuGain: system.cthulhuGain,
        immunity: system.immunity,
        isCthulhuGain: system.properties.cthulhuGain,
        isSanityLoss: system.properties.sanityLoss,
        isSanitySame: system.properties.sanitySame,
        resolve,
        rolled: false,
        sanityLoss: system.sanityLoss,
        spells: []
      }).render({ force: true })
    })
  }

  /**
   * Submit the configuration form.
   * @param {SubmitEvent} event
   * @param {HTMLFormElement} form
   * @param {FormDataExtended} formData
   * @returns {Promise<void>}
   */
  static async #onSubmit (event, form, formData) {
    if (event.submitter.dataset.action === 'roll') {
      if (this.coc7Config.rolled === false) {
        let formula = false
        if (this.coc7Config.isCthulhuGain) {
          formula = this.coc7Config.cthulhuGain
        } else if (this.coc7Config.isSanityLoss) {
          formula = this.coc7Config.sanityLoss
        }
        if (formula !== false) {
          this.coc7Config.rolled = (await new Roll(formula).evaluate()).total
          this.render({ force: true })
        }
        return
      }
    }

    const output = {
      'i.skill.cthulhu-mythos': (this.coc7Config.rolled && this.coc7Config.isCthulhuGain ? this.coc7Config.rolled : 0),
      SAN: (this.coc7Config.rolled && (this.coc7Config.isSanitySame || this.coc7Config.isSanityLoss) ? this.coc7Config.rolled : 0),
      items: [],
      backstory: [],
      encounters: []
    }
    for (const doc of this.coc7Config.spells) {
      output.items.push(doc)
    }
    for (const name of this.coc7Config.immunity) {
      output.encounters.push({
        type: name,
        totalLoss: 0,
        immunity: true
      })
    }
    for (const type of this.coc7Config.backstory) {
      switch (type.type) {
        case 'CoC7.PromptAddInjuryScar':
          {
            const element = document.createElement('p')
            const value = document.createTextNode(type.value)
            element.appendChild(value)
            output.backstory.push(element.outerHTML)
          }
          break
        case 'CoC7.PromptAddStatus':
          if (type.value) {
            output.items.push(type.value)
          }
          break
        case 'CoC7.AddSanityLossEncounter':
          output.encounters.push({
            type: type.value.reason,
            totalLoss: type.value.points,
            immunity: false
          })
          if (type.value.apply) {
            output.SAN = output.SAN + parseInt(type.value.points, 10)
          }
          break
      }
    }
    this.coc7Config.resolve(output)
    this.close()
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
      case 'form':
        context.addSpells = this.coc7Config.addSpells
        context.backstory = this.coc7Config.backstory
        context.backstoryOptions = this.coc7Config.backstoryOptions
        context.cthulhuGain = this.coc7Config.cthulhuGain
        context.isCthulhuGain = this.coc7Config.isCthulhuGain
        context.isSanityLoss = this.coc7Config.isSanityLoss
        context.rolled = this.coc7Config.rolled
        context.sanityLoss = this.coc7Config.sanityLoss
        context.spells = this.coc7Config.spells
        break
      case 'footer':
        context.buttons = [
          {
            type: 'submit',
            action: 'close',
            label: 'Cancel',
            icon: 'fa-solid fa-ban'
          },
          {
            type: 'submit',
            action: 'validate',
            label: 'CoC7.Validate',
            icon: 'fa-solid fa-check'
          }
        ]
        break
    }

    return context
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
}
