# My Call of Cthulhu implementation for Foundry VTT

My implementation of the call of Cthulhu for foundry-vtt  

## Disclaimer

This system doesn’t include any materials from the books and you’ll have to enter manually, weapons, skills, items etc… to be able to play.
I’ve just provided some basics skills that you can use.

I’m testing my dev on Chrome. Not sure how or if it will behave on other browser.

## Installation/usage

Install in foundry VTT from the Game Systems tab using the following manifest :  
<https://raw.githubusercontent.com/HavlockV/CoC7-FoundryVTT/Develop/system.json>  

Compendium 'Examples' contains a 1920's character sheet, you just need to import it to start a character.  
Compendium 'Skills' contains a set of basic skills that you can use for your PC/NPC.  
Compendium 'Weapons' contains a single test weapon.  

## What is working

version 0.1.6 (07/06):

* Lock mechanism to avoid inadvertent actor modification (NPC only so far).  
* Implementation of basic NPC sheet.
* Using basic NPC sheet for creture.
* Bug corretion :
  * You can add many time the same weapon or item, not twice the same skill with the same name.

Version 0.1.5 (01/06) :  

* Luck and San roll implemented.  
* Start implementing NPC sheet with only attributes and skills.  
* Mention of eras in skills removed. It is much simpler to just create a character sheet template and a compendium for each setting.
* Attributes (HP, MP, San, Luck) values can bet set using the mousewheel.
* Bug corretion :
  * Parasit (future) windows during skill roll removed.

Version 0.1.4 (31/05) :

* You can spend luck (provinding you have enough) to pass a failled check.  
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
* Clicking the icon/name will perform and advanced roll ( dialogue selection for penalty/bonus and difficulty).  
  * Holding shift while clicking will roll the dice with no penalty vs regular difficulty.  

## Future plans

* [ ] Correcting bugs.  
* [x] Implement luck rolls.
* [ ] Implementing NPC and Creatures (with automatic and average carac/skill calculation).
* [ ] Implementing localization.
* [ ] Working on CSS/HTML to improve the look.  
* [ ] Improving the combat tab, by adding combat skill to the weapon list.  
* [ ] Automatic skill assignment when adding a weapon.  
* [ ] Combat automation (calculation of difficulty, assignement of damage, opposed check...).  
* [x] Implementing pushed rolls.  
* [ ] Implementing advanced rolls (opposed, combined etc…).  
* [ ] Implementing car chases.  
* [ ] Localization.
