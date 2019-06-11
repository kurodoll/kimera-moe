class SceneGame extends Phaser.Scene {
    constructor() {
        super({ key: "game" });
    }


      //---------------------------------------------------------------------//
     //                                                  DEFAULT FUNCTIONS  //
    //---------------------------------------------------------------------//
    preload() {
        this.character_entity = null;

        this.levels = {};
        this.active_level = null;

        this.entities = {}; // Known entities

        // Data needed for rendering.
        this.tiles_that_block = [ "wall" ];

        // Load image data.
        this.load.image("tileset cave", "/graphics/tilesets/cave");
        this.load.json("tileset cave data", "/data/tilesets/cave");

        this.load.image("player", "/graphics/sprites/player");

        // Loading bar.
        const progress = this.add.graphics();

        this.load.on("progress", (value) => {
            progress.clear();
            progress.fillStyle(0xFFFFFF, 1);
            progress.fillRect(0, this.ch/2 - 30, this.cw*value, 60);

        });

        this.load.on("complete", () => {
            progress.destroy();
            this.scene.start("login");
        });
    }


      //---------------------------------------------------------------------//
     //                                                   CUSTOM FUNCTIONS  //
    //---------------------------------------------------------------------//
    setCharacterEntity(character) {
        this.character_entity = character;
        this.entities[character.id] = character;

        // Check if the level the player's character on is loaded locally. If
        // it isn't, it needs to be requested from the server.
        if (!this.levels[character.components.position.level]) {
            socket.emit("request level", character.components.position.level);
        }
    }

    addLevel(level) {
        const level_id = level.components.level.id;
        this.levels[level_id] = level.components.level;

        // If the player's character is on this level, set the level as active.
        if (this.character_entity.components.position.level == level_id) {
            this.active_level = level_id;
            this.renderLevel(this.active_level);

            this.game.scene.getScene("general ui").message("Entered level " +
                level.components.level.name);
        }
    }

    // Update existing/add new entities sent from the server.
    updateEntities(entities) {
        for (const entity_id in entities) {
            this.entities[entity_id] = entities[entity_id];
        }

        // Render entities to ensure that their changes are shown, and that new
        // ones appear.
        this.renderEntities(this.active_level);
    }


    // ============================================================== Rendering
    renderLevel(level_id) {
        const level = this.levels[level_id];

        if (!level) {
            console.error("Tried to render an unknown level");
            return;
        }

        // Create a tilemap for the level.
        const map = this.make.tilemap({
            tileWidth: level.tile_width,
            tileHeight: level.tile_height,
            width: level.width,
            height: level.height
        });

        // Use the specified tileset.
        const tileset = map.addTilesetImage(
            "tileset " + level.tileset,
            "tileset " + level.tileset,
            level.tile_width,
            level.tile_height,
            0, 0
        );

        // Get the tileset data, which maps tile type to index in the tileset
        // image.
        const tileset_json_name = "tileset " + level.tileset + " data";
        const tileset_data = this.cache.json.get(tileset_json_name);

        // A layer is required to render.
        level.layer = map.createBlankDynamicLayer("Layer 1", tileset);

        // Iterate over each tile in the level and render it.
        for (let x = 0; x < level.width; x++) {
            for (let y = 0; y < level.height; y++) {
                const tile_type = level.tiles[y * level.width + x];
                const tileset_index = tileset_data[tile_type];

                map.putTileAt(tileset_index, x, y);
            }
        }

        // Center the map and zoom to the specified zoom amount for this level.
        this.cameras.main.centerOn(
            (level.width * level.tile_width) / 2,
            (level.height * level.tile_height) / 2
        );

        this.cameras.main.setZoom(level.zoom);

        // Now handle rendering the entities that are present on the level.
        this.renderEntities(level_id);
    }

    renderEntities(level_id) {
        const level = this.levels[level_id];

        if (!level) {
            console.error("Tried to render entities of an unknown level");
            return;
        }

        // First make sure that we have the data of all the entities on the
        // level.
        let unknown_entities = [];

        for (let i = 0; i < level.entities.length; i++) {
            const entity_id = level.entities[i];

            if (!this.entities[entity_id]) {
                unknown_entities.push(entity_id);
            }
        }

        // If there are any entities we need, request their data from the
        // server.
        if (unknown_entities.length > 0) {
            socket.emit("request entities", unknown_entities);
        }

        // Now render the entities (that we have the data of).
        for (let i = 0; i < level.entities.length; i++) {
            const entity_id = level.entities[i];

            // Check whether we have the entity data.
            if (this.entities[entity_id]) {
                const entity = this.entities[entity_id];

                // The entity only needs to be rendered if it actually has a
                // sprite component.
                if ("sprite" in entity.components) {
                    const pixel_x = entity.components.position.x *
                        level.tile_width;
                    const pixel_y = entity.components.position.y *
                        level.tile_height;

                    if (entity.image) {
                        // If the entity already has a sprite created for it,
                        // just move it. But only move it if its position has
                        // actually changed.
                        if ( pixel_x != entity.image.x ||
                             pixel_y != entity.image.y )
                        {
                            entity.image.tween = this.add.tween({
                                targets: [ entity.image ],
                                ease: 'Sine.easeInOut',
                                duration: 100,
                                delay: 0,
                                x: {
                                    getStart: () => entity.image.x,
                                    getEnd: () => pixel_x
                                },
                                y: {
                                    getStart: () => entity.image.y,
                                    getEnd: () => pixel_y
                                }
                            });
                        }
                    }
                    else {
                        // We need to create a sprite for this entity.
                        entity.image = this.add.sprite(
                            pixel_x,
                            pixel_y,
                            entity.components.sprite.sprite
                        ).setOrigin(0, 0);
                    }
                }
            }
        }

        // Have the camera follow the sprite of the player's character.
        this.cameras.main.startFollow(
            this.character_entity.image, 
            false,    // Round Pixels (sub-pixel adjustment)
            0.1, 0.1, // Camera Lerp (smooth movement)
            -(this.character_entity.image.width/2),   // X Offset
            -(this.character_entity.image.height/2)); // Y Offset

        // Update sight of the player character.
        this.determineSight(
            level_id,
            {
                x: this.character_entity.components.position.x,
                y: this.character_entity.components.position.y,
            },
            this.character_entity.components.stats.sight *
                level.sight_multiplier
        );
    }


    // ======================================================== Rendering (LOS)
    // Darkens and hides tiles that are distant/hidden from a specified
    // position. sight_level is how well the entity can see.
    determineSight(level_id, from, sight_level) {
        const level = this.levels[level_id];

        if (!level) {
            console.error("Tried to determine sight on an unknown level");
            return;
        }

        for (let x = 0; x < level.width; x++) {
            for (let y = 0; y < level.height; y++) {
                // Ignore empty tiles.
                if (level.tiles[y * level.width + x] == "empty") {
                    continue;
                }

                // Check whether the tile is hidden from view.
                const tiles_on_line =
                    this.getTilesOnLine(from, { x: x, y: y });

                let tile_hidden = false;

                for (let i = 0; i < tiles_on_line.length; i++) {
                    const coord = tiles_on_line[i];

                    const tile_type = level.tiles
                        [coord.y * level.width + coord.x];

                    if (this.tiles_that_block.indexOf(tile_type) >= 0) {
                        // This tile is blocked, so tint it black.
                        level.layer.getTileAt(x, y).tint = 0x000000;

                        tile_hidden = true;
                        break;
                    }
                }

                if (tile_hidden) {
                    continue;
                }

                // Tint the tile darker based on its distance and how good the
                // sight level is.
                const distance = Math.sqrt(
                    Math.pow(Math.abs(x - from.x), 2) +
                        Math.pow(Math.abs(y - from.y), 2)
                );

                // If the tile is further than the sight level, just hide it.
                // The actual view distance is the sight level * 5.
                if (distance > sight_level * 5) {
                    level.layer.getTileAt(x, y).tint = 0x000000;
                }
                else {
                    let brightness = 1;
                    if (distance > sight_level) {
                        brightness = 1 / (distance / sight_level);
                    }

                    const hex = this.rgbToHex(
                        Math.round(255 * brightness),
                        Math.round(255 * brightness),
                        Math.round(255 * brightness)
                    );
                    level.layer.getTileAt(x, y).tint = hex;
                }
            }
        }
    }

    // Returns a list of tiles that exist along a line.
    getTilesOnLine(from, to) {
        let tiles = [];

        if (from.x == to.x && from.y == to.y) {
            return tiles;
        }

        // Give a bit of space, so that walls aren't blocked.
        if (from.x < to.x) { to.x -= 1; }
        if (from.x > to.x) { to.x += 1; }
 
        if (from.y < to.y) { to.y -= 1; }
        if (from.y > to.y) { to.y += 1; } 

        // Determine line details.
        let x0, x1, y0, y1, ydir, xslope, yslope;
        let xdir = 1;

        // Always go from left to right on the x axis.
        if (from.x > to.x) {
            x0 = to.x;
            y0 = to.y;
            x1 = from.x;
            y1 = from.y;
        }
        else if (from.x < to.x) {
            x0 = from.x;
            y0 = from.y;
            x1 = to.x;
            y1 = to.y;
        }
        else {
            // If the x values are equal, don't advance along the x axis.
            x0 = from.x;
            y0 = from.y;
            x1 = to.x;
            y1 = to.y;

            xdir = 0;
            x1++;
        }

        if (y0 == y1) {
            // If the y values are equal, don't advance along the y axis.
            ydir = 0;
            y1++;
        }
        else {
            ydir = y0 > y1 ? -1 : 1;
        }

        // Determine which distance is lowest (x or y). If the x distance is
        // larger, then the delta that y changes at should be lowered so that
        // it advances towards the endpoint at the same rate that x does.
        const dx = Math.abs(from.x - to.x);
        const dy = Math.abs(from.y - to.y);

        if (dx > dy) {
            xslope = 1;
            yslope = dy / dx;
        }
        else {
            yslope = 1;
            xslope = dx / dy;
        }

        // How often points should be checked for intersection with a tile.
        const delta = 0.1;

        // Find points.
        let y = y0;
        for (let x = x0; x < x1; x += delta * xdir * xslope) {
            // Add 0.5 to the points since we want to check through the middle
            // of tiles. 
            const coord = {
                x: Math.floor(x + 0.5),
                y: Math.floor(y + 0.5)
            };

            // Only save the point if it's new.
            let coord_seen = false;

            for (let i = 0; i < tiles.length; i++) {
                if (tiles[i].x == coord.x && tiles[i].y == coord.y) {
                    coord_seen = true;
                    break;
                }
            }

            if (!coord_seen) {
                tiles.push(coord);
            }

            // Advance the y axis, in case the x points are the same and the y
            // axis needs to be checked to see when we've reached the endpoint.
            y += delta * ydir * yslope;
            if ((ydir == 1 && y >= y1) || (ydir == -1 && y <= y1)) {
                break;
            }
        }

        return tiles;
    }


      //---------------------------------------------------------------------//
     //                                                   HELPER FUNCTIONS  //
    //---------------------------------------------------------------------//
    componentToHex(c) {
        const hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
      
    rgbToHex(r, g, b) {
        return parseInt(
            this.componentToHex(r) +
                this.componentToHex(g) +
                this.componentToHex(b),
            16
        );
    }
}
