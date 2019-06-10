# Custom modules.
from log import log
from Game import Manager

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
        "motd": "Welcome to the Official Kimera M.O.E. server!\n\
            Type /chat <message> to global chat"
    },
    "files": {
        "static_files": "config/static_files.json"
    }
}

pp = pprint.PrettyPrinter(indent=4)

# Game management.
GameManager = Manager.Manager()


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

    if len(command_tokens) >= 2:
        if command_tokens[0] == "/chat":
            if sid in clients:
                if clients[sid]["logged_in"]:
                    sio.emit("chat", {
                        "type": "Global",
                        "from": clients[sid]["username"],
                        "message": command_text[6:]
                    })

                else:
                    sio.emit(
                        "message",
                        "You must be logged in to chat",
                        room=sid
                    )

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
                        response = f"[json] env of {c}:\n"
                        response += pp.pformat(clients[c]["env"])

                        sio.emit("message", response, room=sid)
                        return

                sio.emit("message", "No client with that SID!", room=sid)

            # Retrieve the data of a specific entity.
            elif command_tokens[1] == "entity":
                ent = GameManager.getEntity(int(command_tokens[2]))

                if ent:
                    response = f"[json] Data of Entity#{ent.id}:\n"
                    response += pp.pformat(ent.toJSON(True))

                    sio.emit("message", response, room=sid)

                else:
                    sio.emit("message", "No such entity!", room=sid)

            # Retrieve the data of a specific entity, formatted for level data.
            elif command_tokens[1] == "level":
                ent = GameManager.getEntity(int(command_tokens[2]))

                if ent:
                    if ent.getComponent("level"):
                        level = ent.getComponent("level")
                        level_str = f"[json] Level of Entity#{ent.id}:\n\n"

                        i = 0

                        for t in level.data["tiles"]:
                            if t[0] == "e":
                                # Ignore empty tiles.
                                level_str += " "
                            elif t[0] == "g":
                                # Denote ground tiles with a dot.
                                level_str += "."
                            else:
                                level_str += t[0]

                            level_str += " "

                            i += 1
                            if i == level.data["width"]:
                                level_str += "\n"
                                i = 0

                    sio.emit("message", level_str, room=sid)

                else:
                    sio.emit("message", "No such entity!", room=sid)


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


@sio.on("new character")
def new_character(sid, details):
    log(
        "server.py",
        f"New character request from {clients[sid]['username']}",
        "debug"
    )

    character = GameManager.newCharacter(details)
    clients[sid]["character"] = character

    sio.emit("character entity", character.toJSON(), room=sid)


# ============================================================= Client Requests
@sio.on("request level")
def request_level(sid, level_id):
    log(
        "server.py",
        f"Level requested: '{level_id}' by {clients[sid]['username']}",
        "debug"
    )

    level = GameManager.getLevel(level_id)
    sio.emit("level", level.toJSON(), room=sid)


@sio.on("request entities")
def request_entities(sid, entities):
    log(
        "server.py",
        f"Entities requested: '{entities}' by {clients[sid]['username']}",
        "debug"
    )

    entity_data = {}

    for e in entities:
        entity = GameManager.getEntity(e)

        if entity:
            entity_data[entity.id] = entity.toJSON()

    sio.emit("entity data", entity_data, room=sid)


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
