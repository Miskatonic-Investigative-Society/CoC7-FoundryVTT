/* // FoundryVTT V10 */
// /* global $, Dialog, game, renderTemplate */
// export class CoC7WelcomeMessage extends Dialog {
//   activateListeners (html) {
//     super.activateListeners(html)
//     html.find('#artwork-style').on('change', event => {
//       const style = $(event.currentTarget).val()
//       CoC7WelcomeMessage.changeArtworkStyle(style)
//     })
//   }

//   static async changeArtworkStyle (style) {
//     await game.settings.set('CoC7', 'overrideSheetArtwork', true)
//     const artworkOptions = CoC7WelcomeMessage.getStyles(style)
//     await game.settings.set(
//       'CoC7',
//       'artWorkSheetBackground',
//       artworkOptions.mainSheetBackground
//     )
//     await game.settings.set(
//       'CoC7',
//       'artWorkOtherSheetBackground',
//       artworkOptions.additionalSheetBackground
//     )
//     await game.settings.set(
//       'CoC7',
//       'artworkSheetImage',
//       artworkOptions.mainSheetImage
//     )
//     await game.settings.set(
//       'CoC7',
//       'artworkFrontColor',
//       artworkOptions.mainColor
//     )
//     await game.settings.set(
//       'CoC7',
//       'artworkBackgroundColor',
//       artworkOptions.secondaryColor
//     )
//     await game.settings.set(
//       'CoC7',
//       'artworkInteractiveColor',
//       artworkOptions.interactiveColor
//     )
//     await game.actors.getName('Harold Philips Lovecraft').sheet.render(true)
//   }

//   static getStyles (style) {
//     switch (style) {
//       case '1920':
//         return {
//           mainColor: 'rgba(43,55,83,1)',
//           secondaryColor: 'rgba(103,11,11,1)',
//           interactiveColor: 'rgba(103,11,11,1)',
//           mainSheetBackground:
//             "url('./assets/images/background.webp') 4 repeat",
//           mainSheetImage: "url('./assets/images/tentacles.webp')",
//           additionalSheetBackground: "url('./assets/images/background.webp')"
//         }
//       case 'nyarlathotep':
//         return {
//           mainColor: 'rgba(229, 210, 128, 1)',
//           secondaryColor: 'rgba(255, 255, 255, 1)',
//           interactiveColor: 'rgba(229, 210, 128, 1)',
//           mainSheetBackground:
//             "url('./assets/images/nyarlathotep.png') 4 repeat",
//           mainSheetImage: '',
//           additionalSheetBackground:
//             "url('./assets/images/nyarlathotep.png') 4 repeat"
//         }
//     }
//   }

//   static disableWelcomeMessage () {
//     game.settings.set('CoC7', 'showWelcomeMessage', false)
//   }

//   static async create () {
//     const template = 'systems/CoC7/templates/apps/welcome-message.html'
//     const html = await renderTemplate(template)
//     console.log(html)
//     return new Promise(resolve => {
//       const dialog = new CoC7WelcomeMessage({
//         title: 'Welcome Message',
//         classes: ['coc7', 'app', 'dialog'],
//         content: html,
//         buttons: {
//           disable: {
//             label: 'Disable Welcome Message',
//             callback: CoC7WelcomeMessage.disableWelcomeMessage
//           },
//           continue: {
//             label: 'Continue without Disabling'
//           }
//         }
//       })
//       dialog.render(true)
//     })
//   }
// }
