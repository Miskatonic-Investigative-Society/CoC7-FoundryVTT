# My (Unofficial) Call of Cthulhu implementation for Foundry VTT

My (Unofficial) implementation of the call of Cthulhu for foundry-vtt  

## Disclaimer

This system doesn’t include any materials from the books and you’ll have to enter manually, weapons, skills, items etc… to be able to play.
I’ve just provided some basics skills that you can use as example.
This system is completely Unofficial.

I’m testing my dev on Chrome. Not sure how or if it will behave on other browser.

## Installation/usage

Install in foundry VTT from the Game Systems tab using the following manifest :  
<https://raw.githubusercontent.com/HavlockV/CoC7-FoundryVTT/master/system.json>  

Compendium 'Examples' contains a 1920's character sheet, you just need to import it to start a character. Contains also a NPC and a creature example.  
Compendium 'Skills' contains a set of basic skills that you can use for your PC/NPC.  
Compendium 'Weapons' contains a single test weapon.
Compendium 'Roll Requests' contains numerous links for all your needs.

## What is working

verison 0.5.2 :

* Bug correction:
  * Corrected a bug on inline check where the full actor was embeded. ( This is a temporary fix until refactorisation.)

verison 0.5.1 :

* Bug correction:
  * Corrected a bug preventing attribute and sanity to be dragged onto a jounal entry to create a link.
  * Corrected a bug on sanity chat-card where the full actor was embeded in the card resulting in high chat-log size. ( This is a temporary fix until refactorisation.)
  * PR #373 thanks to Pengouin. Fix a bug on MAC where ctrl key wasn't properly implemented.

version 0.5.0 :

* General reminder:
  * Most sheet component can be clicked on the trigger a check/roll.
  * As a general rule you can modify those requests:
    * shift will fast forward the request [Partial implem. (characteristics/attributes/skills only)].
    * ctrl [GM only] will create a link in the chat with that request [Fully implem.].
    * alt will modify the comportment [sanity only (will allow selection of loss min/max)].
  * You can combine stuff. shift+ctrl+alt+click sanity will create a san check link in the chat without difficulty/penalty selection for the alt sanity (will ask you for min/max)
