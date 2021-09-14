/* global ActorSheet, CONST, Dialog, game, mergeObject */
import { CoC7Parser } from '../../apps/parser.js'
export class CoC7ContainerSheet extends ActorSheet {
  /**
   * Extend and override the default options used by the 5e Actor Sheet
   * @returns {Object}
   */
  static get defaultOptions () {
    return mergeObject(super.defaultOptions, {
      classes: ['coc7', 'sheet', 'actor', 'storage'],
      template: 'systems/CoC7/templates/actors/storage-sheet.html',
      width: 672,
      height: 765,
      dragDrop: [{ dragSelector: '.item', dropSelector: null }],
      tabs: [
        {
          navSelector: '.sheet-nav',
          contentSelector: '.sheet-body',
          initial: 'items'
        }
      ]
    })
  }

  async _onDropFolder (event, data) {
    if (!this.actor.isOwner) return []
    if (data.documentName !== 'Item') return []
    const folder = game.folders.get(data.id)
    if (!folder) return []
    const items = folder.contents.filter(item => ['book', 'item', 'spell', 'weapon'].includes(item.type)).map(item => item.toJSON())
    if (items.length > 0) {
      await this.actor.createEmbeddedDocuments('Item', items)
    }
  }

  onCloseSheet () {
  }

  async getData () {
    const data = await super.getData()
    const sheetData = data.data
    sheetData.isKeeper = game.user.isGM
    sheetData.editable = this.isEditable

    sheetData.itemsByType = {}
    if (data.items) {
      for (const item of data.items) {
        if (!Object.prototype.hasOwnProperty.call(sheetData.itemsByType, item.type)) {
          sheetData.itemsByType[item.type] = []
        }
        sheetData.itemsByType[item.type].push(item)
      }
      for (const itemType in sheetData.itemsByType) {
        sheetData.itemsByType[itemType].sort((a, b) => {
          return a.name.localeCompare(b.name)
        })
      }
    }

    sheetData.allowUnlock =
      game.settings.get('CoC7', 'playerUnlockSheetMode') === 'always' ||
      game.user.isGM

    sheetData.showWeaponsInsteadOfStatus = true

    return sheetData
  }

  activateListeners (html) {
    super.activateListeners(html)

    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents('.item')
      const item = this.actor.items.get(li.data('itemId'))
      item.sheet.render(true)
    })

    html.find('.inventory-header').click(this._onInventoryHeader.bind(this))

    html.find('.item-trade').click(this._onTradeItem.bind(this))
    html.find('.show-detail').click(this._onItemSummary.bind(this))

    html.find('.item-delete').click(async ev => {
      const li = $(ev.currentTarget).parents('.item')
      const itemToDelete = this.actor.items.get(li.data('itemId'), {
        strict: true
      })
      await itemToDelete.delete()
      li.slideUp(200, () => this.render(false))
    })

    html.find('.add-item').click(ev => {
      switch (ev.currentTarget.dataset.type) {
        case 'book':
          this.actor.createEmptyBook(ev)
          break
        case 'item':
          this.actor.createEmptyItem(ev)
          break
        case 'skill':
          this.actor.createEmptySkill(ev)
          break
        case 'spell':
          this.actor.createEmptySpell(ev)
          break
        case 'weapon':
          this.actor.createEmptyWeapon(ev)
          break
      }
    })

    html.find('.lock').click(this._onLockClicked.bind(this))
  }

  async _onLockClicked (event) {
    event.preventDefault()
    const isLocked = this.actor.locked
    this.actor.locked = !isLocked
  }

  async _onTradeItem (event) {
    const li = $(event.currentTarget).parents('.item')
    const item = this.actor.items.get(li.data('itemId'))
    let content = '<p>' + game.i18n.localize('CoC7.MessageSelectUserToGiveTo')
    const message = {
      actorFrom: this.actor.id,
      scene: null,
      actorTo: this.actor.id,
      item: item.id
    }
    if (this.token?.actor) {
      message.actorFrom = this.token.id
      message.scene = this.token.parent.id
    }
    const actors = game.actors.filter(e => {
      if (!['character', 'npc', 'creature', 'container'].includes(e.type)) {
        return false
      }
      if (this.actor.id === e.id) {
        return false
      }
      let visible = false
      for (const [k, v] of Object.entries(e.data.permission)) {
        if (k === 'default' || k === game.user.id) {
          visible = visible || v !== CONST.ENTITY_PERMISSIONS.NONE
        }
      }
      return visible
    })
    content = content + '<form id="selectform"><select name="user">'
    for (const actor of actors) {
      content = content + '<option value="' + actor.id + '">' + actor.name + '</option>'
    }
    content = content + '</select></form></p>'
    await Dialog.prompt({
      title: game.i18n.localize('CoC7.MessageTitleSelectUserToGiveTo'),
      content: content,
      callback: html => {
        const formData = new FormData(html[0].querySelector('#selectform'))
        formData.forEach(function (value, name) {
          if (name === 'user') {
            message.actorTo = value
          }
        })
      }
    })
    await game.CoC7socket.executeAsGM('gmtradeitemto', message)
  }

  _onItemSummary (event) {
    event.preventDefault()
    const li = $(event.currentTarget).parents('.item')
    const item = this.actor.items.get(li.data('item-id'))
    const chatData = item.getChatData({ secrets: this.actor.isOwner })

    // Toggle summary
    if (li.hasClass('expanded')) {
      const summary = li.children('.item-summary')
      summary.slideUp(200, () => summary.remove())
    } else {
      const div = $('<div class="item-summary"></div>')

      const labels = $('<div class="item-labels"></div>')
      chatData.labels.forEach(p =>
        labels.append(
          `<div class="item-label"><span class="label-name">${p.name} :</span><span class="label-value">${p.value}</span></div>`
        )
      )
      div.append(labels)

      div.append(
        $(`<div class="item-description">${chatData.description.value}</div>`)
      )

      if (item.data.data.properties?.spcl) {
        const specialDiv = $(
          `<div class="item-special">${chatData.description.special}</div>`
        )
        div.append(specialDiv)
      }

      const props = $('<div class="item-properties"></div>')
      chatData.properties.forEach(p =>
        props.append(
          `<div class="tag item-property">${game.i18n.localize(p)}</div>`
        )
      )
      div.append(props)

      li.append(div.hide())
      CoC7Parser.bindEventsHandler(div)
      div.slideDown(200)
    }
    li.toggleClass('expanded')
    // $(event.currentTarget).toggleClass('expanded');
  }

  _onInventoryHeader (event) {
    event.preventDefault()
    $(event.currentTarget).siblings('li').slideToggle(200)
  }
}
