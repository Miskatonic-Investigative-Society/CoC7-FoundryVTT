/* global ActorSheet CONFIG foundry ItemSheet */
/* // jQuery */
// SlideUp / SlideDown / Slide Toggle
/* // FoundryVTT V12 */
if (typeof foundry.appv1 === 'undefined') {
  foundry.appv1 = {
    sheets: {
      ActorSheet,
      ItemSheet
    }
  }
}
// Translations TOKEN.MOVEMENT.ACTIONS.* in static/lang/*.json
if (typeof CONFIG.Token.movement === 'undefined') {
  CONFIG.Token.movement = {
    actions: {
      walk: {
        label: 'TOKEN.MOVEMENT.ACTIONS.walk.label',
        icon: 'fa-solid fa-person-walking',
        order: 0
      },
      fly: {
        label: 'TOKEN.MOVEMENT.ACTIONS.fly.label',
        icon: 'fa-solid fa-person-fairy',
        order: 1
      },
      swim: {
        label: 'TOKEN.MOVEMENT.ACTIONS.swim.label',
        icon: 'fa-solid fa-person-swimming',
        order: 2
      },
      burrow: {
        label: 'TOKEN.MOVEMENT.ACTIONS.burrow.label',
        icon: 'fa-solid fa-person-digging',
        order: 3
      },
      crawl: {
        label: 'TOKEN.MOVEMENT.ACTIONS.crawl.label',
        icon: 'fa-solid fa-person-praying',
        order: 4
      },
      climb: {
        label: 'TOKEN.MOVEMENT.ACTIONS.climb.label',
        icon: 'fa-solid fa-person-through-window',
        order: 5
      },
      jump: {
        label: 'TOKEN.MOVEMENT.ACTIONS.jump.label',
        icon: 'fa-solid fa-person-running-fast',
        order: 6
      },
      blink: {
        label: 'TOKEN.MOVEMENT.ACTIONS.blink.label',
        icon: 'fa-solid fa-person-from-portal',
        order: 7
      },
      displace: {
        label: 'TOKEN.MOVEMENT.ACTIONS.displace.label',
        icon: 'fa-solid fa-transporter-1',
        order: 8
      }
    }
  }
}
/* // FoundryVTT V13 */
/* // FoundryVTT V15 */

// Remember
// ui.windows -> foundry.applications.instances
// frame.setAttribute('open', true)
