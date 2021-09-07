/* global canvas, ChatMessage, duplicate, game, NodeFilter, TextEditor, ui */

/**
 * Allow for parsing of CoC7 elements in chat message and sheets.
 * Format is :
 * @coc7.TYPE_OF_REQUEST[OPTIONS]{DISPLAYED_NAME}
 * TYPE_OF_REQUEST :
 * - sanloss : trigger a san check, upon failure will propose to deduct the corresponding SAN.
 * - check : trigger a check depending on the options.
 *
 * OPTIONS: [] = optional
 * sanloss:
 *   sanMax: max SAN loss
 *   sanMin: min SAN loss
 * check:
 *   type: type of check (characteristic, skill, attrib).
 *   name: name of the skill/characteristic.
 *   [difficulty]: ? (blind), 0 (regular), + (hard), ++ (extreme), +++ (critical).
 *   [modifier]: -x (x penalty dice), +x (x bonus dice), 0 (no modifier).
 *   [icon]: icon tu use (font awsome).
 *   [blind]: will trigger a blind roll.
 *
 * [DISPLAYED_NAME: name to display.]
 *
 */

import { SanCheckCard } from '../chat/cards/san-check.js'
import { isCtrlKey, chatHelper } from '../chat/helper.js'

// import { CoC7SanCheck } from '../chat/sancheck.js';
import { CoC7Check } from '../check.js'
import { CoC7Utilities } from '../utilities.js'
import { CoC7LinkCreationDialog } from './link-creation-dialog.js'
import { CoC7Link } from './link.js'
import { RollDialog } from './roll-dialog.js'

export class CoC7Parser {
  static async onEditorDrop (event, editor) {
    // TODO: MANAGE FLAT MODIFIER THERE
    event.preventDefault()

    // check key pressed (CTRL ?)
    // if CTRL check if item is skill/weapon
    // if item from game or pack add ref to the link !
    // const dataString = event.dataTransfer.getData('text/plain');
    const dataString = event.dataTransfer.getData('text/plain')
    const data = JSON.parse(dataString)
    if (data.linkType === 'coc7-link') {
      event.stopPropagation()
      if (
        !event.shiftKey &&
        (typeof data.difficulty === 'undefined' ||
          typeof data.modifier === 'undefined')
      ) {
        const usage = await RollDialog.create({
          disableFlatDiceModifier: true
        })
        if (usage) {
          data.modifier = usage.get('bonusDice')
          data.difficulty = usage.get('difficulty')
        }
      }
      if (game.settings.get('core', 'rollMode') === 'blindroll') {
        data.blind = true
      }

      const link = CoC7Parser.createCoC7Link(data)

      if (link) {
        editor.insertContent(link)
      }
    } else if (isCtrlKey(event)) {
      event.stopPropagation()

      if (data.type !== 'Item') return

      let item
      const linkData = {}

      if (data.pack) {
        const pack = game.packs.get(data.pack)
        if (pack.metadata.entity !== 'Item') return
        item = await pack.getDocument(data.id)
      } else if (data.data) {
        item = data.data
      } else {
        item = game.items.get(data.id)
      }

      if (!item) return

      linkData.name = item.name
      if (data.pack) linkData.pack = data.pack
      if (data.id) linkData.id = data.id

      if (item.type === 'skill') {
        if (!event.shiftKey) {
          const usage = await RollDialog.create({
            disableFlatDiceModifier: true
          })
          if (usage) {
            linkData.modifier = usage.get('bonusDice')
            linkData.difficulty = usage.get('difficulty')
          }
        }
        linkData.check = 'check'
        linkData.type = 'skill'
        if (game.settings.get('core', 'rollMode') === 'blindroll') {
          linkData.blind = true
        }
      } else if (item.type === 'weapon') {
        linkData.check = 'item'
        linkData.type = 'weapon'
      } else return

      const link = CoC7Parser.createCoC7Link(linkData)
      if (link) {
        editor.insertContent(link)
      }
    }
  }

  static async onInitEditor (editor) {
    // editor con
    ui.notifications.info('EDITOR IS INITIATED')
  }

  static ParseMessage (
    message,
    html,
    data /* chatMessage, data/*, option, user */
  ) {
    // @coc7.sanloss[sanMax:1D6,sanMin:1,difficulty:++,modifier:-1]{Hard San Loss (-1) 1/1D6}
    // @coc7.check[type:charac,name:STR,difficulty:+,modifier:-1]{Hard STR check(-1)}
    // @coc7.check[type:attrib,name:lck,difficulty:+,modifier:-1]{Hard luck check(-1)}
    // @coc7.check[type:skill,name:anthropology,difficulty:+,modifier:-1]{Hard Anthropology check(-1)}
    // @coc7.check[type:skill,icon:fas fa-arrow-alt-circle-right,name:anthropology,difficulty:+,modifier:-1]{Hard Anthropology check(-1)}
    // @coc7.item[name:Shotgun,icon:fas fa-bullseye,difficulty:+,modifier:-1]{Use shotgun}
    // [TBI]@coc7.damage[formula:1D6]{Damage 1D6}
    // [TBI]@coc7.roll[threshold:50]{Simple roll}

    if (!message.isContentVisible) return

    if (data.message.content.toLocaleLowerCase().includes('@coc7')) {
      const parsedContent = CoC7Parser.enrichHTML(data.message.content)
      html.find('.message-content').html(parsedContent)
      // chatMessage.data.content = parsedContent;
      data.message.content = parsedContent
    }
    return true // allow message to be published !
  }

