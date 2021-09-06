/* global Hooks, ui */

export function listen () {
  Hooks.on('renderItemSheet', async (data, html, options) => {
    console.log(data)
    if (data.document.type === 'chase') {
      ui.notifications.warn('This feature is a work in progress and its use is still not recommended.')
      await data.close()
      await data.close()
    }
  })
}
