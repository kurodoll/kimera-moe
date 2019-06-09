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

        // Create a list of characters that are valid for text input.
        this.valid_keys = [ 32 ]; // 32 = Space

        for (let i = 48; i <= 57; i++) { // Numbers 0-9 & their symbols
            this.valid_keys.push(i);
        }

        for (let i = 65; i <= 90; i++) { // Characters a-z & A-Z
            this.valid_keys.push(i);
        }
    }

    create() {
        // Define where UI elements should go.
        this.coords_console = { x: 0, y: this.ch - 300, w: this.cw, h: 300 };

        // Display ping in the top-center of the screen.
        this.text_ping = this.add.text(
            10, 7,
            "Connecting to server...",
            this.default_font
        );

        // Console window.
        this.console_bg = this.add.graphics();
        this.console_bg.fillStyle(0x111111, 0.8);
        this.console_bg.fillRect(
            this.coords_console.x,
            this.coords_console.y,
            this.coords_console.w,
            this.coords_console.h
        );

        this.console_input = this.add.text(
            this.coords_console.x + 10,
            this.coords_console.y + this.coords_console.h - 20,
            "", this.default_font
        );

        // Allow user to click the console window to focus it.
        this.console_interact = this.add.zone(
            this.coords_console.x,
            this.coords_console.y,
            this.coords_console.w,
            this.coords_console.h
        ).setOrigin(0, 0).setInteractive();

        this.input.on("gameobjectup", (pointer, game_object) => {
            if (game_object === this.console_interact) {
                active_ui_element = "console";
            }
        });

        // Console text is actually rendered off-screen, and this camera is set
        // to look at that area.
        this.console_camera = this.cameras.add(
            this.coords_console.x,
            this.coords_console.y,
            this.coords_console.w,
            this.coords_console.h
        ).setScroll(this.cw, 0);


        // ===================================================== KEYBOARD INPUT
        this.input.keyboard.on("keydown", (key) => {
            if (active_ui_element == "console") {
                if (this.valid_keys.indexOf(key.keyCode) > -1) {
                    this.console_input.text += key.key;
                }

                // On enter, submit the command.
                else if (key.keyCode == 13) {
                    socket.emit("command", this.console_input.text);
                    this.console_input.text = "";
                }
                
                // Arrow keys up and down scroll the console.
                else if (key.keyCode == 38) {
                    this.console_camera.scrollY += this.coords_console.h / 2;
                }
                else if (key.keyCode == 40) {
                    this.console_camera.scrollY -= this.coords_console.h / 2;
                }
            }
        });
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
        const message_text = this.add.text(
            this.cw + 70, this.message_history_cur_y,
            message,
            this.default_font
        ).setWordWrapWidth(400).setCrop(0, 0, 400, this.ch);

        this.message_history.push({
            "timestamp": this.add.text(
                this.cw + 10, this.message_history_cur_y,
                new Date().toISOString().substring(11, 19),
                this.subdued_font
            ),
            "text": message_text
        });

        // The y coordinate of the latest message needs to be updated.
        this.message_history_cur_y += message_text.displayHeight + 5;

        // If the text is going out of the screen, scroll the camera down so
        // that the latest message can always be seen.
        const message_history_bottom = this.coords_console.h - 30;

        if (this.message_history_cur_y > message_history_bottom) {
            this.console_camera.scrollY =
                this.message_history_cur_y - message_history_bottom;
        }
    }

    keypress(key) {
        if (active_ui_element == "console") {
            if (key.keyCode == 8) { // Backspace
                this.console_input.text = this.console_input.text.slice(0, -1);
            }
            else if (key.keyCode != 9) { // DON'T allow tab
                this.console_input.text += key.key;
            }
        }
    }
}
