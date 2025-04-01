/* // FoundryVTT V10 */
// /* global ChatMessage, foundry, game, renderTemplate, Roll, ui */

// // import { chatHelper } from './helper.js';
// import { CoC7Dice } from '../dice.js'
// import { ChatCardActor } from './card-actor.js'
// import { CoC7Utilities } from '../utilities.js'

// export class CoC7DamageRoll extends ChatCardActor {
//   constructor (itemId, actorKey, options) {
//     // itemId, actorKey, targetKey = null, critical = false, ignoreArmor = false, fastForward = false
//     super(actorKey, options.fastForward)
//     this.itemId = itemId
//     this.actorKey = actorKey
//     this.targetKey = options.targetKey
//     this.critical = options.critical
//     this.fastForward = options.fastForward
//     this.ignoreArmor = options.ignoreArmor
//   }

//   /**
//    *
//    * Roll the damage applying the formula provided.
//    * If there's a target Card will propose to apply the damage to it
//    *
//    * @param {String} range
//    */
//   async rollDamage (range = 'normal') {
//     this.rollString = this.weapon.system.range[range].damage

//     if (this.weapon.system.properties.addb) {
//       this.rollString = this.rollString + '+' + this.actor.db
//     }
//     if (this.weapon.system.properties.ahdb) {
//       this.rollString = this.rollString + CoC7Utilities.halfDB(this.actor.db)
//     }

//     this.maxDamage = new Roll(this.rollString)[(!foundry.utils.isNewerVersion(game.version, '12') ? 'evaluate' : 'evaluateSync')/* // FoundryVTT v11 */]({ maximize: true })
//     /******************/
//     this.roll = null
//     if (this.critical) {
//       if (this.weapon.impale) {
//         this.rollString = this.weapon.system.range[range].damage + '+' + this.maxDamage
//         this.roll = new Roll(this.rollString)
//         await this.roll.roll({ async: true })
//         this.result = Math.floor(this.roll.total)
//       } else {
//         this.roll = new Roll(`${this.maxDamage}`)
//         await this.roll.roll({ async: true })
//         this.result = this.maxDamage
//         this.resultString = `Max(${this.rollString})`
//       }
//     } else {
//       this.roll = new Roll(this.rollString)
//       await this.roll.roll({ async: true })
//       CoC7Dice.showRollDice3d(this.roll)
//       this.result = Math.floor(this.roll.total)
//     }

//     this.roll._dice = this.roll.dice

//     const html = await renderTemplate(
//       'systems/CoC7/templates/chat/combat/damage-result.html',
//       this
//     )

//     // TODO : replace the card if possible (can the player mod the message ???)
//     if (this.messageId) {
//       const message = game.messages.get(this.messageId)
//       message.update({ content: html }).then(msg => {
//         ui.chat.updateMessage(msg, false)
//       })
//     } else {
//       const speakerData = {}
//       if (this.token) speakerData.token = this.token
//       else speakerData.actor = this.actor
//       const speaker = ChatMessage.getSpeaker(speakerData)
//       if (this.actor.isToken) speaker.alias = this.actor.token.name

//       const user = this.actor.user ? this.actor.user : game.user

//       const chatData = {
//         user: user.id,
//         speaker,
//         content: html
//       }

//       const rollMode = game.settings.get('core', 'rollMode')
//       if (['gmroll', 'blindroll'].includes(rollMode)) {
//         chatData.whisper = ChatMessage.getWhisperRecipients('GM')
//       }
//       // if ( rollMode === 'blindroll' ) chatData['blind'] = true;
//       chatData.blind = false

//       await ChatMessage.create(chatData)
//     }
//   }
// }
