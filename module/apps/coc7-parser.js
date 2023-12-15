/* global TextEditor */
import { CoC7Link } from './coc7-link.js'

export class CoC7Parser {
  static enrichHTML (content) {
    const html = document.createElement('div')
    html.innerHTML = String(content)

    let text = []

    text = TextEditor._getTextNodes(html)
    const rgx = new RegExp('@(coc7)\\.' + '(check|effect|item|sanloss)' + '\\[([^\\[\\]]*(?:\\[[^\\[\\]]*(?:\\[[^\\[\\]]*\\])*[^\\[\\]]*\\])*[^\\[\\]]*)\\]' + '(?:{([^}]+)})?', 'gi')
    TextEditor._replaceTextContent(text, rgx, CoC7Link._createLink)
    return html.innerHTML
  }

  static ParseSheetContent (app, html) {
    // Check in all editors content for a link.
    for (const element of html.find('div.editor-content > *, p, li')) {
      if (element.outerHTML.toLocaleLowerCase().includes('@coc7')) {
        element.outerHTML = CoC7Parser.enrichHTML(element.outerHTML)
      }
    }

    // Bind the click to execute the check.
    CoC7Link.bindEventsHandler(html)
  }

  /**
     * A hook event that fires for each ChatMessage which is rendered for addition to the ChatLog.
     * This hook allows for final customization of the message HTML before it is added to the log.
     * @function renderChatMessage
     * @memberof hookEvents
     * @param {ChatMessage} app   The ChatMessage document being rendered
     * @param {jQuery} html           The pending HTML as a jQuery object
     * @param {object} data           The input data provided for template rendering
     */
  static ParseMessage (app, html, data) {
    // @coc7.sanloss[sanMax:1D6,sanMin:1,sanReason:Ghouls,difficulty:++,modifier:-1]{Hard San Loss (-1) 1/1D6}
    // @coc7.check[type:charac,name:STR,difficulty:+,modifier:-1]{Hard STR check(-1)}
    // @coc7.check[type:attrib,name:lck,difficulty:+,modifier:-1]{Hard luck check(-1)}
    // @coc7.check[type:skill,name:anthropology,difficulty:+,modifier:-1]{Hard Anthropology check(-1)}
    // @coc7.check[type:skill,icon:fas fa-arrow-alt-circle-right,name:anthropology,difficulty:+,modifier:-1]{Hard Anthropology check(-1)}
    // @coc7.item[name:Shotgun,icon:fas fa-bullseye,difficulty:+,modifier:-1]{Use shotgun}
    // [TBI]@coc7.damage[formula:1D6]{Damage 1D6}
    // [TBI]@coc7.roll[threshold:50]{Simple roll}

    if (!app.isContentVisible) return

    if (data.message.content.toLocaleLowerCase().includes('@coc7')) {
      const parsedContent = CoC7Parser.enrichHTML(data.message.content)
      html.find('.message-content').html(parsedContent)
      data.message.content = parsedContent
    }
    return true // allow message to be published !
  }
}
