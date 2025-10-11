# Chaosium Canvas Interface

FoundryVTT v12 implemented [fa-regular fa-game-board]Scene Regions which allows you to trigger [fa-solid fa-child-reaching]Behaviors based on token interactions.

The FoundryVTT Knowledge Base has information on using [Drawings](https://foundryvtt.com/article/drawings/), [Map Notes](https://foundryvtt.com/article/map-notes/), [Scene Regions](https://foundryvtt.com/article/scene-regions/), and [Tiles](https://foundryvtt.com/article/tiles/) it is recommend you have a basic understanding of each before continuing.

## Additional Scene Region Behaviors
Clickable Events extends this to allow mouse interactions to run macros, Chaosium Canvas Interface is a simplified version that makes it easier to add to your own scenes.

You can get the UUID for Drawing, Map Notes, Scene Regions, and Tiles by clicking the [fa-solid fa-passport]Copy Document UUID button in the header.

## CCI: Drawing Toggle
This can be used like CCI Tile Toggle (below) to show and hide a Drawing. It requires two regions, one to show and the other to hide. This can only be triggered by the GM (Keeper).

- **Show** - Define if clicking on this region will show or hide the the relevant Drawings, Journal Entries, and Journal Entry Pages. It can also be used to enable or disable other Region Behaviors
- **Select Drawing** - Enter the UUID of the Drawing and then press the Add Document button.
- **Select Journal Entries** - Enter the UUID as per Select Drawing or Drag it here
- **Permission for Documents** - If Show is ticked the Documents will have this default permission
- **Select Journal Entry Pages** - Enter the UUID as per Select Drawing or Drag it here
- **Permission for Journal Entry Pages** - If Show is ticked the Journal Entry Pages will have this default permission
- **Select Region Behavior** - Enter the UUID as per Select Drawing
- **Then trigger these CCI Regions on Right Click** - If this is being used with another region, you can trigger the Left Click action on it by Right Clicking this one

## CCI: Map Note Toggle
This is designed to make a toggle for player Map Note visibility and requires two regions, one to show the Map Note and one to hide it. This can only be triggered by the GM (Keeper).

- **Show** - Define if clicking on this region will show or hide the Map Note to the players
- **Scene Notes** - Enter the UUID of the Map Note and then press the Add Document button.
- **Selected Documents** - These documents will have their permissions altered, this should be set the same Journal Entry or Journal Entry Page as the Map Note. You can drag the Document here or add the UUID using the same method as Scene Notes.
- **Show Permission** - When Show is ticked and the Scene Region is triggered the default permissions for Selected Documents will be set to this.
- **Hide Permission** - When Show is unticked and the Scene Region is triggered the default permissions for Selected Documents will be set to this.

*Example*
![](../../assets/manual/cci/map_note_toggle_token.webp)
Using a Map Note, two Tiles, and two Scene Regions

The tile images are available on these paths systems/CoC7/assets/art/eye-red.svg and systems/CoC7/assets/art/eye-green.svg

![](../../assets/manual/cci/map_note_toggle_region.webp)
Viewing the Scene Region layer

## CCI: Open Document
This is designed to open a Document (e.g. Journal Entry, Journal Entry Page, or Actor).

- **Click If** - Who can click on this region
  - Always - All users
  - Can See Document - Only users that have permission to view the document
  - Keeper - Only GM users (Keepers)
- **Select Document** - Enter the UUID of the Document and then press the Add Document button.
- **Optional Anchor** - If the Document is a Journal Entry Page you can optionally set the anchor

## CCI: Tile Toggle
This is designed to be used with CCI Open Document (above) to show and hide a Tile, which has an CCI: Open Document Scene Region. It requires two regions, one to show and the other to hide. This can only be triggered by the GM (Keeper).

- **Show** - Define if clicking on this region will show or hide the the relevant Tiles, Journal Entries, and Journal Entry Pages. It can also be used to enable or disable other Region Behaviors
- **Select Tile** - Enter the UUID of the Tile and then press the Add Document button.
- **Select Journal Entries** - Enter the UUID as per Select Tile or Drag it here
- **Permission for Documents** - If Show is ticked the Documents will have this default permission
- **Select Journal Entry Pages** - Enter the UUID as per Select Tile or Drag it here
- **Permission for Journal Entry Pages** - If Show is ticked the Journal Entry Pages will have this default permission
- **Select Region Behavior** - Enter the UUID as per Select Tile
- **Then trigger these CCI Regions on Right Click** - If this is being used with another region, you can trigger the Left Click action on it by Right Clicking this one

*Example*
![](../../assets/manual/cci/tile_toggle_token.webp)
Using a three Tiles and three Scene Regions

The tile images are available on these paths systems/CoC7/assets/art/eye-red.svg and systems/CoC7/assets/art/eye-green.svg

![](../../assets/manual/cci/tile_toggle_region.webp)
Viewing the Scene Region layer

## CCI: To Scene
This is designed to move between Scenes

- **Can click if** - Who can click on this region
  - Always - All users
  - Keeper - Only GM users (Keepers)
  - Can See Tile - Only users that have permission to view the Tile
- **Select Scene** - Enter the UUID of the Scene and then press the Add Document button.
- **Select Tile** - Enter the UUID of the Tile and then press the Add Document button.
