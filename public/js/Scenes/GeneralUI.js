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
        this.ch = this.sys.game.canvas.height;

        this.default_font = {
            fontFamily: "Verdana",
            fontSize: 10,
            color: "#FFFFFF"
        };

        this.subdued_font = {
            fontFamily: "Verdana",
            fontSize: 10,
            color: "#888888"
        };

        this.message_history = [];
        this.message_history_cur_y = 7;
    }

    create() {
        // Display ping in the top-center of the screen.
        this.text_ping = this.add.text(
            this.cw/2, 10,
            "Connecting to server...",
            this.default_font
        ).setOrigin(0.5);

        // Console window.
        this.console_bg = this.add.graphics();
        this.console_bg.fillStyle(0x000000, 0.8);
        this.console_bg.fillRect(0, 0, 500, this.ch);

        // Console text is actually rendered off-screen, and this camera is set
        // to look at that area.
        this.console_camera = this.cameras.add(0, 0, 500, this.ch)
            .setScroll(-500, 0);
    }


      //---------------------------------------------------------------------//
     //                                                   CUSTOM FUNCTIONS  //
    //---------------------------------------------------------------------//
    setPing(ping) {
        if (ping >= 0) {
            this.text_ping.text = "Ping: " + ping.toString() + "ms";
        }
        else {
            this.text_ping.text = "DISCONNECTED. Attempting to reconnect...";
        }
    }

    message(message) {
        // Add canvas text objects to the history. To scroll back in history,
        // a camera will be used.
        this.message_history.push({
            "timestamp": this.add.text(
                -490, this.message_history_cur_y,
                new Date().toISOString().substring(11, 19),
                this.subdued_font
            ),
            "text": this.add.text(
                -430, this.message_history_cur_y,
                message,
                this.default_font
            )
        });

        // The y coordinate of the latest message needs to be updated.
        this.message_history_cur_y += 15;

        // If the text is going out of the screen, scroll the camera down so
        // that the latest message can always be seen.
        if (this.message_history_cur_y > this.ch) {
            this.console_camera.scrollY = this.message_history_cur_y - this.ch;
        }
    }
}
