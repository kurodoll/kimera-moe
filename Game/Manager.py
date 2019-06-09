from log import log
from . import Entity


class Manager:
    def __init__(self):
        log("Manager", "Initializing Manager", timer_start="manager")
        self.entities = {}
        log("Manager", "Initialized Manager", timer_end="manager")

    def newCharacter(self, details):
        new_ent = Entity.Entity("player")
        self.entities[new_ent.id] = new_ent

        # Set details based on character creation.
        bio_component = new_ent.getComponent("bio")

        if bio_component:
            bio_component.updateData({
                "name": details["name"]
            })

    def getEntity(self, entity_id):
        if entity_id in self.entities:
            return self.entities[entity_id]

        return None
