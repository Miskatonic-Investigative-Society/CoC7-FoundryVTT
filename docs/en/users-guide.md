# Actors and Items

Foundry VTT is based in actors and items. This module includes a number of system specific actors and items,
and some examples of them can be found in the included system compendiums.

## Actors

This system includes four types of actors:

- character: A complete character, usually an investigator.
- npc: A more simple character, suitable for NPCs.
- creature: A non-human NPC.
- vehicle: Not yet implemented

## Items

As for items, these are the types available:

- item: A piece of equipment.
- weapon: An item with weapon statistics (this includes unarmed attacks).
- skill: A skill with a base percentage and some tags.
- setup: A set of default configurations for character creation.
- occupation: A set of skills and other stats that implement a CoC occupation.
- archetype: A set of skills and other stats that implement a CoC archetype.
- book: An arcane tome.
- spell: A magic spell.
- talent: A special power for Pulp Cthulhu.
- status: An insanity condition.

# Creating a character

Before creating a character you should probably create some items (some of them can be taken from the compendiums):

- A setup. You can choose some default details for all your characters, a list of default skills and a method to
generate characteristics (distributing points or rolling dice).
- A bunch of occupations. You can take their skills from the compendiums.
- You might want to create some items, weapons, talents or archetypes.

The GM must enable 'Character creation mode' from the toolbar.

Once you have these items, create a new actor of 'character' type, and drag your setup from the sidebar and drop it
on the character sheet. A dialog will appear to distribute points or roll dice for the characteristics. After clicking
on 'Validate', the scores will be copied to the sheet, and it will be filled with the default list of skills and their
base percentages.

Then, drag and drop an occupation on the character sheet. If 'Character creation mode' is enabled, there will be
a 'Development' tab in the character sheet. There, each skill has a field for personal interest points, and occupation
skills have a field for occupation points. You need to distribute your points until all are spent, which you can see
in the left column of the 'Development' tab.

You can then drag and drop any items, talents, etc. When you are finished, lock the sheet using the padlock button.

# Tools

There are some system specific buttons in the toolbar, available only to the GM:

- Keeper's tools
    - Development phase: when enabled, players can make improvement rolls for their marked skills.
    - Character creation mode: when enabled, players can distribute points among their skills.
    - XP gain: when enabled, a skill will be marked for improvement after a successful check.
    - Send a decoy roll to players: when clicked, players will see a fake GM private roll.
- Roll dice: used to roll 1d100 with a threshold, difficulty and bonus or penalty dice.


# Keyboard and mouse shortcuts

There are many elements in the sheets that trigger a dice roll when clicked. Usually a dialog is shown to prompt the
user for a difficulty and a possible bonus or penalty. This behavior is modified with the following controls:

- Right click on any rollable element to include it in an opposed roll. As long as the card is open, all rolls made
with a right click will be added to the opposed roll.
- Alt + Right click on any rollable element to include it in a combined roll.
- Shift + Left click on a rollable element will make a roll without asking for difficulty or bonus/penalty.
- Ctrl + Left click on a rollable element will create a roll request. Only available for the GM.
- Alt + Left click on sanity will prompt the player for minimum and maximum sanity loss.
