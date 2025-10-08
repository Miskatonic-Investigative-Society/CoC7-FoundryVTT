# System documentation for version 7.21

This document is a work in progress overview of the CoC7 system it is not a tutorial for how to use FoundryVTT.

You will need one of the following to play the game

- Chaosium's Call of Cthulhu 7th Edition - Keeper's Rulebook
- Chaosium's Call of Cthulhu 7th Edition - Call of Cthulhu Starter Set
- Chaosium's Call of Cthulhu 7th Edition - Quick-Start Rules

The system automates most of the regular tasks and rules involved with running a game.

Several parts of the actor sheets have pop up tooltips that trigger after two seconds, this delay can be changed in the settings

This documentation can be reopened under [fas fa-cogs]Game Settings -> Help and Documentation -> View CoC7 System Manual

# Recent changes

For a full list of changes checkout the [changelog](https://github.com/Miskatonic-Investigative-Society/CoC7-FoundryVTT/blob/develop/.github/CHANGELOG.md) on GitHub

 - Chaosium Canvas Interface [CCI](cci.md)
 - Using [Compendiums](compendiums.md) to update your text

# Chaosium Modules
- [Call of Cthulhu® - Starter Set](https://foundryvtt.com/packages/cha-coc-fvtt-en-starterset) - Contains three scenarios (Paper Chase, Edge of Darkness, and Dead Man Stomp) and instructions for playing Call of Cthulhu 7th edition.
- [Call of Cthulhu® - Quick-Start Rules](https://foundryvtt.com/packages/cha-coc-fvtt-en-quickstart) - Contains The Haunting scenario and a beginner guide to FoundryVTT and Call of Cthulhu 7th edition.
- [Call of Cthulhu® - FoundryVTT - Investigator Wizard](https://foundryvtt.com/packages/call-of-cthulhu-foundryvtt-investigator-wizard) - Released with permission from Chaosium contains archetypes, occupations, setups, and skills for use with the Investigator Creation Wizard.
- [Call of Cthulhu® - Core Content](https://foundryvtt.com/packages/cha-coc-fvtt-en-keeperitems) - The Core Content package contains everything you need to play Call of Cthulhu on Foundry including lethal weapons, forbidden tomes, arcane spells, eldritch horrors, and more!

# Overview sections below

If this is your first time it is recommends you also read the following sections on this page.

Foundry VTT is based in actors and items. This module includes a number of system specific actors and items, and some examples of them can be found in the included system compendiums.

- [Actor overview](#actor-overview)
- [Items overview](#items-overview)
- [Settings overview](#settings-overview)
- [Scene menu overview](#call-of-cthulhu-scene-menu)
- [Keyboard and mouse shortcuts](#keyboard-and-mouse-shortcuts)
- [Creating your first investigator](first_investigator.md)
- [Character creation](character_creation.md)

# How to use the system

- [Active effects](effects.md) - An active effect will modify an actor characteristic(s), attribute(s), skill(s).
- [Actor importer](actor_importer.md)
- Actor Type: Character (TODO)
- Actor Type: Container (TODO)
- Actor Type: Creature (TODO)
- Actor Type: NPC (TODO)
- [CCI](cci.md)
- Chat link creator (TODO)
- Character creation mode (TODO)
- [Combat](combat.md) (TODO)
- [Compendiums](compendiums.md)
- Development phase (TODO)
- [Item Types](items.md) (TODO)
- [Item Type: Archetype](item_archetype.md) (TODO)
- [Item Type: Book](item_book.md) (TODO)
- [Item Type: Chases](chases.md)
- Item Type: Item (TODO)
- [Item Type: Occupation](item_occupation.md)
- [Item Type: Setup](item_setup.md)
- [Item Type: Skill](item_skill.md) (TODO)
- Item Type: Spell (TODO)
- Item Type: Status (TODO)
- Item Type: Talent (TODO)
- Item Type: Weapon (TODO)
- [Link Creation Tool](link_creation_window.md)
- [Links](links.md) (TODO)
- Macros (TODO)
- Rolls (TODO)
- [Sanity](sanity.md) (TODO)
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
- _Status_ - An phobia or mania condition. @Compendium[CoC7.en-wiki-phobias-and-manias.Item.RSBgVRZFUDDCNhXo]{Example Mania}
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