  static createCoC7Link (data) {
    if (!data.check) return
    switch (data.check.toLowerCase()) {
      case 'check': {
        // @coc7.check[type:charac,name:STR,difficulty:+,modifier:-1]{Hard STR check(-1)}
        if (!data.type || !data.name) return
        let options = `${data.blind ? 'blind,' : ''}type:${data.type},name:${
          data.name
        }`
        if (typeof data.difficulty !== 'undefined') {
          options += `,difficulty:${data.difficulty}`
        }
        if (typeof data.modifier !== 'undefined') {
          options += `,modifier:${data.modifier}`
        }
        if (data.icon) options += `,icon:${data.icon}`
        if (data.pack) options += `,pack:${data.pack}`
        if (data.id) options += `,id:${data.id}`
        let link = `@coc7.check[${options}]`
        if (data.displayName) link += `{${data.displayName}}`
        return link
      }

      case 'sanloss': {
        // @coc7.sanloss[sanMax:1D6,sanMin:1,difficulty:++,modifier:-1]{Hard San Loss (-1) 1/1D6}
        if (!data.sanMax || !data.sanMin) return
        let options = `${data.blind ? 'blind,' : ''}sanMax:${
          data.sanMax
        },sanMin:${data.sanMin}`
        if (data.difficulty) options += `,difficulty:${data.difficulty}`
        if (data.modifier) options += `,modifier:${data.modifier}`
        if (data.icon) options += `,icon:${data.icon}`
        let link = `@coc7.sanloss[${options}]`
        if (data.displayName) link += `{${data.displayName}}`
        return link
      }

      // Do we need that ???
      case 'item': {
        // @coc7.item[type:optional,name:Shotgun,difficulty:+,modifier:-1]{Hard Shitgun check(-1)}
        if (!data.type || !data.name) return
        let options = `${data.blind ? 'blind,' : ''}type:${data.type},name:${
          data.name
        }`
        // if( data.difficulty) options += `,difficulty:${data.difficulty}`;
        // if( data.modifier) options += `,modifier:${data.modifier}`;
        if (data.icon) options += `,icon:${data.icon}`
        if (data.pack) options += `,pack:${data.pack}`
        if (data.id) options += `,id:${data.id}`
        let link = `@coc7.item[${options}]`
        if (data.displayName) link += `{${data.displayName}}`
        return link
      }

      default:
        break
    }
  }

  static ParseSheetContent (app, html) {
    // Check in all editors content for a link.
    for (const element of html.find('div.editor-content > *, p')) {
      if (element.outerHTML.toLocaleLowerCase().includes('@coc7')) {
        element.outerHTML = CoC7Parser.enrichHTML(element.outerHTML)
      }
    }

    for (const element of html.find('.keeper-only')) {
      if (!game.user.isGM) element.style.display = 'none'
    }

    // for (const element of html.find('div.editor-content')){
    //   if (element.outerHTML.toLocaleLowerCase().includes('[gm-only]')){
    //     element.outerHTML = CoC7Parser.procesGMOnly( element.outerHTML)
    //   }
    // }

    // Bind the click to execute the check.
    // html.on('click', 'a.coc7-link', CoC7Parser._onCheck.bind(this));
    html
      .find('a.coc7-link')
      .on('click', async event => await CoC7Parser._onCheck(event))
    html
      .find('a.coc7-link')
      .on('dragstart', event => CoC7Parser._onDragCoC7Link(event))
  }

  static _getTextNodes (parent) {
    const text = []
    const walk = document.createTreeWalker(
      parent,
      NodeFilter.SHOW_TEXT,
      null,
      false
    )
    while (walk.nextNode()) text.push(walk.currentNode)
    return text
  }

  static enrichHTML (content) {
    const html = document.createElement('div')
    html.innerHTML = String(content)

    let text = []

    text = TextEditor._getTextNodes(html)
    // Alternative regex : '@(coc7).([^\[]+)\[([^\]]+)\](?:{([^}]+)})?'
    const rgx = new RegExp(
      '@(coc7).(.*?)\\[([^\\]]+)\\]' + '(?:{([^}]+)})?',
      'gi'
    )
    TextEditor._replaceTextContent(text, rgx, CoC7Parser._createLink)
    return html.innerHTML
  }

