/* global foundry game */
export default function (data, updates, actor) {
  /* // FoundryVTT V12 */
  if (game.release.generation === 12) {
    return true
  }
  if (typeof updates['system.attribs.hp.value'] !== 'undefined') {
    const damage = foundry.utils.getProperty(actor, 'system.attribs.hp.value') - Number(updates['system.attribs.hp.value'])
    if (damage > 0) {
      actor.dealDamage(damage, { ignoreArmor: true })
      return false
    }
  } else if (typeof updates['system.attribs.san.value'] !== 'undefined') {
    actor.setSan(Number(updates['system.attribs.san.value']))
    return false
  }
  return true
}
