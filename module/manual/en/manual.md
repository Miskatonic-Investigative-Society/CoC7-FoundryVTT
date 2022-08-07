# System documentation v0.7.12

This document is a work in progress overview of the CoC7 system it is not a tutorial for how to use FoundryVTT.

You will need one of the following to play the game

- Chaosium's Call of Cthulhu 7th Edition - Keeper's Rulebook
- Chaosium's Call of Cthulhu 7th Edition - Call of Cthulhu Starter Set
- Chaosium's Call of Cthulhu 7th Edition - Quick-Start Rules

The system automates most of the regular tasks and rules involved with running a game.

.

This documentation can be reopened under [fas fa-atlas] Compendiums -> JournalEntry -> System manual -> Call of Cthulhu 7th Edition (Unofficial) [en]

.

# Recent changes

For a full list of changes checkout the [changelog](https://github.com/Miskatonic-Investigative-Society/CoC7-FoundryVTT/blob/develop/.github/CHANGELOG.md) on GitHub

.

- @Compendium[CoC7.system-doc.VdOeGcxsu3jsVm3F]{Chases}
- The Dhole's House JSON actor importer

.

# Overview sections below

- Actor overview
- Items overview
- Settings overview
- Scene menu overview

.

# How to use the system

- @Compendium[CoC7.system-doc.nVYLlqVzmUV5dXAW]{Creating your first investigator}
- @Compendium[CoC7.system-doc.VdOeGcxsu3jsVm3F]{Chases}

.

# Actor overview

- _Character_ - A complete character, usually an investigator. @Compendium[CoC7.examples.JuI2aWDSEuQNKeUI]{Example Character}
- _Container_ - An inventory container. @Compendium[CoC7.examples.r7bDSY4OYKxQYEas]{Example Container}
- _Creature_ - A more simple character, suitable for creatures. @Compendium[CoC7.examples.XE2vjLG03wGfnYLw]{Example Creature}
- _NPC_ - A more simple character, suitable for NPCs. @Compendium[CoC7.examples.4kSvDc4n13oFx8RG]{Example NPC}

.

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

.

# Settings overview

Click on the [fas fa-cogs]Game Settings tab then under the Game Settings heading click on Configure Settings.

Click on [fas fa-cogs]System Settings

- _Variant/Optional Rules_ - Here you can turn on individual Pulp Cthulhu rules and other optional rules
- _Initiative Settings_ - Additional settings for optional initiative rule
- _Roll Settings_ - Default options for rolls
- _Chat Cards Settings_ - Configure chat messages
- _Scene Settings_ - Scene Settings
- _Game Artwork Settings_ - This allows you to set a custom pause icon and message
- _Sheet Settings_ - This allows you to change character sheet settings and optional CSS
- _Weapon Settings_ - Weapon Settings
- _Developer And Debug Settings_ - These settings can break your world when new updates are released so only use them on test world
- _Roll Table Settings_ - When sanity rolls are made the system can automatically roll for a bout of madness. You can see example roll tables in the Sanity Roll Table compendiums

.

# Call of Cthulhu Scene Menu

To access this menu you will need to have an active scene which can be created in the [fas fa-map]Scenes Directory.

- _Keeper's tools_ - Here you can toggle character creation mode, character development phase, actor importer, toggle automatic XP gain on a success, and start a rest
- _Roll !_ - Create a roll in chat
- _Create link_ - Create a roll link for players to click
