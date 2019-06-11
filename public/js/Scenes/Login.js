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
        this.load.image("blue orb", "/graphics/particles/blue_orb");

        // Allow Google fonts to be loaded.
        this.load.script(
            "webfont",
            "https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js"
        );

        // Fonts.
        this.default_font = {
            fontFamily: "Verdana",
            fontSize: 10,
            color: "#000000"
        };

        this.subdued_font = {
            fontFamily: "Verdana",
            fontSize: 10,
            color: "#808080"
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
        this.cameras.main.setBackgroundColor(0xFFFFFF);

        // Background image.
        this.background = this.add.image(0, 0, "login bg").setOrigin(0, 0);
        this.background.displayWidth = this.cw;
        this.background.scaleY = this.background.scaleX;

        this.add.tween({
            targets: [ this.background ],
            ease: "Sine.easeInOut",
            duration: 3000,
            delay: 0,
            y: {
                getStart: () => -this.ch,
                getEnd: () => 0
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
                ).setShadow(0, 0, "#0080C0", 2, false, true).setOrigin(0.5);

                const game_subtitle = this.add.text(
                    this.cw/2 + 160, 160,
                    "キメラ萌",
                    {
                        fontFamily: "Rajdhani",
                        fontSize: 30,
                        color: "#FFC0FF"
                    }
                ).setOrigin(0.5);

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

        // Login prompt.
        this.login_bg = this.add.graphics();
        this.login_bg.fillGradientStyle(0x80C0FF, 0xFFFFFF, 0xFFFFFF, 0xFFC0FF, 0.5);
        this.login_bg.fillRect(
            this.cw/2 - 175, 200,
            350, 120
        );

        this.username_label = this.add.text(
            this.cw/2 - 150, 220, "Username:", this.default_font
        );

        this.password_label = this.add.text(
            this.cw/2 - 150, 240, "Password:", this.subdued_font
        );

        this.username_field = this.add.text(
            this.cw/2 - 60, 220, "GUEST", this.default_font
        );

        this.password_field = this.add.text(
            this.cw/2 - 60, 240, "", this.default_font
        );

        // Buttons.
        this.btn_login = this.add.graphics();
        this.btn_login.fillStyle(0xFFFFFF, 1);
        this.btn_login.fillRoundedRect(
            this.cw/2 - 115, 275,
            110, 30,
            5
        );

        this.btn_login_text = this.add.text(
            this.cw/2 - 60, 290, "Login", this.subdued_font
        ).setOrigin(0.5).setInteractive();

        this.btn_register = this.add.graphics();
        this.btn_register.fillStyle(0xFFFFFF, 1);
        this.btn_register.fillRoundedRect(
            this.cw/2 + 5, 275,
            110, 30,
            5
        );

        this.btn_register_text = this.add.text(
            this.cw/2 + 60, 290, "Register", this.subdued_font
        ).setOrigin(0.5).setInteractive();

        // Button interaction.
        this.btn_login_text.on("pointerover", () => {
            this.btn_login_text.setStyle({ color: "#000000" });
        });
        this.btn_login_text.on("pointerout", () => {
            this.btn_login_text.setStyle({ color: "#808080" });
        });
        this.btn_login_text.on("pointerdown", () => {
            socket.emit("login", {
                "username": this.username_field.text,
                "password": this.password_field.text
            });
        });

        this.btn_register_text.on("pointerover", () => {
            this.btn_register_text.setStyle({ color: "#000000" });
        });
        this.btn_register_text.on("pointerout", () => {
            this.btn_register_text.setStyle({ color: "#808080" });
        });
        this.btn_register_text.on("pointerdown", () => {
            document.location.href = "/register";
        });

        // Allow user to click the login prompt to focus it.
        this.login_prompt_interact = this.add.zone(
            this.cw/2, 235,
            350, 65
        ).setInteractive();

        this.input.on("gameobjectup", (pointer, game_object) => {
            if (game_object === this.login_prompt_interact) {
                active_ui_element = "login username";
            }
        });

        // Tweens.
        this.add.tween({
            targets: [
                this.login_bg,
                this.username_label,
                this.password_label,
                this.username_field,
                this.password_field,
                this.btn_login,
                this.btn_login_text,
                this.btn_register,
                this.btn_register_text
            ],
            ease: "Sine.easeInOut",
            duration: 3000,
            delay: 0,
            alpha: {
                getStart: () => 0,
                getEnd: () => 1
            }
        });

        // Particle effect.
        this.particle = this.add.particles("blue orb");
        this.emitter = this.particle.createEmitter({
            x: this.cw + 500,
            y: this.ch,
            angle: { min: 170, max: 200 },
            speed: 900,
            gravityY: 0,
            lifespan: { min: 5000, max: 5000 },
            blendMode: "MULTIPLY",
            alpha: 0.5
        });

        // Make sure the General UI scene is shown above this one.
        this.scene.bringToTop("general ui");

        // Focus the username field by default.
        active_ui_element = "login username";

        // Keep track of which UI element is in focus.
        setInterval(() => {
            if (active_ui_element == "login username") {
                this.username_label.setStyle({ color: "#000000" });
            }
            else {
                this.username_label.setStyle({ color: "#808080" });
            }

            if (active_ui_element == "login password") {
                this.password_label.setStyle({ color: "#000000" });
            }
            else {
                this.password_label.setStyle({ color: "#808080" });
            }
        }, 100);


        // ===================================================== KEYBOARD INPUT
        this.input.keyboard.on("keydown", (key) => {
            if (active_ui_element == "login username") {
                if (this.valid_keys.indexOf(key.keyCode) > -1) {
                    this.username_field.text += key.key;
                }
                else if (key.keyCode == 13) {
                    active_ui_element = "login password";
                }
            }
            else if (active_ui_element == "login password") {
                if (this.valid_keys.indexOf(key.keyCode) > -1) {
                    this.password_field.text += key.key;
                }
                else if (key.keyCode == 13) {
                    socket.emit("login", {
                        "username": this.username_field.text,
                        "password": this.password_field.text
                    });
                }
            }
        });
    }


      //---------------------------------------------------------------------//
     //                                                   CUSTOM FUNCTIONS  //
    //---------------------------------------------------------------------//
    keypress(key) {
        if (active_ui_element == "login username") {
            if (key.keyCode == 8) { // Backspace
                this.username_field.text = this.username_field.text.slice(0, -1);
            }
            else if (key.keyCode == 9) { // Tab
                active_ui_element = "login password";
            }
            else if (key.key == "_") {
                this.username_field.text += key.key;
            }
        }
        else if (active_ui_element == "login password") {
            if (key.keyCode == 8) { // Backspace
                this.password_field.text = this.password_field.text.slice(0, -1);
            }
            else if (key.keyCode == 9) { // Tab
                active_ui_element = "login username";
            }
            else if (key.key == "_") {
                this.password_field.text += key.key;
            }
        }
    }
}
