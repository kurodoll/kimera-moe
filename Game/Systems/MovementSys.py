from log import log


class MovementSys:
    def __init__(self, Manager):
        log(
            "MovementSys",
            "Initializing MovementSys",
            timer_start="MovementSys"
        )

        self.Manager = Manager

        self.walkable_tiles = [
            "ground", "ground_rough",
            "grass", "tall_grass", "flower"
        ]

        log("MovementSys", "Initialized MovementSys", timer_end="MovementSys")

    def handleEvent(self, event):
        if event["type"] == "move entity relative":
            # Set up all the info we need.
            ent = event["details"]["entity"]
            ent_pos = ent.getComponent("position").data

            dir = event["details"]["direction"].split(" ")

            level_comp = self.Manager.getLevel(ent_pos["level"])
            level_data = level_comp.getComponent("level").data
            tiles = level_data["tiles"]

            target = ent_pos.copy()

            if "up" in dir:
                target["y"] -= 1
            if "down" in dir:
                target["y"] += 1
            if "left" in dir:
                target["x"] -= 1
            if "right" in dir:
                target["x"] += 1

            # Check whether the move is valid.
            tile_type = tiles[target["y"] * level_data["width"] + target["x"]]

            if tile_type in self.walkable_tiles:
                ent_pos.update(target)
                self.Manager.markEntityUpdated(ent.id)
