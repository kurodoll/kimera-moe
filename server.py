# Custom modules.
from log import log

# Standard modules.
import json
import os

# Networking modules.
import eventlet
import socketio


# --------------------------------------------------------------------------- #
#                                                              IMPORTANT DATA #
# --------------------------------------------------------------------------- #
config = {
    "server": {
        "default_port": 3000,
        "motd": "Welcome to the Official Kimera M.O.E. server!"
    },
    "files": {
        "static_files": "config/static_files.json"
    }
}


# --------------------------------------------------------------------------- #
#                                                        INITIALIZE SOCKET.IO #
# --------------------------------------------------------------------------- #
log("server.py", "Initializing Server/Socket.io", timer_start="init sio")
sio = socketio.Server()

# Load the list of static files that should be visible to clients.
try:
    static_files = json.load(open(config["files"]["static_files"]))

except IOError:
    message = f"Failed to open {config['files']['static_files']}"
    log("server.py", message, log_level="fatal error")

    exit()

app = socketio.WSGIApp(sio, static_files=static_files)
log("server.py", "Initialized Server/Socket.io", timer_end="init sio")


# --------------------------------------------------------------------------- #
#                                                       SOCKET.IO INTERACTION #
# --------------------------------------------------------------------------- #
clients = {}


# ================================================== Connection & Disconnection
@sio.on("connect")
def connect(sid, env):
    log("server.py", f"Connected: {sid}", "debug (network)")

    clients[sid] = {
        "online": True,
        "env": env
    }

    # Send client the MOTD.
    sio.emit("message", config["server"]["motd"], room=sid)


@sio.on("disconnect")
def disconnect(sid):
    log("server.py", f"Disconnected: {sid}", "debug (network)")

    if sid in clients:
        clients[sid]["online"] = False


# ===================================================================== General
@sio.on("my ping")
def my_ping(sid, emit_time):
    sio.emit("my pong", emit_time, room=sid)


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
