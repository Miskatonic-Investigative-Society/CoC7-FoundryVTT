# Creating a new chase

To create a chase create a new item of type chase.

Only the keeper should have access to that item.

A chase is composed of a succession of locations. Each location can be separated by an obstacle (barrier or hazard).

A hazard will always be crossed but failing the check will slow you down.

A barrier will stop you until you successfully pass or destroy it.

![](../../assets/manual/chases/new_chase.webp)

The chase sheet is divided in 3 parts.

- A header where you will see information about current location once a chase is started.
- A chase setup tab. This will allows you to create and follow the chase.
- A participant list where you can setup your participant. This tab will not work after the chase started.

# Adding a participant.

To add a participant click on the plus sign on the participant list or drag an actor or a token.

Note that it is not mandatory to have a actor associated with a participant. This will allows for fast setup or to add someone on the fly to the chase.

To be able to add a token to the chase a few control have been added to character and NPC sheets:

![](../../assets/manual/chases/new_controls.webp)

Those icons will give additional information.

1. Indicate that this actor is a synthetic actor (instance of an actor)
2. Indicate that actor's data are not linked. Each instance of that actor has his own properties.
3. Indicate that this actor has an associated token. **You can drag and drop this onto a chase location or on the participant list**.
4. Indicate that actor's data are linked to an actor in the actors directory.

Here you can set up your participant. Dragging an actor from the Actors sidebar will set the details. Note that you can select a different initiative and speed check. This is non standard in the CoC, but allows to setup unusual chases (futuristic matrix chase, dreamlands chase...)

![](../../assets/manual/chases/new_participant_drag.webp)

1. Dragging the questionmark onto a token will set the details to that token.

Once you drag an actor or select a token you can set up the participant

![](../../assets/manual/chases/new_participant_setup.webp)

1. Clicking this will change the participant side from prey to chaser.
2. Clicking this will trigger a speed check. Note that there will be no player entries necessary nor any roll card displayed.

# Participant list

![](../../assets/manual/chases/participant_list.webp)

Here you can have the list of participant to the chase.

1. Will trigger a chase roll. This will create a roll card if the participant has an associated actor (it's not a dummy). Holding shift will fast forward and solve the card.
2. This will clear the speed roll if any, or delete the participant.

![](../../assets/manual/chases/participant_list_2.webp)

1. Roll card waiting to get resolved in the chat.
2. Speed check rolled. You can click this to get the details.
3. To reset the speed check.

![](../../assets/manual/chases/roll_card.webp)

# Chase setup

![](../../assets/manual/chases/chase_init.webp)

To setup a chase enter the initial numbers of locations and click initialize.

![](../../assets/manual/chases/chase_initialized.webp)

The chase is initialized, you can adjust some options. Locations in white are initial locations and can not be modified.

1. This is the chase track, the location in white are initials locations. The location in grey are actual chase locations.
2. Selecting this will include in the chase participants who would have otherwise been able to escape.
3. Selecting this will include in the chase participants who would have been excluded for being too slow.
4. This is the number of locations between the slowest prey and the fastest chaser.
5. This is the starting location of the fastest prey. Setting this to 0 will place him just before the start. 1 will place him at the start. -1 will place him 1 location before the start.
6. This will animate token when they move to a new location.

# Setting up locations

During setup or during chase you can select a location to modify it.

Starting (white) locations can not be modified during setup.

To modify a location select it by clicking on it. This will display the location details on the header part of the sheet.

![](../../assets/manual/chases/setting_locations_1.webp)

1. This will add a participant. If the chase is started the participant will be on that location. If the chase isn't started the participant will be added on the init track.
2. This will remove the location. A location has to be empty to be removed.
3. You can drag this and drop it on a scene. This will set the coordinates for that location. A red pin indicate that coordinates has been set. Right clicking a red pin will reset it's coordinate. If coordinates are set, and a participant with an associated token enter that location his token will be moved to that location.
4. Add a new location.
5. Active location.

# Setting up obstacles.

You can add obstacle after and before a location. You can pre-fill an obstacle with a name, an associated check and some penalties.

![](../../assets/manual/chases/setting_locations_2.webp)

1. Toggle this to add damage to a barrier.
2. Barrier's hit points.
3. Movement action cost in case of failure.
4. Check used to pass the location. When it's red the active actor does not have the associated check.

# Cut to the chase.

When you are ready you can cut to the chase. If not all participant have a speed check this will trigger a warning and will not let you start.

![](../../assets/manual/chases/cut_to_the_chase_1.webp)

1. Initiative track. The active participant is circled in orange.
2. Chase track. Active location and participant. You can drag drop participant from the chase track to move them freely. You can drag a new actor or token directly on the chase track. This will pop the import window and add that participant to the chase. In some cases (eg. new prey slower than the slowest participant) all movement action will be recalculated.
3. A barrier.
4. A hazard.

# Obstacle resolution flow

![](../../assets/manual/chases/cut_to_the_chase_2.webp)

1. When the active participant is facing an obstacle you can trigger the obstacle resolution flow by clicking this. This will open a chat card where keeper and player can interact to pass that obstacle. All changes made to the card can be reflected to the obstacle in the chase at the end of the flow.

Here is a shorten flow example:

![](../../assets/manual/chases/obstalce_flow_1.webp)
![](../../assets/manual/chases/obstalce_flow_2.webp)
![](../../assets/manual/chases/obstalce_flow_3.webp)
![](../../assets/manual/chases/obstalce_flow_4.webp)

Once the flow is complete all changes are send to the chase.

![](../../assets/manual/chases/cut_to_the_chase_3.webp)

This round is finished. All actor have spent their movement action. You can click Next round to proceed.

# Participant controls.

![](../../assets/manual/chases/participant_controls.webp)

You can modify or move a participant by using the controls button on his card.

1. Those 3 icons will allow to delete, modify and activate a participant.
2. Movement action. A yellow is available, grey is consumed, red is a deficit.
3. This will control your participant bonus. He can draw a gun or be awarded bonus dices.
4. Movement action controls. Here you can increase or decrease movement actions.
5. Movement controls. You can move backward or forward. You can assist an ally (consume an action and give a bonus die) or take a cautious approach.
