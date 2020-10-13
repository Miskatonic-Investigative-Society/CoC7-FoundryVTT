# My Call of Cthulhu implementation for Foundry VTT

My implementation of the call of Cthulhu for foundry-vtt  

## Disclaimer

This system doesn’t include any materials from the books and you’ll have to enter manually, weapons, skills, items etc… to be able to play.
I’ve just provided some basics skills that you can use.

I’m testing my dev on Chrome. Not sure how or if it will behave on other browser.

## Installation/usage

Install in foundry VTT from the Game Systems tab using the following manifest :  
<https://raw.githubusercontent.com/HavlockV/CoC7-FoundryVTT/master/system.json>  

Compendium 'Examples' contains a 1920's character sheet, you just need to import it to start a character. Contains also a NPC and a creature example.  
Compendium 'Skills' contains a set of basic skills that you can use for your PC/NPC.  
Compendium 'Weapons' contains a single test weapon.  

## What is working

version 0.3.9 :

* Bug correction:
  * Typo correction and missing strings.
  * Damage card displays roll correctly.
  * When holding shift while clicking on a weapon damage this will make the damage critical.
  * Occupations, Archetypes and Setups can have multiple generics specializations e.g. Art/Craft(Any).
  * Add-weapon button fixed.
* Occupation type added : Pulp.
* Spanish translation updated thanks to Lozalojo.

version 0.3.8 :

* SAN can be displayed as a bar on token.
* Bug correction:
  * when weapon malfunction threshold was 100 spending luck on the roll was resulting in a malfunction.
  * spells can be added to books from compendium.
* When adding a weapon to a character the system will try to find the matching skill (if the weapon specifies one).
  * If no skill is found, the system will create the corresponding skill and open the skill sheet for you to crosscheck and fill the base value.
* New tab added to the character sheet for character development. In this tab you can:
  * see/modify how skills are calculated (base + personal + occupation + experience).
  * roll your skills for development. You can either click each skill individually or trigger a check for all skill by clicking the 'development' button.
* Controls have been added for the GM.
  * Controls are located under the token group.
  * the first one allows the skill to be rolled for XP for all players.
  * the second one allows player to modify their skills value and allocates points (useful for character creation).
  * A validation report is displayed on top of the development tab.
* You can now add weapons and skills to the macro bar.
  * If you are a player, your default character is used for the macro unless you have an owned token selected.
  * If you are the GM you need to have an actor selected before clicking the macro.
  * Macro skills/items are retrieved using names. If 2 weapons have the same name the first retrieved is used.
