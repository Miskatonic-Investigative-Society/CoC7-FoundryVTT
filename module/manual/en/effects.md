# Effects

The system allows for the creation of Active Effects.
An active effect will modify an actor characteristic(s), attribute(s), skill(s).
Effects can be created as a @Compendium[CoC7.system-doc.fk040vqb4per5ju1]{links} using the @Compendium[CoC7.system-doc.emuu3wo0uul91029]{Link creation tool} or directly in the character sheet by clicking the [game-icon game-icon-aura] button.

## Effects tab

Effects will be display in the effect tabs on the character sheet.

![effects tab](../../assets/manual/effects/effects-tab.jpg)

Effect are broken down in 4 categories for PC :

- Status: those are effects used and created by the system (Wounds status, prone, insane ...). Those effects do not include any changes.
- Temporary: those are effects with duration.
- Passive: those are permanent effects.
- Innactive: those are disabled effects.

For NPC/Creatures you will only see 2 sections: active and inactive effects.
When an effect is not inactive, the correcponding changes will be applied to the actor.

## Creating effects

You can create effect by clicking the Add button.
This will bring the effect creation window.
This windows has 3 tabs

### Details tab

![Details tab](../../assets/manual/effects/details-tab.jpg)

### Duration tab

![Duration tab](../../assets/manual/effects/duration-tab.jpg)

### Changes tab

![Changes tab](../../assets/manual/effects/changes-tab.jpg)

This last tab will includes all changes made to the character sheet.

## Changes

An effect includes a list of changes. Each change needs to be addressed with the corresponding data path.
The available changes are :

- Characteristics: data.characteristics.\[charactetistic\].value
  - available \[charactetistic\] are: str, con, siz, dex, app, int, pow, edu
- attributes:
  - mov: data.attribs.mov.value
  - build: data.attribs.build.value
  - bonus damage: data.attribs.db.value
  - armor: data.attribs.armor.value
- derived attributes. Only the maximum value of those attributes should be modifed. Those changes are applied after all other changes have been made. If that attibute is in auto mode, it will be recalculated with the previous characteristics changes before having it's value affected.
  - max hit points: data.attribs.hp.max
  - max sanity: data.attribs.san.max
- skills. Skills are identified by their name without specialization. Skill names are case sensitive !
  - data.skills.Handgun.value
