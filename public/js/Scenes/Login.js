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

        // Allow Google fonts to be loaded.
        this.load.script(
            "webfont",
            "https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js"
        );
    }

    create() {
        //================================================================ Text
        // Background image.
        this.background = this.add.image(0, 0, "login bg").setOrigin(0, 0);
        this.background.displayWidth = this.cw;
        this.background.scaleY = this.background.scaleX;

        this.add.tween({
            targets: [ this.background ],
            ease: "Sine.easeInOut",
            duration: 3000,
            delay: 0,
            alpha: {
                getStart: () => 0,
                getEnd: () => 1
            }
        });

        // Game title.
        WebFont.load({
            google: {
                families: [ "Rajdhani" ]
            },
            active: () => {
                const game_title = this.add.text(
                    this.cw/2, 100,
                    "Kimera M.O.E.",
                    {
                        fontFamily: "Rajdhani",
                        fontSize: 100,
                        color: "#FFFFFF"
                    }
                ).setShadow(0, 0, "#000000", 5, false, true).setOrigin(0.5);

                const game_subtitle = this.add.text(
                    this.cw/2 + 160, 160,
                    "キメラ萌",
                    {
                        fontFamily: "Rajdhani",
                        fontSize: 30,
                        color: "#FFFFFF"
                    }
                ).setShadow(0, 0, "#000000", 5, false, true).setOrigin(0.5);

                this.add.tween({
                    targets: [ game_title, game_subtitle ],
                    ease: "Sine.easeInOut",
                    duration: 3000,
                    delay: 0,
                    alpha: {
                        getStart: () => 0,
                        getEnd: () => 1
                    }
                });
            }
        });
    }
}
