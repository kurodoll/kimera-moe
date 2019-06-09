$(() => {
      //---------------------------------------------------------------------//
     //                                                  INITIALIZE PHASER  //
    //---------------------------------------------------------------------//
    const phaser_config = {
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        scene: [ SceneGeneralUI, SceneLogin ]
    };

    const game = new Phaser.Game(phaser_config);
    game.scene.start("general ui");
    game.scene.start("login");


      //---------------------------------------------------------------------//
     //                                               INITIALIZE SOCKET.IO  //
    //---------------------------------------------------------------------//
    const socket = io.connect();
    let connected = false;


       //--------------------------------------------------------------------//
      //                                             SOCKET.IO INTERACTION  //
     //--------------------------------------------------------------------//
    //========================================= Connection & Disconnection
    socket.on("connect", () => {
        connected = true;
        game.scene.getScene("general ui").message("Connected to server.");
    });

    socket.on("disconnect", () => {
        connected = false;
        game.scene.getScene("general ui").setPing(-1);
        game.scene.getScene("general ui").message("Disconnected to server.");
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
});
