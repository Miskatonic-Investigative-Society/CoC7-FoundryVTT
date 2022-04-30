/* global game, Hooks */
export function listen () {
  Hooks.on('diceSoNiceRollStart', dice3d => {
    game.CoC7DecaderDSNFaces.setFaces()
  })
}
