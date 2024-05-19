/* global $, game, Hooks, ui */
import { COC7 } from '../config.js'
import { CoC7Utilities } from '../utilities.js'

async function performFilter (app) {
  const appHtml = $('div.app[data-appid=' + app.appId + ']')
  const type = appHtml.find('select[name=coc7type' + app.appId + ']').val()
  const name = appHtml.find('input[name=search]').val()
  const eraElement = appHtml.find('select[name=coc7era' + app.appId + ']')
  let setEra = false
  let setType = false
  let era = ''
  switch (type) {
    case 'occupation':
    case 'setup':
    case 'skill':
    case 'weapon':
      eraElement.closest('div.era_select').show()
      era = eraElement.val()
      setType = true
      setEra = true
      break
    default:
      eraElement.closest('div.era_select').hide()
      setType = true
  }
  app.options.filterCoC7 = {
    type: (setType ? type : null),
    era: (setEra ? era : null)
  }
  const items = await game.packs.get(appHtml.data('packId'))?.getDocuments()
  if (typeof items === 'undefined') {
    return
  }
  const show = []
  const nameFilter = new RegExp(RegExp.escape(name), 'i')
  for (const [, item] of Object.entries(items)) {
    let filter = true
    if (filter && name !== '') {
      filter = item.name.match(nameFilter)
    }
    if (filter && type !== '') {
      filter = item.type === type
    }
    if (filter && era !== '') {
      const eras = item.flags?.CoC7?.cocidFlag?.eras
      if (eras && Object.keys(eras).length > 0 && !(eras[era] ?? false)) {
        filter = false
      }
    }
    if (filter) {
      show.push(item.id)
    }
  }
  appHtml.find('ol.directory-list li').each(function () {
    this.style.display = show.includes(this.dataset.documentId)
      ? 'flex'
      : 'none'
  })
}

async function triggerFilterEvent (e) {
  let appId = e.currentTarget.name.replace(/^coc7[^0-9]+(\d+)$/, '$1')
  if (appId === 'search') {
    appId = $(e.currentTarget).closest('div.app').data('appid')
  }
  if (ui.windows[appId] ?? false) {
    performFilter(ui.windows[appId])
  }
}

export function compendiumFilter () {
  Hooks.on('renderCompendium', async (app, html, data) => {
    if (app.collection.documentName === 'Item') {
      const input = $('input[name=search]', html)
      input.after(input.clone())
      input.remove()
      await app.collection.getIndex()
      const types = [...new Set(data.index.filter(i => i.name !== '#[CF_tempEntity]').map(item => item.type))]
      const select = []
      const selectedType = (app.options.filterCoC7?.type ?? '')
      const selectedEra = (app.options.filterCoC7?.era ?? '')
      select.push(
        '<option value="">' + game.i18n.localize('CoC7.All') + '</option>'
      )
      const groupTypes = [
        {
          key: 'archetype',
          name: 'CoC7.Entities.Archetype'
        },
        {
          key: 'book',
          name: 'CoC7.Entities.Book'
        },
        {
          key: 'item',
          name: 'CoC7.Entities.Item'
        },
        {
          key: 'occupation',
          name: 'CoC7.Entities.Occupation'
        },
        {
          key: 'setup',
          name: 'CoC7.Entities.Setup'
        },
        {
          key: 'skill',
          name: 'CoC7.Entities.Skill'
        },
        {
          key: 'spell',
          name: 'CoC7.Entities.Spell'
        },
        {
          key: 'status',
          name: 'CoC7.Entities.Status'
        },
        {
          key: 'talent',
          name: 'CoC7.Entities.Talent'
        },
        {
          key: 'weapon',
          name: 'CoC7.Entities.Weapon'
        }
      ]
      for (const groupType of groupTypes) {
        if (types.includes(groupType.key)) {
          select.push(
            '<option value="' + groupType.key + '"' + (selectedType === groupType.key ? ' selected="selected"' : '') + '>' +
              game.i18n.localize(groupType.name) +
              '</option>'
          )
        }
      }
      const eras = []
      eras.push(
        '<option value="">' + game.i18n.localize('CoC7.All') + '</option>'
      )
      for (const era of Object.entries(COC7.eras).map(e => { return { id: e[0], name: game.i18n.localize(e[1]) } }).sort(CoC7Utilities.sortByNameKey)) {
        eras.push(
          '<option value="' +
            era.id +
            '"' + (selectedEra === era.id ? ' selected="selected"' : '') + '>' +
            era.name +
            '</option>'
        )
      }
      html.data('packId', app.metadata.id)
      let uncommon = game.i18n.localize('CoC7.SkillRarityShort')
      if (uncommon === 'CoC7.SkillRarityShort') {
        uncommon = '??'
      }
      html.find('li.directory-item').each(function () {
        const row = $(this)
        let item = []
        if (typeof data.index !== 'undefined') {
          // DEPRECIATED IN v11
          item = data.index.find(i => i._id === row.data('document-id'))
        } else {
          item = app.collection.index.get(row.data('document-id'))
        }
        if (item && item.type === 'skill') {
          row.find('a').html(item.name + ' (' + (item.system?.base ?? '?') + '%' + ((item.system?.properties?.rarity ?? false) ? ' ' + uncommon : '') + ')')
        }
      })
      html
        .find('header.directory-header')
        .after(
          '<div class="compendiumfilter">' +
          '<div class="header-search flexrow"><i class="fas fa-layer-group"></i><select name="coc7type' + app.appId + '" style="">' + select.join('') + '</select></div>' +
          '<div class="header-search flexrow era_select" style="display:none"><i class="fas fa-layer-group"></i><select name="coc7era' + app.appId + '" style="">' + eras.join('') + '</select></div>' +
          '</div>'
        )
      html.find('select').change(triggerFilterEvent.bind(this))
      html.find('input').keyup(triggerFilterEvent.bind(this))
      if (selectedType !== '') {
        performFilter(app)
      }
    }
  })
}
