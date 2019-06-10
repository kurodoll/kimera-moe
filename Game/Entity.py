from log import log
from . import Component

import json


# ID generation.
cur_id = 0


def nextID():
    global cur_id

    ret_id = cur_id
    cur_id += 1

    return ret_id


# Manages a single entity.
class Entity:
    def __init__(self, base=None):
        self.id = nextID()
        self.log_str = f"Entity#{self.id}"

        log(
            self.log_str,
            "Creating new entity",
            "debug(2)",
            timer_start=self.log_str
        )

        self.components = {}

        # If this entity is to be based off of a base, then load that base data
        # and apply it to this entity.
        if base:
            # Try to load the base data from file.
            try:
                filename = f"Game/data/entities/{base}.json"
                base_data = json.load(open(filename, "r"))

            except IOError:
                log(self.log_str, f"Failed to open {filename}", "error")

            except json.decoder.JSONDecodeError:
                log(
                    self.log_str,
                    f"JSON decode error in {filename}",
                    "warning"
                )

            # Create component objects for each component described in the
            # base.
            if "components" in base_data:
                for c in base_data["components"]:
                    # Create a component based on the base.
                    self.components[c] = Component.Component(c)

                    # Then update the component with the specific data given
                    # in the entity base.
                    if len(base_data["components"][c]):
                        self.components[c].updateData(
                            base_data["components"][c]
                        )

            log(
                self.log_str,
                f"Created from base '{base}'",
                "debug(2)",
                timer_end=self.log_str
            )

        else:
            log(self.log_str, "Created", "debug(2)", timer_end=self.log_str)

    def getComponent(self, component):
        if component in self.components:
            return self.components[component]

        return None

    def toJSON(self, condensed=False):
        result = {
            "id": self.id,
            "components": {}
        }

        for c in self.components:
            result["components"][c] = self.components[c].toJSON(condensed)

        return result
