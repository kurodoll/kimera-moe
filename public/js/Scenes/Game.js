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
