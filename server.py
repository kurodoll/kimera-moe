# Custom modules.
from log import log

# Standard modules.
import os

# Networking modules.
import eventlet
import socketio


# --------------------------------------------------------------------------- #
#                                                              IMPORTANT DATA #
# --------------------------------------------------------------------------- #
config = {
    "server": {
        "default_port": 3000
    }
}


# --------------------------------------------------------------------------- #
#                                                        INITIALIZE SOCKET.IO #
# --------------------------------------------------------------------------- #
log("server.py", "Initializing Server/Socket.io", timer_start="init sio")

sio = socketio.Server()
app = socketio.WSGIApp(sio, static_files="")  # TODO: Load static files.

log("server.py", "Initialized Server/Socket.io", timer_end="init sio")


# --------------------------------------------------------------------------- #
#                                                                         RUN #
# --------------------------------------------------------------------------- #
if __name__ == "__main__":
    port = config["server"]["default_port"]

    # If the port to use is defined in the environment variables, use the value
    # provided.
    if "PORT" in os.environ.keys():
        port = int(os.environ["PORT"])

    # Run the server.
    log("server.py", f"Starting server on port {port}")
    eventlet.wsgi.server(eventlet.listen(("", port)), app)
