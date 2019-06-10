from log import log
from .. import Entity

import json
import random


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

            # Generate the level if it needs to be.
            level_comp = level_ent.getComponent("level")

            if "generator" in level_comp.data:
                tiles = self.generateLevel(level_comp.data)

                level_comp.updateData({
                    "tiles": tiles
                })

            # Return the level entity.
            log("LevelSys", f"Loaded level '{level_id}'", timer_end=level_id)
            return level_ent

    def generateLevel(self, level_data):
        log(
            f"LevelSys",
            f"Generating level of type '{level_data['generator']}'",
            "debug"
        )

        if level_data["generator"] == "cave":
            tiles_total = level_data["width"] * level_data["height"]
            tiles_to_place = int(tiles_total / 3)  # Fill the map decently

            # Place the "cursor" in the middle of the level space.
            cur_x = int(level_data["width"] / 2)
            cur_y = int(level_data["height"] / 2)

            # Keep track of non-blocking tiles.
            open_tiles = []

            # Create an array of blank tiles.
            tiles = []

            for i in range(0, tiles_total):
                tiles.append("empty")

            # Use a random walk algorithm to create a random floor plan.
            for i in range(0, tiles_to_place):
                # Determine a random (weighted) tile type to place.
                tile_prob = random.randint(1, 100)

                for t in level_data["tile_weights"]:
                    if tile_prob <= level_data["tile_weights"][t]:
                        tile_type = t
                        break

                tile_index = int(cur_y * level_data["width"] + cur_x)
                tiles[tile_index] = tile_type

                open_tiles.append({
                    "x": cur_x,
                    "y": cur_y
                })

                # Move the cursor randomly until it lands on an empty spot.
                while True:
                    if random.random() > 0.5:
                        if random.random() > 0.5:
                            cur_x += 1
                        else:
                            cur_x -= 1
                    else:
                        if random.random() > 0.5:
                            cur_y += 1
                        else:
                            cur_y -= 1

                    if cur_x < 1 or cur_x >= level_data["width"] - 1 or cur_y < 1 or cur_y >= level_data["height"] - 1:  # noqa
                        cur_x = int(level_data["width"] / 2)
                        cur_y = int(level_data["height"] / 2)

                    # If the cursor is on an empty tile, break from the loop.
                    if tiles[cur_y * level_data["width"] + cur_x] == "empty":
                        break

            # Place walls around ground tiles.
            for x in range(0, level_data["width"]):
                for y in range(0, level_data["height"]):
                    if tiles[y * level_data["width"] + x] == "empty":
                        adjacent = self.getAdjacentTiles(
                            level_data,
                            tiles,
                            x, y
                        )

                        for adj in adjacent:
                            if adj != "empty" and adj != "wall":
                                tiles[y * level_data["width"] + x] = "wall"
                                break

            return tiles

    # Returns the 8 tiles around a given coordinate.
    def getAdjacentTiles(self, level_data, tiles, x, y):
        adjacent = []

        coords = [
            {"x": x - 1, "y": y - 1},
            {"x": x, "y": y - 1},
            {"x": x + 1, "y": y - 1},

            {"x": x - 1, "y": y},
            {"x": x + 1, "y": y},

            {"x": x - 1, "y": y + 1},
            {"x": x, "y": y + 1},
            {"x": x + 1, "y": y + 1},
        ]

        for c in coords:
            try:
                adjacent.append(tiles[c["y"] * level_data["width"] + c["x"]])

            except IndexError:
                pass

        return adjacent