  // static procesGMOnly (content){
  //   // const gmOnlyRgx = new RegExp(
  //   //   '(?:\[gm-only\])(.|\n)*?(?:\[\/gm-only\])',
  //   //   'gi'
  //   // )

  //   let replaced = content

  //   const searchAndReplace = [
  //     { search: '<p>[gm-only]', replace: '<div class="gm-secret"><p>'},
  //     { search: '[/gm-only]</p>', replace: '</p></div>'},
  //     { search: '[gm-only]', replace: '<div class="gm-secret>'},
  //     { search: '[/gm-only]', replace: '</div'}
  //   ]

  //   searchAndReplace.forEach( e => {
  //     const esc = e.search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  //     const searchRegEx = new RegExp(esc, 'ig')
  //     replaced = replaced.replaceAll( searchRegEx, e.replace)
  //   })

  //   return content
  // }

  static bindEventsHandler (html) {
    html
      .find('a.coc7-link')
      .on('click', async event => await CoC7Parser._onCheck(event))
    html
      .find('a.coc7-link')
      .on('dragstart', event => CoC7Parser._onDragCoC7Link(event))
  }

  static _onDragCoC7Link (event) {
    const a = event.currentTarget
    const i = a.querySelector('i.link-icon')
    const data = duplicate(a.dataset)
    data.linkType = 'coc7-link'
    data.CoC7Type = 'link'
    data.icon = null

    if (
      i.dataset &&
      i.dataset.linkIcon &&
      i.dataset.linkIcon !== 'fas fa-dice'
    ) {
      data.icon = i.dataset.linkIcon
    }
    data.displayName = a.dataset.displayName ? a.innerText : null
    event.originalEvent.dataTransfer.setData('text/plain', JSON.stringify(data))
  }

  static _createLink (match, tag, type, options, name) {
    const data = {
      cls: ['coc7-link'],
      dataset: { check: type },
      icon: 'fas fa-dice',
      blind: false,
      name: name
    }

    const matches = options.matchAll(/[^,]+/gi)
    for (const match of Array.from(matches)) {
      let [key, value] = match[0].split(':')
      if (key === 'icon') data.icon = value
      if (key === 'blind' && typeof value === 'undefined') {
        value = true
        data.blind = true && ['check'].includes(type.toLowerCase())
      }
      data.dataset[key] = value
    }

    let title
    const difficulty = CoC7Check.difficultyString(data.dataset.difficulty)

    switch (type.toLowerCase()) {
      case 'check': {
        let humanName = data.dataset.name
        if (
          ['attributes', 'attribute', 'attrib', 'attribs'].includes(
            data.dataset.type?.toLowerCase()
          )
        ) {
          if (data.dataset.name === 'lck') {
            humanName = game.i18n.localize('CoC7.Luck')
          }
          if (data.dataset.name === 'san') {
            humanName = game.i18n.localize('CoC7.Sanity')
          }
        }
        if (
          ['charac', 'char', 'characteristic', 'characteristics'].includes(
            data.dataset.type?.toLowerCase()
          )
        ) {
          humanName = CoC7Utilities.getCharacteristicNames(data.dataset.name)
            ?.label
        }
        title = game.i18n.format(
          `CoC7.LinkCheck${!data.dataset.difficulty ? '' : 'Diff'}${
            !data.dataset.modifier ? '' : 'Modif'
          }`,
          {
            difficulty: difficulty,
            modifier: data.dataset.modifier,
            name: humanName
          }
        )
        break
      }
      case 'sanloss':
        title = game.i18n.format(
          `CoC7.LinkSanLoss${!data.dataset.difficulty ? '' : 'Diff'}${
            !data.dataset.modifier ? '' : 'Modif'
          }`,
          {
            difficulty: difficulty,
            modifier: data.dataset.modifier,
            sanMin: data.dataset.sanMin,
            sanMax: data.dataset.sanMax
          }
        )
        break
      case 'item':
        title = game.i18n.format(
          `CoC7.LinkItem${!data.dataset.difficulty ? '' : 'Diff'}${
            !data.dataset.modifier ? '' : 'Modif'
          }`,
          {
            difficulty: difficulty,
            modifier: data.dataset.modifier,
            name: data.dataset.name
          }
        )
        break
      default:
        break
    }

    if (!name) {
      data.name = title
    } else data.dataset.displayName = true

    const a = document.createElement('a')
    a.title = game.user.isGM ? data.name : title
    a.classList.add(...data.cls)
    for (const [k, v] of Object.entries(data.dataset)) {
      a.dataset[k] = v
    }
    a.draggable = true
    a.innerHTML = `${
      data.blind ? '<i class="fas fa-eye-slash"></i>' : ''
    }<i data-link-icon="${data.icon}" class="link-icon ${data.icon}"></i>${
      data.name
    }`

    return a
  }

