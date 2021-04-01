
# _Character Setup_ creation 

Setups are predefined sets of skills and a way to generate the characteristics (this can be by rolling dices or assigning certain amount of points for example). Once a setup has been created can be used during teh [Character creation](./Character_Creation.md).

The process to create a character setup is the following:

1. Go to the items directory
2. Click on _Create Item_
    2.1 Give it a name
    2.2 Select _setup_ as _Type_
    2.3 Select the destination folder.
3. Define the setup to set the basic configuration for a type of characters.
    * You can add a textual description on the _Description_ tab
    * If you click on the _icon_ you can select a new one
    * On the _Details_ tab you can:
        * Select the _Cthulhu Flavors_ where this setup is valid
        * Define the biography sections and their names (click on the `+` to add extra Biography sections)
        * Drag default items 
        * Show / Hide the _Characteristics_ tab with the _Enable characteristics_ checkbox
    * The _Characteristics_ tab allows you to define the formula to roll the dices for each characteristic
    * The _Skills_ tab allows you to define the default set of skills by dragging items of type _skill_ to the _common skills_ area.

# _Occupation_ creation

An _occupation_ helps to define the character background, think about it as the definition of the set of _occupational skills_ (the ones where the character can spend their occupation points) plus the definition of how to calculate the amount of available occupation points. Finally the _occupation_ also allows to define the minimum and the maximum _credit_ for a character with this _occupation_.  

Keep in mind that the set of _occupational skills_ doesn't need to be fixed, the system allows to configure the _occupation_ so when it's dragged to a Character sheet will give the option of selecting one or more skills from a closed list, or even add a pre defined number of skills to select from all the available ones.

The _ocupation_ creation process is the following one:

1. Go to the items directory
2. Click on _Create Item_
    2.1 Give it a name
    2.2 Select _occupation_ as _Type_
    2.3 Selet the destination folder.
3. Define the _occupation_ to select the relevant characteristics and the occupation skills
    * You can add a textual description on the _Description_ tab and define the _Source_ 
    * If you click on the _icon_ you can select a new one
    * On the _Details_ tab you can:
        * Select the _Occupation Type_ 
        * Define the characteristics used to calculate the _occupation points_, you can check the characteristics you want and define the multiplier, for the ones with _Optional_ marked, the player will have to choose one at creation time.
        For instance if an occupation uses _EDU * 2 + (STR or DEX) * 2_ You have to select _Education_ and put _2_ on the _Multiplier_ without marking _Optional_ and then for _Strength_ and _Dexterity_ you have to check both, check _Optional_ on both, and put _2_ on the Multiplier on both.
        * Finally you will have to define the _Minimum_ and _Maximum_ value for the _Credit Rating_ skill for this occupation.
    * The _Skills_ tab allows you to select the _occupation skills_ by dragging items of the Type _skill_ to the different sections. A typical occupation has 8 skills plus the _Credit Rating_ skill.
        * The _Common Skills_ includes the default occupation skills that can't be changed
        * The _Optional skills groups_ section allows to add groups (you can create several of them) of skills for the player to choose from. Once you click on the `+` sign a group is created and you can define the _Number to chose from_ (number of skills to select) and create a pool of skills available for the selection by dragging them on the group. 
        * Finally the _Additional Skills_ allows you to enter a number of skills the player can choose from the rest of the available skills.

# _Player Character_ creation

You can create a _Player Character_ by creating the _actor_ and filling the corresponding blank _Character Sheet_, but it's much easier if you have previously created a _setup_ and an _occupation_ (see above), if you have created both the process to create the _Player Character_ it's the following one:

1. Create blank character sheet:
   1. Go to the actor's tab 
   2. Click on _Create Actor_
     * Give te actor a _Name_
     * Select _character_ as the _Type_
     * If desired, select the folder for the actor to be created.
     * When you click on _Create New Actor_ the actor you will see the black character sheet for the actor.
2. Drag and drop a item of Type _setup_ (for instance 1920s, 1890s, Pulp, Modern,...) on the sheet to do the basic setup using the configuration defined on the item, this usually includes rolling the characteristics or setting their values with the points system, and set a default set of skills corresponding to the given setup.
3. Set the development/ character creation mode. A new tab called _Development_ should appear on the character sheet.
4. Drag and drop an _occupation_ Type item on the sheet, this will probably involve selecting some skills from a given reduced set or from the remaining ones. This will calculate the available _Personal points_ and _Occupation points_ and assign the part of the Occupation points to reach the minimum value for _Credit Rating_ of the selected occupation. 
5. Distribute occupation/personal points in development tab taking on account that each skill has 5 columns:
    1. First one is the basic percentage of the skill
    2. The second one is the one to put the _Personal interest points_ during the creation of the character
    3. The third one is only available on for the _occupation_ skills (marked with a dark circle before the skill name) and it's used to assign the _Occupation points_.
    4. The forth column should be initially blank and its where the experience points will show up (you can also assign points here if you are playing an experienced character)
    5. The final column is a read only one with the final calculated value for the skill (the sum of the other 4) 


* [Video showing the Character creation process](https://www.youtube.com/watch?v=VsQZHVXFwlk)