* New items added : setup, occupation and archetype.
  * setup: A character setup that can contains a list of skills, items, characteristics (points allocation or rolls). Drop this on a character.
  * occupation: You can create occupation for your character. Dropping an occupation on a char will create corresponding skills if they don't exist, flag them as occupation skills and calculate your occupation points.
  * archetype: Same as occupation for pulp (Pulp rules need to be enabled).
  * [Example of char creation](https://www.youtube.com/watch?v=OnUPIgj4Gdc&t=4s)
* Spanish translation updated thanks to Lozalojo.

version 0.3.7 :

* Bug correction:
  * Typo on the character sheet.
  * Typo correction on the range chat-card.
  * Typo correction malus->penalty.
  * Calculation of bullets fired was wrongly deducted from the weapon magazine.
* On the range chat-card, the fast option is not default anymore.
  * When targeting a target with MOV of 8+, the fast option will not be selected by default. Instead, selecting fast for a target with MOV less than 8 will trigger a warning. You will still be able to select it.
* Added distance to target on the range chat-card.
  * Distance are calculated center of token to center of token. This may have an incidence on what the ruler displays if, for example, your token is 2x2 on a square grid (in that case you can't put the ruler end on the center of the token).
  * You can now see the distance from the target below the target selector in the chat-card and on the tool-tip of the target.
* Added an option to restrict measurement to grid space.
  * By default, for combat range calculation, the distance measured is the euclidean distance. To see that distance using the ruler you'll need to hold shift while measuring. An option is added to use grid spaces instead of euclidean distance. By selecting it, distance will be calculated as per the default ruler for that grid type (Grid less; Square, Hex...)
* Spanish translation updated thanks to Lozalojo.

version 0.3.6 :

* Addition of pulp talents (To be tested, I’m not familiar with Pulp Cthulhu, all of this is mainly cosmetic, no automation implemented so far)
  * There's a new sheet for pulp talents.
  * Talents can be dragged/dropped on actors (PC & NPC).
  * Talents are displayed as a section of the "Gear&Cash" tab.
  * Talents have no effect in play (e.g. the "Resilient" talent will NOT be taken in account for sanity loss, you'll have to do it "manually")
* Two fields added to the character sheet for pulp heroes (Archetype and Organization).
  * To have those displayed, as well as the auto HP calculation you will have to enable the "Pulp Rules" option from the system's options.
* Bug correction: Ammo loaded in weapons is now correctly saved between sessions.
* On the combat chat card you can now increase/decrease the volley size in full-auto mode.
* Added option to ignore bullets limitation.
* Added option to ignore uses per round limitation.

version 0.3.5 :

* Automatic damage.
  * When a combat card is resolved an option will appear to automatically deal the damage to the target(s).
  * When damage is dealt status (major wounds, dying, unconscious...) will be triggered.
  * When receiving major wounds status a CON roll card will be triggered.
  * When dying, the only option for the player will be ti do a CON roll by clicking on the dice in the header of the sheet.
  * On failing a dying CON check or receiving more damage than max HP a player will die.
  * When dying or death, the actor portrait will be replaced by the dying/death icon.
  * Only the keeper can clear the dying/dead status by DOUBLE clicking on the portrait.
* Ammunition/Uses per round.
  * Using a range weapon will now compare the number of bullet shot to the number of bullets available.
  * Shots will be limited by the max uses/round of the weapon.

version 0.3.4 :

* Inventory tab added to NPC and Creatures. Inventory can contains items, books and spells.
  * Items, book and spells can be dragged/dropped.
  * Any empty section will not be displayed.
  * Is empty the inventory will not be displayed.
* Close combat flow: if the target is a PC, only GM can see the initiator roll.
  * The PC has to choose to retaliate/dodge without knowing the outcome of the attack.
  * GM can see everything.
* Creature and NPC sheet design sliglty reworked.
* Japanese transalation updated thanks to AdmiralNyar.

version 0.3.3 :

* Inventory (Gear&Cash tab) displays items, books and spells.
  * clicking on a section will toggle the display of it's content.
  * clicking on an item name will display it's description.
* Combat tracker now correctly displays actor's turn.
  * Option added for initiative. You can select the regular (DEX value) or the optional (DEX roll) initiative rule.
  * A small target icon has been added to each combat participant. Clicking it will ready the actor's gun and modify it's initiative.
* Spells can now be properly dragged and dropped to and from books.
* Token will now correctly displays bars.
* Skills will now popup in a separate window.
* Option added for Pulp HP.
* Bug correction on skill specialization localization.

version 0.3.2 :

* First implementation of SAN checks (to be localized):
  * You can select one or many targets and click on the new SAN loss field in the creature sheet to trigger a SAN check.
  * Keeper can then apply the SAN loss to the PC/Actor.
  * Rule - Getting Used to the Awfulness (Keeper's rule book P169) - not yet implemented.
  * Optional rules not implemented.
* PDFoundry removed !!
  * PDFoundry is now a fully independant module (as per 0.7.x+). Install it and convert your existing items to jounal entries.
  * Thanks to Djphoenix719 for this amazing module.
* Spanish translation by Gerbek and lozalojo merged.
* Japanese translation by AdmiralNyar merged.
* Unknown difficulty text fix by DavidCMeier merged.
* Coming next :
  * Missing sheets (items, vehicules, *talents, occupation* ...) coming ASAP.
  * Hardening of what has been implemented so far.
  * Lot's of requests for PULP cthulhu, I'm having a look at it.

version 0.3.1 :

* Templates for books and spells added.
  * You can add a spell to a book by dragging it (from item directory only for the time beeing) on the book.
* Bug fix, luck amount spent is now correctly displayed on the roll result.
* Japanese translation improved thanks to AdmiralNyar

version 0.3.0 :

* Hot fix on luck spent.

version 0.2.9 :

* Bug fix forcing a fail or a pass should work as intended.
  * Doing so will show a fail or a pass to the player.
* Bug fix, a combat roll will now flag the skill for experience correctly.
* You can now 'cheat' bu modifying the success level of the rolls before revealing the (blind rolls only)
  * On blind rolls you have 2 new buttons for the keeper use only: increase/decrease success.
  * Once your happy with the result push reveal check.
  * Experience will not be flagged, keeper needs to manually award it with the corresponding button.
* On blind roll, the level of success will not be revealed until you push reveal check button.
  * Pushing force fail/pass will just indicate to the player the failure or the success with no level indication.

version 0.2.8 :

* Bug fix/improvement on melee flow cards.
  * Synthetic actors and token are retrieved from the viewed scene (use to be from active scene).
  * Actors and target retrieval hardened.
  * Flow simplification (Resolution card is replaced after resolution).
* Rolls received a lot of work.
  * Success level is displayed as medals (critical), stars (success), spiders (failure) or skull (fumble).
  * Addition of unknown difficulty rolls.
    * Selection of difficulty is done in the roll dialogue. Select the '???' options.
    * Default mode (unknown difficulty or normal difficulty) can be selected in the world options.
    * Player rolling can see his numbers but not the check difficulty. He can spend luck to improve his success.
    * Roll difficulty and success level is revealed upon difficulty selection by the keeper.
  * Unknown difficulty check can be rolled as normal check (public, private and blind).
* ただいま#0125 Dicebot module has been integrated and will be supported in the system.
  * Type commands /cc and /cbr to use it.
  * /cc xx will roll a D100 vs a xxx difficulty and display the level of success.
  * /cbr xx, yy will roll a D100 vs xx and yy difficulty and display the level of success.
* Japanese translation improved and augmented thanks to ただいま#0125!
* Localization continues thanks to the efforts of Kael79#8036.
* French translation improved and augmented thanks to Kael79#8036.
* French discord community is helping with debugging and testing (special thanks to Carter#2703 and Drakenvar#8665).
* Tutorial videos are on the way !

version 0.2.7 :

* Bug fix/improvement on melee flow cards.
  * Addition of portraits on cards.
  * Double click on chatcard icons will open corresponding actor.
* Implementation of blind and private GM rolls.
  * Keeper has the possibility to force the check to pass or to fail.
  * Keeper has the possibility to reveal the check result.
  * Awarding experience automatically is disabled for blind check. Keeper can award experience.

version 0.2.6 :

* Modification of rolls and dice to be compatible with 0.7.x.
  * 0.7.x bring a lot of changes. __This needs more testing. I *strongly* recommend to wait before upgrading to 0.7.x__

version 0.2.5 :

* Bug correction on creature sheets.
  * Size is now limited and content will be scrolled.
  * Weapon damage is now correctly entered.
  * Added a small reminder for bonus damage after weapons damage formula

version 0.2.4 :

* Range combat supports shotguns.
* Bug correction (spending luck on luck and SAN rolls no more possible).
* Slight range combat refactoring (more to come at a later stage. Aim is to reduce size and number of cards).
  * Additions of icons to the cards.
  * Bonus, penalties, target response have been moved to the card tooltip once the card is resolved.
* Spanish translation updated thanks to Gerbek.

version 0.2.3 :

* Hotfix.

version 0.2.2 :

* PDFoundry Integration.
* First implementation of range combat.
  * Weapon sheet has been modified.
  * select a target (or not) and in the combat tab click on a range weapon name. This will start the range combat flow and open a range combat chat-card.
  * All bonus and penalties can be overridden by the keeper only.
  * Range and difficulty are automatically calculated.
  * Bonus for target size, speed are automatically applied.
  * Bonus for shooting at point blank is automatically given.
  * Calculation of bullets wasted when switching target in automatic fire mode.
  * Penalty dice for multi/auto fire are applied.
  * Difficulty automatically increased with mode than 2 penalty dice.
  * If you don't have a target a fake 'dummy' target will be created.
  * Supports auto-fire, burst, single shot, multi shots.
  * Supports weapon malfunction.
  * Damage rolls (armor is not taken in account).
  * What is coming next:
    * Implementation of shotgun type weapons and explosives.
    * Distribution of damage to the targets and status applied.
    * Attribution of malfunction to the corresponding weapons.
    * Implementation of fast forwarding for range and melee combat.
    * Implementation of bullets.
    * Limitation on number of shot fired (depending on the weapon max shot per rounds and bullets in the magazine).
* Support for Japanese translation thanks to AdmiralNyar.
* Bugs correction
  * Movement calculation.

version 0.2.1 :

* Template and CSS correction.

version 0.2.0 :

* Implementation of experience tracking.
  * A successful (no bonus, not pushed, no luck used) check will flag a skill for development. A skill flagged for development will show a gold star next to it’s score. You can flag or un-flag a skill by double clicking on the corresponding star in the skill tab.
  * Addition of a new skill property 'No XP gain'. Set to false by default. A skill with this property enabled will not benefit from experience tracking.
  * Unlock the character sheet to access the 'Development phase' button. Clicking it will roll experience and increase all skills accordingly.
* Implementation of cash and assets under the Gear & Cash tab. Spending level, Cash ans Assets are calculated automatically according to 1920’s CoC rule book.
  * Unlock the character sheet to allow modification of the calculations.
  * Clicking the cog will toggle between manual and automatic modes.
    * In manual mode (gray cog), just enter whatever you feel like in the fields.
    * In automatic mode (green cog), you can change the monetary symbol and factor. By default the system uses $ and a factor of 1. The factor will just multiplies all values. Enter 20 for modern CoC for example.
  * Addition of a spent counter. It is to track cash spent today and check it against the available cash.
  * Addition of an 'Assets details' section.
  * Addition of a 'Notes' section.
* Implementation of backstory tab. Some backstory element are proposed with the default 1920’s character sheet.
  * Unlocking the character sheet will allow you to:
    * add a new section (Add section button).
    * change section names.
    * delete a section (Trash icon next to the section name).
    * change sections order (Up and Down arrows next to the section name).
* Addition of daily sanity loss counter and reset counter button.
  * Upon changing sanity all losses will be recorded.
  * Loosing 5 points at once or loosing more than 1/5 of current sanity will lit the according status (Indefinite insanity, temporary insanity).
  * Clicking on the reset button next to the counter will reset it to 0.
* Improvment of the combat tab.
  * Melee and range weapon are shown in different sections
  * The combat skill will show at the bottom of the combat section.
  * Unlock the sheet to allow modifications of skills and weapons.
* Addition of calculation of average values for characteristics of creatures and NPC.
  * Unlock the creature/NPC sheet, pass the sheet in 'values' mode (icon next to the lock should display a small person with a pen).
    * The red dices will roll characteristics when a formula is available.
    * The red scale will average characteristics values when a formula is available.
  * In 'formula' (icon next to the lock should display a small square-root symbol) you can now reference other characteristics (Enter @POW for example to set that characteristic to the same value as POW).

version 0.1.9 :

* Rework of the close combat mechanism. Select a target click on the weapon name and select the different options on the chat cards.
* Implementation of damage bonus on weapon damage roll.
* You can now override the auto calculation of max HP and MP for PC. Click the lock to edit the sheet, there will be a green cog next to max HP and MP. Clicking it will toggle between manual and auto calculation of max HP/MP.
* Typo corrections.
* German translation, thanks to MrViso.

version 0.1.8 :

* Started to implement the combat mechanisms (close combat only).
  * You can select one or many targets and click on a weapon name in the combat tab/section.
  this will open a roll window where you can roll the attack, select if you're outnumbered and choose options for defense (dodge/fight back/maneuver).
  When all participants have rolled, the card will show the results and propose to roll the damage.
  * You will see the corresponding option (roll attack or defense) only if you are the owner. Result will be public.
  * If you have enough, you can spend luck to pass a failed check. This will update the result card. Spending luck to increment your success is not implemented yet.
  * Now working on improving/debugging the flow before implementing attack maneuver (trample for example) before moving to range weapon attack.
* Addition of a small cog next to attributes in NPC/Creature sheets. Clicking it will toggle the attribute to auto calculation (green cog) or manual input (gray cog).
* Creatures are now created with a fighting skill and a natural attack. This will be extended soon to PC/NPC sheets.
* Added the lock mechanism to the PC sheet.
* Added the add skill/weapon/item to the PC sheet.
* Be aware this is an 'experimental' increment, template had to be modified. I did my best but I can't assure that previously created entities will work.

version 0.1.7 :

* Added a lock switch to allow editing of NPC/Creature sheet
  * When locked you still can modify some of the sheet numbers by double clicking on them.
  * Unlocking the sheet will allow more advanced modifications and additions of entities.
* You can add skills/items directly from NPC/Creature sheet, without the need to pull them from compendium or items.
  * Upon clicking the + sign the corresponding entity will be created and the corresponding entity sheet will open.
  * Holding shift while clicking the + sign will not open the sheet just create a generic entity.
* Creatures have a formula button, allowing to enter formulas instead of characteristics.
  * Formulas need to be valid roll strings (like the /r command).
* Starting to implement localization.  

version 0.1.6 (07/06):

* Lock mechanism to avoid inadvertent actor modification (NPC only so far).  
* Implementation of basic NPC sheet.
* Using basic NPC sheet for creature.
* Bug correction:
  * You can add many time the same weapon or item, not twice the same skill with the same name.

Version 0.1.5 (01/06) :  

* Luck and San roll implemented.  
* Start implementing NPC sheet with only attributes and skills.  
* Mention of eras in skills removed. It is much simpler to just create a character sheet template and a compendium for each setting.
* Attributes (HP, MP, San, Luck) values can bet set using the mouse-wheel.
* Bug correction:
  * Parasite (future) windows during skill roll removed.  

Version 0.1.4 (31/05) :

* You can spend luck (providing you have enough) to pass a failed check.  
* You can push a skill if it is 'pushable' (pushed enabled on the skill sheet).  
* Typo correction.  

Version 0.1.3 :  

* The character sheet.  
  * You can enter your characteristics. Entering them will update the attributes (max HP, MP …).  
  * If a field is not editable it’s because it’s locked (black border). Double clicking on it will unlock it (red border, this is to prevent inadvertent modifications).  
  * Manually modifying an automatic field  (like max HP) will remove the auto calculation. To reset it, set it to -1.  
* You can roll skills from the sheet by clicking the icon.  
* You can roll your weapons from the combat tab. If the weapon is tagged as ‘Full-Auto’ you will see 2 clickable zones reflecting the 2 different skills used in normal and auto mode.  
  * If the background is red, that’s because no skill have been attached to that weapon, edit the weapon to assign a skill to roll.  
* You can roll a characteristics by clicking his name
* Clicking the icon/name will perform and advanced roll (dialogue selection for penalty/bonus and difficulty).  
* Holding shift while clicking will roll the dice with no penalty vs regular difficulty.  

## Future plans

* [ ] Correcting bugs.  
* [x] Implement luck rolls.
* [x] Implement Creatures (with automatic and average carac/skill calculation).
* [x] Implement NPC (with automatic and average carac/skill calculation).
* [x] Implement creations of skills directly from the sheets.
* [x] Implement experience tracking.
* [x] !!WIP. Implement localization.
* [ ] Working on CSS/HTML to improve the look.  
* [x] Improving the combat tab, by adding combat skill to the weapon list.  
* [ ] Automatic skill assignment when adding a weapon.  
* [ ] Combat automation (calculation of difficulty, assignement of damage, opposed check...).  
* [x] Implement pushed rolls.  
* [ ] Implement advanced rolls (opposed, combined etc…).  
* [ ] Implement car chases.  
* [ ] Automation of character creation.
