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
            color: "#808080"
        };

        this.highlight_font = {
            fontFamily: "Verdana",
            fontSize: 10,
            color: "#80C0FF"
        };

        this.code_font = {
            fontFamily: "Consolas",
            fontSize: 11,
            color: "#808080"
        };

        this.chat_font = {
            fontFamily: "Verdana",
            fontSize: 10,
            color: "#80FFC0"
        };

        this.message_history = [];
        this.message_history_cur_y = 7;

        this.console_shown = true;
        this.console_maximized = false;

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
        this.coords_console = {
            x: this.cw - 710,
            y: this.ch - 320,
            w: 700,
            h: 300
        };

        // Status bar background.
        this.status_bar_bg = this.add.graphics();
        this.status_bar_bg.fillStyle(0x000000, 0.9);
        this.status_bar_bg.fillRect(0, this.ch - 20, this.cw, this.ch);

        // Display ping and server info in the bottom-left of the screen.
        this.text_ping = this.add.text(
            10, this.ch - 16,
            "Connecting to server...",
            this.default_font
        );

        this.server_info = this.add.text(
            260, this.ch - 16,
            "",
            this.subdued_font
        );

        // Console window.
        this.console_bg = this.add.graphics();
        this.console_bg.fillStyle(0x101010, 0.8);
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

        this.console_input_cursor = this.add.graphics();
        this.console_input_cursor.fillStyle(0xFFFFFF, 1);
        this.console_input_cursor.fillRect(
            this.coords_console.x + 10,
            this.coords_console.y + this.coords_console.h - 19,
            2, 10
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

        // Show the latest message on the status bar when the console is
        // hidden.
        this.console_latest_message = this.add.text(
            this.coords_console.x + 10,
            this.ch - 16,
            "",
            this.default_font
        );

        this.console_open_label = this.add.text(
            this.coords_console.x - 80,
            this.ch - 16,
            "~ to open log",
            this.subdued_font
        );

        // Hide the console by default.
        this.toggleConsole();


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
                    this.console_camera.scrollY -= this.coords_console.h / 2;
                }
                else if (key.keyCode == 40) {
                    this.console_camera.scrollY += this.coords_console.h / 2;
                }

                // Update cursor.
                this.console_input_cursor.destroy();
                this.console_input_cursor = this.add.graphics();
                this.console_input_cursor.fillStyle(0xFFFFFF, 1);
                this.console_input_cursor.fillRect(
                    this.coords_console.x + 10 + this.console_input.width,
                    this.coords_console.y + this.coords_console.h - 19,
                    2, 10
                );
            }
        });

        // Keep track of which UI element is in focus.
        setInterval(() => {
            if (active_ui_element == "console") {
                if (this.console_input_cursor.visible) {
                    this.console_input_cursor.visible = false;
                }
                else if (this.console_shown) {
                    this.console_input_cursor.visible = true;
                }
            }
            else {
                this.console_input_cursor.visible = false;
            }
        }, 500);
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

    serverInfo(details) {
        this.server_info.text = "Online: " + details.users_online;
    }

    message(message) {
        let font_to_use = this.default_font;

        if (message.substring(9, 15) == "[json]") {
            font_to_use = this.code_font;
        }
        else if (message.substring(0, 8) == "[server]") {
            font_to_use = this.highlight_font;
        }

        // Add canvas text objects to the history. To scroll back in history,
        // a camera will be used.
        const message_text = this.add.text(
            this.cw + 70, this.message_history_cur_y,
            message,
            font_to_use
        );

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
        this.console_camera.scrollY =
            this.message_history_cur_y - message_history_bottom;

        this.console_latest_message.text = message;
    }

    chatMessage(details) {
        // Add canvas text objects to the history. To scroll back in history,
        // a camera will be used.
        const message_text = this.add.text(
            this.cw + 70, this.message_history_cur_y,
            "[" + details.type + " Chat] " + details.from + ": " + details.message,
            this.chat_font
        );

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
        this.console_camera.scrollY =
            this.message_history_cur_y - message_history_bottom;

        this.console_latest_message.text = message_text.text;
    }

    toggleConsole() {
        if (this.console_shown) {
            this.console_shown = false;

            this.console_bg.visible = false;
            this.console_input_cursor.visible = false;
            this.console_camera.visible = false;
            this.console_interact.disableInteractive();

            if (this.message_history.length) {
                this.console_latest_message.text = this.message_history[this.message_history.length - 1].text.text;
            }
        }
        else {
            this.console_shown = true;

            this.console_bg.visible = true;
            this.console_input.visible = true;
            this.console_input_cursor.visible = true;
            this.console_camera.visible = true;
            this.console_interact.setInteractive();

            this.console_latest_message.text = "Type ? for help";

            active_ui_element = "console";
        }
    }

    moveConsole(x, y, w, h) {
        this.coords_console = { x: x, y: y, w: w, h: h };

        this.console_bg.destroy();
        this.console_bg = this.add.graphics();
        this.console_bg.fillStyle(0x101010, 0.8);
        this.console_bg.fillRect(x, y, w, h);

        this.console_input.x = x + 10;
        this.console_input.y = y + h - 20;
        this.console_input.setDepth(1);

        this.console_interact.x = x;
        this.console_interact.y = y;
        this.console_interact.w = w;
        this.console_interact.h = h;

        this.console_camera.setPosition(x, y);
        this.console_camera.setSize(w, h);
    }

    keypress(key) {
        if (key.key == "`") {
            this.toggleConsole();
        }
        else if (active_ui_element == "console") {
            if (key.keyCode == 8) { // Backspace
                this.console_input.text = this.console_input.text.slice(0, -1);
            }
            else if (key.keyCode == 9) {
                if (!this.console_shown) {
                    this.toggleConsole();
                }

                if (this.console_maximized) {
                    this.coords_console = this.coords_console_old;
                    this.console_maximized = false;

                    this.moveConsole(
                        this.coords_console.x,
                        this.coords_console.y,
                        this.coords_console.w,
                        this.coords_console.h
                    );
                }
                else {
                    this.coords_console_old = this.coords_console;
                    this.console_maximized = true;

                    this.moveConsole(0, 0, this.cw, this.ch - 20);
                }

                const message_history_bottom = this.coords_console.h - 30;
                this.console_camera.scrollY =
                    this.message_history_cur_y - message_history_bottom;
            }
            else {
                this.console_input.text += key.key;
            }

            // Update cursor.
            this.console_input_cursor.destroy();
            this.console_input_cursor = this.add.graphics();
            this.console_input_cursor.fillStyle(0xFFFFFF, 1);
            this.console_input_cursor.fillRect(
                this.coords_console.x + 10 + this.console_input.width,
                this.coords_console.y + this.coords_console.h - 19,
                2, 10
            );
        }
    }
}
