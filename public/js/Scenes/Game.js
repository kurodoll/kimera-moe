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
        this.levels[level.components.level.id] = level;
    }
}
