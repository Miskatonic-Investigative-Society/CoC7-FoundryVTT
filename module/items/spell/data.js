/* global ChatMessage, game, Roll, renderTemplate, ui */

import { CoC7Utilities } from '../../utilities.js'
import { CoC7Item } from '../item.js'
import { SanCheckCard } from '../../chat/cards/san-check.js'

export class CoC7Spell extends CoC7Item {
  constructor (data, context) {
    if (typeof data.img === 'undefined') {
      data.img = 'systems/CoC7/assets/icons/pentagram-rose.svg'
    }
    super(data, context)
  }

  async cast () {
    if (!this.isOwned) {
      /** This is not owned by any Actor */
      return ui.notifications.error(game.i18n.localize('CoC7.NotOwned'))
    }
    const costs = this.data.data.costs
    const losses = []
    for (const [key, value] of Object.entries(costs)) {
      if (!value || Number(value) === 0) continue
      losses.push(await this.resolveLosses(key, value))
    }
    const template = 'systems/CoC7/templates/items/spell/chat.html'
    const description = this.data.data.description.value
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
    const actorData = this.actor.data.data
    switch (characteristic) {
      case 'hitPoints':
        characteristicName = game.i18n.localize('CoC7.HitPoints')
        this.actor.dealDamage(loss)
        break
      case 'sanity':
        characteristicName = game.i18n.localize('CoC7.SanityPoints')
        this.grantSanityLoss(loss)
        break
      case 'magicPoints':
        characteristicName = game.i18n.localize('CoC7.MagicPoints')
        this.actor.update({
          'data.attribs.mp.value': actorData.attribs.mp.value - loss
        })
        break
      case 'power':
        characteristicName = game.i18n.localize('CHARAC.Power')
        this.actor.update({
          'data.characteristics.pow.value':
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
}