* Bug correction:
  * a bug preventing the chatCards to retrieve unassigned actors corrected.
  * #201 Scroll to end of chat on message change.
  * #361 Item description bug.
  * Insanity Side-Effects 3: Insanity and the Cthulhu Mythos rule (P163 of keeper's handbook) is now correctly implemented. 5% on first mythos related insanity (used to be per creature), 1% on the following.
  * Minor label correction on setup items.
* Option added to create sanity chat card from sheet.
  * holding alt while clicking on sanity will open a dialogue to enter sanity loss (min and max).
  * holding shift in the mean time will fast forward the bonus/penalty/difficulty selection dialogue.
  * holding ctrl in the mean time will, if you're the GM, create a CoC7 link in the chat log.
* Option added to allow/prevent players from unlocking sheets.
  * When unlocking is disabled for players, only keeper can unlock the sheet.
  * If the keeper unlock the sheet the player will see an unlocked sheet.
  * Upon exiting creation mode, all sheets get locked.
* Taiwanese Mandarin translation added thanks to zeteticl.

version 0.4.9 :

* Bout roll tables example added.
  * You can import those talbe from the incliuded 'Sanity Roll Table' compendium. Once imported you need to restart your client.
  * Table VII: Bouts of Madness - Real Time. This table is to be set in the Bout of Madness (Realtime) settings under system settings.
  * Table VIII: Bouts of Madness - Summary. This table is to be set in the Bout of Madness (Summary) settings under system settings.
  * Table IX: Sample Phobias & Table X: Sample Manias are part of the previous tables.
  * Phobias and Manias tables can contain text or a status item. Each table contain text and items.
  * Table rolls are recursive until an item or a text is found.

version 0.4.8 :

* Bug correction/Feature :
  * Kckaiwei helped to tackle some issues :
    * (#323: Pulp talents don't show when added to npc sheet unless another item type is added.)
    * (#222: [Bug] Inventory panel continuously collapsing in creature/NPC templates.)
  * #329 Accent are now sorted correctly (é = e when it comes to sorting).
  * #329 Weapon without skill associated are shown in red.
  * #317 Compatibility issue with The Furnace.
  * #339 Private GM rolls are now seen only by player and GM.
  * #349 setting added to display success level/text. Settings are client scope.
* Sanity system reworked.
  * Card is divided into two main part, The top one for the player, the bottom one for the keeper.
  * System keep track of encountered creatures.
  * If a token creature have a customized san loss (different from orignal actor) it's considered like a different creature from the same specie. e.g. A Byakhee will be a 1/1D6 SAN. A baby will be 1/1D3. A monstrous may be 2/2D6. They all will be the same specie but baby and monstruous will have less/more SAN loss.
    * All creatures of that specie get credited for SAN loss.
    * When rolling the chat card will propose the keeper with option to reset that ceature/specie history.
  * The SAN flow should be fully implemented. Int roll will triggered, bout will make you immune ...
  * A bout of madness result can be rolled from a table. Table to be defined in system settings.
    * A table can contains:
      * A text (including inline deferred or not rolls [[/r 1D10]] [[1D10]]).
      * An other table (for phobia or mania for example).
      * An item of type status (Simple item with a description).
    * Nested calls will be resolved.
    * If the final result is a status (Phobia or mania) it will be added to that character (under Gear&Cash).
* Japanese translation updated thanks to AdmiralNyar.
* Polish translation updated thanks to Yossabart.
* French translation updated.

version 0.4.7 :

* First sheet V2 implementation.
* **Special thanks to Darshyne for providing the initial sheets design.**
  * using [game-icons](https://game-icons.net/) fonts from [seiyria](https://github.com/seiyria/gameicons-font).
  * Skills, development and combat tab completed.
  * Gear and backstory tabs will be reworked later.
* Options added to override sheet look and feel.
  * Upon activation/deactivation of artwork override you have to restart/refresh your client.
  * Leaving a field blank will revert it to default colors/artwork.
  * Setting and image to 'null' will remove it (sheet background and tentacle).
  * Fonts can be changed
    * blank for default font or you can use a custom font e.g. "url( '/fonts/TT2020Base-Regular.ttf')  format('truetype')".
    * you can set 2 types of fonts, normal and bold.
    * you can specify the base font size.
* Português (Brasil) translation added thanks to Vittinho and Lozalojo.
* Spanish translation updated thanks to Lozalojo.
* German translation updated thanks to Barti-meaus.
* Polish translation updated thanks to Yossabart.
* Typo correction thanks to drober76.

version 0.4.6 :

* Bug correction :
  * Regular difficulty was misinterpreted in links.
* Polish translation added thanks to Yossabart.

Version 0.4.5 :

* Bug correction :
  * Internal field datas integrity check missing.
  * Rolling characteristics may provide non integer results.
  * Sheets not set as default are now working as intended. Thank to Sharcashmo for his help.
  * Rolling damage of weapon with DsN was showing the dice twice.
* Max SAN is automatically calculated
  * Skill 'Cthulhu Mythos' is defined in the lang.json.
  * Max SAN is calculated as 99-Cthlhu Mythos.
  * Auto calc can be bypassed in the same way as the other attributes.
* Introducing links.
* **Links TLDR.** Read next paragraph for details.
  * Links are a way for a GM to request for a roll (*Characteristic, Attribute, Skill, SAN loss, Weapon*).
  * Links are created in the chat log. When you click a link it will trigger a check for your(s) controlled/impersonated character(s).
  * Links can be included in any editor, mainly journal entries.
  * Link can be created in 5 ways:
    * By manually typing it (read details below).
    * By CTRL+click on any sheet element (Characteristic, Attribute, skill, SAN loss).
    * By dragging a sheet element (Characteristic, Attribute, skill (+CTRL)) on an editor (Journal entry)
    * By CTRL + dragging an item (skill or weapon) from a compendium or an item directory on an editor. When a link is created that way and the used as a GM, if your controlled character doen't hold the weapon/skill you'll be prompted to create the corresponding item.
    * By using the included compendium written by Lozalojo.
  * Links can be dragged from chat log on an editor.
  * When a link is created the difficulty/penalty selection windows will open. Hold SHIFT to bypass that comportment.
  * When a link is created, the roll mode will be check. If the roll mode is set to 'blind GM roll' the link will be created as blind.
  * When a link is created with a difficulty and a penalty, the difficulty/penalty windows will not pop.
  * When a link is created without a difficulty or a penalty, the difficulty/penalty windows will pop. Holding SHIFT will fastforward the roll (regular/no penalty).
* **Details** First implementation of CoC7 links for chat messages and sheet editors (NPC, Journal entries...).
  * Format of link is @coc7.TYPE_OF_REQUEST[OPTIONS]{TEXT_TO_DISPLAY}
    * TYPE_OF_REQUEST :
      * 'sanloss': trigger a san check, upon failure will propose to deduct the corresponding SAN.
      * 'check': trigger a check depending on the options.
      * 'item': trigger use of a weapon. Only items of type weapon can be triggered.
    * OPTIONS: [] = optional, __*default*__
      * sanloss:
        * sanMax: max SAN loss
        * sanMin: min SAN loss
      * check:
        * type: type of check (characteristic, skill, attrib).
        * name: name of the skill/characteristic/attrib.
        * [blind]: will force a blind check, if not present the check will depend on your selected roll mode.
      * all:
        * [difficulty]: ? (blind), __*0 (regular)*__, + (hard), ++ (extreme), +++ (critical).
        * [modifier]: -x (x penalty dice), +x (x bonus dice), __*0 (no modifier)*__.
        * [icon]: icon tu use (font awesome, __*fas fa-dice*__).
    * TEXT_TO_DISPLAY: Name to display, this is optional.
  * Some examples :
    * `@coc7.sanloss[sanMax:1D6,sanMin:1,difficulty:++,modifier:-1]{Hard San Loss (-1) 1/1D6}`
    * `@coc7.check[type:charac,name:STR,difficulty:+,modifier:-1]{Hard STR check(-1)}`
    * `@coc7.check[type:attrib,name:lck,difficulty:+,modifier:-1]{Hard luck check(-1)}`
    * With icon : `@coc7.check[type:skill,icon:fas fa-arrow-alt-circle-right,name:anthropology,difficulty:+,modifier:-1]{Hard Anthropology check(-1)}`
    * Without name, difficulty nor modifier: `@coc7.sanloss[sanMax:1D6,sanMin:1]`
    * With icon, without name nor difficulty `@coc7.check[type:skill,icon:fas fa-arrow-alt-circle-right,name:anthropology,modifier:+1]`
  * You can drag/drop links from chat to sheets and between sheets.
  * You can drag/drop items and skills on a journal entry while holding CTRL, this will create the corresponding check with regular difficulty and 0 modifier.
  * You can create link in the chat by clicking and holding CTRL from any sheet (PC/NPC/Creature) corresponding characteristic/luck/SAN/Competence/weapon/San loss.
    * This will open the select penalty/difficulty dialogue. Clicking on the generated link will then trigger the check with all parameters.
    * Holding Shift on top will not open the penalty/difficulty dialogue. Clicking on the generated link will open the penalty/difficulty dialogue then trigger the check.
* Skill macro updated to accept and optional 3rd parameter options.
  * e.g. options = {difficulty:'++', modifier:-1, blind:true}. All those parameter are optional, default will be regular difficulty, no modifier, non blind check.
* Chinese translation added thanks to hmqgg.
* Compendium (Journal entries) with links example, courtesy of Lozalojo.

Version 0.4.4 :

* **Last version to support foundry 0.6.x.**
* Bug correction :
  * Portrait correctly displayed on range combat card.
  * Dice roll migration to 0.7.x in dev. phase.
  * Initiative decimals properly set after reload.
  * Distance on range combat card is now memorised when card refresh.
* Optional initiative rule text
  * When using optional initiative rule, you can display the initiative as text instead of number.
  * Settings added to switch between text and values.
* French translation updated thanks to Mandaar
* French translation updated thanks to Ferin29

version 0.4.3 :

* Bug correction :
  * localization for individual development roll added.
  * 1920's Character example updated.
  * Bug on opening character from compendium corrected.
  * Double HP for pulp character corrected.
* German translation updated thanks to Taglar
* Spanish translation updated thanks to Lozalojo.

version 0.4.2 :

* Bug correction :
  * Not having a credit rating skill will not block char creation.
  * Bug correction on DsN V2 with 0.6.6
* Typo correction validate
* Spanish translation updated thanks to Lozalojo.

version 0.4.1 :

* Quick fix, DsN V3 is now working.
* A few settingd added for DsN V3, color set for unit and ten dice, and a setting to sync dice rolls between players.

vesion 0.4.0 :

* Ready for 0.7.5
* The latest version of 'Dice So Nice!' will not work with skills check. You  have to keep an older version to see the dice.

version 0.3.9 :

* Bug correction:
  * Typo correction and missing strings.
  * Damage card displays roll correctly.
  * When holding shift while clicking on a weapon damage this will make the damage critical.
  * Occupations, Archetypes and Setups can have multiple generics specializations e.g. Art/Craft(Any).
  * Add-weapon button fixed.
  * Automatic cash&assets calculation was broken, now working as intended.
  * Riffle and shotgun skills are now one (Riffle/shotgun).
  * Skill details windows now correctly parse HTML content (All links except PDFFoundry).
  * Selected specializations now display correctly in character's occupation.
* Macro for skills and weapon can be created with items from directory and compendiums.
  * As a GM if you click on a weapon macro, if the actor doesn't have a corresponding weapon, you will be prompt to create one.
  * If you click on a skill macro, if the actor doesn't have the corresponding skill it will be created. As a GM you'll be prompted for the skill value.
* Specialization reworked. A specialization with a name set to 'Any' will be considered generic.
  * The generic name can be changed in lang.json.
  * When dropping a specialization with name 'Any' on a sheet, you will be prompted for a name and a base value. If you skip that the skill will be created as 'Any'. You can modify that later in the sheet.
  * When an occupation/archetype containing one or many 'Any' specialization, you will be prompted to select and existing one or to create a new one.
* Occupation type added : Pulp.
* Localization strings added for previous cards/sheet.
* Option added to prevent players from modifying their status.
  * By default player can modify their status.
  * Player can now modify dying and dead status.
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
* [x] Implement localization.
* [ ] Working on CSS/HTML to improve the look.  
* [x] Improving the combat tab, by adding combat skill to the weapon list.  
* [x] Automatic skill assignment when adding a weapon.  
* [x] Combat automation (calculation of difficulty, assignement of damage, opposed check...).  
* [x] Implement pushed rolls.  
* [ ] Implement advanced rolls (opposed, combined etc…).  
* [ ] Implement car chases.  
* [x] Automation of character creation.
