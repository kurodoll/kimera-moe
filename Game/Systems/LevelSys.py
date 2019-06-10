from log import log
from .. import Entity

import json


class LevelSys:
    def __init__(self):
        log("LevelSys", "Initializing LevelSys", timer_start="LevelSys")

        try:
            filename = "Game/data/world/defined_levels.json"
            self.defined_levels = json.load(open(filename, "r"))

        except IOError:
            log("LevelSys", f"Failed to open {filename}", "error")

        except json.decoder.JSONDecodeError:
            log(
                "LevelSys",
                f"JSON decode error in {filename}",
                "warning"
            )

        log("LevelSys", "Initialized LevelSys", timer_end="LevelSys")

    def load(self, level_id):
        log(
            "LevelSys",
            f"Loading level '{level_id}'",
            "debug",
            timer_start=level_id
        )

        # Load the level definition.
        try:
            filename = "Game/" + self.defined_levels[level_id]
            level_data = json.load(open(filename, "r"))

        except IOError:
            log("LevelSys", f"Failed to open {filename}", "error")

        except json.decoder.JSONDecodeError:
            log(
                "LevelSys",
                f"JSON decode error in {filename}",
                "warning"
            )

        else:
            level_ent = Entity.Entity("level")
            level_ent.getComponent("level").updateData(level_data)

            log("LevelSys", f"Loaded level '{level_id}'", timer_end=level_id)
            return level_ent
