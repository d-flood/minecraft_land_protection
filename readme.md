# A minecraft bedrock addon for protecting an area of land

_An afternoon project for reducing real life conflict from in game behavior._

## Description

I have kids who like to play Minecraft together. Sometimes their time is ruined because someone takes items from a chest or messes up someone's house. This addon enables each player to claim one piece of land at a time. Only the owner of the land my place or interact in any way with blocks in their protected area. The idea is that each player can have a safe place.

This has already prevented conflict.

## How to protect an area

1. Right-click on any 4 blocks while holding a stick. 
    - These will define the coordinates for the protection.
    - I have limited the area to 2,500 blocks (e.g., 50x50 square, 25x100 rectangle, etc.)
    - The claimed area includes _all_ blocks above and below.
2. Fire particles will spawn on the border of the protected area to indicate its boundaries.
    - Each player will see the boarder at whatever height/depth they are at.
3. To move the protected area, simply repeat #1 and the previous protected area will be removed and a new one created.

**Protection Rules**
- Only an owner can interact with blocks in a protected area. This includes:
    - breaking blocks
    - placing blocks
    - interacting with blocks
    - opening chests
    - opening doors
    - using crafting tables, furnaces, etc.
- Protected areas cannot overlap.
- Explosions that would affect a protected area, _even if originating outside the protected area_, will be cancelled.

## How to install on a bedrock server
1. Add the `.land_protection_bp/` directory from this repo to the `./behavior_packs/` directory of your bedrock server.
2. Then create a file at `./worlds/YOUR_WORLD_NAME/world_behavior_packs.json` with the following contents:
    ```json
    [
        {
            "pack_id" : "7f681bee-c5e0-46d5-a935-f2b73c8815bc",
            "version" : [ 1, 0, 0]
        }
    ]
    ```
    For example, if your world name is "there and back again", then the file needs to be created at `./worlds/there and back again/world_behavior_packs.json`.
    If this file already exists, then update it like this:
    ```json
    [
        // this is an existing addon
        {
            "pack_id" : "0d18d86-f454-4361-bbcf-b118274dec17",
            "version" : [ 1, 2, 6 ]
        },
        // this is the new land protection addon
        {
            "pack_id" : "7f681bee-c5e0-46d5-a935-f2b73c8815bc",
            "version" : [ 1, 0, 0]
        }
    ]
    ```

This was a three hour Saturday project. I'm happy to review and accept PRs, but keep in mind it has a narrow focus and that I do not actually know much or play much Minecraft.