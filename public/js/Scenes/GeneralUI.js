class SceneGeneralUI extends Phaser.Scene {
    constructor() {
        super({ key: "general ui" });
    }


      //---------------------------------------------------------------------//
     //                                                  DEFAULT FUNCTIONS  //
    //---------------------------------------------------------------------//
    preload() {
        // Setup variables.
        this.cw = this.sys.game.canvas.width;

        this.default_font = {
            fontFamily: "Verdana",
            fontSize: 10,
            color: "#FFFFFF"
        };
    }

    create() {
        // Display ping in the top-center of the screen.
        this.text_ping = this.add.text(this.cw/2, 5, "", this.default_font)
            .setOrigin(0.5);
    }


      //---------------------------------------------------------------------//
     //                                                   CUSTOM FUNCTIONS  //
    //---------------------------------------------------------------------//
    setPing(ping) {
        if (typeof ping == "number") {
            this.text_ping.text = "Ping: " + ping.toString() + "ms";
        }
        else {
            this.text_ping.text = ping;
        }
    }
}
