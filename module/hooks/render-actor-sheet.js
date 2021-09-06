/* global Hooks, ui */

export function listen () {
  Hooks.on('renderActorSheet', async (data, html, options) => {
    console.log(data)
    if (data.document.type === 'vehicle') {
      ui.notifications.warn('This feature is a work in progress and its use is still not recommended.')
      await data.close()
      await data.close()
    }
  })
}
