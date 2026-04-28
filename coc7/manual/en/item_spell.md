# Item Type: Spell

1. Go to the [fa-solid fa-suitcase]Items Directory tab
2. Click on [fa-solid fa-suitcase]Create Item

    1. Give the skill a name e.g. _Test Spell_
    2. Set _Type_ to _Spell_

3. On the _Details_ tab you can enter how the spell is cast to automate Actor attribute and characteristic costs

    ![](../../../static/assets/manual/spell_costs.webp)

    1. Change the order of this step
    2. Type of step
    3. Only run this step if this is empty or if @variable (is true) or !@variable (is false)
    4. Configuration options for this type
    5. Add a new row above this one
    6. Delete this row
    7. Add a new row at the end


### Additional Casters

- **Prompt: Additional caster prompt: Add**

    Each time this is added a new group will be added

    - **Prompt**: Shown to the User casting the spell
    - **Number name**: Group name for casters
    - **Group size**: When adding new additional casters how many will be added (0 if no more can be added)
    - **Minimum**: Minimum number (0 if no minimum requirement)


- **Prompt: Additional caster cost**

    Add a cost to the current additional caster group

    - **Modify**: Attribute or Characteristic to modify
    - **Value**: This can be a Roll formula (2D6 + 3), Number (10), or a variable (@variable)


- **Prompt: Additional caster prompt: Enter number**

    Add a prompt for a number to the current additional caster group

    - **Prompt**: Shown to the User casting the spell
    - **Number name**: Variable name to store the entered value into


### Casters Costs

- **Additional Information**

    Line to show in chat message

    - **Text**: Show line of text in chat message any @variables will be substituted with the value previously entered


- **Caster cost**

    This value will be automatically deducted from the casting Actor

    - **Modify**: Attribute or Characteristic to modify
    - **Value**: This can be a Roll formula (2D6 + 3), Number (10), or a variable (@variable)


### Casting time

- **Casting time**

    Replace casting time

    - **Text**: Show line of text in chat message any @variables will be substituted with the value previously entered


### Prompt

- **Prompt: Enter number**

    Add a prompt for a number to the current additional caster group

    - **Prompt**: Shown to the User casting the spell
    - **Number name**: Variable name to store the entered value into


- **Prompt: Show text**

    Show text in popup

    - **Prompt**: Shown to the User casting the spell


- **Prompt: Show variable**

    Show value in popup

    - **Prompt**: Shown to the User casting the spell
    - **Number name**: Variable to show to the User


- **Prompt: Toggle button**

    Show a button that can be toggled to be used in the If section

    - **Prompt**: Shown to the User casting the spell
    - **Number name**: Variable to show to the User


- **Show dialog prompt**

    Once a set of user input had been configured request User input


### System

- **Variable**

    Store value in a variable for using in another row

    - **Number name**: Variable name to store the entered value into
    - **Value**: This can be a Roll formula (2D6 + 3), Number (10), or a variable (@variable)
