# Custom modules.
from log import log

# Standard modules.
import json
import os
import pprint

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

pp = pprint.PrettyPrinter(indent=4)


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
    log("server.py", f"Connected: {sid}", "debug (network)", timer_start=sid)

    clients[sid] = {
        "online": True,
        "logged_in": False,
        "env": env
    }

    # Send client the MOTD.
    sio.emit("message", config["server"]["motd"], room=sid)


@sio.on("disconnect")
def disconnect(sid):
    log("server.py", f"Disconnected: {sid}", "debug (network)", timer_end=sid)

    if sid in clients:
        clients[sid]["online"] = False


# ===================================================================== General
@sio.on("my ping")
def my_ping(sid, emit_time):
    sio.emit("my pong", emit_time, room=sid)


# User has sent a command.
@sio.on("command")
def command(sid, command_text):
    log(
        "server.py",
        f"Recieved command '{command_text}' (from {sid})",
        "debug"
    )

    command_tokens = command_text.split(" ")

    if len(command_tokens) == 2:
        if command_tokens[0] == "/gm":
            if command_tokens[1] == "connected_users":
                response = "Connected Users:\n"

                for c in clients:
                    if clients[c]["online"]:
                        response += c + "\n"

                response += "END."

                sio.emit("message", response, room=sid)

    elif len(command_tokens) == 3:
        if command_tokens[0] == "/gm":
            if command_tokens[1] == "client_env":
                for c in clients:
                    if c.startswith(command_tokens[2]):
                        response = f"env of {c}:\n"
                        response += pp.pformat(clients[c]["env"])

                        sio.emit("message", response, room=sid)
                        return

                sio.emit("message", "No client with that SID!", room=sid)


# ============================================================ Login & Register
@sio.on("register")
def register(sid, details):
    log("server.py", f"Registration request recieved", "debug (network)")


@sio.on("login")
def login(sid, details):
    log("server.py", f"Login from {details['username']}", "debug (network)")

    # If user is logging in as a guest, no need to check for anything.
    if details["username"] == "GUEST":
        clients[sid]["username"] = details["username"]
        clients[sid]["logged_in"] = True

        sio.emit("login success")


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