  /**
   * Trigger a check when a link is clicqued.
   * Depending the origin
   * @param {*} event
   *
   */
  static async _onCheck (event) {
    const options = event.currentTarget.dataset

    if (options.difficulty) {
      options.difficulty = CoC7Utilities.convertDifficulty(options.difficulty)
    }

    // Click origin (from message or from sheet)
    // const fromSheet = event.currentTarget.closest('.chat-message')?false:true;

    if (game.user.isGM) {
      if (isCtrlKey(event)) {
        if (options.displayName) options.label = event.currentTarget.innerText
        const link = await CoC7Link.fromData(options)
        const linkDialog = new CoC7LinkCreationDialog(link)
        linkDialog.render(true)
        return
      }
      if (canvas.tokens.controlled.length) {
        canvas.tokens.controlled.forEach(token => {
          switch (options.check) {
            case 'check':
              if (
                [
                  'charac',
                  'char',
                  'characteristic',
                  'characteristics'
                ].includes(options.type.toLowerCase())
              ) {
                return token.actor.characteristicCheck(
                  options.name,
                  event.shiftKey,
                  options
                )
              }
              if (['skill'].includes(options.type.toLowerCase())) {
                return token.actor.skillCheck(options, event.shiftKey, options)
              }
              if (
                ['attributes', 'attribute', 'attrib', 'attribs'].includes(
                  options.type.toLowerCase()
                )
              ) {
                return token.actor.attributeCheck(
                  options.name,
                  event.shiftKey,
                  options
                )
              }
              break

            case 'sanloss': {
              SanCheckCard.create(token.actor.id, options, {
                fastForward: event.shiftKey
              })
              // const check = new CoC7SanCheck(
              //   token.actor.id,
              //   options.sanMin,
              //   options.sanMax,
              //   undefined != options.difficulty?CoC7Utilities.convertDifficulty(options.difficulty):CoC7Check.difficultyLevel.regular,
              //   undefined != options.modifier?Number(options.modifier):0);
              // check.toMessage( event.shiftKey);
              break
            }

            case 'item': {
              return token.actor.weaponCheck(options, event.shiftKey)
            }

            default:
          }
        })
      } else {
        if (game.user.data.document.character?.data) {
          await Promise.all(
            game.user.data.document.character.data.items.map(async v => {
              if (v.name === options.name) {
                const check = new CoC7Check()
                check._rawValue = v.data.data.base
                await check.roll()
                check.toMessage()
              }
              return false
            })
          )
        } else if (game.user.isGM) {
          const option = {
            speaker: {
              alias: game.user.name
            }
          }
          chatHelper.createMessage(
            null,
            game.i18n.format('CoC7.MessageCheckRequestedWait', {
              check: (await CoC7Link.fromData(options)).link
            }),
            option
          )
        }
      }
    } else {
      const speaker = ChatMessage.getSpeaker()
      const actor = ChatMessage.getSpeakerActor(speaker)
      if (actor) {
        switch (options.check) {
          case 'check':
            if (
              ['charac', 'char', 'characteristic', 'characteristics'].includes(
                options.type.toLowerCase()
              )
            ) {
              return actor.characteristicCheck(
                options.name,
                event.shiftKey,
                options
              )
            }
            if (['skill'].includes(options.type.toLowerCase())) {
              return actor.skillCheck(options, event.shiftKey, options)
            }
            if (
              ['attributes', 'attribute', 'attrib', 'attribs'].includes(
                options.type.toLowerCase()
              )
            ) {
              return actor.attributeCheck(options.name, event.shiftKey, options)
            }
            break

          case 'sanloss': {
            SanCheckCard.create(actor.id, options, {
              fastForward: event.shiftKey
            })
            // const check = new CoC7SanCheck(
            //   actor.id,
            //   options.sanMin,
            //   options.sanMax,
            //   undefined != options.difficulty?CoC7Utilities.convertDifficulty(options.difficulty):CoC7Check.difficultyLevel.regular,
            //   undefined != options.modifier?Number(options.modifier):0);
            // check.toMessage( event.shiftKey);
            break
          }

          case 'item': {
            return actor.weaponCheck(options, event.shiftKey)
          }
          default:
        }
      } else {
        if (game.user.data.document.character?.data) {
          await Promise.all(
            game.user.data.document.character.data.items.map(async v => {
              if (v.name === options.name) {
                const check = new CoC7Check()
                check._rawValue = v.data.data.base
                await check.roll()
                check.toMessage()
              }
              return false
            })
          )
        } else {
          ui.notifications.warn(
            game.i18n.localize('CoC7.WarnNoControlledActor')
          )
        }
      }
    }
  }
}
