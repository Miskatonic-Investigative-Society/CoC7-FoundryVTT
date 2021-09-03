/* global Hooks */

export function listen () {
  Hooks.once('ready', async () => {
    console.log('Call of Cthulhu 7th Edition | Ready')
  })
}
