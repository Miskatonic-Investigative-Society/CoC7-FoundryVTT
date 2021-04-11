Links
-----

* Links are a way for a GM to request for a roll (Characteristic, Attribute, Skill, SAN loss, Weapon).
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

## Writing links 

Links for chat messages and sheet editors (NPC, Journal entries...).
Format of link is `@coc7.TYPE_OF_REQUEST[OPTIONS]{TEXT_TO_DISPLAY}`
* `TYPE_OF_REQUEST` :
    * `sanloss`: trigger a san check, upon failure will propose to deduct the corresponding SAN.
    * `check`: trigger a check depending on the options.
    * `item`: trigger use of a weapon. Only items of type weapon can be triggered.
* `OPTIONS: []` = optional, default
    * `sanloss`:
        * `sanMax`: max SAN loss
        * `sanMin`: min SAN loss
    * `check`:
        * `type`: type of check ( `characteristic`, `skill`, `attrib`).
        * `name`: name of the skill/characteristic/attrib.
        * [`blind`]: will force a blind check, if not present the check will depend on your selected roll mode.
    * all:
        * [`difficulty`]: `?` (blind), `0` (regular), `+` (hard), `++` (extreme), `+++` (critical).
        * [`modifier`]: `-x` (x penalty dice), `+x` (x bonus dice), `0` (no modifier).
        * [`icon`]: icon tu use ([font awesome](https://fontawesome.com/icons), `fas fa-dice`).
* `TEXT_TO_DISPLAY`: Name to display, this is optional.

### Examples 

| Link                                                           | Result                     |
| ---------------------------------------------------------------| ---------------------------|
| `@coc7.sanloss[sanMax:1D6,sanMin:1,difficulty:++,modifier:-1]` | {Hard San Loss (-1) 1/1D6} |
| `@coc7.check[type:charac,name:STR,difficulty:+,modifier:-1]`   | {Hard STR check(-1)}       |
| `@coc7.check[type:attrib,name:lck,difficulty:+,modifier:-1]`    | {Hard luck check(-1)}      |
| `@coc7.check[type:skill,icon:fas fa-arrow-alt-circle-right,name:anthropology,difficulty:+,modifier:-1]` | {Hard Anthropology check(-1)} (with icon)|
| `@coc7.sanloss[sanMax:1D6,sanMin:1]` | {San Loss (-1) 1/1D6} (without name, difficulty nor modifier) |
| `@coc7.check[type:skill,icon:fas fa-arrow-alt-circle-right,name:anthropology,modifier:+1]` | {Anthropology check (+1)} (with icon, without name nor difficulty) |

### Using links 

* You can drag/drop links from chat to sheets and between sheets.
* You can drag/drop items and skills on a journal entry while holding CTRL, this will create the corresponding check with regular difficulty and 0 modifier.
* You can create link in the chat by clicking and holding CTRL from any sheet (PC/NPC/Creature) corresponding characteristic/luck/SAN/Competence/weapon/San loss.
    * This will open the select penalty/difficulty dialogue. Clicking on the generated link will then trigger the check with all parameters.
    * Holding Shift on top will not open the penalty/difficulty dialogue. Clicking on the generated link will open the penalty/difficulty dialogue then trigger the check.