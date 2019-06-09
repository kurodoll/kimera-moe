from log import log
import json


# ID generation.
cur_id = 0


def nextID():
    global cur_id

    ret_id = cur_id
    cur_id += 1

    return ret_id


# Manages a single component.
class Component:
    def __init__(self, base=None):
        self.id = nextID()
        self.log_str = f"Component#{self.id}"

        self.data = {}

        # If this component is to be based off of a base, then load that base
        # data and apply it to this component.
        if base:
            # Try to load the base data from file.
            try:
                filename = f"Game/data/components/{base}.json"
                base_data = json.load(open(filename, "r"))

            except IOError:
                log(self.log_str, f"Failed to open {filename}", "warning")

            except json.decoder.JSONDecodeError:
                log(
                    self.log_str,
                    f"JSON decode error in {filename}",
                    "warning"
                )

            else:
                self.data.update(base_data)

            log(self.log_str, f"Created from base '{base}'", "debug(2)")

        else:
            log(self.log_str, "Created", "debug(2)")

    # Overwrite existing data with new data in dict format.
    def updateData(self, data):
        self.data.update(data)

        log(
            self.log_str,
            f"Updated data from dict ({len(data)} items)",
            "debug(2)"
        )

    def toJSON(self):
        return self.data
