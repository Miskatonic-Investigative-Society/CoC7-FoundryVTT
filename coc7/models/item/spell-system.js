/* global ChatMessage CONST foundry game Item renderTemplate ui */
import { FOLDER_ID } from '../../constants.js'
import CoC7ModelsItemGlobalSystem from './global-system.js'

export default class CoC7ModelsItemSpellSystem extends CoC7ModelsItemGlobalSystem {
  /**
   * Default img
   * @returns {string}
   */
  static get defaultImg () {
    return 'systems/' + FOLDER_ID + '/assets/icons/pentagram-rose.svg'
  }

  /**
   * Create Schema
   * @returns {DataSchema}
   */
  static defineSchema () {
    const fields = foundry.data.fields
    return {
      /* // FoundryVTT V13 - not required
      alternativeNames: [],
      effects: [],
      learned: false,
      */
      castingTime: new fields.StringField({ initial: '' }),
      costs: new fields.SchemaField({
        hitPoints: new fields.StringField({ initial: '0' }),
        magicPoints: new fields.StringField({ initial: '0' }),
        others: new fields.StringField({ initial: '' }),
        sanity: new fields.StringField({ initial: '0' }),
        power: new fields.StringField({ initial: '0' })
      }),
      description: new fields.SchemaField({
        /* // FoundryVTT V13 - not required
        chat: '',
        */
        value: new fields.HTMLField({ initial: '' }),
        keeper: new fields.HTMLField({ initial: '' }),
        alternativeNames: new fields.HTMLField({ initial: '' })
      }),
      source: new fields.StringField({ initial: '' }),
      type: new fields.SchemaField({
        bind: new fields.BooleanField({ label: 'CoC7.BindSpell', initial: false }),
        call: new fields.BooleanField({ label: 'CoC7.CallSpell', initial: false }),
        combat: new fields.BooleanField({ label: 'CoC7.CombatSpell', initial: false }),
        contact: new fields.BooleanField({ label: 'CoC7.ContactSpell', initial: false }),
        dismiss: new fields.BooleanField({ label: 'CoC7.DismissSpell', initial: false }),
        enchantment: new fields.BooleanField({ label: 'CoC7.EnchantmentSpell', initial: false }),
        gate: new fields.BooleanField({ label: 'CoC7.GateSpell', initial: false }),
        summon: new fields.BooleanField({ label: 'CoC7.SummonSpell', initial: false })
      })
    }
  }

  /**
   * Create empty object for this item type
   * @param {object} options
   * @returns {object}
   */
  static emptyObject (options) {
    const object = foundry.utils.mergeObject({
      name: game.i18n.localize('CoC7.NewSpellName'),
      type: 'spell',
      system: new CoC7ModelsItemSpellSystem().toObject()
    }, options)
    return object
  }

