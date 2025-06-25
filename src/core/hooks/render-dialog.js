/* global game */
export default function (dialog, html) {
  const form = html.find('form')
  if (form.is('#document-create') && form.find('select').length !== 0) {
    const entityCreateSelectTag = form.find("[name='type']")
    const entitySortedList = []
    const showExperimental = !!game.settings.get(
      'CoC7',
      'experimentalFeatures'
    )
    entityCreateSelectTag.children().each((o, entityOption) => {
      const key = entityOption.textContent?.capitalize()
      if (game.i18n.has(`CoC7.Entities.${key}`)) {
        entityOption.textContent = game.i18n.localize(`CoC7.Entities.${key}`)
      }
      if (showExperimental || !['vehicle'].includes(entityOption.value)) {
        entitySortedList.push(entityOption)
      }
    })
    entityCreateSelectTag.empty()
    entityCreateSelectTag.append(
      entitySortedList.sort((first, second) =>
        first.innerText.localeCompare(second.innerText)
      )
    )
    if (entityCreateSelectTag.val() === 'actor') {
      entityCreateSelectTag.val('character')
    } else if (entityCreateSelectTag.val() === 'book') {
      entityCreateSelectTag.val('item')
    }
  }
}
