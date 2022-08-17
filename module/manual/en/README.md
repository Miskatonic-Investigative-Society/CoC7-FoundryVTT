# System documentation for version 0.8.0

This document is a work in progress overview of the CoC7 system it is not a tutorial for how to use FoundryVTT.

You will need one of the following to play the game

- Chaosium's Call of Cthulhu 7th Edition - Keeper's Rulebook
- Chaosium's Call of Cthulhu 7th Edition - Call of Cthulhu Starter Set
- Chaosium's Call of Cthulhu 7th Edition - Quick-Start Rules

The system automates most of the regular tasks and rules involved with running a game.

Several parts of the actor sheets have pop up tooltips that trigger after two seconds, this delay can be changed in the settings
.

This documentation can be reopened under [fas fa-atlas] Compendiums -> JournalEntry -> System manual -> Call of Cthulhu 7th Edition (Unofficial) [en]

# Recent changes

For a full list of changes checkout the [changelog](https://github.com/Miskatonic-Investigative-Society/CoC7-FoundryVTT/blob/develop/.github/CHANGELOG.md) on GitHub

- @Compendium[CoC7.system-doc.VdOeGcxsu3jsVm3F]{Chases}
- @Compendium[CoC7.system-doc.xV4Hxxmu6zjIMw9h]{Actor importer} - added The Dhole's House JSON support
- @Compendium[CoC7.system-doc.rmtiwtbixojhyf5v]{Active effects} - implementation of active effects
- Active effects added to @Compendium[CoC7.system-doc.fk040vqb4per5ju1]{links} and @Compendium[CoC7.system-doc.emuu3wo0uul91029]{Link creation tool}

# Overview sections below

If this is your first time it is recommends you also read the following sections on this page.

Foundry VTT is based in actors and items. This module includes a number of system specific actors and items, and some examples of them can be found in the included system compendiums.

- Actor overview
- Items overview
- Settings overview
- Scene menu overview
- Keyboard and mouse shortcuts
- @Compendium[CoC7.system-doc.nVYLlqVzmUV5dXAW]{Creating your first investigator}
- @Compendium[CoC7.system-doc.uug1mm5nokly4o2v]{Character creation}

# How to use the system

- @Compendium[CoC7.system-doc.rmtiwtbixojhyf5v]{Active effects} - An active effect will modify an actor characteristic(s), attribute(s), skill(s).
- @Compendium[CoC7.system-doc.xV4Hxxmu6zjIMw9h]{Actor importer}
- Actor Type: Character (TODO)
- Actor Type: Container (TODO)
- Actor Type: Creature (TODO)
- Actor Type: NPC (TODO)
- Chat link creator (TODO)
- Character creation mode (TODO)
- @Compendium[CoC7.system-doc.nk68b2ew15iw0bb8]{Combat} (TODO)
- Development phase (TODO)
- @Compendium[CoC7.system-doc.di6mcnaxfyi0y2l4]{Item Types} (TODO)
- @Compendium[CoC7.system-doc.kv2tbz6x29cq6ewq]{Item Type: Archetype} (TODO)
- @Compendium[CoC7.system-doc.oruecvy7jne4u4gt]{Item Type: Book} (TODO)
- @Compendium[CoC7.system-doc.VdOeGcxsu3jsVm3F]{Item Type: Chases}
- Item Type: Item (TODO)
- @Compendium[CoC7.system-doc.qa934whpkpauiyc9]{Item Type: Occupation}
- @Compendium[CoC7.system-doc.JU1GCWwc8at7gzJ4]{Item Type: Setup}
- @Compendium[CoC7.system-doc.mz0ulbkecfvv8nw7]{Item Type: Skill} (TODO)
- Item Type: Spell (TODO)
- Item Type: Status (TODO)
- Item Type: Talent (TODO)
- Item Type: Weapon (TODO)
- @Compendium[CoC7.system-doc.emuu3wo0uul91029]{Link Creation Tool}
- @Compendium[CoC7.system-doc.fk040vqb4per5ju1]{Links} (TODO)
- Macros (TODO)
- Rolls (TODO)
- @Compendium[CoC7.system-doc.ce7s8psgyctzx5r1]{Sanity} (TODO)
- Start Rest (TODO)
- XP Gain (TODO)

# Actor overview

- _Character_ - A complete character, usually an investigator. @Compendium[CoC7.examples.JuI2aWDSEuQNKeUI]{Example Character}
- _Container_ - An inventory container. @Compendium[CoC7.examples.r7bDSY4OYKxQYEas]{Example Container}
- _Creature_ - A more simple character, suitable for creatures. @Compendium[CoC7.examples.XE2vjLG03wGfnYLw]{Example Creature}
- _NPC_ - A more simple character, suitable for NPCs. @Compendium[CoC7.examples.4kSvDc4n13oFx8RG]{Example NPC}

# Items overview

- _Archetype_ - A set of skills and other stats that implement a Pulp Cthulhu archetype. These do not trigger automation in the system. @Compendium[CoC7.items.lu04TIRrg9P3vRqY]{Example Archetype}
- _Book_ - An arcane tome that can hold spells and character improvements.
- _Item_ - A piece of equipment.
- _Occupation_ - A set of skills and other stats that implement a CoC occupation. @Compendium[CoC7.items.NOsh6EdNSjpjahDF]{Example Occupation}
- _Setup_ - A set of default configurations for character, creature, or NPC creation. @Compendium[CoC7.items.CcH7CdXGtGTjMSCg]{Example Setup}
- _Skill_ - A skill with a base percentage and some tags. @Compendium[CoC7.skills.UOuN0gESXPp2HXwH]{Example Skill}
- _Spell_ - A magic spell.
- _Status_ - An phobia or mania condition. @Compendium[CoC7.items.DVdvEDizPZPux1pK]{Example Mania}
- _Talent_ -A special power for Pulp Cthulhu. These do not trigger automation in the system. @Compendium[CoC7.items.yqvwz769ZeJplOW7]{Example Talent}
- _Weapon_ - An item with weapon statistics (this includes unarmed attacks). @Compendium[CoC7.items.3elxAwnv7WCUNwng]{Example Weapon}

# Settings overview

Click on the [fas fa-cogs]Game Settings tab then under the Game Settings heading click on [fas fa-cogs]Configure Settings.

Click on [fas fa-cogs]System Settings

- _Variant/Optional Rules_ - Here you can turn on individual Pulp Cthulhu rules and other optional rules
- _Initiative Settings_ - Additional settings for optional initiative rule
- _Roll Settings_ - Default options for rolls
- _Chat Cards Settings_ - Configure chat messages
- _Scene Settings_ - Scene Settings
- _Game Artwork Settings_ - This allows you to set a custom pause icon and message
- _Sheet Settings_ - This allows you to change character sheet settings and optional CSS
- _Weapon Settings_ - Weapon Settings
- _Developer And Debug Settings_ - These settings can break your world when new updates are released so only use them on test worlds
- _Roll Table Settings_ - When sanity rolls are made the system can automatically roll for a bout of madness. You can see example roll tables in the Sanity Roll Table compendiums

# Call of Cthulhu Scene Menu

To access this menu you will need to have an active scene which can be created in the [fas fa-map]Scenes Directory. These options are only available to the Keeper.

- _Keeper's tools_
  - _Development phase_: When enabled, players can make improvement rolls for their marked skills.
  - _Character creation mode_: When enabled, players can distribute points among their skills.
  - _XP gain_: When enabled, a skill will be marked for improvement after a successful check.
  - _Send a decoy roll to players_: When clicked, players will see a fake GM private roll.
  - _Start Rest_: When click, pick characters to perform a rest and roll for XP gains.
- _Roll !_: Used to roll 1d100 with a threshold, difficulty and bonus or penalty dice.
- _Create link_: Create a roll link for players to click

# Keyboard and mouse shortcuts

There are many elements in the sheets that trigger a dice roll when clicked. Usually a dialog is shown to prompt the user for a difficulty and a possible bonus or penalty. This behavior is modified with the following controls:

- Right click on any rollable element to include it in an opposed roll. As long as the card is open, all rolls made
  with a right click will be added to the opposed roll.
- Alt + Right click on any rollable element to include it in a combined roll.
- Shift + Left click on a rollable element will make a roll without asking for difficulty or bonus/penalty.
- Ctrl + Left click on a rollable element will create a roll request. Only available for the GM.
- Alt + Left click on sanity will prompt the player for minimum and maximum sanity loss.
