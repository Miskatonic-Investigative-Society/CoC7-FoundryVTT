# Effects

The system allows for the creation of Active Effects.
An active effect will modify an actor characteristic(s), attribute(s), skill(s).
Effects can be created as a [link](links.md) using the [Link creation tool](link_creation_window.md) or directly in the character sheet by clicking the [game-icon game-icon-aura] button.

## Effects tab

Effects will be display in the effect tabs on the character sheet.

![effects tab](../../assets/manual/effects/effects-tab.webp)

Effect are broken down in 4 categories for PC :

- Status: those are effects used and created by the system (Wounds status, prone, insane ...). Those effects do not include any changes.
- Temporary: those are effects with duration.
- Passive: those are permanent effects.
- Inactive: those are disabled effects.

For NPC/Creatures you will only see 2 sections: active and inactive effects.
When an effect is not inactive, the corresponding changes will be applied to the actor.

## Creating effects

You can create effect by clicking the Add button.
This will bring the effect creation window.
This windows has 3 tabs

### Details tab

![Details tab](../../assets/manual/effects/details-tab.webp)

### Duration tab

![Duration tab](../../assets/manual/effects/duration-tab.webp)

### Changes tab

![Changes tab](../../assets/manual/effects/changes-tab.webp)

This last tab will includes all changes made to the character sheet.

## Changes

An effect includes a list of changes. Each change needs to be addressed with the corresponding system path.
The available changes are :

- Characteristics:
  - Strength:
    - system.characteristics.str.value
    - system.characteristics.str.bonusDice
  - Constitution:
    - system.characteristics.con.value
    - system.characteristics.con.bonusDice
  - Size:
    - system.characteristics.siz.value
    - system.characteristics.siz.bonusDice
  - Dexterity:
    - system.characteristics.dex.value
    - system.characteristics.dex.bonusDice
  - Appearance:
    - system.characteristics.app.value
    - system.characteristics.app.bonusDice
  - Intelligence:
    - system.characteristics.int.value
    - system.characteristics.int.bonusDice
  - Power:
    - system.characteristics.pow.value
    - system.characteristics.pow.bonusDice
  - Education:
    - system.characteristics.edu.value
    - system.characteristics.edu.bonusDice
- Attributes:
  - Luck:
    - system.attribs.lck.value
    - system.attribs.lck.bonusDice
  - Sanity:
    - system.attribs.san.value
    - system.attribs.san.bonusDice
  - Movement Rate:
    - system.attribs.mov.value
  - Build:
    - system.attribs.build.value
  - Damage Bonus:
    - system.attribs.db.value
  - Armor:
    - system.attribs.armor.value
- Derived attributes. Only the maximum value of those attributes should be modified. Those changes are applied after all other changes have been made. If that attibute is in auto mode, it will be recalculated with the previous characteristics changes before having it's value affected.
  - Hit Points:
    - system.attribs.hp.max
  - Sanity:
    - system.attribs.san.max
- Skills. Skills are identified by their full names and are case sensitive!
  - Charm
    - system.skills.Charm.value
    - system.skills.Charm.bonusDice
  - Fighting (Brawl)
    - system.skills.Fighting (Brawl).value
    - system.skills.Fighting (Brawl).bonusDice
