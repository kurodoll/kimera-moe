const socket = io.connect();


$(() => {
    $("#form").submit((e) => {
        e.preventDefault();
    
        socket.emit("register", {
            username: $("#username").val(),
            password: $("#password").val()
        });
    });
});
