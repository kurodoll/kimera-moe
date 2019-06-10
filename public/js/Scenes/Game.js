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

        // Load image data.
        this.load.image("tileset cave", "/graphics/tilesets/cave");
        this.load.json("tileset cave data", "/data/tilesets/cave");

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
        }
    }


    // ========================================================= Rendering
    renderLevel(level_id) {
        const level = this.levels[level_id];

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
    }
}
