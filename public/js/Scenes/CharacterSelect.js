class SceneCharacterSelect extends Phaser.Scene {
    constructor() {
        super({ key: "character select" });
    }


      //---------------------------------------------------------------------//
     //                                                  DEFAULT FUNCTIONS  //
    //---------------------------------------------------------------------//
    preload() {
        this.default_font = {
            fontFamily: "Verdana",
            fontSize: 10,
            color: "#FFFFFF"
        };

        this.large_font = {
            fontFamily: "Verdana",
            fontSize: 15,
            color: "#FFFFFF"
        };

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
        this.menu = this.add.text(
            10, 7,
            "a) Create New Character",
            this.default_font
        );


        // ===================================================== KEYBOARD INPUT
        active_ui_element = "character select";

        this.input.keyboard.on("keydown", (key) => {
            if (active_ui_element == "character select") {
                if (key.key == "a") {
                    this.newCharacterScreen();
                }
            }
            else if (active_ui_element == "character select name") {
                if (this.valid_keys.indexOf(key.keyCode) > -1) {
                    this.name_field.text += key.key;
                }

                // On enter, submit.
                else if (key.keyCode == 13) {
                    socket.emit("new character", {
                        name: this.name_field.text
                    });
                }
            }
        });
    }


      //---------------------------------------------------------------------//
     //                                                   CUSTOM FUNCTIONS  //
    //---------------------------------------------------------------------//
    keypress(key) {
        if (active_ui_element == "character select name") {
            if (key.keyCode == 8) { // Backspace
                this.name_field.text = this.name_field.text.slice(0, -1);
            }
            else if (key.keyCode != 9) { // DON'T allow tab
                this.name_field.text += key.key;
            }
        }
    }

    newCharacterScreen() {
        this.menu.visible = false;

        this.header = this.add.text(
            10, 7,
            "New Character Creation",
            this.large_font
        );

        this.name_label = this.add.text(
            10, 27,
            "Character name:",
            this.default_font
        );

        this.name_field = this.add.text(110, 27, "", this.default_font);

        active_ui_element = "character select name";
    }
}
