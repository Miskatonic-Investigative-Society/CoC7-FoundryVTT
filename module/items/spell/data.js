/* global ChatMessage, Dialog, foundry, game, Roll, renderTemplate, ui */
import { CoC7Utilities } from '../../utilities.js'
import { CoC7Item } from '../item.js'
import { SanCheckCard } from '../../chat/cards/san-check.js'

export class CoC7Spell extends CoC7Item {
  constructor (data, context) {
    if (typeof data.img === 'undefined') {
      data.img = 'systems/CoC7/assets/icons/pentagram-rose.svg'
    }
    super(data, context)
    this.context = context
  }

  async cast () {
    if (!this.isOwned) {
      /** This is not owned by any Actor */
      return ui.notifications.error(game.i18n.localize('CoC7.NotOwned'))
    }
    const costs = foundry.utils.duplicate(this.system.costs)
    const losses = []
    let convertSurplusIntoHitPoints
    costs.magicPoints = CoC7Utilities.isFormula(costs.magicPoints)
      ? (await new Roll(costs.magicPoints).roll({ async: true })).total
      : parseInt(costs.magicPoints)
    if (
      costs.magicPoints &&
      costs.magicPoints > this.actor.system.attribs.mp.value
    ) {
      convertSurplusIntoHitPoints = await new Promise(resolve => {
        const convertedHitPoints =
          costs.magicPoints - this.actor.system.attribs.mp.value
        const convertedMagicPoints = costs.magicPoints - convertedHitPoints
        const data = {
          title: ' ',
          content: game.i18n.format('CoC7.NotEnoughMagicPoints', {
            actorMagicPoints: this.actor.system.attribs.mp.value,
            convertedHitPoints,
            convertedMagicPoints,
            originalMagicPoints: costs.magicPoints,
            spell: this.name
          }),
          buttons: {
            cancel: {
              icon: '<i class="fas fa-times"></i>',
              label: game.i18n.localize('CoC7.Cancel'),
              callback: () => {
                return resolve(false)
              }
            },
            proceed: {
              icon: '<i class="fas fa-check"></i>',
              label: game.i18n.localize('CoC7.Proceed'),
              callback: () => {
                costs.hitPoints = convertedHitPoints
                costs.magicPoints = convertedMagicPoints
                return resolve(true)
              }
            }
          },
          default: 'cancel',
          classes: ['coc7', 'dialog']
        }
        new Dialog(data).render(true)
      })
      if (!convertSurplusIntoHitPoints) return
    }
    for (const [key, value] of Object.entries(costs)) {
      if (!value || Number(value) === 0) continue
      losses.push(await this.resolveLosses(key, value))
    }
    const template = 'systems/CoC7/templates/items/spell/chat.html'
    const description = this.system.description.value
    const html = await renderTemplate(template, { description, losses })
    return await ChatMessage.create({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: this.name,
      content: html
    })
  }

  async resolveLosses (characteristic, value) {
    let characteristicName
    let loss
    if (CoC7Utilities.isFormula(value)) {
      loss = (await new Roll(value).roll({ async: true })).total
    } else {
      loss = parseInt(value)
    }
    const actorData = this.actor.system
    switch (characteristic) {
      case 'hitPoints':
        characteristicName = game.i18n.localize('CoC7.HitPoints')
        this.actor.dealDamage(loss, { ignoreArmor: true })
        break
      case 'sanity':
        characteristicName = game.i18n.localize('CoC7.SanityPoints')
        this.grantSanityLoss(loss)
        break
      case 'magicPoints':
        characteristicName = game.i18n.localize('CoC7.MagicPoints')
        this.actor.setMp(actorData.attribs.mp.value - loss)
        break
      case 'power':
        characteristicName = game.i18n.localize('CHARAC.Power')
        this.actor.update({
          'system.characteristics.pow.value':
            actorData.characteristics.pow.value - loss
        })
    }
    return { characteristicName, loss }
  }

  /** Bypass the Sanity check and just roll the damage */
  async grantSanityLoss (value) {
    const template = SanCheckCard.template
    let html = await renderTemplate(template, {})
    const message = await ChatMessage.create({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: game.i18n.format('CoC7.CastingSpell', {
        spell: this.name
      }),
      content: html
    })
    const card = await message.getHTML()
    if (typeof card.length !== 'undefined' && card.length === 1) {
      const sanityLoss = value
      html = card.find('.chat-card')[0]
      html.dataset.object = escape(
        JSON.stringify({
          actorKey: this.actor.id,
          fastForward: false,
          sanData: {
            sanMin: sanityLoss,
            sanMax: sanityLoss
          }
        })
      )
      const sanityCheck = SanCheckCard.getFromCard(html)
      await sanityCheck.bypassRollSan()
      await sanityCheck.rollSanLoss()
      sanityCheck.updateChatCard()
    }
  }

  async update (data, context) {
    if (
      typeof this.context.parent !== 'undefined' &&
      typeof this.context.bookId !== 'undefined'
    ) {
      let item
      let book
      // let spellData
      if (this.context.parent === null) {
        item = game.items.get(this.context.bookId)
        book = item.toObject()
      } else {
        book = this.context.parent.items.get(this.context.bookId).toObject()
      }
      for (let i = 0, im = book.system.spells.length; i < im; i++) {
        if (book.system.spells[i]._id === this.id) {
          book.system.spells[i] = foundry.utils.mergeObject(book.system.spells[i], data)
          // spellData = book.system.spells[i]
        }
      }
      if (this.context.parent === null) {
        await item.update({
          'system.spells': book.system.spells
        })
        this.sheet.object = new CoC7Spell(
          book.system.spells.find(spell => spell._id === this.id),
          this.context
        )
      } else {
        await this.context.parent.updateEmbeddedDocuments('Item', [book])
        this.sheet.object = new CoC7Spell(
          book.system.spells.find(spell => spell._id === this.id),
          this.context
        )
      }
      this.sheet.render(true)
    } else {
      await super.update(data, context)
    }
  }
}
