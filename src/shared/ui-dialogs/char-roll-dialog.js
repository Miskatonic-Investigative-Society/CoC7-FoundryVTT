/* global Dialog, game, renderTemplate, Roll */
export class CharacRollDialog extends Dialog {
  constructor (data, options) {
    super(data, options)

    this.rolled = data.rolled || {}
  }

  activateListeners (html) {
    super.activateListeners(html)
    html.on('change', 'input', this._onChangeInput.bind(this))
    html.on('submit', 'form', this._onSubmit.bind(this))
    html.on(
      'click',
      '.roll-characteristic',
      this._onRollCharacteristic.bind(this)
    )
    html.on(
      'click',
      '.increase-characteristic',
      this._onIncreaseCharacteristic.bind(this)
    )
    html.on(
      'click',
      '.decrease-characteristic',
      this._onDecreaseCharacteristic.bind(this)
    )
    html.on(
      'click',
      '.reset-characteristic',
      this._onResetCharacteristic.bind(this)
    )
    html.on('click', 'button', this._onButton.bind(this))
  }

  async _onRollCharacteristic (event) {
    event.preventDefault()
    const li = event.currentTarget.closest('.item')
    const characKey = li.dataset.key
    await this.rollCharacteristic(characKey)
  }

  async _onIncreaseCharacteristic (event) {
    event.preventDefault()
    const li = event.currentTarget.closest('.item')
    const characKey = li.dataset.key
    this.increaseCharacteristic(characKey)
  }

  async _onDecreaseCharacteristic (event) {
    event.preventDefault()
    const li = event.currentTarget.closest('.item')
    const characKey = li.dataset.key
    this.decreaseCharacteristic(characKey)
  }

  async _onResetCharacteristic (event) {
    event.preventDefault()
    const li = event.currentTarget.closest('.item')
    const characKey = li.dataset.key
    this.resetCharacteristic(characKey)
  }

  async _onButton (event) {
    const action = event.currentTarget.dataset.action
    if (action === 'roll') {
      for (const char of [
        'str',
        'con',
        'siz',
        'dex',
        'app',
        'int',
        'pow',
        'edu',
        'luck'
      ]) {
        await this.rollCharacteristic(char)
      }
    }
    this.checkTotal()
    if (action === 'validate' && this.data.data.validate) {
      this.close()
    }
  }

  async rollCharacteristic (key) {
    const li = this._element[0].querySelector(`li.item[data-key=${key}]`)
    const input = li?.querySelector('input')
    const formula = this.data.data.characteristics.rolls[key]
    if (input && formula) {
      if (isNaN(Number(formula))) {
        const roll = new Roll(formula)
        await roll.evaluate({ async: true })
        roll.toMessage({
          flavor: game.i18n.format('CoC7.MessageRollingCharacteristic', {
            label: this.data.data.characteristics.list[key].label,
            formula
          })
        })
        input.value = roll.total
      } else input.value = Number(formula)
      this.data.data.characteristics.values[key] = Number(input.value)
      if (!this.rolled) this.rolled = {}
      this.rolled[key] = true
    }
    this.checkTotal()
  }

  async increaseCharacteristic (key) {
    const li = this._element[0].querySelector(`li.item[data-key=${key}]`)
    const input = li?.querySelector('input')
    if (input) {
      input.value = Number(input.value) + 1
      this.data.data.characteristics.values[key] = Number(input.value)
    }
    this.checkTotal()
  }

  async decreaseCharacteristic (key) {
    const li = this._element[0].querySelector(`li.item[data-key=${key}]`)
    const input = li?.querySelector('input')
    if (input && Number(input.value) > 0) {
      input.value = Number(input.value) - 1
      this.data.data.characteristics.values[key] = Number(input.value)
    }
    this.checkTotal()
  }

  async resetCharacteristic (key) {
    const li = this._element[0].querySelector(`li.item[data-key=${key}]`)
    const input = li?.querySelector('input')
    if (input) {
      input.value = null
      this.data.data.characteristics.values[key] = 0
    }
    this.checkTotal()
  }

  async _onChangeInput (event) {
    event.preventDefault()
    const input = event.currentTarget
    const value = Number(input.value)
    if (!isNaN(value)) {
      this.data.data.characteristics.values[input.name] = value
    }

    this.checkTotal()
  }

  checkTotal () {
    this.data.data.characteristics.points.total = 0
    for (const [key, value] of Object.entries(
      this.data.data.characteristics.values
    )) {
      if (key !== 'luck') {
        this.data.data.characteristics.points.total += value
      }
    }

    const validation = this._element[0].querySelector('.points')
    if (this.data.data.characteristics.points.enabled) {
      if (
        Number(this.data.data.characteristics.points.total) !==
        Number(this.data.data.characteristics.points.value)
      ) {
        validation.classList.add('warning')
        this.data.data.validate = false
      } else {
        validation.classList.remove('warning')
        this.data.data.validate = true
      }
      const value = validation.querySelector('.value')
      value.innerText = this.data.data.characteristics.points.value
    }

    const total = validation.querySelector('.total')
    total.innerText = this.data.data.characteristics.points.total

    if (this.data.data.characteristics.rolls.enabled) {
      this.data.data.validate = Object.values(this.data.data.characteristics.values).filter(val => isNaN(parseInt(val))).length === 0
    }
  }

  async _onSubmit (event) {
    event.preventDefault()
  }

  static async create (data) {
    const rolled = {}
    data.characteristics.points.total = 0
    for (const [key, value] of Object.entries(data.characteristics.values)) {
      if (key !== 'luck') {
        data.characteristics.points.total += value || 0
      }
      if (!isNaN(value) && value > 0) {
        rolled[key] = true
      }
    }

    if (data.characteristics.points.enabled) {
      if (
        Number(data.characteristics.points.total) !==
        Number(data.characteristics.points.value)
      ) {
        data.pointsWarning = true
      }
    }

    const html = await renderTemplate(
      'systems/CoC7/templates/apps/char-roll.html',
      data
    )
    return new Promise(resolve => {
      const dlg = new CharacRollDialog(
        {
          title: data.title,
          content: html,
          data,
          rolled,
          buttons: {},
          close: () => {
            if (data.validate) return resolve(true)
            else return resolve(false)
          }
        },
        { classes: ['coc7', 'dialog', 'char-select'] }
      )
      dlg.render(true)
    })
  }
}
