/* global game, Hooks */

export function listen () {
  Hooks.on('renderDialog', (dialog, html) => {
    const form = html.find('form')
    if (form.is('#entity-create') && form.find('select').length !== 0) {
      const entityCreateSelectTag = form.find("[name='type']")
      const entitySortedList = []
      entityCreateSelectTag.children().each((o, entityOption) => {
        const key = entityOption.textContent?.capitalize()
        entityOption.textContent = game.i18n.localize(`CoC7.Entities.${key}`)
        entitySortedList.push(entityOption)
      })
      entityCreateSelectTag.empty()
      entityCreateSelectTag.append(
        entitySortedList.sort((first, second) =>
          first.innerText.localeCompare(second.innerText)
        )
      )
      if (entityCreateSelectTag.val() === 'actor') {
        entityCreateSelectTag.val('investigator')
      } else if (entityCreateSelectTag.val() === 'book') {
        entityCreateSelectTag.val('item')
      }
    }
  })
}
