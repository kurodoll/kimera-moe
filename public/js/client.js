let socket;
let active_ui_element = null;


$(() => {
      //---------------------------------------------------------------------//
     //                                                  INITIALIZE PHASER  //
    //---------------------------------------------------------------------//
    const phaser_config = {
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        scene: [ SceneGeneralUI, SceneLogin, SceneCharacterSelect, SceneGame ],
        render: {
            "pixelArt": true
        }
    };

    const game = new Phaser.Game(phaser_config);
    game.scene.start("general ui");
    game.scene.start("game"); // Will switch to login scene when preloaded


      //---------------------------------------------------------------------//
     //                                               INITIALIZE SOCKET.IO  //
    //---------------------------------------------------------------------//
    socket = io.connect();
    let connected = false;


       //--------------------------------------------------------------------//
      //                                             SOCKET.IO INTERACTION  //
     //--------------------------------------------------------------------//
    //========================================= Connection & Disconnection
    socket.on("connect", () => {
        connected = true;
        game.scene.getScene("general ui").message("Connected to server");
    });

    socket.on("disconnect", () => {
        connected = false;
        game.scene.getScene("general ui").setPing(-1);
        game.scene.getScene("general ui").message("Disconnected from server");
    });


    //============================================================ General
    // Send out a ping every second, to determine latency to the server.
    setInterval(() => {
        if (connected) {
            socket.emit("my ping", +new Date());
        }
    }, 1000);

    socket.on("my pong", (emit_time) => {
        const ping = (+new Date()) - emit_time;
        game.scene.getScene("general ui").setPing(ping);
    });

    // If a generic message is recieved, output it to the console window.
    socket.on("message", (message) => {
        game.scene.getScene("general ui").message("[server] " + message);
    });

    socket.on("chat", (details) => {
        game.scene.getScene("general ui").chatMessage(details);
    });


    //============================================================ Account
    socket.on("login success", () => {
        game.scene.switch("login", "character select");
        game.scene.getScene("general ui").message("Logged in successfully");
    });


    //========================================================== Game Data
    socket.on("character entity", (character) => {
        game.scene.switch("character select", "game");
        game.scene.getScene("game").setCharacterEntity(character);
    });

    socket.on("level", (level) => {
        game.scene.getScene("game").addLevel(level);
    });

    socket.on("entity data", (entities) => {
        game.scene.getScene("game").updateEntities(entities);
    });


      //---------------------------------------------------------------------//
     //                                         JQUERY BROWSER INTERACTION  //
    //---------------------------------------------------------------------//
    // If the user presses backspace or similar, rather than having the browser
    // go back in history or anything like that, forward the keypress to the
    // relevant scene.
    // Overrides backspace, tab, and the / key.
    const listen_for = [ "/", "_", "`", "?" ];

    $(document).on("keydown", (e) => {
        if (e.keyCode == 8 || e.keyCode == 9 ||
            (listen_for.indexOf(e.key) != -1))
        {
            e.preventDefault();

            // If the user hits the ~ key, bring up the console and focus it
            // regardless of what is in focus.
            if (e.key == "`") {
                game.scene.getScene("general ui").keypress(e);
            }
            else if (active_ui_element == "console") {
                game.scene.getScene("general ui").keypress(e);
            }
            else if (active_ui_element.substring(0, 5) == "login") {
                game.scene.getScene("login").keypress(e);
            }
            else if (active_ui_element.substring(0, 16) == "character select")
            {
                game.scene.getScene("character select").keypress(e);
            }
        }
    });
});
