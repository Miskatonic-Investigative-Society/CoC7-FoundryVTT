/* // FoundryVTT V10 */
// /* global ChatMessage, game, Hooks, Roll, ui */

// /**
//  *CallofCthulhu(7thEd.) Define your own commands
//  *Here, we receive the chat Messages and determine each command.
//  *[/CC]Define a command to judge a normal dice.
//  *[/CBR] Command to define the decision on combination rolls.
//  */
//  export function listen () {
//   Hooks.on('chatMessage', (html, content) => {
//     // I'm currently using it for testing bonus dice.
//     if (content.match(/^\/(cbr|cc)/i)) {
//       // Extracting numbers from combination rolls
//       const commands = content.match(/(\d+)/g)
//       if (commands) {
//         new Roll('1d100').roll({ async: true }).then(r => {
//           const s = r.result
//           const res = commands
//             .map(m => {
//               let res = ''
//               if (s <= 1) res = game.i18n.localize('CoC7.CriticalSuccess')
//               else if (s >= 100) res = game.i18n.localize('CoC7.Fumble')
//               else if (s <= m / 5) {
//                 res = game.i18n.localize('CoC7.ExtremeSuccess')
//               } else if (s <= m / 2) {
//                 res = game.i18n.localize('CoC7.HardSuccess')
//               } else if (s <= m) res = game.i18n.localize('CoC7.RegularSuccess')
//               else if (s >= 96) {
//                 if (m < 50) res = game.i18n.localize('CoC7.Fumble')
//                 else res = game.i18n.localize('CoC7.Failure')
//               } else res = game.i18n.localize('CoC7.Failure')
//               // Record the first results.
//               res += ' ' + game.i18n.localize('CoC7.Value') + ' ' + m
//               return res
//             })
//             .join(' / ')
//           r.toMessage({
//             speaker: ChatMessage.getSpeaker(),
//             flavor: res
//           })
//         })
//       } else {
//         ui.notifications.error('Incorrect usage of command')
//       }
//       // return to avoid errors in the command.
//       return false
//     }
//   })
// }
