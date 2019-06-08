class SceneLogin extends Phaser.Scene {
    constructor() {
        super({ key: "login" });
    }


      //---------------------------------------------------------------------//
     //                                                  DEFAULT FUNCTIONS  //
    //---------------------------------------------------------------------//
    preload() {
        this.cw = this.sys.game.canvas.width;
        this.ch = this.sys.game.canvas.height;

        // Loading bar.
        const progress = this.add.graphics();

        this.load.on("progress", (value) => {
            progress.clear();
            progress.fillStyle(0xFFFFFF, 1);
            progress.fillRect(0, this.ch/2 - 30, this.cw*value, 60);

        });

        this.load.on("complete", () => {
            progress.destroy();
        });

        // Actual assets.
        this.load.image("login bg", "/graphics/art/login_bg");
    }

    create() {
        // Background image.
        this.background = this.add.image(0, 0, "login bg").setOrigin(0, 0);
        this.background.displayWidth = this.cw;
        this.background.scaleY = this.background.scaleX;
    }
}
