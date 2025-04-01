/* global $, FormApplication, foundry, game */
export class SkillSpecializationSelectDialog extends FormApplication {
  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['coc7', 'skill-name-dialog'],
      title: '',
      template: 'systems/CoC7/templates/apps/skill-specialization-select.hbs',
      width: 400,
      height: 'auto',
      closeOnSubmit: false
    })
  }

  get title () {
    return game.i18n.format('CoC7.SkillSpecSelectTitle', {
      specialization: this.object.specializationName
    })
  }

  activateListeners (html) {
    super.activateListeners(html)

    html.find('.submit-button').click(this._onClickSubmit.bind(this))
    html.find('[name=existing-skill]').change(this._onSelectChange.bind(this))
  }

  async _onSelectChange (event) {
    this.object.selected = event.currentTarget.value
    this.render(true)
  }

  async _onClickSubmit (event) {
    if (this.object.selected === '') {
      const obj = $(event.currentTarget).closest('form')
      this.object.name = (obj.find('input[name=new-skill-name]').val() ?? '')
      this.object.baseValue = (obj.find('input[name=base-value]').val() ?? '')
    }
    if (this.object.selected === '' && this.object.name === '') {
      return false
    }
    this.object.resolve({
      selected: this.object.selected,
      name: this.object.name,
      baseValue: this.object.baseValue
    })
    this.close()
  }

  async _updateObject (event, formData) {
  }

  static async create ({ skills = [], allowCustom = false, fixedBaseValue = false, specializationName = '', label = '', baseValue = null } = {}) {
    const select = []
    for (const skill of skills) {
      select.push({
        id: skill.id,
        name: skill.name,
        base: skill.system.base
      })
    }
    return await new Promise(resolve => {
      new SkillSpecializationSelectDialog({
        specializationName,
        allowCustom,
        fixedBaseValue,
        allowSelect: skills.length > 0,
        skills: select,
        selected: '',
        name: '',
        label,
        baseValue,
        resolve
      }, {}).render(true)
    })
  }
}
