/* global $, CONST, Dialog, FormData, foundry, game, TextEditor */
import { addCoCIDSheetHeaderButton } from '../coc-id-system/coc-id-button.js'
import { CoC7Utilities } from '../../shared/utilities.js'

export class CoC7ContainerSheet extends foundry.appv1.sheets.ActorSheet {
  /**
   * Extend and override the default options used by the 5e Actor Sheet
   * @returns {Object}
   */
  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
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

  async _onDrop (event) {
    event.preventDefault()
    event.stopPropagation()

    const dataList = await CoC7Utilities.getDataFromDropEvent(event, 'Item')
    if (!this.options.editable) {
      return
    }
    const items = this.actor.items.toObject() || []
    for (const item of dataList) {
      if (!item || !item.system) {
        continue
      }
      if (!['book', 'item', 'spell', 'weapon', 'armor'].includes(item.type)) {
        continue
      }
      items.push(item.toObject())
    }
    await this.actor.update({ items })
  }

  onCloseSheet () {}

  _getHeaderButtons () {
    const headerButtons = super._getHeaderButtons()
    addCoCIDSheetHeaderButton(headerButtons, this)
    return headerButtons
  }

  async getData () {
    const sheetData = await super.getData()

    sheetData.isKeeper = game.user.isGM
    sheetData.editable = this.isEditable

    sheetData.itemsByType = {}
    if (sheetData.items) {
      for (const item of sheetData.items) {
        if (
          !Object.prototype.hasOwnProperty.call(
            sheetData.itemsByType,
            item.type
          )
        ) {
          sheetData.itemsByType[item.type] = []
        }
        sheetData.itemsByType[item.type].push(item)
      }
      for (const itemType in sheetData.itemsByType) {
        sheetData.itemsByType[itemType].sort(CoC7Utilities.sortByNameKey)
      }
    }

    sheetData.allowUnlock =
      game.settings.get('CoC7', 'playerUnlockSheetMode') === 'always' ||
      game.user.isGM

    sheetData.showInventoryItems =
      Object.prototype.hasOwnProperty.call(sheetData.itemsByType, 'item') ||
      !sheetData.data.system.flags.locked
    sheetData.showInventoryBooks =
      Object.prototype.hasOwnProperty.call(sheetData.itemsByType, 'book') ||
      !sheetData.data.system.flags.locked
    sheetData.showInventorySpells =
      Object.prototype.hasOwnProperty.call(sheetData.itemsByType, 'spell') ||
      !sheetData.data.system.flags.locked
    sheetData.showInventoryTalents =
      Object.prototype.hasOwnProperty.call(sheetData.itemsByType, 'talent') ||
      (!sheetData.data.system.flags.locked &&
        game.settings.get('CoC7', 'pulpRuleTalents'))
    sheetData.showInventoryWeapons =
      Object.prototype.hasOwnProperty.call(sheetData.itemsByType, 'weapon') ||
      !sheetData.data.system.flags.locked
    sheetData.showInventoryArmor =
      Object.prototype.hasOwnProperty.call(sheetData.itemsByType, 'armor') ||
      !sheetData.data.system.flags.locked

    sheetData.hasInventory =
      sheetData.showInventoryItems ||
      sheetData.showInventoryBooks ||
      sheetData.showInventorySpells ||
      sheetData.showInventoryTalents ||
      sheetData.showInventoryWeapons ||
      sheetData.showInventoryArmor

    sheetData.enrichedDescriptionValue = await TextEditor.enrichHTML(
      sheetData.data.system.description.value,
      {
        async: true,
        secrets: sheetData.editable
      }
    )

    sheetData.enrichedDescriptionKeeper = await TextEditor.enrichHTML(
      sheetData.data.system.description.keeper,
      {
        async: true,
        secrets: sheetData.editable
      }
    )

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
        case 'armor':
          this.actor.createEmptyArmor(ev)
          break
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
      for (const [k, v] of Object.entries(e.ownership)) {
        if (k === 'default' || k === game.user.id) {
          visible =
            visible ||
            v !== CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE
        }
      }
      return visible
    })
    content = content + '<form id="selectform"><select name="user">'
    for (const actor of actors) {
      content =
        content + '<option value="' + actor.id + '">' + actor.name + '</option>'
    }
    content = content + '</select></form></p>'
    await Dialog.prompt({
      title: game.i18n.localize('CoC7.MessageTitleSelectUserToGiveTo'),
      content,
      callback: html => {
        const formData = new FormData(html[0].querySelector('#selectform'))
        for (const [name, value] of formData) {
          if (name === 'user') {
            message.actorTo = value
          }
        }
      }
    })
    await game.CoC7socket.executeAsGM('gmtradeitemto', message)
  }

  async _onItemSummary (event) {
    event.preventDefault()
    const li = $(event.currentTarget).parents('.item')
    const item = this.actor.items.get(li.data('item-id'))
    const chatData = await item.getChatData({ secrets: this.actor.isOwner })

    // Toggle summary
    if (li.hasClass('expanded')) {
      const summary = li.children('.item-summary')
      summary.slideUp(200, () => summary.remove())
    } else {
      const div = $('<div class="item-summary"></div>')

      const labels = $('<div class="item-labels"></div>')
      for (const p of chatData.labels) {
        labels.append(
          `<div class="item-label"><span class="label-name">${p.name} :</span><span class="label-value">${p.value}</span></div>`
        )
      }
      div.append(labels)

      div.append(
        $(`<div class="item-description">${chatData.description.value}</div>`)
      )
      if (item.system.properties?.spcl) {
        const specialDiv = $(
          `<div class="item-special">${chatData.description.special}</div>`
        )
        div.append(specialDiv)
      }

      const props = $('<div class="item-properties"></div>')
      for (const p of chatData.properties) {
        props.append(
          `<div class="tag item-property">${game.i18n.localize(p)}</div>`
        )
      }
      div.append(props)

      li.append(div.hide())
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
