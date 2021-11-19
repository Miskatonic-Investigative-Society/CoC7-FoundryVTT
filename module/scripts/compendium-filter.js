/* global game, Hooks */
import { COC7 } from '../config.js'

async function performFilter (e) {
  const appId = e.currentTarget.name.replace(/^coc7[^0-9]+(\d+)$/, '$1')
  const app = $('#app-' + appId)
  const type = app.find('select[name=coc7type' + appId + ']').val()
  const name = app.find('input[name=coc7name' + appId + ']').val()
  const eraElement = app.find('select[name=coc7era' + appId + ']')
  let era = ''
  switch (type) {
    case 'setup':
    case 'skill':
    case 'weapon':
      eraElement.closest('div.era_select').show()
      era = eraElement.val()
      break
    default:
      eraElement.closest('div.era_select').hide()
  }
  const items = await game.packs.get(app.data('packId'))?.getDocuments()
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
      if (item.data.data.eras[era] === false || item.data.data.eras[era] === true) {
        filter = item.data.data.eras[era]
      } else {
        filter = (item.data.data.eras[era]?.selected ?? false)
      }
    }
    if (filter) {
      show.push(item.id)
    }
  }
  app.find('ol.directory-list li').each(function () {
    this.style.display = show.includes(this.dataset.documentId) ? 'flex' : 'none'
  })
}

export function compendiumFilter () {
  Hooks.on('renderCompendium', async (app, html, data) => {
    if (app.metadata.entity === 'Item') {
      console.log(app, html, data)
      const types = [...new Set(data.index.map(item => item.type))]
      const select = []
      select.push('<option value="">' + game.i18n.localize('CoC7.All') + '</option>')
      if (types.includes('archetype')) {
        select.push('<option value="archetype">' + game.i18n.localize('CoC7.Entities.Archetype') + '</option>')
      }
      if (types.includes('book')) {
        select.push('<option value="book">' + game.i18n.localize('CoC7.Entities.Book') + '</option>')
      }
      if (types.includes('item')) {
        select.push('<option value="item">' + game.i18n.localize('CoC7.Entities.Item') + '</option>')
      }
      if (types.includes('occupation')) {
        select.push('<option value="occupation">' + game.i18n.localize('CoC7.Entities.Occupation') + '</option>')
      }
      if (types.includes('setup')) {
        select.push('<option value="setup">' + game.i18n.localize('CoC7.Entities.Setup') + '</option>')
      }
      if (types.includes('skill')) {
        select.push('<option value="skill">' + game.i18n.localize('CoC7.Entities.Skill') + '</option>')
      }
      if (types.includes('spell')) {
        select.push('<option value="spell">' + game.i18n.localize('CoC7.Entities.Spell') + '</option>')
      }
      if (types.includes('status')) {
        select.push('<option value="status">' + game.i18n.localize('CoC7.Entities.Status') + '</option>')
      }
      if (types.includes('talent')) {
        select.push('<option value="talent">' + game.i18n.localize('CoC7.Entities.Talent') + '</option>')
      }
      if (types.includes('weapon')) {
        select.push('<option value="weapon">' + game.i18n.localize('CoC7.Entities.Weapon') + '</option>')
      }
      const eras = []
      eras.push('<option value="">' + game.i18n.localize('CoC7.All') + '</option>')
      for (const [key, value] of Object.entries(COC7.eras)) {
        eras.push('<option value="' + key + '">' + game.i18n.localize(value) + '</option>')
      }
      html.data('packId', app.metadata.package + '.' + app.metadata.name)
      html.find('header.directory-header').remove()
      html.find('div.compendium.directory').before('<div class="compendiumfilter"><div class="flexrow"><i class="fas fa-layer-group"></i><select name="coc7type' + app.appId + '" style="">' + select.join('') + '</select></div><div class="flexrow"><i class="fas fa-search"></i><input type="text" name="coc7name' + app.appId + '" placeholder="' + game.i18n.localize('FILES.Search') + '" autocomplete="off"></div><div class="flexrow era_select" style="display:none"><i class="fas fa-layer-group"></i><select name="coc7era' + app.appId + '" style="">' + eras.join('') + '</select></div></div>')
      html.find('select').change(performFilter.bind(this))
      html.find('input').keyup(performFilter.bind(this))
    }
  })
}