  /**
   * Cast a spell
   * @param {boolean} privateRoll
   */
  async cast (privateRoll) {
    let actor
    if (this.parent.parent instanceof Item) {
      actor = this.parent.parent.actor
    } else if (this.parent.actor?.isOwner) {
      actor = this.parent.actor
    } else {
      /** This is not owned by any Actor */
      ui.notifications.error('CoC7.NotOwned', { localize: true })
      return
    }
    const costs = foundry.utils.duplicate(this.costs)
    const losses = []
    // TODO: Temporary disable while automation is improved
    // let convertSurplusIntoHitPoints
    // costs.magicPoints = !new Roll(costs.magicPoints.toString()).isDeterministic
    //   ? (await new Roll(costs.magicPoints).roll({ async: true })).total
    //   : parseInt(costs.magicPoints)
    // if (
    //   costs.magicPoints &&
    //   costs.magicPoints > this.actor.system.attribs.mp.value
    // ) {
    //   convertSurplusIntoHitPoints = await new Promise(resolve => {
    //     const convertedHitPoints =
    //       costs.magicPoints - this.actor.system.attribs.mp.value
    //     const convertedMagicPoints = costs.magicPoints - convertedHitPoints
    //     const data = {
    //       title: ' ',
    //       content: game.i18n.format('CoC7.NotEnoughMagicPoints', {
    //         actorMagicPoints: this.actor.system.attribs.mp.value,
    //         convertedHitPoints,
    //         convertedMagicPoints,
    //         originalMagicPoints: costs.magicPoints,
    //         spell: this.name
    //       }),
    //       buttons: {
    //         cancel: {
    //           icon: '<i class="fas fa-times"></i>',
    //           label: game.i18n.localize('CoC7.Cancel'),
    //           callback: () => {
    //             return resolve(false)
    //           }
    //         },
    //         proceed: {
    //           icon: '<i class="fas fa-check"></i>',
    //           label: game.i18n.localize('CoC7.Proceed'),
    //           callback: () => {
    //             costs.hitPoints = convertedHitPoints
    //             costs.magicPoints = convertedMagicPoints
    //             return resolve(true)
    //           }
    //         }
    //       },
    //       default: 'cancel',
    //       classes: ['coc7', 'dialog']
    //     }
    //     new Dialog(data).render(true)
    //   })
    //   if (!convertSurplusIntoHitPoints) return
    // }
    for (const [key, loss] of Object.entries(costs)) {
      if (!loss || Number(loss) === 0) continue
      let characteristicName = game.i18n.localize('CoC7.OtherCosts')
      switch (key) {
        case 'hitPoints':
          characteristicName = game.i18n.localize('CoC7.HitPoints')
          break
        case 'sanity':
          characteristicName = game.i18n.localize('CoC7.SanityPoints')
          break
        case 'magicPoints':
          characteristicName = game.i18n.localize('CoC7.MagicPoints')
          break
        case 'power':
          characteristicName = game.i18n.localize('CHARAC.Power')
      }
      losses.push({ characteristicName, loss })
    }
    const template = 'systems/' + FOLDER_ID + '/templates/chat/spell.hbs'
    const description = this.description.value
    /* // FoundryVTT V12 */
    const html = await (foundry.applications.handlebars?.renderTemplate ?? renderTemplate)(template, { description, losses })
    let chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: this.parent.name,
      content: html
    }
    if (privateRoll) {
      chatData = ChatMessage.applyRollMode(chatData, CONST.DICE_ROLL_MODES.PRIVATE)
    }
    await ChatMessage.create(chatData)
  }

  /**
   * Migrate old style data to new
   * @param {object} source
   * @returns {object}
   */
  static migrateData (source) {
    // Moved cost.hp to costs.hitPoints
    if (typeof source.cost?.hp !== 'undefined' && typeof source.costs?.hitPoints === 'undefined') {
      foundry.utils.setProperty(source, 'costs.hitPoints', source.cost.hp)
    }
    // Moved cost.mp to costs.magicPoints
    if (typeof source.cost?.mp !== 'undefined' && typeof source.costs?.magicPoints === 'undefined') {
      foundry.utils.setProperty(source, 'costs.magicPoints', source.cost.mp)
    }
    // Moved cost.san to costs.sanity
    if (typeof source.cost?.san !== 'undefined' && typeof source.costs?.sanity === 'undefined') {
      foundry.utils.setProperty(source, 'costs.sanity', source.cost.san)
    }
    // Moved cost.pow to costs.power
    if (typeof source.cost?.pow !== 'undefined' && typeof source.costs?.power === 'undefined') {
      foundry.utils.setProperty(source, 'costs.power', source.cost.pow)
    }
    // Migrate description to object
    if (typeof source.description === 'string') {
      foundry.utils.setProperty(source, 'description.value', source.description)
    }
    return super.migrateData(source)
  }

  // TODO: XXXX Temporary disable while automation is improved
  // async resolveLosses (characteristic, value, priv) {
  //   let characteristicName
  //   let loss
  //   if (!new Roll(value.toString()).isDeterministic) {
  //     loss = (await new Roll(value).roll({ async: true })).total
  //   } else {
  //     loss = parseInt(value)
  //   }
  //   const actorData = this.actor.system
  //   switch (characteristic) {
  //     case 'hitPoints':
  //       characteristicName = game.i18n.localize('CoC7.HitPoints')
  //       this.actor.dealDamage(loss, { ignoreArmor: true })
  //       break
  //     case 'sanity':
  //       characteristicName = game.i18n.localize('CoC7.SanityPoints')
  //       loss = await this.grantSanityLoss(loss, priv)
  //       break
  //     case 'magicPoints':
  //       characteristicName = game.i18n.localize('CoC7.MagicPoints')
  //       this.actor.setMp(actorData.attribs.mp.value - loss)
  //       break
  //     case 'power':
  //       characteristicName = game.i18n.localize('CHARAC.Power')
  //       this.actor.update({
  //         'system.characteristics.pow.value':
  //           actorData.characteristics.pow.value - loss
  //       })
  //   }
  //   return { characteristicName, loss }
  // }

  // TODO: XXXX Temporary disable while automation is improved
  // /** Bypass the Sanity check and just roll the damage */
  // async grantSanityLoss (value, priv) {
  // import CoC7SanCheckCard from '../../chat/cards/san-check.js'
  //   const template = CoC7SanCheckCard.template
  //   let html = await renderTemplate(template, {})
  //   let chatData = {
  //     user: game.user.id,
  //     speaker: ChatMessage.getSpeaker({ actor: this.actor }),
  //     flavor: game.i18n.format('CoC7.CastingSpell', {
  //       spell: this.name
  //     }),
  //     content: html
  //   }
  //   if (priv) {
  //     chatData = ChatMessage.applyRollMode(chatData, CONST.DICE_ROLL_MODES.PRIVATE)
  //   }
  //   const message = await ChatMessage.create(chatData)
  //   const card = await message.getHTML()
  //   if (typeof card.length !== 'undefined' && card.length === 1) {
  //     const sanityLoss = value
  //     html = card.find('.chat-card')[0]
  //     html.dataset.object = escape(
  //       JSON.stringify({
  //         actorKey: this.actor.id,
  //         fastForward: false,
  //         sanData: {
  //           sanMin: sanityLoss,
  //           sanMax: sanityLoss
  //         }
  //       })
  //     )
  //     const sanityCheck = CoC7SanCheckCard.getFromCard(html)
  //     await sanityCheck.bypassRollSan()
  //     await sanityCheck.rollSanLoss()
  //     await sanityCheck.updateChatCard()
  //     return sanityCheck.sanLoss
  //   }
  // }
}
