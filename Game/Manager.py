from log import log
from . import Entity


class Manager:
    def __init__(self):
        log("Manager", "Initializing Manager", timer_start="manager")
        self.entities = {}
        log("Manager", "Initialized Manager", timer_end="manager")

    def newCharacter(self):
        new_ent = Entity.Entity("player")
        self.entities[new_ent.id] = new_ent

    def getEntity(self, entity_id):
        if entity_id in self.entities:
            return self.entities[entity_id]

        return None
