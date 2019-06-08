const socket = io.connect();
let connected = false;


$(() => {
      //---------------------------------------------------------------------//
     //                                                  INITIALIZE PHASER  //
    //---------------------------------------------------------------------//
    const phaser_config = {
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        scene: [ SceneGeneralUI, SceneLogin ],
        render: {
            "pixelArt": true
        }
    };

    const game = new Phaser.Game(phaser_config);
    game.scene.start("general ui");
    game.scene.start("login");


       //--------------------------------------------------------------------//
      //                                             SOCKET.IO INTERACTION  //
     //--------------------------------------------------------------------//
    //========================================= Connection & Disconnection
    socket.on("connect", () => {
        connected = true;
    });


    socket.on("disconnect", () => {
        connected = false;
        game.scene.getScene("general ui").setPing("DISCONNECTED");
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
});
