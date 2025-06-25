/* global Dialog DragDrop fromUuid game renderTemplate Roll */
export class ExperiencePackageDialog extends Dialog {
  constructor (data, options) {
    super(data, options)
    this.templateData = options.templateData
  }

  activateListeners (html) {
    super.activateListeners(html)

    const itemDragDrop = new DragDrop({
      dropSelector: '.flexcol.coc7',
      permissions: { drop: game.user.isGM },
      callbacks: { drop: this._onDrop.bind(this) }
    })
    itemDragDrop.bind(html[0])

    html.find('.rollvalue').click(event => this._onRollValue(event))
    html.find('.item-delete').click(event => this._onDeleteItem(event))
    html.find('select').change(event => this._onChangeBackstory(event))
    html.find('textarea').each((offset, tag) => tag.addEventListener('keyup', event => this._onChangeBackstoryText(event)))
    html.find('input[type=checkbox]').click(event => this._onClickCheckbox(event))
    html.find('.backstoryBlock').find('input[type=text]').each((offset, tag) => tag.addEventListener('keyup', event => this._onChangeBackstoryInput(event)))
  }

  async _onChangeBackstoryText (event) {
    const index = event.target.closest('.backstoryBlock').dataset.index
    if (index && this.templateData.backstory[index].type === 'CoC7.PromptAddInjuryScar') {
      this.templateData.backstory[index].value = event.target.value
    }
  }

  async _onChangeBackstoryInput (event) {
    const index = event.target.closest('.backstoryBlock').dataset.index
    const key = event.target.dataset.name
    if (index && this.templateData.backstory[index].type === 'CoC7.AddSanityLossEncounter') {
      this.templateData.backstory[index].value[key] = event.target.value
    }
  }

  async _onDrop (event) {
    const dataString = event.dataTransfer.getData('text/plain')
    if (dataString === '') {
      return false
    }
    const data = JSON.parse(dataString)
    if (data.type === 'Item' && typeof data.uuid === 'string') {
      const doc = await fromUuid(data.uuid)
      if (doc.type === 'spell' && this.templateData.system.addSpells) {
        if (!this.templateData.spells.find(d => d._id === doc._id)) {
          this.templateData.spells.push(doc)
          this.refreshDialog()
        }
      } else if (doc.type === 'status') {
        const block = event.target.closest('.backstoryBlock')
        if (block) {
          const index = block.dataset.index
          const doc = await fromUuid(data.uuid)
          if (index && doc.type === 'status' && this.templateData.backstory[index].type === 'CoC7.PromptAddStatus') {
            if (!this.templateData.backstory.find(d => d.value._id === doc._id)) {
              this.templateData.backstory[index].value = doc
              this.refreshDialog()
            }
          }
        }
      }
    }
  }

  async _onClickCheckbox (event) {
    const block = event.target.closest('.backstoryBlock')
    if (block) {
      const index = block.dataset.index
      if (index && this.templateData.backstory[index].type === 'CoC7.AddSanityLossEncounter') {
        this.templateData.backstory[index].value.apply = !this.templateData.backstory[index].value.apply
      }
    }
  }

  async refreshDialog () {
    this.data.content = await renderTemplate('systems/CoC7/templates/apps/experience-package-dialog.hbs', this.templateData)
    this.render(true)
  }

  async _onRollValue (event) {
    event.preventDefault()
    if (this.templateData.rolled === false) {
      let formula = false
      if (this.templateData.system.properties.cthulhuGain) {
        formula = this.templateData.system.cthulhuGain
      } else if (this.templateData.system.properties.sanityLoss) {
        formula = this.templateData.system.sanityLoss
      }
      if (formula !== false) {
        this.templateData.rolled = (await new Roll(formula).evaluate()).total
        this.refreshDialog()
      }
    }
  }

  async _onChangeBackstory (event) {
    const index = event.currentTarget.dataset.backstoryIndex
    if (typeof this.templateData.backstory[index] !== 'undefined') {
      this.templateData.backstory[index].type = event.currentTarget.value
      switch (this.templateData.backstory[index].type) {
        case '':
        case 'CoC7.PromptAddStatus':
          this.templateData.backstory[index].value = false
          break
        case 'CoC7.PromptAddInjuryScar':
          this.templateData.backstory[index].value = ''
          break
        case 'CoC7.AddSanityLossEncounter':
          this.templateData.backstory[index].value = {
            reason: '',
            points: '',
            apply: true
          }
      }
      this.refreshDialog()
    }
  }

  async _onDeleteItem (event) {
    event.preventDefault()
    const tag = event.currentTarget.closest('.item')
    const itemId = tag.dataset.itemId
    switch (tag.dataset.type) {
      case 'spell':
        {
          const index = this.templateData.spells.findIndex(doc => doc._id === itemId)
          if (index > -1) {
            this.templateData.spells.splice(index, 1)
            this.refreshDialog()
          }
        }
        break
      case 'status':
        {
          const index = this.templateData.backstory.findIndex(doc => doc.type === 'CoC7.PromptAddStatus' && doc.value._id === itemId)
          if (index > -1) {
            this.templateData.backstory[index].value = false
            this.refreshDialog()
          }
        }
        break
    }
  }

  static async create (system) {
    const data = {
      backstory: [],
      backstoryOptions: {
        'CoC7.PromptAddInjuryScar': 'CoC7.PromptAddInjuryScar',
        'CoC7.PromptAddStatus': 'CoC7.PromptAddStatus',
        'CoC7.AddSanityLossEncounter': 'CoC7.AddSanityLossEncounter'
      },
      rolled: false,
      spells: [],
      system
    }

    for (let count = 0; count < system.backgroundQty; count++) {
      data.backstory.push({
        type: '',
        value: false
      })
    }

    const html = await renderTemplate('systems/CoC7/templates/apps/experience-package-dialog.hbs', data)
    return new Promise(resolve => {
      const dlg = new ExperiencePackageDialog(
        {
          title: game.i18n.localize('CoC7.ExperiencePackageDialogTitle'),
          content: html,
          buttons: {
            close: {
              icon: '<i class="fas fa-ban"></i>',
              label: game.i18n.localize('Cancel'),
              callback: () => {
                resolve(false)
              }
            },
            save: {
              icon: '<i class="fas fa-check"></i>',
              label: game.i18n.localize('CoC7.Validate'),
              callback: async () => {
                const output = {
                  'i.skill.cthulhu-mythos': (dlg.templateData.rolled && dlg.templateData.system.properties.cthulhuGain ? dlg.templateData.rolled : 0),
                  SAN: (dlg.templateData.rolled && (dlg.templateData.system.properties.sanitySame || dlg.templateData.system.properties.sanityLoss) ? dlg.templateData.rolled : 0),
                  items: [],
                  backstory: [],
                  encounters: []
                }
                for (const doc of dlg.templateData.spells) {
                  output.items.push(doc)
                }
                for (const name of dlg.templateData.system.immunity) {
                  output.encounters.push({
                    type: name,
                    totalLoss: 0,
                    immunity: true
                  })
                }
                for (const type of dlg.templateData.backstory) {
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
                      console.log('CoC7.AddSanityLossEncounter', type)
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
                resolve(output)
              }
            }
          },
          default: 'save'
        },
        {
          classes: ['coc7', 'dialog', 'char-select'],
          templateData: data
        }
      )
      dlg.render(true)
    })
  }
}
