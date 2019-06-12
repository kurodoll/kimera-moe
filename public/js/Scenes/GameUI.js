class SceneGameUI extends Phaser.Scene {
    constructor() {
        super({ key: "game ui" });
    }

    preload() {
        this.nameplates = {};

        this.default_font = {
            fontFamily: "Verdana",
            fontSize: 10,
            color: "#FFFFFF"
        };
    }

    update() {
        for (const np in this.nameplates) {
            const entity = this.nameplates[np].entity;

            if (!entity.image) {
                continue;
            }

            if (!entity.image.visible) {
                if (this.nameplates[entity.id].text) {
                    this.nameplates[entity.id].text.visible = false;
                    this.nameplates[entity.id].bg.destroy();
                }

                continue;
            }
            else {
                if (this.nameplates[entity.id].text) {
                    this.nameplates[entity.id].text.visible = true;
                }
            }

            const username = entity.components.bio.username;
            const game_camera = this.scene.get("game").cameras.main;

            const x = Math.round((entity.image.x - game_camera.worldView.x) *
                game_camera.zoom);
            const y = Math.round((entity.image.y - game_camera.worldView.y) *
                game_camera.zoom) - 20;

            if (this.nameplates[entity.id].text) {
                this.nameplates[entity.id].text.x = x;
                this.nameplates[entity.id].text.y = y;

                this.nameplates[entity.id].bg.destroy();
                this.nameplates[entity.id].bg = this.add.graphics();
                this.nameplates[entity.id].bg.fillStyle(0x000000, 0.5);
                this.nameplates[entity.id].bg.fillRect(
                    x - 3,
                    y - 3,
                    this.nameplates[entity.id].text.width + 6,
                    this.nameplates[entity.id].text.height + 6
                );
            }
            else {
                this.nameplates[entity.id].text = this.add.text(
                    x, y, username, this.default_font
                );

                this.nameplates[entity.id].bg = this.add.graphics();
                this.nameplates[entity.id].bg.fillStyle(0x000000, 0.5);
                this.nameplates[entity.id].bg.fillRect(
                    x - 3,
                    y - 3,
                    this.nameplates[entity.id].text.width + 6,
                    this.nameplates[entity.id].text.height + 6
                );
            }
        }
    }

    updateEntity(entity) {
        if (!this.nameplates[entity.id]) {
            if (entity.components.bio && entity.components.position) {
                this.nameplates[entity.id] = { entity: entity };
            }
        }
    }
}
